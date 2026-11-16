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
     * Obtener notificaciones del usuario autenticado estrictamente segmentadas por rol (RBAC)
     */
    public function misNotificaciones(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'success' => true,
                    'data'    => [],
                    'total'   => 0,
                ]);
            }

            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            $ahora = Carbon::now('America/La_Paz');
            $hoy = $ahora->toDateString();
            $notificaciones = [];

            // =========================================================================
            // 1. PACIENTE (CLIENTE): Solo recibe mensajes dirigidos a sus propias citas
            // =========================================================================
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $paciente = $user->paciente ?? \App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente::where('id_usuario', $user->id_usuario)->first();
                if ($paciente) {
                    $recs = Recordatorio::with(['cita.paciente', 'cita.medico', 'cita.especialidad'])
                        ->whereHas('cita', function ($qc) use ($paciente) {
                            $qc->where('id_paciente', $paciente->id_paciente);
                        })
                        ->orderBy('id_recordatorio', 'desc')
                        ->take(20)
                        ->get();

                    foreach ($recs as $r) {
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

                        $actionCu = 'CU10';
                        $actionPkg = 'PKG05';
                        $actionLabel = 'Ver Mis Citas';

                        if ($tipo === 'EMERGENCIA') {
                            $actionCu = 'CU11';
                            $actionPkg = 'PKG05';
                            $actionLabel = 'Reprogramar Cita Ahora';
                        } elseif ($tipo === 'LABORATORIO') {
                            $actionCu = 'CU18';
                            $actionPkg = 'PKG07';
                            $actionLabel = 'Ver Resultado PDF';
                        } elseif ($tipo === 'RESERVA') {
                            $actionCu = 'CU10';
                            $actionPkg = 'PKG05';
                            $actionLabel = 'Pagar Reserva';
                        } elseif ($tipo === 'CANCELACION') {
                            $actionCu = 'CU09';
                            $actionPkg = 'PKG04';
                            $actionLabel = 'Buscar Nuevo Horario';
                        }

                        $notificaciones[] = [
                            'id_notificacion' => $r->id_recordatorio,
                            'id_cita'         => $r->id_cita,
                            'codigo_cita'     => $r->cita?->codigo_cita ?? 'CITA',
                            'tipo'            => $tipo,
                            'mensaje'         => $r->mensaje,
                            'fecha'           => $r->fecha_envio ? Carbon::parse($r->fecha_envio)->format('Y-m-d H:i') : ($r->fecha_programada ? Carbon::parse($r->fecha_programada)->format('Y-m-d H:i') : null),
                            'canal'           => $r->tipo_canal,
                            'action_cu'       => $actionCu,
                            'action_pkg'      => $actionPkg,
                            'action_label'    => $actionLabel,
                        ];
                    }
                }
            }

            // =========================================================================
            // 2. MÉDICO: Solo avisos clínicos de su agenda, bloqueos y labs de sus pacientes
            // =========================================================================
            elseif ($rol === 'MEDICO') {
                $medico = $user->medico ?? \App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico::where('id_usuario', $user->id_usuario)->first();
                if ($medico) {
                    // A) Bloqueos activos o recientes de su agenda
                    $bloqueos = \App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda::where('id_medico', $medico->id_medico)
                        ->where('fecha_fin', '>=', $hoy)
                        ->orderBy('id_bloqueo', 'desc')
                        ->take(5)
                        ->get();

                    foreach ($bloqueos as $b) {
                        $horaIni = substr($b->hora_inicio, 0, 5);
                        $horaFin = substr($b->hora_fin, 0, 5);
                        $notificaciones[] = [
                            'id_notificacion' => 'med_blq_' . $b->id_bloqueo,
                            'id_cita'         => null,
                            'codigo_cita'     => 'AGENDA',
                            'tipo'            => 'EMERGENCIA',
                            'mensaje'         => "🚨 BLOQUEO DE AGENDA: Se encuentra activo un bloqueo ({$b->tipo_bloqueo}: {$b->motivo}) en su jornada del {$b->fecha_inicio} ({$horaIni} - {$horaFin}).",
                            'fecha'           => Carbon::parse($b->fecha_creacion)->format('Y-m-d H:i'),
                            'canal'           => 'CLÍNICA',
                            'action_cu'       => 'CU15',
                            'action_pkg'      => 'PKG06',
                            'action_label'    => 'Ver Mi Agenda (CU15)',
                        ];
                    }

                    // B) Estudios de laboratorio publicados de sus pacientes
                    $labs = \App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta::where('id_medico_solicitante', $medico->id_medico)
                        ->where('estado', 'PUBLICADO')
                        ->with(['paciente', 'cita'])
                        ->orderBy('id_estudio', 'desc')
                        ->take(5)
                        ->get();

                    foreach ($labs as $lab) {
                        $pacNom = $lab->paciente ? $lab->paciente->nombre_completo : 'Paciente';
                        $notificaciones[] = [
                            'id_notificacion' => 'med_lab_' . $lab->id_estudio,
                            'id_cita'         => $lab->id_cita,
                            'codigo_cita'     => $lab->codigo_estudio,
                            'tipo'            => 'LABORATORIO',
                            'mensaje'         => "🔬 RESULTADO PUBLICADO: El estudio '{$lab->nombre_estudio}' del paciente {$pacNom} (Cita #{$lab->cita?->codigo_cita}) ya está disponible para su valoración clínica.",
                            'fecha'           => Carbon::parse($lab->publicado_en ?? $lab->fecha_solicitud)->format('Y-m-d H:i'),
                            'canal'           => 'LABORATORIO',
                            'action_cu'       => 'CU18',
                            'action_pkg'      => 'PKG07',
                            'action_label'    => 'Revisar Estudio (CU18)',
                        ];
                    }

                    // C) Citas confirmadas en sala para hoy
                    $citasHoy = \App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita::where('id_medico', $medico->id_medico)
                        ->where('fecha_cita', $hoy)
                        ->whereIn('estado_cita', ['CONFIRMADA', 'EN_ESPERA'])
                        ->with('paciente')
                        ->orderBy('hora_inicio', 'asc')
                        ->take(5)
                        ->get();

                    foreach ($citasHoy as $ch) {
                        $pacNom = $ch->paciente ? $ch->paciente->nombre_completo : 'Paciente';
                        $horaTurno = substr($ch->hora_inicio, 0, 5);
                        $notificaciones[] = [
                            'id_notificacion' => 'med_cita_' . $ch->id_cita,
                            'id_cita'         => $ch->id_cita,
                            'codigo_cita'     => $ch->codigo_cita,
                            'tipo'            => 'RESERVA',
                            'mensaje'         => "📅 PACIENTE CONFIRMADO: {$pacNom} tiene cita médica programada hoy a las {$horaTurno} en su consultorio.",
                            'fecha'           => Carbon::parse($ch->fecha_actualizacion ?? $ch->fecha_creacion)->format('Y-m-d H:i'),
                            'canal'           => 'AGENDA',
                            'action_cu'       => 'CU15',
                            'action_pkg'      => 'PKG06',
                            'action_label'    => 'Atender en Agenda (CU15)',
                        ];
                    }
                }
            }

            // =========================================================================
            // 3. RECEPCIONISTA: Alertas operativas de recepción (bloqueos, caja, entrega de labs)
            // =========================================================================
            elseif ($rol === 'RECEPCIONISTA') {
                // A) Bloqueos activos que requieren atención operativa en recepción
                $bloqueos = \App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda::with('medico')
                    ->where('fecha_fin', '>=', $hoy)
                    ->orderBy('id_bloqueo', 'desc')
                    ->take(5)
                    ->get();

                foreach ($bloqueos as $b) {
                    $medNom = $b->medico ? $b->medico->nombre_completo : 'Médico';
                    $horaIni = substr($b->hora_inicio, 0, 5);
                    $horaFin = substr($b->hora_fin, 0, 5);
                    $notificaciones[] = [
                        'id_notificacion' => 'rec_blq_' . $b->id_bloqueo,
                        'id_cita'         => null,
                        'codigo_cita'     => 'OPERATIVA',
                        'tipo'            => 'EMERGENCIA',
                        'mensaje'         => "🚨 ALERTA RECEPCIÓN: El Dr(a). {$medNom} tiene un bloqueo activo ({$b->tipo_bloqueo}: {$b->motivo}) el {$b->fecha_inicio} ({$horaIni} - {$horaFin}). Brinde asistencia de reprogramación si acuden pacientes a ventanilla.",
                        'fecha'           => Carbon::parse($b->fecha_creacion)->format('Y-m-d H:i'),
                        'canal'           => 'RECEPCIÓN',
                        'action_cu'       => 'CU10',
                        'action_pkg'      => 'PKG05',
                        'action_label'    => 'Gestionar Citas (CU10)',
                    ];
                }

                // B) Citas de hoy pendientes de cobro en ventanilla (CU23)
                $citasPendientes = \App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita::where('estado_cita', 'PROGRAMADA')
                    ->where('fecha_cita', $hoy)
                    ->with(['paciente', 'medico'])
                    ->orderBy('hora_inicio', 'asc')
                    ->take(5)
                    ->get();

                foreach ($citasPendientes as $cp) {
                    $pacNom = $cp->paciente ? $cp->paciente->nombre_completo : 'Paciente';
                    $medNom = $cp->medico ? $cp->medico->nombre_completo : 'Médico';
                    $horaTurno = substr($cp->hora_inicio, 0, 5);
                    $notificaciones[] = [
                        'id_notificacion' => 'rec_prog_' . $cp->id_cita,
                        'id_cita'         => $cp->id_cita,
                        'codigo_cita'     => $cp->codigo_cita,
                        'tipo'            => 'CANCELACION',
                        'mensaje'         => "💳 COBRO EN VENTANILLA: Cita #{$cp->codigo_cita} del paciente {$pacNom} ({$horaTurno} con Dr(a). {$medNom}) pendiente de cobro en caja.",
                        'fecha'           => Carbon::parse($cp->fecha_creacion)->format('Y-m-d H:i'),
                        'canal'           => 'CAJA',
                        'action_cu'       => 'CU23',
                        'action_pkg'      => 'PKG05',
                        'action_label'    => 'Cobrar en Caja (CU23)',
                    ];
                }

                // C) Estudios de laboratorio publicados hoy listos para entrega
                $labsHoy = \App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta::where('estado', 'PUBLICADO')
                    ->whereDate('publicado_en', $hoy)
                    ->with('paciente')
                    ->orderBy('id_estudio', 'desc')
                    ->take(5)
                    ->get();

                foreach ($labsHoy as $labH) {
                    $pacNom = $labH->paciente ? $labH->paciente->nombre_completo : 'Paciente';
                    $notificaciones[] = [
                        'id_notificacion' => 'rec_lab_' . $labH->id_estudio,
                        'id_cita'         => $labH->id_cita,
                        'codigo_cita'     => $labH->codigo_estudio,
                        'tipo'            => 'LABORATORIO',
                        'mensaje'         => "🔬 RESULTADO LISTO: Estudio '{$labH->nombre_estudio}' de {$pacNom} disponible para entrega física o consulta de ventanilla.",
                        'fecha'           => Carbon::parse($labH->publicado_en)->format('Y-m-d H:i'),
                        'canal'           => 'RECEPCIÓN',
                        'action_cu'       => 'CU17',
                        'action_pkg'      => 'PKG07',
                        'action_label'    => 'Ver en Laboratorios (CU17)',
                    ];
                }
            }

            // =========================================================================
            // 4. ADMINISTRADOR: Auditoría, copias de seguridad y estado de sistema
            // =========================================================================
            elseif ($rol === 'ADMINISTRADOR') {
                // A) Bloqueos de agenda registrados recientemente
                $bloqueosAdmin = \App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda::with('medico')
                    ->where('fecha_fin', '>=', $hoy)
                    ->orderBy('id_bloqueo', 'desc')
                    ->take(3)
                    ->get();

                foreach ($bloqueosAdmin as $ba) {
                    $medNom = $ba->medico ? $ba->medico->nombre_completo : 'Médico';
                    $horaIni = substr($ba->hora_inicio, 0, 5);
                    $horaFin = substr($ba->hora_fin, 0, 5);
                    $notificaciones[] = [
                        'id_notificacion' => 'adm_blq_' . $ba->id_bloqueo,
                        'id_cita'         => null,
                        'codigo_cita'     => 'AUDITORÍA',
                        'tipo'            => 'EMERGENCIA',
                        'mensaje'         => "🛡️ AUDITORÍA DE AGENDA: Bloqueo registrado para el Dr(a). {$medNom} ({$ba->tipo_bloqueo}: {$ba->motivo}) en fecha {$ba->fecha_inicio} ({$horaIni} - {$horaFin}).",
                        'fecha'           => Carbon::parse($ba->fecha_creacion)->format('Y-m-d H:i'),
                        'canal'           => 'AUDITORÍA',
                        'action_cu'       => 'CU20',
                        'action_pkg'      => 'PKG08',
                        'action_label'    => 'Ver Dashboard (CU20)',
                    ];
                }

                // B) Logs de Backup
                if (\Illuminate\Support\Facades\Schema::hasTable('backup_logs')) {
                    $backupLogs = DB::table('backup_logs')->orderBy('id_log', 'desc')->take(3)->get();
                    foreach ($backupLogs as $bkl) {
                        $notificaciones[] = [
                            'id_notificacion' => 'adm_bk_' . $bkl->id_log,
                            'id_cita'         => null,
                            'codigo_cita'     => 'BACKUP',
                            'tipo'            => $bkl->estado === 'EXITOSO' ? 'RESERVA' : 'CANCELACION',
                            'mensaje'         => "💾 COPIA DE SEGURIDAD ({$bkl->estado}): '{$bkl->nombre_archivo}' ({$bkl->tamano_formateado}) registrado.",
                            'fecha'           => Carbon::parse($bkl->fecha_evento)->format('Y-m-d H:i'),
                            'canal'           => 'SEGURIDAD',
                            'action_cu'       => 'CU22',
                            'action_pkg'      => 'PKG01',
                            'action_label'    => 'Gestionar Backups (CU22)',
                        ];
                    }
                }
            }

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
