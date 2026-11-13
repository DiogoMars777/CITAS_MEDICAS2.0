<?php

namespace App\Controllers\PKG04_AgendasHorarios\CU09_ConsultarDisponibilidad;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

use App\Models\PKG04_AgendasHorarios\CU07_ConfigurarTurnos\TurnoMedico;
use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;

/**
 * CU09 - Consultar disponibilidad de horarios médicos
 * Actor(es): Paciente, Recepcionista, Médico
 */
class CU09_DisponibilidadController extends Controller
{
    /**
     * Metadatos para los filtros de búsqueda (Especialidades, Médicos, Franjas Horarias)
     */
    public function meta(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $especialidades = Especialidad::where('estado', 'ACTIVO')
            ->orderBy('nombre', 'asc')
            ->get(['id_especialidad', 'nombre']);

        $queryMedicos = Medico::with(['especialidades' => function ($q) {
            $q->where('especialidades.estado', 'ACTIVO');
        }])->where('estado', 'ACTIVO');

        if ($request->filled('id_especialidad')) {
            $idEspecialidad = (int) $request->input('id_especialidad');
            $queryMedicos->whereHas('especialidades', function ($q) use ($idEspecialidad) {
                $q->where('especialidades.id_especialidad', $idEspecialidad);
            });
        }

        $medicos = $queryMedicos->orderBy('apellidos', 'asc')
            ->orderBy('nombres', 'asc')
            ->get()
            ->map(function ($m) {
                $esp = $m->especialidades->firstWhere('pivot.es_principal', true) ?? $m->especialidades->first();
                return [
                    'id_medico'              => $m->id_medico,
                    'nombre_completo'        => "Dr(a). {$m->nombre_completo}",
                    'matricula'              => $m->numero_registro_profesional,
                    'especialidad_principal' => $esp ? $esp->nombre : 'Sin especialidad',
                    'especialidades_ids'     => $m->especialidades->pluck('id_especialidad')->toArray(),
                ];
            });

        $franjas = [
            ['id' => 'TODOS', 'label' => 'Todo el día', 'rango' => '08:00 - 22:00'],
            ['id' => 'MANANA', 'label' => 'Mañana', 'rango' => '08:00 - 12:00'],
            ['id' => 'TARDE', 'label' => 'Tarde', 'rango' => '12:00 - 18:00'],
            ['id' => 'NOCHE', 'label' => 'Noche', 'rango' => '18:00 - 22:00'],
        ];

        return response()->json([
            'success'          => true,
            'fecha_actual'     => $ahoraBolivia->format('Y-m-d'),
            'hora_actual'      => $ahoraBolivia->format('H:i'),
            'especialidades'   => $especialidades,
            'medicos'          => $medicos,
            'franjas_horarias' => $franjas,
        ]);
    }

    /**
     * CU09 - Consulta de disponibilidad de cupos de 15 minutos en tiempo real
     */
    public function consultar(Request $request): JsonResponse
    {
        // Cancelar automáticamente citas impagas de 24 horas antes para liberar los slots inmediatamente
        Cita::cancelarCitasImpagasVencidas();

        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $validator = Validator::make($request->all(), [
            'fecha'           => 'nullable|date_format:Y-m-d',
            'id_especialidad' => 'nullable|integer|exists:especialidades,id_especialidad',
            'id_medico'       => 'nullable|integer|exists:medicos,id_medico',
            'turno_filtro'    => 'nullable|string|in:TODOS,MANANA,TARDE,NOCHE',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros de consulta no válidos.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $fechaStr = $request->input('fecha', $ahoraBolivia->format('Y-m-d'));
        $fechaConsulta = Carbon::parse($fechaStr, $timezone)->startOfDay();
        $esHoy = $fechaConsulta->isSameDay($ahoraBolivia);
        $esPasado = $fechaConsulta->isBefore($ahoraBolivia->copy()->startOfDay());

        // Día de la semana ISO (1 = Lunes .. 7 = Domingo)
        $diaSemana = $fechaConsulta->dayOfWeekIso;

        $diasMap = [
            1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles',
            4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo',
        ];
        $diaNombre = $diasMap[$diaSemana] ?? 'Día desconocido';

        $idEspecialidad = $request->input('id_especialidad');
        $idMedico = $request->input('id_medico');
        $turnoFiltro = $request->input('turno_filtro', 'TODOS');

        // 1. Médicos objetivo
        $queryMedicos = Medico::with(['especialidades' => function ($q) {
            $q->where('especialidades.estado', 'ACTIVO');
        }])->where('estado', 'ACTIVO');

        if ($idMedico) {
            $queryMedicos->where('id_medico', (int) $idMedico);
        } elseif ($idEspecialidad) {
            $queryMedicos->whereHas('especialidades', function ($q) use ($idEspecialidad) {
                $q->where('especialidades.id_especialidad', (int) $idEspecialidad);
            });
        }

        $medicos = $queryMedicos->orderBy('apellidos')->get();

        // 2. Procesar disponibilidad por médico
        $resultadoMedicos = [];
        $totalGeneralCupos = 0;
        $totalDisponibles = 0;
        $totalOcupados = 0;
        $totalBloqueados = 0;
        $totalExpirados = 0;

        foreach ($medicos as $medico) {
            $espPrincipal = $medico->especialidades->firstWhere('pivot.es_principal', true)
                ?? $medico->especialidades->first();

            $turnos = TurnoMedico::where('id_medico', $medico->id_medico)
                ->where('dia_semana', $diaSemana)
                ->where('estado', 'ACTIVO')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            $citas = Cita::with(['paciente'])
                ->where('id_medico', $medico->id_medico)
                ->whereDate('fecha_cita', $fechaStr)
                ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA'])
                ->get();

            $bloqueos = BloqueoAgenda::where('id_medico', $medico->id_medico)
                ->where('fecha_inicio', '<=', $fechaStr)
                ->where('fecha_fin', '>=', $fechaStr)
                ->get();

            $medicoSlots = [];
            $medicoDisponibles = 0;
            $medicoOcupados = 0;
            $medicoBloqueados = 0;

            foreach ($turnos as $turno) {
                $duracion = $turno->duracion_bloque_min ?: 15;
                $inicioTurno = Carbon::parse($turno->hora_inicio, $timezone);
                $finTurno = Carbon::parse($turno->hora_fin, $timezone);

                while ($inicioTurno->copy()->addMinutes($duracion)->lessThanOrEqualTo($finTurno)) {
                    $slotIniStr = $inicioTurno->format('H:i');
                    $slotFinStr = $inicioTurno->copy()->addMinutes($duracion)->format('H:i');

                    $incluir = true;
                    if ($turnoFiltro === 'MANANA' && $slotIniStr >= '12:00') $incluir = false;
                    if ($turnoFiltro === 'TARDE' && ($slotIniStr < '12:00' || $slotIniStr >= '18:00')) $incluir = false;
                    if ($turnoFiltro === 'NOCHE' && $slotIniStr < '18:00') $incluir = false;

                    if ($incluir) {
                        $estadoSlot = 'DISPONIBLE';
                        $motivoDetalle = null;
                        $citaInfo = null;

                        // ¿Bloqueo de agenda?
                        foreach ($bloqueos as $b) {
                            if ($b->solapaConSlot($fechaStr, $slotIniStr, $slotFinStr)) {
                                $estadoSlot = 'BLOQUEADO';
                                $motivoDetalle = "Bloqueado: {$b->motivo}";
                                break;
                            }
                        }

                        // ¿Cita activa?
                        if ($estadoSlot === 'DISPONIBLE') {
                            foreach ($citas as $c) {
                                $cIni = substr($c->hora_inicio, 0, 5);
                                $cFin = substr($c->hora_fin, 0, 5);
                                if ($slotIniStr < $cFin && $slotFinStr > $cIni) {
                                    $estadoSlot = 'OCUPADO';
                                    $citaInfo = [
                                        'id_cita'     => $c->id_cita,
                                        'codigo'      => $c->codigo_cita,
                                        'estado_cita' => $c->estado_cita,
                                        'paciente'    => $c->paciente ? "{$c->paciente->nombres} {$c->paciente->apellidos}" : 'Paciente reservado',
                                    ];
                                    break;
                                }
                            }
                        }

                        // ¿Hora pasada hoy?
                        if ($estadoSlot === 'DISPONIBLE') {
                            if ($esPasado) {
                                $estadoSlot = 'EXPIRADO';
                                $motivoDetalle = 'Fecha pasada';
                            } elseif ($esHoy && $slotFinStr <= $ahoraBolivia->format('H:i')) {
                                $estadoSlot = 'EXPIRADO';
                                $motivoDetalle = 'Horario transcurrido';
                            }
                        }

                        if ($estadoSlot === 'DISPONIBLE') {
                            $medicoDisponibles++;
                            $totalDisponibles++;
                        } elseif ($estadoSlot === 'OCUPADO') {
                            $medicoOcupados++;
                            $totalOcupados++;
                        } elseif ($estadoSlot === 'BLOQUEADO') {
                            $medicoBloqueados++;
                            $totalBloqueados++;
                        } elseif ($estadoSlot === 'EXPIRADO') {
                            $totalExpirados++;
                        }

                        $totalGeneralCupos++;

                        $medicoSlots[] = [
                            'hora_inicio'    => $slotIniStr,
                            'hora_fin'       => $slotFinStr,
                            'intervalo'      => "{$slotIniStr} - {$slotFinStr}",
                            'duracion_min'   => $duracion,
                            'estado'         => $estadoSlot,
                            'motivo'         => $motivoDetalle,
                            'cita'           => $citaInfo,
                            'id_turno'       => $turno->id_turno,
                        ];
                    }

                    $inicioTurno->addMinutes($duracion);
                }
            }

            if ($idMedico || count($turnos) > 0) {
                $resultadoMedicos[] = [
                    'id_medico'              => $medico->id_medico,
                    'nombre_completo'        => "Dr(a). {$medico->nombre_completo}",
                    'matricula'              => $medico->numero_registro_profesional,
                    'especialidad_principal' => $espPrincipal ? $espPrincipal->nombre : 'Medicina General',
                    'id_especialidad'        => $espPrincipal?->id_especialidad,
                    'tiene_turnos_hoy'       => count($turnos) > 0,
                    'turnos_configurados'    => count($turnos),
                    'total_cupos'            => count($medicoSlots),
                    'cupos_disponibles'      => $medicoDisponibles,
                    'cupos_ocupados'         => $medicoOcupados,
                    'cupos_bloqueados'       => $medicoBloqueados,
                    'slots'                  => $medicoSlots,
                ];
            }
        }

        // Matriz de 14 días
        $proximosDias = $this->calcularMatrizProximosDias($fechaConsulta, $idMedico, $idEspecialidad, 14);

        $porcentajeOcupacion = $totalGeneralCupos > 0
            ? round(($totalOcupados / $totalGeneralCupos) * 100)
            : 0;

        return response()->json([
            'success' => true,
            'consulta' => [
                'fecha'          => $fechaStr,
                'dia_nombre'     => $diaNombre,
                'dia_semana'     => $diaSemana,
                'es_hoy'         => $esHoy,
                'es_pasado'      => $esPasado,
                'hora_consulta'  => $ahoraBolivia->format('H:i:s'),
                'filtro_franja'  => $turnoFiltro,
            ],
            'kpis' => [
                'total_cupos'          => $totalGeneralCupos,
                'cupos_disponibles'    => $totalDisponibles,
                'cupos_ocupados'       => $totalOcupados,
                'cupos_bloqueados'     => $totalBloqueados,
                'cupos_expirados'      => $totalExpirados,
                'porcentaje_ocupacion' => $porcentajeOcupacion,
                'total_medicos'        => count($resultadoMedicos),
            ],
            'medicos'        => $resultadoMedicos,
            'proximos_dias'  => $proximosDias,
        ]);
    }

    /**
     * Matriz de disponibilidad para los próximos N días
     */
    private function calcularMatrizProximosDias(Carbon $fechaBase, ?int $idMedico, ?int $idEspecialidad, int $totalDias = 14): array
    {
        $diasMap = [
            1 => 'Lun', 2 => 'Mar', 3 => 'Mié',
            4 => 'Jue', 5 => 'Vie', 6 => 'Sáb', 7 => 'Dom',
        ];

        $matriz = [];
        $cursor = $fechaBase->copy();

        for ($i = 0; $i < $totalDias; $i++) {
            $fStr = $cursor->format('Y-m-d');
            $diaSem = $cursor->dayOfWeekIso;

            $turnosQuery = TurnoMedico::where('dia_semana', $diaSem)
                ->where('estado', 'ACTIVO');

            if ($idMedico) {
                $turnosQuery->where('id_medico', $idMedico);
            } elseif ($idEspecialidad) {
                $turnosQuery->whereHas('medico.especialidades', function ($q) use ($idEspecialidad) {
                    $q->where('especialidades.id_especialidad', $idEspecialidad);
                });
            }

            $turnos = $turnosQuery->get();
            $cuposTotales = $turnos->sum(fn($t) => $t->cupos_totales);

            $citasQuery = Cita::whereDate('fecha_cita', $fStr)
                ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'ATENDIDA']);
            if ($idMedico) {
                $citasQuery->where('id_medico', $idMedico);
            }
            $citasOcupadas = $citasQuery->count();
            $cuposLibres = max(0, $cuposTotales - $citasOcupadas);

            $matriz[] = [
                'fecha'            => $fStr,
                'dia_corto'        => $diasMap[$diaSem] ?? '',
                'dia_numero'       => $cursor->format('d'),
                'mes_corto'        => $cursor->locale('es')->isoFormat('MMM'),
                'dia_semana'       => $diaSem,
                'es_seleccionado'  => ($i === 0),
                'total_cupos'      => $cuposTotales,
                'cupos_libres'     => $cuposLibres,
                'tiene_turnos'     => $cuposTotales > 0,
            ];

            $cursor->addDay();
        }

        return $matriz;
    }
}
