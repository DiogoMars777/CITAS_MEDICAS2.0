<?php

namespace App\Controllers\PKG05_GestionCitasConcurrencia\CU12_CancelarCita;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CancelacionCita;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

/**
 * CU12 - Cancelar cita médica
 * Actor(es): Paciente, Recepcionista
 */
class CU12_CancelacionController extends Controller
{
    /**
     * CU12 - Cancelar Cita Médica y liberar cupo horario
     */
    public function cancelarCita(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'motivo_cancelacion' => 'required|string|min:4|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor ingrese un motivo válido para la cancelación.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $cita = Cita::with(['paciente', 'medico'])->find($id);

        if (!$cita) {
            return response()->json(['success' => false, 'message' => 'Cita médica no encontrada.'], 404);
        }

        // Regla de Seguridad: Paciente solo puede cancelar su propia cita (Recepción puede de todos)
        $user = $request->user();
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $paciente = Paciente::where('id_usuario', $user->id_usuario)->first();
                if (!$paciente || $cita->id_paciente !== $paciente->id_paciente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Violación de seguridad: No tiene autorización para cancelar citas de otro paciente.',
                    ], 403);
                }
            }
        }

        if (in_array($cita->estado_cita, ['CANCELADA', 'ATENDIDA'])) {
            return response()->json([
                'success' => false,
                'message' => "No se puede cancelar una cita que ya se encuentra {$cita->estado_cita}.",
            ], 422);
        }

        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);
        $usuarioId = $request->user()?->id_usuario ?? 1;
        $motivo = trim($request->input('motivo_cancelacion'));

        try {
            return DB::transaction(function () use ($cita, $motivo, $usuarioId, $ahoraBolivia, $request) {
                // Bloqueo pesimista
                $citaActualizada = Cita::where('id_cita', $cita->id_cita)->lockForUpdate()->first();

                $estadoAnterior = $citaActualizada->estado_cita;
                $citaActualizada->estado_cita = 'CANCELADA';
                $citaActualizada->fecha_actualizacion = $ahoraBolivia->format('Y-m-d H:i:s');
                $citaActualizada->save();

                // Registrar en cancelaciones_citas
                CancelacionCita::create([
                    'id_cita'                => $citaActualizada->id_cita,
                    'motivo_cancelacion'     => $motivo,
                    'id_usuario_responsable' => $usuarioId,
                    'fecha_cancelacion'      => $ahoraBolivia->format('Y-m-d H:i:s'),
                ]);

                // Actualizar estado en reservas
                DB::table('reservas')
                    ->where('id_cita', $citaActualizada->id_cita)
                    ->update(['estado_reserva' => 'EXPIRADA']);

                // Auditoría
                BitacoraAuditoria::registrar(
                    'PKG05_GestionCitasConcurrencia',
                    'citas',
                    $citaActualizada->id_cita,
                    'UPDATE',
                    ['estado_cita' => $estadoAnterior],
                    [
                        'estado_cita'        => 'CANCELADA',
                        'motivo_cancelacion' => $motivo,
                        'cupo_liberado'      => "{$citaActualizada->fecha_cita} {$citaActualizada->hora_inicio} - {$citaActualizada->hora_fin}",
                    ],
                    $usuarioId,
                    $request->ip(),
                    $request->userAgent()
                );

                return response()->json([
                    'success' => true,
                    'message' => "Cita #{$citaActualizada->codigo_cita} cancelada exitosamente. El cupo de las {$citaActualizada->hora_inicio} del día {$citaActualizada->fecha_cita} ha sido liberado en la agenda.",
                    'data'    => $citaActualizada,
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('Error en CU12 cancelar cita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al cancelar la cita: ' . $e->getMessage()], 500);
        }
    }

    /**
     * CU12 - Ver motivo y detalle de cancelación de una cita
     */
    public function detalleCancelacion(int $id): JsonResponse
    {
        $cancelacion = CancelacionCita::with(['responsable', 'cita.paciente', 'cita.medico'])
            ->where('id_cita', $id)
            ->first();

        if (!$cancelacion) {
            return response()->json(['success' => false, 'message' => 'No hay registro de cancelación para esta cita.'], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id_cancelacion'     => $cancelacion->id_cancelacion,
                'id_cita'            => $cancelacion->id_cita,
                'codigo_cita'        => $cancelacion->cita?->codigo_cita,
                'paciente'           => $cancelacion->cita?->paciente ? "{$cancelacion->cita->paciente->nombres} {$cancelacion->cita->paciente->apellidos}" : '',
                'medico'             => $cancelacion->cita?->medico ? "Dr(a). {$cancelacion->cita->medico->nombre_completo}" : '',
                'motivo_cancelacion' => $cancelacion->motivo_cancelacion,
                'responsable'        => $cancelacion->responsable?->nombre_completo ?? 'Sistema',
                'fecha_cancelacion'  => $cancelacion->fecha_cancelacion,
            ],
        ]);
    }
}
