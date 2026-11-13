<?php

namespace App\Controllers\PKG05_GestionCitasConcurrencia\CU13_ControlAsistencia;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

/**
 * CU13 - Registrar asistencia e inasistencia
 * Actor(es): Recepcionista
 */
class CU13_AsistenciaController extends Controller
{
    /**
     * Listado de citas de hoy con filtros de sala de espera
     */
    public function index(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);
        $fecha = $request->input('fecha', $ahoraBolivia->format('Y-m-d'));

        $query = Cita::with(['paciente.historiaClinica', 'medico', 'especialidad'])
            ->whereDate('fecha_cita', $fecha)
            ->orderBy('hora_inicio', 'asc');

        if ($request->filled('estado')) {
            $query->where('estado_cita', strtoupper($request->input('estado')));
        }

        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(codigo_cita) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('paciente', function ($pq) use ($search) {
                      $pq->whereRaw('LOWER(nombres) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(ci) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        $citas = $query->get()->map(function ($c) {
            $pac = $c->paciente;
            $med = $c->medico;

            return [
                'id_cita'             => $c->id_cita,
                'codigo_cita'         => $c->codigo_cita,
                'fecha_cita'          => Carbon::parse($c->fecha_cita)->format('Y-m-d'),
                'hora_inicio'         => substr($c->hora_inicio, 0, 5),
                'hora_fin'            => substr($c->hora_fin, 0, 5),
                'horario_rango'       => substr($c->hora_inicio, 0, 5) . ' - ' . substr($c->hora_fin, 0, 5),
                'estado_cita'         => $c->estado_cita,
                'paciente_nombre'     => $pac ? "{$pac->nombres} {$pac->apellidos}" : '',
                'paciente_ci'         => $pac?->ci,
                'paciente_telefono'   => $pac?->telefono ?? 'N/A',
                'paciente_expediente' => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                'numero_expediente'   => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                'medico_nombre'       => $med ? "Dr(a). {$med->nombre_completo}" : '',
                'especialidad'        => $c->especialidad?->nombre ?? 'Medicina General',
                'especialidad_nombre' => $c->especialidad?->nombre ?? 'Medicina General',
                'motivo_consulta'     => $c->motivo_consulta,
            ];
        });

        $kpis = [
            'total_hoy'      => Cita::whereDate('fecha_cita', $fecha)->count(),
            'pendientes'     => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'PROGRAMADA')->count(),
            'en_espera'      => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'PROGRAMADA')->count(),
            'confirmados'    => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'CONFIRMADA')->count(),
            'atendidos'      => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'ATENDIDA')->count(),
            'atendidas'      => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'ATENDIDA')->count(),
            'inasistencias'  => Cita::whereDate('fecha_cita', $fecha)->where('estado_cita', 'INASISTENCIA')->count(),
        ];

        return response()->json([
            'success' => true,
            'fecha'   => $fecha,
            'kpis'    => $kpis,
            'data'    => $citas,
        ]);
    }

    /**
     * Registrar llegada (CONFIRMADA), inasistencia (INASISTENCIA) o atención (ATENDIDA)
     * Enforzado por la máquina de estados TransicionEstadoCitaService
     */
    public function registrarAsistencia(Request $request, int $id, \App\Services\Citas\TransicionEstadoCitaService $transicionService): JsonResponse
    {
        $estadoInput = strtoupper(trim((string) ($request->input('nuevo_estado') ?? $request->input('estado_asistencia'))));
        $request->merge(['nuevo_estado' => $estadoInput]);

        $validator = Validator::make($request->all(), [
            'nuevo_estado' => 'required|string|in:CONFIRMADA,INASISTENCIA,ATENDIDA,PROGRAMADA',
            'observaciones' => 'nullable|string|max:255',
        ]);

        if ($validator->fails() || empty($estadoInput)) {
            return response()->json(['success' => false, 'message' => 'Estado de asistencia no válido.'], 422);
        }

        $cita = Cita::with(['paciente', 'medico'])->find($id);
        if (!$cita) {
            return response()->json(['success' => false, 'message' => 'Cita no encontrada.'], 404);
        }

        try {
            $citaTransicionada = $transicionService->transicionar(
                $cita,
                $estadoInput,
                $request->user(),
                $request->input('observaciones')
            );

            $msg = match ($estadoInput) {
                'CONFIRMADA'   => "Llegada del paciente confirmada. Pasó a sala de espera.",
                'INASISTENCIA' => "Inasistencia registrada para la cita #{$cita->codigo_cita}.",
                'ATENDIDA'     => "Cita marcada como atendida.",
                default        => "Estado actualizado a {$estadoInput}."
            };

            return response()->json([
                'success' => true,
                'message' => $msg,
                'data'    => $citaTransicionada,
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->getStatusCode());
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el cambio de estado de la cita: ' . $e->getMessage(),
            ], 500);
        }
    }
}
