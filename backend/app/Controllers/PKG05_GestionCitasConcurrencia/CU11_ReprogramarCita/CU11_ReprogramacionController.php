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
     * CU11 - Reprogramar Cita Médica centralizada a través de CitaService
     */
    public function reprogramarCita(Request $request, int $id, \App\Services\Citas\CitaService $citaService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fecha_nueva'           => 'required|date_format:Y-m-d',
            'hora_inicio_nueva'     => 'required|string',
            'hora_fin_nueva'        => 'nullable|string',
            'id_medico_nuevo'       => 'nullable|integer',
            'motivo_reprogramacion' => 'required|string|min:4|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos de reprogramación.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $cita = $citaService->reprogramarCita($id, $request->all(), $request->user());
            $cita->load(['paciente.historiaClinica', 'medico', 'especialidad']);
            $pac = $cita->paciente;
            $med = $cita->medico;

            return response()->json([
                'success' => true,
                'message' => "Cita #{$cita->codigo_cita} reprogramada exitosamente para el {$cita->fecha_cita} ({$cita->hora_inicio} - {$cita->hora_fin}).",
                'data'    => [
                    'id_cita'                => $cita->id_cita,
                    'codigo_cita'            => $cita->codigo_cita,
                    'fecha_cita'             => Carbon::parse($cita->fecha_cita)->format('Y-m-d'),
                    'hora_inicio'            => substr($cita->hora_inicio, 0, 5),
                    'hora_fin'               => substr($cita->hora_fin, 0, 5),
                    'horario_rango'          => substr($cita->hora_inicio, 0, 5) . ' - ' . substr($cita->hora_fin, 0, 5),
                    'motivo_consulta'        => $cita->motivo_consulta,
                    'estado_cita'            => $cita->estado_cita,
                    'paciente_nombre'        => $pac ? "{$pac->nombres} {$pac->apellidos}" : '',
                    'paciente_ci'            => $pac?->ci,
                    'paciente_telefono'      => $pac?->telefono,
                    'paciente_expediente'    => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                    'medico_nombre'          => $med ? "Dr(a). {$med->nombre_completo}" : '',
                    'matricula_profesional'  => $med?->numero_registro_profesional,
                    'especialidad_nombre'    => $cita->especialidad?->nombre ?? '',
                    'fecha_emision'          => Carbon::now('America/La_Paz')->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('Error en CU11 reprogramar cita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al reprogramar la cita. Por favor intente nuevamente.'], 500);
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
