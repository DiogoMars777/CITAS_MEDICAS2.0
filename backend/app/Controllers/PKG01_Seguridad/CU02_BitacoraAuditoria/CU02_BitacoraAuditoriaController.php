<?php

namespace App\Controllers\PKG01_Seguridad\CU02_BitacoraAuditoria;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;

class CU02_BitacoraAuditoriaController extends Controller
{
    /**
     * CU02 - Consultar bitácora de auditoría con filtros avanzados y hora boliviana
     */
    public function listarAuditoria(Request $request): JsonResponse
    {
        $query = BitacoraAuditoria::with(['usuario' => function ($q) {
            $q->select('id_usuario', 'username', 'email', 'id_rol');
        }]);

        // 1. Filtro por búsqueda textual
        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(modulo) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(tabla_afectada) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(operacion) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('CAST(id_registro_afectado AS TEXT) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('usuario', function ($uq) use ($search) {
                      $uq->whereRaw('LOWER(username) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        // 2. Filtro por Módulo
        if ($request->filled('modulo') && $request->input('modulo') !== 'TODOS') {
            $query->where('modulo', strtoupper(trim($request->input('modulo'))));
        }

        // 3. Filtro por Operación
        if ($request->filled('operacion') && $request->input('operacion') !== 'TODOS') {
            $query->where('operacion', strtoupper(trim($request->input('operacion'))));
        }

        // 4. Filtro por Usuario
        if ($request->filled('id_usuario')) {
            $query->where('id_usuario', $request->input('id_usuario'));
        }

        // 5. Filtro por Rango de Fechas (Hora Boliviana: America/La_Paz)
        if ($request->filled('fecha_inicio')) {
            $inicio = Carbon::parse($request->input('fecha_inicio'), 'America/La_Paz')->startOfDay();
            $query->where('fecha_creacion', '>=', $inicio);
        }

        if ($request->filled('fecha_fin')) {
            $fin = Carbon::parse($request->input('fecha_fin'), 'America/La_Paz')->endOfDay();
            $query->where('fecha_creacion', '<=', $fin);
        }

        // Orden cronológico descendente (más recientes primero)
        $perPage = (int) $request->input('per_page', 15);
        $logs = $query->orderBy('fecha_creacion', 'desc')
                      ->orderBy('id_bitacora', 'desc')
                      ->paginate($perPage);

        // Mapear logs con fecha boliviana, rol del usuario y nombre de la persona
        $logs->getCollection()->transform(function ($log) {
            $rolNombre = 'SISTEMA';
            $personaNombre = null;

            if ($log->usuario) {
                $rolNombre = DB::table('roles')->where('id_rol', $log->usuario->id_rol)->value('nombre_rol') ?? 'USUARIO';

                $medico = DB::table('medicos')->where('id_usuario', $log->usuario->id_usuario)->first();
                if ($medico) {
                    $personaNombre = "Dr(a). {$medico->nombres} {$medico->apellidos}";
                } else {
                    $paciente = DB::table('pacientes')->where('id_usuario', $log->usuario->id_usuario)->first();
                    if ($paciente) {
                        $personaNombre = "{$paciente->nombres} {$paciente->apellidos}";
                    }
                }
            }

            return [
                'id_bitacora'          => $log->id_bitacora,
                'id_usuario'           => $log->id_usuario,
                'usuario'              => $log->usuario ? $log->usuario->username : 'Sistema / Anónimo',
                'usuario_nombre'       => $personaNombre ?: ($log->usuario ? $log->usuario->username : 'Sistema'),
                'usuario_email'        => $log->usuario ? $log->usuario->email : null,
                'rol'                  => strtoupper($rolNombre),
                'usuario_responsable'  => [
                    'username' => $log->usuario ? $log->usuario->username : 'Sistema',
                    'nombre'   => $personaNombre ?: ($log->usuario ? $log->usuario->username : 'Sistema / Anónimo'),
                    'rol'      => strtoupper($rolNombre),
                ],
                'modulo'               => $log->modulo,
                'tabla_afectada'       => $log->tabla_afectada,
                'id_registro_afectado' => $log->id_registro_afectado,
                'operacion'            => $log->operacion,
                'valores_anteriores'   => $log->valores_anteriores,
                'valores_nuevos'       => $log->valores_nuevos,
                'direccion_ip'         => $log->direccion_ip ?? '127.0.0.1',
                'user_agent'           => $log->user_agent,
                'fecha_bolivia'        => $log->fecha_bolivia,
                'fecha_raw'            => $log->fecha_creacion ? $log->fecha_creacion->toIso8601String() : null,
            ];
        });

        // Hora actual en Bolivia
        $horaActualBolivia = Carbon::now('America/La_Paz')->format('d/m/Y H:i:s') . ' [BOT - America/La_Paz]';

        return response()->json([
            'status'              => 'success',
            'case_of_use'         => 'CU02_BitacoraAuditoria',
            'timezone'            => 'America/La_Paz (UTC-4)',
            'hora_servidor_bolivia' => $horaActualBolivia,
            'data'                => $logs,
        ]);
    }

    /**
     * CU02 - Detalle individual de un evento de auditoría
     */
    public function obtenerDetalleAuditoria(int $id): JsonResponse
    {
        $log = BitacoraAuditoria::with('usuario')->find($id);

        if (!$log) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Registro de auditoría no encontrado.',
            ], 404);
        }

        $rolNombre = 'SISTEMA';
        $personaNombre = null;
        if ($log->usuario) {
            $rolNombre = DB::table('roles')->where('id_rol', $log->usuario->id_rol)->value('nombre_rol') ?? 'USUARIO';
            $medico = DB::table('medicos')->where('id_usuario', $log->usuario->id_usuario)->first();
            if ($medico) {
                $personaNombre = "Dr(a). {$medico->nombres} {$medico->apellidos}";
            } else {
                $paciente = DB::table('pacientes')->where('id_usuario', $log->usuario->id_usuario)->first();
                if ($paciente) {
                    $personaNombre = "{$paciente->nombres} {$paciente->apellidos}";
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id_bitacora'          => $log->id_bitacora,
                'usuario'              => $log->usuario ? $log->usuario->username : 'Sistema / Anónimo',
                'usuario_nombre'       => $personaNombre ?: ($log->usuario ? $log->usuario->username : 'Sistema'),
                'rol'                  => strtoupper($rolNombre),
                'usuario_responsable'  => [
                    'username' => $log->usuario ? $log->usuario->username : 'Sistema',
                    'nombre'   => $personaNombre ?: ($log->usuario ? $log->usuario->username : 'Sistema / Anónimo'),
                    'rol'      => strtoupper($rolNombre),
                ],
                'modulo'               => $log->modulo,
                'tabla_afectada'       => $log->tabla_afectada,
                'id_registro_afectado' => $log->id_registro_afectado,
                'operacion'            => $log->operacion,
                'valores_anteriores'   => $log->valores_anteriores,
                'valores_nuevos'       => $log->valores_nuevos,
                'direccion_ip'         => $log->direccion_ip,
                'user_agent'           => $log->user_agent,
                'fecha_bolivia'        => $log->fecha_bolivia,
            ]
        ]);
    }

    /**
     * CU02 - Métricas y resumen estadístico de auditoría (Hora Boliviana)
     */
    public function estadisticasAuditoria(): JsonResponse
    {
        $hoyBolivia = Carbon::now('America/La_Paz')->toDateString();

        $totalRegistros = BitacoraAuditoria::count();
        $totalHoy = BitacoraAuditoria::whereDate('fecha_creacion', $hoyBolivia)->count();
        
        $operacionesCriticas = BitacoraAuditoria::whereIn('operacion', ['UPDATE', 'DELETE', 'CAMBIO_ESTADO'])->count();
        $totalAccesos = BitacoraAuditoria::whereIn('operacion', ['LOGIN', 'LOGOUT'])->count();

        // Operaciones agrupadas
        $porOperacion = BitacoraAuditoria::select('operacion', DB::raw('count(*) as total'))
            ->groupBy('operacion')
            ->pluck('total', 'operacion');

        // Módulos agrupados
        $porModulo = BitacoraAuditoria::select('modulo', DB::raw('count(*) as total'))
            ->groupBy('modulo')
            ->pluck('total', 'modulo');

        return response()->json([
            'status' => 'success',
            'hora_bolivia_actual' => Carbon::now('America/La_Paz')->format('d/m/Y H:i:s') . ' BOT',
            'metrics' => [
                'total_registros'      => $totalRegistros,
                'total_hoy'            => $totalHoy,
                'operaciones_criticas' => $operacionesCriticas,
                'total_accesos'        => $totalAccesos,
                'desglose_operaciones' => $porOperacion,
                'desglose_modulos'     => $porModulo,
            ]
        ]);
    }

    // ==========================================
    // Alias para compatibilidad de rutas y llamadas
    // ==========================================
    public function index(Request $request): JsonResponse { return $this->listarAuditoria($request); }
    public function show(int $id): JsonResponse { return $this->obtenerDetalleAuditoria($id); }
    public function stats(): JsonResponse { return $this->estadisticasAuditoria(); }
}
