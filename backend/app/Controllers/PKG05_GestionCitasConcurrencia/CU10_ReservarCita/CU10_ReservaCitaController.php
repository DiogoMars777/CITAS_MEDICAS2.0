<?php

namespace App\Controllers\PKG05_GestionCitasConcurrencia\CU10_ReservarCita;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG04_AgendasHorarios\CU07_ConfigurarTurnos\TurnoMedico;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

/**
 * CU10 - Reservar cita médica con control de concurrencia
 * Actor(es): Paciente, Recepcionista
 */
class CU10_ReservaCitaController extends Controller
{
    /**
     * Metadatos para el formulario de reserva (Pacientes, Especialidades, Médicos)
     */
    public function meta(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);
        $user = $request->user();

        $pacientesQuery = Paciente::with('historiaClinica')
            ->where('estado', 'ACTIVO');

        // Regla de Privacidad: El paciente solo se ve a sí mismo en selectores; Recepción ve todos
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $pacientesQuery->where('id_usuario', $user->id_usuario);
            }
        } elseif ($request->filled('id_paciente')) {
            $pacientesQuery->where('id_paciente', (int) $request->input('id_paciente'));
        }

        $pacientes = $pacientesQuery
            ->orderBy('apellidos', 'asc')
            ->orderBy('nombres', 'asc')
            ->get()
            ->map(function ($p) {
                return [
                    'id_paciente'        => $p->id_paciente,
                    'nombre_completo'    => "{$p->apellidos}, {$p->nombres}",
                    'ci'                 => $p->ci,
                    'telefono'           => $p->telefono,
                    'numero_expediente'  => $p->historiaClinica?->numero_expediente ?? 'Sin expediente',
                    'tipo_sangre'        => $p->historiaClinica?->tipo_sangre,
                ];
            });

        $especialidades = Especialidad::where('estado', 'ACTIVO')
            ->orderBy('nombre', 'asc')
            ->get(['id_especialidad', 'nombre']);

        $medicos = Medico::with(['especialidades' => function ($q) {
            $q->where('especialidades.estado', 'ACTIVO');
        }])->where('estado', 'ACTIVO')
            ->orderBy('apellidos', 'asc')
            ->orderBy('nombres', 'asc')
            ->get()
            ->map(function ($m) {
                $esp = $m->especialidades->firstWhere('pivot.es_principal', true) ?? $m->especialidades->first();
                return [
                    'id_medico'              => $m->id_medico,
                    'nombre_completo'        => "Dr(a). {$m->nombre_completo}",
                    'matricula'              => $m->numero_registro_profesional,
                    'especialidad_principal' => $esp ? $esp->nombre : 'Medicina General',
                    'especialidades_ids'     => $m->especialidades->pluck('id_especialidad')->toArray(),
                ];
            });

        $estados = ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'INASISTENCIA'];

        return response()->json([
            'success'        => true,
            'fecha_actual'   => $ahoraBolivia->format('Y-m-d'),
            'hora_actual'    => $ahoraBolivia->format('H:i'),
            'pacientes'      => $pacientes,
            'especialidades' => $especialidades,
            'medicos'        => $medicos,
            'estados'        => $estados,
        ]);
    }

    /**
     * CU10 - Listado general de citas médicas con filtros y KPIs
     */
    public function index(Request $request): JsonResponse
    {
        // Cancelar citas vencidas por falta de pago previo de 24 horas
        Cita::cancelarCitasImpagasVencidas();

        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $query = Cita::with([
            'paciente.historiaClinica',
            'medico.especialidades',
            'especialidad',
            'creador',
            'pagos',
        ]);

        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(codigo_cita) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(motivo_consulta) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('paciente', function ($pq) use ($search) {
                      $pq->whereRaw('LOWER(nombres) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(ci) LIKE ?', ["%{$search}%"]);
                  })
                  ->orWhereHas('medico', function ($mq) use ($search) {
                      $mq->whereRaw('LOWER(nombres) LIKE ?', ["%{$search}%"])
                         ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        if ($request->filled('id_medico')) {
            $query->where('id_medico', (int) $request->input('id_medico'));
        }

        if ($request->filled('id_especialidad')) {
            $query->where('id_especialidad', (int) $request->input('id_especialidad'));
        }

        if ($request->filled('estado_cita')) {
            $query->where('estado_cita', strtoupper($request->input('estado_cita')));
        }

        if ($request->filled('fecha')) {
            $query->whereDate('fecha_cita', $request->input('fecha'));
        }

        // Regla de Visibilidad: Paciente solo puede ver sus propias reservas (Recepción ve todas)
        $user = $request->user();
        $idPacienteFiltro = null;
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $paciente = Paciente::where('id_usuario', $user->id_usuario)->first();
                $idPacienteFiltro = $paciente?->id_paciente;
            } elseif ($request->filled('id_paciente')) {
                $idPacienteFiltro = (int) $request->input('id_paciente');
            }
        } elseif ($request->filled('id_paciente')) {
            $idPacienteFiltro = (int) $request->input('id_paciente');
        }

        if ($idPacienteFiltro) {
            $query->where('citas.id_paciente', $idPacienteFiltro);
        }

        $query->orderBy('fecha_cita', 'desc')
              ->orderBy('hora_inicio', 'desc');

        $perPage = (int) $request->input('per_page', 15);
        $citas = $query->paginate($perPage);

        $citas->getCollection()->transform(function ($cita) {
            $pac = $cita->paciente;
            $med = $cita->medico;
            $esp = $cita->especialidad;

            return [
                'id_cita'                => $cita->id_cita,
                'codigo_cita'            => $cita->codigo_cita,
                'fecha_cita'             => Carbon::parse($cita->fecha_cita)->format('Y-m-d'),
                'hora_inicio'            => substr($cita->hora_inicio, 0, 5),
                'hora_fin'               => substr($cita->hora_fin, 0, 5),
                'horario_rango'          => substr($cita->hora_inicio, 0, 5) . ' - ' . substr($cita->hora_fin, 0, 5),
                'motivo_consulta'        => $cita->motivo_consulta,
                'estado_cita'            => $cita->estado_cita,
                'paciente_id'            => $cita->id_paciente,
                'paciente_nombre'        => $pac ? "{$pac->nombres} {$pac->apellidos}" : 'Paciente no asignado',
                'paciente_ci'            => $pac?->ci,
                'paciente_telefono'      => $pac?->telefono,
                'paciente_expediente'    => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                'medico_id'              => $cita->id_medico,
                'medico_nombre'          => $med ? "Dr(a). {$med->nombre_completo}" : 'Médico no asignado',
                'matricula_profesional'  => $med?->numero_registro_profesional,
                'especialidad_nombre'    => $esp?->nombre ?? 'Medicina General',
                'creado_por'             => $cita->creador?->nombre_completo ?? 'Sistema',
                'fecha_creacion'         => $cita->fecha_creacion,
                'esta_pagada'            => $cita->estaPagada(),
            ];
        });

        $hoyStr = $ahoraBolivia->format('Y-m-d');
        $kpiQuery = Cita::query();
        if ($idPacienteFiltro) {
            $kpiQuery->where('id_paciente', $idPacienteFiltro);
        }

        $kpis = [
            'total_citas'       => (clone $kpiQuery)->count(),
            'citas_programadas' => (clone $kpiQuery)->where('estado_cita', 'PROGRAMADA')->count(),
            'citas_confirmadas' => (clone $kpiQuery)->where('estado_cita', 'CONFIRMADA')->count(),
            'citas_atendidas'   => (clone $kpiQuery)->where('estado_cita', 'ATENDIDA')->count(),
            'citas_canceladas'  => (clone $kpiQuery)->where('estado_cita', 'CANCELADA')->count(),
            'citas_hoy'         => (clone $kpiQuery)->whereDate('fecha_cita', $hoyStr)->count(),
        ];

        return response()->json([
            'success' => true,
            'kpis'    => $kpis,
            'data'    => $citas,
        ]);
    }

    /**
     * CU10 - Reservar Cita Médica con Control de Concurrencia Estricto (Pessimistic Lock)
     */
    public function store(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $validator = Validator::make($request->all(), [
            'id_paciente'     => 'required|integer|exists:pacientes,id_paciente',
            'id_medico'       => 'required|integer|exists:medicos,id_medico',
            'id_especialidad' => 'required|integer|exists:especialidades,id_especialidad',
            'fecha_cita'      => 'required|date_format:Y-m-d',
            'hora_inicio'     => 'required|date_format:H:i',
            'hora_fin'        => 'required|date_format:H:i',
            'motivo_consulta' => 'required|string|min:3|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos del formulario.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $idPaciente = (int) $request->input('id_paciente');
        $idMedico = (int) $request->input('id_medico');
        $idEspecialidad = (int) $request->input('id_especialidad');
        $fechaCita = $request->input('fecha_cita');
        $horaIni = $request->input('hora_inicio') . ':00';
        $horaFin = $request->input('hora_fin') . ':00';
        $motivo = trim($request->input('motivo_consulta'));
        $usuarioId = $request->user()?->id_usuario ?? 1;

        if ($horaFin <= $horaIni) {
            return response()->json([
                'success' => false,
                'message' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ], 422);
        }

        $fechaCarbon = Carbon::parse($fechaCita, $timezone)->startOfDay();
        if ($fechaCarbon->isBefore($ahoraBolivia->copy()->startOfDay())) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden reservar citas en fechas pasadas.',
            ], 422);
        }

        if ($fechaCarbon->isSameDay($ahoraBolivia) && substr($horaFin, 0, 5) <= $ahoraBolivia->format('H:i')) {
            return response()->json([
                'success' => false,
                'message' => 'El horario seleccionado ya ha transcurrido en el día de hoy.',
            ], 422);
        }

        try {
            return DB::transaction(function () use (
                $idPaciente, $idMedico, $idEspecialidad, $fechaCita,
                $horaIni, $horaFin, $motivo, $usuarioId, $ahoraBolivia, $request
            ) {
                // 1. Bloqueo pesimista: verificar si el médico ya tiene una cita activa en ese rango
                $conflictoCita = Cita::where('id_medico', $idMedico)
                    ->whereDate('fecha_cita', $fechaCita)
                    ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA'])
                    ->where(function ($q) use ($horaIni, $horaFin) {
                        $q->where('hora_inicio', '<', $horaFin)
                          ->where('hora_fin', '>', $horaIni);
                    })
                    ->lockForUpdate()
                    ->first();

                if ($conflictoCita) {
                    return response()->json([
                        'success' => false,
                        'message' => "Conflicto de concurrencia: El cupo {$horaIni} - {$horaFin} acaba de ser reservado (Cita #{$conflictoCita->codigo_cita}). Por favor seleccione otro horario disponible.",
                    ], 409);
                }

                // 2. Verificar si existe un bloqueo de agenda que cubra el slot
                $bloqueo = BloqueoAgenda::where('id_medico', $idMedico)
                    ->where('fecha_inicio', '<=', $fechaCita)
                    ->where('fecha_fin', '>=', $fechaCita)
                    ->lockForUpdate()
                    ->get()
                    ->first(function ($b) use ($fechaCita, $horaIni, $horaFin) {
                        return $b->solapaConSlot($fechaCita, $horaIni, $horaFin);
                    });

                if ($bloqueo) {
                    return response()->json([
                        'success' => false,
                        'message' => "El horario seleccionado se encuentra bloqueado administrativamente: {$bloqueo->motivo}.",
                    ], 422);
                }

                // 3. Generar Código Único de Cita (formato CIT-YYYYMMDD-XXXX)
                $fechaNum = Carbon::parse($fechaCita)->format('Ymd');
                do {
                    $randomSuffix = strtoupper(Str::random(4));
                    $codigoCita = "CIT-{$fechaNum}-{$randomSuffix}";
                } while (Cita::where('codigo_cita', $codigoCita)->exists());

                // 4. Crear registro en tabla `citas`
                $cita = Cita::create([
                    'codigo_cita'         => $codigoCita,
                    'id_paciente'         => $idPaciente,
                    'id_medico'           => $idMedico,
                    'id_especialidad'     => $idEspecialidad,
                    'fecha_cita'          => $fechaCita,
                    'hora_inicio'         => $horaIni,
                    'hora_fin'            => $horaFin,
                    'motivo_consulta'     => $motivo,
                    'estado_cita'         => 'PROGRAMADA',
                    'creado_por'          => $usuarioId,
                    'fecha_creacion'      => $ahoraBolivia->format('Y-m-d H:i:s'),
                ]);

                // 5. Crear registro de reserva
                DB::table('reservas')->insert([
                    'id_cita'          => $cita->id_cita,
                    'id_paciente'      => $idPaciente,
                    'token_reserva'    => (string) Str::uuid(),
                    'fecha_expiracion' => Carbon::parse($fechaCita . ' ' . $horaIni)->toDateTimeString(),
                    'estado_reserva'   => 'CONFIRMADA',
                ]);

                $cita->load([
                    'paciente.historiaClinica',
                    'medico.especialidades',
                    'especialidad',
                ]);

                // 6. Auditoría
                BitacoraAuditoria::registrar(
                    'PKG05_GestionCitasConcurrencia',
                    'citas',
                    $cita->id_cita,
                    'INSERT',
                    null,
                    [
                        'codigo_cita'     => $cita->codigo_cita,
                        'paciente'        => "{$cita->paciente?->nombres} {$cita->paciente?->apellidos}",
                        'ci_paciente'     => $cita->paciente?->ci,
                        'medico'          => $cita->medico?->nombre_completo,
                        'especialidad'    => $cita->especialidad?->nombre,
                        'fecha_cita'      => $cita->fecha_cita,
                        'horario'         => "{$cita->hora_inicio} - {$cita->hora_fin}",
                        'motivo_consulta' => $cita->motivo_consulta,
                        'estado_cita'     => $cita->estado_cita,
                    ],
                    $usuarioId,
                    $request->ip(),
                    $request->userAgent()
                );

                $pac = $cita->paciente;
                $med = $cita->medico;

                return response()->json([
                    'success' => true,
                    'message' => "Cita médica reservada exitosamente con código {$codigoCita}.",
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
                        'fecha_emision'          => $ahoraBolivia->format('Y-m-d H:i:s'),
                    ],
                ], 201);
            }, 5);
        } catch (\Throwable $e) {
            Log::error('Error en CU10 reservar cita: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la reserva de cita: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU10 - Ver detalle completo de una cita y emisión de ficha médica
     */
    public function show(int $id): JsonResponse
    {
        $cita = Cita::with([
            'paciente.historiaClinica',
            'medico.especialidades',
            'especialidad',
            'creador',
        ])->find($id);

        if (!$cita) {
            return response()->json(['success' => false, 'message' => 'Cita médica no encontrada.'], 404);
        }

        $pac = $cita->paciente;
        $med = $cita->medico;

        return response()->json([
            'success' => true,
            'data'    => [
                'id_cita'                => $cita->id_cita,
                'codigo_cita'            => $cita->codigo_cita,
                'fecha_cita'             => Carbon::parse($cita->fecha_cita)->format('Y-m-d'),
                'hora_inicio'            => substr($cita->hora_inicio, 0, 5),
                'hora_fin'               => substr($cita->hora_fin, 0, 5),
                'horario_rango'          => substr($cita->hora_inicio, 0, 5) . ' - ' . substr($cita->hora_fin, 0, 5),
                'motivo_consulta'        => $cita->motivo_consulta,
                'estado_cita'            => $cita->estado_cita,
                'paciente_id'            => $cita->id_paciente,
                'paciente_nombre'        => $pac ? "{$pac->nombres} {$pac->apellidos}" : '',
                'paciente_ci'            => $pac?->ci,
                'paciente_telefono'      => $pac?->telefono,
                'paciente_expediente'    => $pac?->historiaClinica?->numero_expediente ?? 'N/A',
                'paciente_tipo_sangre'   => $pac?->historiaClinica?->tipo_sangre ?? 'No registrado',
                'medico_id'              => $cita->id_medico,
                'medico_nombre'          => $med ? "Dr(a). {$med->nombre_completo}" : '',
                'matricula_profesional'  => $med?->numero_registro_profesional,
                'especialidad_nombre'    => $cita->especialidad?->nombre ?? '',
                'creado_por'             => $cita->creador?->nombre_completo ?? 'Sistema',
                'fecha_creacion'         => $cita->fecha_creacion,
            ],
        ]);
    }

    /**
     * CU10 - Cambiar estado de la cita
     */
    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado_cita' => 'required|string|in:PROGRAMADA,CONFIRMADA,ATENDIDA,CANCELADA,INASISTENCIA',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Estado no válido.'], 422);
        }

        $cita = Cita::find($id);
        if (!$cita) {
            return response()->json(['success' => false, 'message' => 'Cita no encontrada.'], 404);
        }

        $estadoAnterior = $cita->estado_cita;
        $nuevoEstado = strtoupper($request->input('estado_cita'));
        $usuarioId = $request->user()?->id_usuario ?? 1;

        $cita->estado_cita = $nuevoEstado;
        $cita->fecha_actualizacion = Carbon::now('America/La_Paz');
        $cita->save();

        BitacoraAuditoria::registrar(
            'PKG05_GestionCitasConcurrencia',
            'citas',
            $cita->id_cita,
            'UPDATE',
            ['estado_cita' => $estadoAnterior],
            ['estado_cita' => $nuevoEstado],
            $usuarioId,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => "Estado de la cita {$cita->codigo_cita} actualizado a {$nuevoEstado}.",
            'data'    => $cita,
        ]);
    }
}
