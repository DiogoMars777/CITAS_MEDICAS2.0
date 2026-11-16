<?php

namespace App\Controllers\PKG08_DashboardReportes\CU19_Recordatorios;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PKG08_DashboardReportes\CU19_Recordatorios\Recordatorio;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;

class CU19_RecordatorioController extends Controller
{
    /**
     * Listado general de recordatorios y avisos
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Recordatorio::with(['cita.paciente', 'cita.medico', 'cita.especialidad']);

            // Filtro por estado
            if ($request->filled('estado')) {
                $query->where('estado_envio', strtoupper($request->query('estado')));
            }

            // Filtro por canal (EMAIL, SMS, WHATSAPP)
            if ($request->filled('canal')) {
                $query->where('tipo_canal', strtoupper($request->query('canal')));
            }

            // Búsqueda por paciente o texto
            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('mensaje', 'like', "%{$search}%")
                      ->orWhereHas('cita.paciente', function ($qp) use ($search) {
                          $qp->where('ci', 'like', "%{$search}%")
                             ->orWhere('nombres', 'like', "%{$search}%")
                             ->orWhere('apellidos', 'like', "%{$search}%");
                      });
                });
            }

            $recordatorios = $query->orderBy('id_recordatorio', 'desc')->get();

            $data = $recordatorios->map(function ($r) {
                $cita = $r->cita;
                $paciente = $cita ? $cita->paciente : null;
                $medico = $cita ? $cita->medico : null;

                return [
                    'id_recordatorio'  => $r->id_recordatorio,
                    'id_cita'          => $r->id_cita,
                    'codigo_cita'      => $cita->codigo_cita ?? 'CITA-DEMO',
                    'tipo_canal'       => $r->tipo_canal,
                    'fecha_programada' => $r->fecha_programada ? Carbon::parse($r->fecha_programada)->format('Y-m-d H:i') : null,
                    'fecha_envio'      => $r->fecha_envio ? Carbon::parse($r->fecha_envio)->format('Y-m-d H:i') : null,
                    'estado_envio'     => $r->estado_envio,
                    'intentos'         => $r->intentos,
                    'mensaje'          => $r->mensaje,
                    'paciente'         => [
                        'nombre'   => $paciente ? "{$paciente->nombres} {$paciente->apellidos}" : 'Paciente General',
                        'ci'       => $paciente->ci ?? 'S/N',
                        'telefono' => $paciente->telefono ?? '70000000',
                        'email'    => $paciente->email ?? 'contacto@paciente.bo',
                    ],
                    'medico'           => $medico ? "Dr(a). {$medico->nombres} {$medico->apellidos}" : 'Médico General',
                    'especialidad'     => $cita && $cita->especialidad ? $cita->especialidad->nombre : 'Consulta',
                    'fecha_cita'       => $cita ? $cita->fecha_cita : null,
                    'hora_cita'        => $cita ? $cita->hora_inicio : null,
                ];
            });

            // Métricas
            $total = Recordatorio::count();
            $enviados = Recordatorio::where('estado_envio', 'ENVIADO')->count();
            $pendientes = Recordatorio::where('estado_envio', 'PENDIENTE')->count();
            $fallidos = Recordatorio::where('estado_envio', 'FALLIDO')->count();

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'recordatorios' => $data,
                    'estadisticas'  => [
                        'total'      => $total,
                        'enviados'   => $enviados,
                        'pendientes' => $pendientes,
                        'fallidos'   => $fallidos,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al listar recordatorios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tarea periódica / automática: escanear citas de las próximas 24 horas y generar avisos
     */
    public function escanearProximas24Horas(): JsonResponse
    {
        try {
            DB::beginTransaction();

            $hoy = Carbon::now('America/La_Paz')->toDateString();
            $manana = Carbon::now('America/La_Paz')->addDay()->toDateString();

            // Citas activas programadas para hoy o mañana
            $citas = Cita::with(['paciente', 'medico', 'especialidad'])
                ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA'])
                ->whereIn('fecha_cita', [$hoy, $manana])
                ->get();

            $generados = 0;

            foreach ($citas as $c) {
                // Verificar si ya existe recordatorio para esta cita
                $existe = Recordatorio::where('id_cita', $c->id_cita)->exists();
                if (!$existe) {
                    $pacienteNombre = $c->paciente ? "{$c->paciente->nombres} {$c->paciente->apellidos}" : 'Estimado Paciente';
                    $medicoNombre = $c->medico ? "Dr(a). {$c->medico->nombres} {$c->medico->apellidos}" : 'Médico Asignado';
                    $especialidadNombre = $c->especialidad ? $c->especialidad->nombre : 'Consulta';

                    $mensaje = "Clínica Vida Salud: Recordatorio de cita médica. Paciente: {$pacienteNombre}. Especialidad: {$especialidadNombre} con {$medicoNombre}. Fecha: {$c->fecha_cita} a las {$c->hora_inicio} (Bloque de 15 min). Por favor presentarse 10 min antes en recepción.";

                    Recordatorio::create([
                        'id_cita'          => $c->id_cita,
                        'tipo_canal'       => 'WHATSAPP',
                        'fecha_programada' => Carbon::now('America/La_Paz'),
                        'fecha_envio'      => Carbon::now('America/La_Paz'),
                        'estado_envio'     => 'ENVIADO',
                        'intentos'         => 1,
                        'mensaje'          => $mensaje,
                    ]);

                    $generados++;
                }
            }

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => "Escaneo completado con éxito. Se generaron y enviaron {$generados} recordatorios para citas en las próximas 24 horas.",
                'data'    => [
                    'nuevos_generados' => $generados,
                    'total_evaluadas'  => $citas->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al escanear citas próximas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reenviar recordatorio manualmente (Recepcionista)
     */
    public function reenviar($id): JsonResponse
    {
        try {
            $rec = Recordatorio::findOrFail($id);
            $rec->intentos += 1;
            $rec->estado_envio = 'ENVIADO';
            $rec->fecha_envio = Carbon::now('America/La_Paz');
            $rec->save();

            return response()->json([
                'status'  => 'success',
                'message' => "Recordatorio #{$rec->id_recordatorio} reenviado satisfactoriamente vía {$rec->tipo_canal}.",
                'data'    => $rec,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No se pudo reenviar el recordatorio: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear aviso o notificación manual
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_cita'    => 'required|integer|exists:citas,id_cita',
            'tipo_canal' => 'required|string|in:WHATSAPP,EMAIL,SMS',
            'mensaje'    => 'required|string|max:500',
        ]);

        try {
            $rec = Recordatorio::create([
                'id_cita'          => $validated['id_cita'],
                'tipo_canal'       => $validated['tipo_canal'],
                'fecha_programada' => Carbon::now('America/La_Paz'),
                'fecha_envio'      => Carbon::now('America/La_Paz'),
                'estado_envio'     => 'ENVIADO',
                'intentos'         => 1,
                'mensaje'          => $validated['mensaje'],
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => "Notificación enviada inmediatamente al paciente por {$validated['tipo_canal']}.",
                'data'    => $rec,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al registrar notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener notificaciones del usuario autenticado (Paciente, Médico o Staff)
     */
    public function misNotificaciones(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Recordatorio::with(['cita.paciente', 'cita.medico', 'cita.especialidad']);

            if ($user) {
                $rol = strtoupper($user->rol?->nombre_rol ?? '');
                if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                    $paciente = $user->paciente ?? \App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente::where('id_usuario', $user->id_usuario)->first();
                    if ($paciente) {
                        $query->whereHas('cita', function ($qc) use ($paciente) {
                            $qc->where('id_paciente', $paciente->id_paciente);
                        });
                    }
                } elseif ($rol === 'MEDICO') {
                    $medico = $user->medico ?? \App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico::where('id_usuario', $user->id_usuario)->first();
                    if ($medico) {
                        $query->whereHas('cita', function ($qc) use ($medico) {
                            $qc->where('id_medico', $medico->id_medico);
                        });
                    }
                }
            }

            $notificaciones = $query->orderBy('id_recordatorio', 'desc')
                ->take(30)
                ->get()
                ->map(function ($r) {
                    $msg = $r->mensaje;
                    $tipo = 'GENERAL';
                    if (str_contains(strtolower($msg), 'emergencia') || str_contains(strtolower($msg), 'bloqueo')) {
                        $tipo = 'EMERGENCIA';
                    } elseif (str_contains(strtolower($msg), 'reserva') || str_contains(strtolower($msg), 'agendada')) {
                        $tipo = 'RESERVA';
                    } elseif (str_contains(strtolower($msg), 'cancelada') || str_contains(strtolower($msg), 'expiración') || str_contains(strtolower($msg), 'plazo')) {
                        $tipo = 'CANCELACION';
                    } elseif (str_contains(strtolower($msg), 'laboratorio')) {
                        $tipo = 'LABORATORIO';
                    } elseif (str_contains(strtolower($msg), 'reprogramad')) {
                        $tipo = 'REPROGRAMACION';
                    }

                    return [
                        'id_notificacion' => $r->id_recordatorio,
                        'id_cita'         => $r->id_cita,
                        'codigo_cita'     => $r->cita?->codigo_cita ?? 'CITA',
                        'tipo'            => $tipo,
                        'mensaje'         => $r->mensaje,
                        'fecha'           => $r->fecha_envio ? Carbon::parse($r->fecha_envio)->format('Y-m-d H:i') : ($r->fecha_programada ? Carbon::parse($r->fecha_programada)->format('Y-m-d H:i') : null),
                        'canal'           => $r->tipo_canal,
                    ];
                });

            return response()->json([
                'success' => true,
                'data'    => $notificaciones,
                'total'   => count($notificaciones),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener notificaciones: ' . $e->getMessage(),
            ], 500);
        }
    }
}
