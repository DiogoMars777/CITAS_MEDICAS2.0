<?php

namespace App\Controllers\PKG04_AgendasHorarios\CU08_BloqueosAgenda;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU08_BloqueoAgendaController extends Controller
{
    /**
     * CU08 - Listar Bloqueos de Agenda Médica con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $query = BloqueoAgenda::with(['medico.especialidades', 'creador'])
            ->orderBy('fecha_inicio', 'desc')
            ->orderBy('hora_inicio', 'desc');

        if ($request->filled('id_medico')) {
            $query->where('id_medico', (int) $request->input('id_medico'));
        }

        if ($request->filled('tipo_bloqueo')) {
            $query->where('tipo_bloqueo', $request->input('tipo_bloqueo'));
        }

        $bloqueos = $query->paginate((int) $request->input('per_page', 20));

        $bloqueos->getCollection()->transform(function ($b) use ($ahoraBolivia, $timezone) {
            $med = $b->medico;
            $esp = $med?->especialidades->first();
            $fechaFinStr = substr((string) $b->fecha_fin, 0, 10);
            $horaFinStr = substr((string) $b->hora_fin, 0, 5) . ':00';
            $fechaFin = Carbon::parse("{$fechaFinStr} {$horaFinStr}", $timezone);
            $esActivo = $fechaFin->isAfter($ahoraBolivia);

            return [
                'id_bloqueo'         => $b->id_bloqueo,
                'id_medico'          => $b->id_medico,
                'medico_nombre'      => $med ? "Dr(a). {$med->nombre_completo}" : 'Médico no asignado',
                'matricula'          => $med?->numero_registro_profesional,
                'especialidad'       => $esp?->nombre ?? 'Medicina General',
                'fecha_inicio'       => $b->fecha_inicio,
                'fecha_fin'          => $b->fecha_fin,
                'hora_inicio'        => substr($b->hora_inicio, 0, 5),
                'hora_fin'           => substr($b->hora_fin, 0, 5),
                'horario_rango'      => substr($b->hora_inicio, 0, 5) . ' - ' . substr($b->hora_fin, 0, 5),
                'tipo_bloqueo'       => $b->tipo_bloqueo,
                'motivo'             => $b->motivo,
                'es_activo'          => $esActivo,
                'creado_por'         => $b->creador?->nombre_completo ?? 'Administrador',
                'fecha_creacion'     => $b->fecha_creacion,
            ];
        });

        // Metadatos y KPIs
        $totalBloqueos = BloqueoAgenda::count();
        $bloqueosVigentes = BloqueoAgenda::where('fecha_fin', '>=', $ahoraBolivia->format('Y-m-d'))->count();

        return response()->json([
            'success' => true,
            'kpis'    => [
                'total_bloqueos'    => $totalBloqueos,
                'bloqueos_vigentes' => $bloqueosVigentes,
            ],
            'data'    => $bloqueos,
        ]);
    }

    /**
     * CU08 - Registrar un nuevo bloqueo de agenda médica
     */
    public function store(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $ahoraBolivia = Carbon::now($timezone);

        $validator = Validator::make($request->all(), [
            'id_medico'    => 'required|integer|exists:medicos,id_medico',
            'fecha_inicio' => 'required|date_format:Y-m-d',
            'fecha_fin'    => 'required|date_format:Y-m-d|after_or_equal:fecha_inicio',
            'hora_inicio'  => 'required|date_format:H:i',
            'hora_fin'     => 'required|date_format:H:i',
            'tipo_bloqueo' => 'required|string|in:EMERGENCIA,PERMISO,CAPACITACION,CIRUGIA,VACACIONES,ADMINISTRATIVO',
            'motivo'       => 'required|string|min:3|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos del bloqueo.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $horaInicio = $request->input('hora_inicio') . ':00';
        $horaFin = $request->input('hora_fin') . ':00';

        if ($horaFin <= $horaInicio) {
            return response()->json([
                'success' => false,
                'message' => 'La hora final del bloqueo debe ser posterior a la hora inicial.',
            ], 422);
        }

        $usuarioId = $request->user()?->id_usuario ?? 1;

        $bloqueo = BloqueoAgenda::create([
            'id_medico'      => (int) $request->input('id_medico'),
            'fecha_inicio'   => $request->input('fecha_inicio'),
            'fecha_fin'      => $request->input('fecha_fin'),
            'hora_inicio'    => $horaInicio,
            'hora_fin'       => $horaFin,
            'tipo_bloqueo'   => $request->input('tipo_bloqueo'),
            'motivo'         => trim($request->input('motivo')),
            'creado_por'     => $usuarioId,
            'fecha_creacion' => $ahoraBolivia->format('Y-m-d H:i:s'),
        ]);

        $bloqueo->load(['medico', 'creador']);

        // Cancelar citas afectadas por emergencia y enviar señal de reprogramación al paciente
        $citasAfectadas = \App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita::with(['paciente', 'medico'])
            ->where('id_medico', (int) $request->input('id_medico'))
            ->whereBetween('fecha_cita', [$request->input('fecha_inicio'), $request->input('fecha_fin')])
            ->where('estado_cita', '!=', 'CANCELADA')
            ->where('hora_inicio', '<', $horaFin)
            ->where('hora_fin', '>', $horaInicio)
            ->get();

        $citasCanceladasCount = 0;

        foreach ($citasAfectadas as $citaAfectada) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($citaAfectada, $bloqueo, $usuarioId, $ahoraBolivia, &$citasCanceladasCount) {
                // Si la cita tenía registro de atención médica para este turno bloqueado, se invalida
                \App\Models\PKG06_AtencionMedica\CU16_AtenderConsulta\AtencionMedica::where('id_cita', $citaAfectada->id_cita)->delete();

                // Cancelar la cita por emergencia
                $citaAfectada->estado_cita = 'CANCELADA';
                $citaAfectada->fecha_actualizacion = $ahoraBolivia;
                $citaAfectada->save();

                \App\Models\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CancelacionCita::create([
                    'id_cita'                => $citaAfectada->id_cita,
                    'motivo_cancelacion'     => "Cancelación por bloqueo de agenda ({$bloqueo->tipo_bloqueo}): {$bloqueo->motivo}",
                    'id_usuario_responsable' => $usuarioId,
                    'fecha_cancelacion'      => $ahoraBolivia,
                ]);

                // Generar recordatorio / señal al paciente para que reprograme
                $pacienteNombre = $citaAfectada->paciente?->nombres ?? ($citaAfectada->paciente?->nombre_completo ?? 'Paciente');
                $medicoNombre = $citaAfectada->medico?->nombre_completo ?? 'Médico Tratante';
                \App\Models\PKG08_DashboardReportes\CU19_Recordatorios\Recordatorio::create([
                    'id_cita'          => $citaAfectada->id_cita,
                    'tipo_canal'       => 'WHATSAPP',
                    'fecha_programada' => $ahoraBolivia,
                    'fecha_envio'      => $ahoraBolivia,
                    'estado_envio'     => 'ENVIADO',
                    'intentos'         => 1,
                    'mensaje'          => "🚨 Estimado(a) {$pacienteNombre}: Por motivo de bloqueo/emergencia médica ({$bloqueo->motivo}), su cita (#{$citaAfectada->codigo_cita}) del {$citaAfectada->fecha_cita} ({$citaAfectada->hora_inicio}) con el Dr(a). {$medicoNombre} ha sido cancelada. Ingrese a su portal de paciente para reprogramar su turno prioritariamente sin costo adicional.",
                ]);

                $citasCanceladasCount++;
            });
        }

        // Registrar en bitácora de auditoría
        BitacoraAuditoria::registrar(
            'PKG04_AgendasHorarios',
            'bloqueos_agenda',
            $bloqueo->id_bloqueo,
            'INSERT',
            null,
            [
                'medico'           => $bloqueo->medico?->nombre_completo,
                'tipo_bloqueo'     => $bloqueo->tipo_bloqueo,
                'periodo'          => "{$bloqueo->fecha_inicio} al {$bloqueo->fecha_fin}",
                'horario'          => "{$bloqueo->hora_inicio} - {$bloqueo->hora_fin}",
                'motivo'           => $bloqueo->motivo,
                'citas_canceladas' => $citasCanceladasCount,
            ],
            $usuarioId,
            $request->ip(),
            $request->userAgent()
        );

        $mensajeRespuesta = "Bloqueo de agenda médica registrado exitosamente para el médico {$bloqueo->medico?->nombre_completo}.";
        if ($citasCanceladasCount > 0) {
            $mensajeRespuesta .= " Se cancelaron {$citasCanceladasCount} cita(s) activas por emergencia y se enviaron las alertas para reprogramación a los pacientes.";
        }

        return response()->json([
            'success'                 => true,
            'message'                 => $mensajeRespuesta,
            'data'                    => $bloqueo,
            'citas_canceladas_count' => $citasCanceladasCount,
        ], 201);
    }

    /**
     * CU08 - Eliminar / Liberar bloqueo de agenda médica
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $bloqueo = BloqueoAgenda::with('medico')->find($id);

        if (!$bloqueo) {
            return response()->json(['success' => false, 'message' => 'Bloqueo no encontrado.'], 404);
        }

        $usuarioId = $request->user()?->id_usuario ?? 1;

        $datosAnteriores = [
            'id_bloqueo'   => $bloqueo->id_bloqueo,
            'medico'       => $bloqueo->medico?->nombre_completo,
            'tipo_bloqueo' => $bloqueo->tipo_bloqueo,
            'periodo'      => "{$bloqueo->fecha_inicio} al {$bloqueo->fecha_fin}",
            'horario'      => "{$bloqueo->hora_inicio} - {$bloqueo->hora_fin}",
            'motivo'       => $bloqueo->motivo,
        ];

        $bloqueo->delete();

        BitacoraAuditoria::registrar(
            'PKG04_AgendasHorarios',
            'bloqueos_agenda',
            $id,
            'DELETE',
            $datosAnteriores,
            null,
            $usuarioId,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => 'Bloqueo de agenda liberado exitosamente. Los horarios vuelven a estar disponibles.',
        ]);
    }

    /**
     * CU08 - Médicos y tipos de bloqueo para el formulario
     */
    public function meta(): JsonResponse
    {
        $medicos = Medico::where('estado', 'ACTIVO')
            ->orderBy('apellidos', 'asc')
            ->get()
            ->map(function ($m) {
                return [
                    'id_medico'       => $m->id_medico,
                    'nombre_completo' => "Dr(a). {$m->nombre_completo}",
                ];
            });

        return response()->json([
            'success'        => true,
            'medicos'        => $medicos,
            'tipos_bloqueo'  => ['EMERGENCIA', 'PERMISO', 'CIRUGIA', 'CAPACITACION', 'VACACIONES', 'ADMINISTRATIVO'],
        ]);
    }
}
