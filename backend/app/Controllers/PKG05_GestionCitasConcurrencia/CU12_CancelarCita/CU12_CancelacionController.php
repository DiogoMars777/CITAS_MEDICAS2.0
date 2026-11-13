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
     * CU12 - Cancelar Cita Médica centralizada a través de CitaService
     */
    public function cancelarCita(Request $request, int $id, \App\Services\Citas\CitaService $citaService): JsonResponse
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

        try {
            $motivo = trim($request->input('motivo_cancelacion'));
            $cita = $citaService->cancelarCita($id, $motivo, $request->user());

            return response()->json([
                'success' => true,
                'message' => "Cita #{$cita->codigo_cita} cancelada exitosamente. El cupo de las {$cita->hora_inicio} del día {$cita->fecha_cita} ha sido liberado en la agenda.",
                'data'    => $cita,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Throwable $e) {
            Log::error('Error en CU12 cancelar cita: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al cancelar la cita. Por favor intente nuevamente.'], 500);
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
