<?php

namespace App\Controllers\PKG05_GestionCitasConcurrencia\CU11_ReprogramarCita;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG05_GestionCitasConcurrencia\CU11_ReprogramarCita\HistorialReprogramacion;
use App\Models\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CancelacionCita;
use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

/**
 * CU11 - Reprogramar cita médica
 * Actor(es): Paciente, Recepcionista
 */
class CU11_ReprogramacionController extends Controller
{
    /**
     * CU11 - Reprogramar Cita Médica con Control de Concurrencia
     */
    public function reprogramarCita(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fecha_nueva'           => 'required|date_format:Y-m-d',
            'hora_inicio_nueva'     => 'required|date_format:H:i',
            'hora_fin_nueva'        => 'required|date_format:H:i',
            'id_medico_nuevo'       => 'nullable|integer|exists:medicos,id_medico',
            'motivo_reprogramacion' => 'required|string|min:4|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos de reprogramación.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $cita = Cita::with(['paciente', 'medico', 'especialidad'])->find($id);

        if (!$cita) {
            return response()->json(['success' => false, 'message' => 'Cita no encontrada.'], 404);
        }

        // Regla de Seguridad: Paciente solo puede reprogramar su propia cita (Recepción puede de todos)
        $user = $request->user();
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $paciente = Paciente::where('id_usuario', $user->id_usuario)->first();
                if (!$paciente || $cita->id_paciente !== $paciente->id_paciente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Violación de seguridad: No tiene autorización para reprogramar citas de otro paciente.',
                    ], 403);
                }
            }
        }

        if (in_array($cita->estado_cita, ['CANCELADA', 'ATENDIDA'])) {
            return response()->json([
                'success' => false,
                'message' => "No se puede reprogramar una cita que ya se encuentra {$cita->estado_cita}.",
            ], 422);
        }

        // Política Institucional: Solo se permite reprogramar citas cuyo pago esté completado
        if (!$cita->estaPagada()) {
            return response()->json([
                'success'          => false,
                'payment_required' => true,
                'message'          => 'Política de la Clínica: Solo se pueden reprogramar citas con pago confirmado. Las citas pendientes de pago deben abonarse o están sujetas a cancelación automática 24 horas antes.',
            ], 422);
        }

        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);
        $usuarioId = $request->user()?->id_usuario ?? 1;

        $fechaNueva = $request->input('fecha_nueva');
        $horaIniNueva = $request->input('hora_inicio_nueva') . ':00';
        $horaFinNueva = $request->input('hora_fin_nueva') . ':00';
        $idMedicoNuevo = $request->input('id_medico_nuevo') ? (int) $request->input('id_medico_nuevo') : $cita->id_medico;
        $motivo = trim($request->input('motivo_reprogramacion'));

        if ($horaFinNueva <= $horaIniNueva) {
            return response()->json([
                'success' => false,
                'message' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ], 422);
        }

        $fechaCarbon = Carbon::parse($fechaNueva, $timezone)->startOfDay();
        if ($fechaCarbon->isBefore($ahoraBolivia->copy()->startOfDay())) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede reprogramar a una fecha pasada.',
            ], 422);
        }

        try {
            return DB::transaction(function () use (
                $cita, $fechaNueva, $horaIniNueva, $horaFinNueva,
                $idMedicoNuevo, $motivo, $usuarioId, $ahoraBolivia, $request
            ) {
                // 1. Bloqueo pesimista: verificar colisión en el nuevo horario
                $conflicto = Cita::where('id_medico', $idMedicoNuevo)
                    ->whereDate('fecha_cita', $fechaNueva)
                    ->where('id_cita', '!=', $cita->id_cita)
                    ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA'])
                    ->where(function ($q) use ($horaIniNueva, $horaFinNueva) {
                        $q->where('hora_inicio', '<', $horaFinNueva)
                          ->where('hora_fin', '>', $horaIniNueva);
                    })
                    ->lockForUpdate()
                    ->first();

                if ($conflicto) {
                    return response()->json([
                        'success' => false,
                        'message' => "Conflicto de concurrencia: El nuevo horario seleccionado acaba de ser reservado por otra cita (#{$conflicto->codigo_cita}). Por favor elija otro horario.",
                    ], 409);
                }

                // 2. Verificar bloqueo de agenda
                $bloqueo = BloqueoAgenda::where('id_medico', $idMedicoNuevo)
                    ->where('fecha_inicio', '<=', $fechaNueva)
                    ->where('fecha_fin', '>=', $fechaNueva)
                    ->lockForUpdate()
                    ->get()
                    ->first(function ($b) use ($fechaNueva, $horaIniNueva, $horaFinNueva) {
                        return $b->solapaConSlot($fechaNueva, $horaIniNueva, $horaFinNueva);
                    });

                if ($bloqueo) {
                    return response()->json([
                        'success' => false,
                        'message' => "El nuevo horario se encuentra bloqueado administrativamente: {$bloqueo->motivo}.",
                    ], 422);
                }

                // 3. Capturar valores anteriores
                $fechaAnt = Carbon::parse($cita->fecha_cita)->format('Y-m-d');
                $horaIniAnt = $cita->hora_inicio;
                $horaFinAnt = $cita->hora_fin;
                $medicoAntId = $cita->id_medico;

                // 4. Actualizar la cita
                $citaActualizada = Cita::where('id_cita', $cita->id_cita)->lockForUpdate()->first();
                $citaActualizada->fecha_cita = $fechaNueva;
                $citaActualizada->hora_inicio = $horaIniNueva;
                $citaActualizada->hora_fin = $horaFinNueva;
                $citaActualizada->id_medico = $idMedicoNuevo;
                $citaActualizada->fecha_actualizacion = $ahoraBolivia->format('Y-m-d H:i:s');
                $citaActualizada->save();

                // 5. Registrar en historial_reprogramaciones
                HistorialReprogramacion::create([
                    'id_cita'                => $citaActualizada->id_cita,
                    'fecha_anterior'         => $fechaAnt,
                    'hora_inicio_anterior'   => $horaIniAnt,
                    'hora_fin_anterior'      => $horaFinAnt,
                    'id_medico_anterior'     => $medicoAntId,
                    'fecha_nueva'            => $fechaNueva,
                    'hora_inicio_nueva'      => $horaIniNueva,
                    'hora_fin_nueva'         => $horaFinNueva,
                    'id_medico_nuevo'        => $idMedicoNuevo,
                    'motivo_reprogramacion'  => $motivo,
                    'id_usuario_responsable' => $usuarioId,
                    'fecha_operacion'        => $ahoraBolivia->format('Y-m-d H:i:s'),
                ]);

                $citaActualizada->load(['paciente.historiaClinica', 'medico', 'especialidad']);

                // 6. Auditoría
                BitacoraAuditoria::registrar(
                    'PKG05_GestionCitasConcurrencia',
                    'citas',
                    $citaActualizada->id_cita,
                    'UPDATE',
                    [
                        'fecha_cita'  => $fechaAnt,
                        'hora_inicio' => $horaIniAnt,
                        'hora_fin'    => $horaFinAnt,
                        'id_medico'   => $medicoAntId,
                    ],
                    [
                        'fecha_cita'            => $fechaNueva,
                        'hora_inicio'           => $horaIniNueva,
                        'hora_fin'              => $horaFinNueva,
                        'id_medico'             => $idMedicoNuevo,
                        'motivo_reprogramacion' => $motivo,
                    ],
                    $usuarioId,
                    $request->ip(),
                    $request->userAgent()
                );

                $pac = $citaActualizada->paciente;
                $med = $citaActualizada->medico;

                return response()->json([
                    'success' => true,
                    'message' => "Cita #{$citaActualizada->codigo_cita} reprogramada exitosamente para el {$fechaNueva} ({$horaIniNueva} - {$horaFinNueva}).",
                    'data'    => [
                        'id_cita'                => $citaActualizada->id_cita,
                        'codigo_cita'            => $citaActualizada->codigo_cita,
                        'fecha_cita'             => Carbon::parse($citaActualizada->fecha_cita)->format('Y-m-d'),
                        'hora_inicio'            => substr($citaActualizada->hora_inicio, 0, 5),
                        'hora_fin'               => substr($citaActualizada->hora_fin, 0, 5),
                        'horario_rango'          => substr($citaActualizada->hora_inicio, 0, 5) . ' - ' . substr($citaActualizada->hora_fin, 0, 5),
                        'motivo_consulta'        => $citaActualizada->motivo_consulta,
                        'estado_cita'            => $citaActualizada->estado_cita,
                        'paciente_nombre'        => $pac ? "{$pac->nombres} {$pac->apellidos}" : '',
                        'paciente_ci'            => $pac?->ci,
                        'paciente_telefono'      => $pac?->telefono,
                        'paciente_expediente'    => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                        'medico_nombre'          => $med ? "Dr(a). {$med->nombre_completo}" : '',
                        'matricula_profesional'  => $med?->numero_registro_profesional,
                        'especialidad_nombre'    => $citaActualizada->especialidad?->nombre ?? '',
                        'fecha_emision'          => $ahoraBolivia->format('Y-m-d H:i:s'),
                    ],
                ]);
            }, 5);
        } catch (\Throwable $e) {
            Log::error('Error en CU11 reprogramar cita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al reprogramar la cita: ' . $e->getMessage()], 500);
        }
    }

    /**
     * CU11 - Historial de reprogramaciones de una cita
     */
    public function historial(int $id): JsonResponse
    {
        $reprogramaciones = HistorialReprogramacion::with(['medicoAnterior', 'medicoNuevo', 'responsable'])
            ->where('id_cita', $id)
            ->orderBy('fecha_operacion', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id_reprogramacion'     => $r->id_reprogramacion,
                    'fecha_anterior'        => $r->fecha_anterior ? Carbon::parse($r->fecha_anterior)->format('Y-m-d') : null,
                    'horario_anterior'      => substr($r->hora_inicio_anterior, 0, 5) . ' - ' . substr($r->hora_fin_anterior, 0, 5),
                    'medico_anterior'       => $r->medicoAnterior ? "Dr(a). {$r->medicoAnterior->nombre_completo}" : 'Médico anterior',
                    'fecha_nueva'           => $r->fecha_nueva ? Carbon::parse($r->fecha_nueva)->format('Y-m-d') : null,
                    'horario_nuevo'         => substr($r->hora_inicio_nueva, 0, 5) . ' - ' . substr($r->hora_fin_nueva, 0, 5),
                    'medico_nuevo'          => $r->medicoNuevo ? "Dr(a). {$r->medicoNuevo->nombre_completo}" : 'Médico nuevo',
                    'motivo_reprogramacion' => $r->motivo_reprogramacion,
                    'responsable'           => $r->responsable?->nombre_completo ?? 'Sistema',
                    'fecha_operacion'       => $r->fecha_operacion ? Carbon::parse($r->fecha_operacion)->format('Y-m-d H:i:s') : null,
                ];
            });

        // Verificar si la cita además tiene evento de cancelación
        $cancelacion = CancelacionCita::with('responsable')
            ->where('id_cita', $id)
            ->first();

        $cancelData = null;
        if ($cancelacion) {
            $cancelData = [
                'motivo_cancelacion' => $cancelacion->motivo_cancelacion,
                'fecha_cancelacion'  => $cancelacion->fecha_cancelacion ? Carbon::parse($cancelacion->fecha_cancelacion)->format('Y-m-d H:i:s') : null,
                'responsable'        => $cancelacion->responsable?->nombre_completo ?? 'Sistema',
            ];
        }

        return response()->json([
            'success'          => true,
            'reprogramaciones' => $reprogramaciones,
            'cancelacion'      => $cancelData,
        ]);
    }
}
