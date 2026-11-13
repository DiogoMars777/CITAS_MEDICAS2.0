<?php

namespace App\Controllers\PKG06_AtencionMedica\CU15_AgendaDiariaMedico;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\HistoriaClinica;
use App\Models\PKG06_AtencionMedica\CU16_AtenderConsulta\AtencionMedica;
use App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU15_AgendaMedicoController extends Controller
{
    /**
     * CU15 - Visualizar agenda médica diaria del profesional autenticado
     * Filtra exclusivamente los pacientes agendados en su jornada para proteger la privacidad.
     */
    public function agendaDiaria(Request $request): JsonResponse
    {
        $timezone = 'America/La_Paz';
        $fecha = $request->input('fecha', Carbon::now($timezone)->toDateString());

        // Identificar al médico autenticado
        $medico = $this->resolverMedico($request);

        if (!$medico) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No se encontró un perfil médico asociado al usuario actual.',
            ], 404);
        }

        // Aplicar cancelación automática de citas impagas cuyo plazo de 24 horas previas venció
        Cita::cancelarCitasImpagasVencidas();

        // Consultar citas del médico en la fecha indicada en orden cronológico estricto (bloques de 15 min)
        $citas = Cita::where('id_medico', $medico->id_medico)
            ->whereDate('fecha_cita', $fecha)
            ->with([
                'paciente.historiaClinica',
                'paciente.contactoEmergencia',
                'especialidad',
                'atencionMedica',
                'laboratorios',
                'pagos',
            ])
            ->orderBy('hora_inicio', 'asc')
            ->get();

        // Resumen de Métricas / KPIs del día
        $kpis = [
            'total_citas'   => $citas->count(),
            'atendidas'     => $citas->where('estado_cita', 'ATENDIDA')->count(),
            'en_espera'     => $citas->whereIn('estado_cita', ['EN_ESPERA', 'CONFIRMADA'])->count(),
            'programadas'   => $citas->where('estado_cita', 'PROGRAMADA')->count(),
            'canceladas'    => $citas->whereIn('estado_cita', ['CANCELADA', 'INASISTENCIA'])->count(),
        ];

        // Mapeo detallado con cálculo de edad y formateo
        $citasFormateadas = $citas->map(function ($cita) {
            $paciente = $cita->paciente;
            $historia = $paciente ? $paciente->historiaClinica : null;
            $contacto = $paciente ? $paciente->contactoEmergencia : null;

            $alergias = $historia ? $historia->alergias_medicamentos : null;
            $tieneAlergias = !empty(trim((string)$alergias)) 
                && stripos(trim((string)$alergias), 'ningun') === false 
                && strtoupper(trim((string)$alergias)) !== 'NO'
                && strtoupper(trim((string)$alergias)) !== 'NEGATIVO';

            return [
                'id_cita'         => $cita->id_cita,
                'codigo_cita'     => $cita->codigo_cita,
                'fecha_cita'      => $cita->fecha_cita ? Carbon::parse($cita->fecha_cita)->toDateString() : null,
                'hora_inicio'     => substr((string)$cita->hora_inicio, 0, 5),
                'hora_fin'        => substr((string)$cita->hora_fin, 0, 5),
                'duracion_min'    => 15,
                'motivo_consulta' => $cita->motivo_consulta,
                'estado_cita'     => $cita->estado_cita,
                'especialidad'    => $cita->especialidad ? $cita->especialidad->nombre : 'Consulta General',
                'paciente'        => $paciente ? [
                    'id_paciente'       => $paciente->id_paciente,
                    'ci'                => $paciente->ci,
                    'nombre_completo'   => $paciente->nombre_completo,
                    'nombres'           => $paciente->nombres,
                    'apellidos'         => $paciente->apellidos,
                    'edad'              => $paciente->edad,
                    'sexo'              => $paciente->sexo,
                    'telefono'          => $paciente->telefono,
                    'email'             => $paciente->email,
                    'direccion'         => $paciente->direccion,
                    'primera_visita'    => (bool)$paciente->primera_visita,
                ] : null,
                'historia_clinica' => $historia ? [
                    'id_historia_clinica'        => $historia->id_historia_clinica,
                    'numero_expediente'          => $historia->numero_expediente,
                    'tipo_sangre'                => $historia->tipo_sangre ?: 'No registrado',
                    'alergias_medicamentos'      => $alergias ?: 'Ninguna conocida',
                    'tiene_alergias'             => $tieneAlergias,
                    'enfermedades_hereditarias'  => $historia->enfermedades_hereditarias ?: 'Sin antecedentes',
                    'antecedentes_patologicos'   => $historia->antecedentes_patologicos ?: 'Sin antecedentes',
                    'antecedentes_quirurgicos'   => $historia->antecedentes_quirurgicos ?: 'Sin cirugías previas',
                ] : null,
                'contacto_emergencia' => $contacto ? [
                    'nombre_completo' => $contacto->nombre_completo,
                    'parentesco'      => $contacto->parentesco,
                    'telefono'        => $contacto->telefono,
                ] : null,
                'tiene_atencion'  => $cita->atencionMedica !== null,
                'atencion_resumen' => $cita->atencionMedica ? [
                    'id_atencion'       => $cita->atencionMedica->id_atencion,
                    'diagnostico_cie10' => $cita->atencionMedica->diagnostico_cie10,
                    'diagnostico'       => $cita->atencionMedica->diagnostico_descripcion,
                    'fecha_atencion'    => $cita->atencionMedica->fecha_atencion ? Carbon::parse($cita->atencionMedica->fecha_atencion)->format('d/m/Y H:i') : null,
                ] : null,
                'laboratorios_count' => $cita->laboratorios->count(),
                'esta_pagada'        => $cita->estaPagada(),
                'pago_info'          => $cita->ultimoPago ? [
                    'monto'       => (float) $cita->ultimoPago->monto,
                    'metodo'      => $cita->ultimoPago->metodo_pago,
                    'comprobante' => $cita->ultimoPago->numero_comprobante,
                    'fecha'       => $cita->ultimoPago->fecha_pago ? $cita->ultimoPago->fecha_pago->format('d/m/Y H:i') : null,
                ] : null,
            ];
        });

        // Registrar auditoría de acceso exclusivo a la agenda
        try {
            $user = $request->user();
            BitacoraAuditoria::registrar(
                'PKG06_AtencionMedica',
                'citas',
                $medico->id_medico,
                'CONSULTA_AGENDA_DIARIA',
                ['accion' => 'Consulta de agenda del día'],
                ['fecha' => $fecha, 'total_pacientes' => $citas->count()],
                $user ? $user->id_usuario : null,
                $request->ip(),
                $request->userAgent()
            );
        } catch (\Throwable $e) {
            Log::warning('Bitacora CU15: ' . $e->getMessage());
        }

        return response()->json([
            'success'       => true,
            'status'        => 'success',
            'case_of_use'   => 'CU15_AgendaDiariaMedico',
            'medico'        => [
                'id_medico'                     => $medico->id_medico,
                'nombre_completo'               => $medico->nombre_completo,
                'numero_registro_profesional'   => $medico->numero_registro_profesional,
                'especialidades'                => $medico->especialidades->pluck('nombre'),
            ],
            'fecha_consultada' => $fecha,
            'kpis'          => $kpis,
            'data'          => $citasFormateadas,
        ]);
    }

    /**
     * CU15 - Abrir expediente médico seguro de un paciente asignado
     * Regla de Privacidad: Bloquea el acceso si la cita no pertenece a la agenda del médico.
     */
    public function expedientePaciente(Request $request, int $idCita): JsonResponse
    {
        $medico = $this->resolverMedico($request);

        if (!$medico) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No autorizado. Debe ser un médico registrado para consultar expedientes.',
            ], 403);
        }

        // Buscar cita
        $cita = Cita::with(['paciente.historiaClinica', 'paciente.contactoEmergencia'])->find($idCita);

        if (!$cita) {
            return response()->json([
                'status'  => 'error',
                'message' => 'La cita médica especificada no existe.',
            ], 404);
        }

        // CONTROL ESTRICTO DE PRIVACIDAD: La cita DEBE pertenecer a este médico
        if ((int)$cita->id_medico !== (int)$medico->id_medico) {
            return response()->json([
                'status'  => 'error',
                'security_violation' => true,
                'message' => 'Acceso denegado por privacidad médica: Este paciente no pertenece a su agenda de atención asignada.',
            ], 403);
        }

        // CONTROL DE PAGO PREVIO: Solo pacientes con pago completado pueden ser atendidos y revisados
        if (!$cita->estaPagada()) {
            return response()->json([
                'status'           => 'error',
                'payment_required' => true,
                'message'          => 'Acceso restringido por política médica: La cita no cuenta con pago confirmado. El paciente debe regularizar su consulta antes de abrir su expediente.',
            ], 402);
        }

        $paciente = $cita->paciente;
        if (!$paciente) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No se encontró la ficha del paciente asignada a esta cita.',
            ], 404);
        }

        $historia = $paciente->historiaClinica;

        // Atenciones médicas históricas previas
        $historialAtenciones = AtencionMedica::where('id_historia_clinica', $historia ? $historia->id_historia_clinica : 0)
            ->with('medico')
            ->orderBy('fecha_atencion', 'desc')
            ->get()
            ->map(function ($at) {
                return [
                    'id_atencion'             => $at->id_atencion,
                    'fecha_atencion'          => Carbon::parse($at->fecha_atencion)->format('d/m/Y H:i'),
                    'medico_nombre'           => $at->medico ? $at->medico->nombre_completo : 'Médico Tratante',
                    'motivo_consulta'         => $at->motivo_consulta,
                    'sintomas'                => $at->sintomas,
                    'signos_vitales'          => $at->signos_vitales,
                    'diagnostico_cie10'       => $at->diagnostico_cie10,
                    'diagnostico_descripcion' => $at->diagnostico_descripcion,
                    'tratamiento'             => $at->tratamiento,
                    'receta_medica'           => $at->receta_medica,
                    'derivacion'              => $at->derivacion_especialidad,
                ];
            });

        // Resultados y órdenes de laboratorio del paciente
        $laboratorios = LaboratorioEstudioConsulta::where('id_paciente', $paciente->id_paciente)
            ->with('medico')
            ->orderBy('fecha_solicitud', 'desc')
            ->get()
            ->map(function ($lab) {
                return [
                    'id_estudio'            => $lab->id_estudio,
                    'codigo_estudio'        => $lab->codigo_estudio,
                    'nombre_estudio'        => $lab->nombre_estudio,
                    'tipo_estudio'          => $lab->tipo_estudio,
                    'estado'                => $lab->estado,
                    'fecha_solicitud'       => Carbon::parse($lab->fecha_solicitud)->format('d/m/Y H:i'),
                    'resultado_diagnostico' => $lab->resultado_diagnostico,
                    'archivo_resultado_url' => $lab->archivo_resultado_url,
                    'publicado_en'          => $lab->publicado_en ? Carbon::parse($lab->publicado_en)->format('d/m/Y H:i') : null,
                    'medico_solicitante'    => $lab->medico ? $lab->medico->nombre_completo : 'Médico',
                ];
            });

        // Registrar auditoría de acceso al expediente
        try {
            $user = $request->user();
            BitacoraAuditoria::registrar(
                'PKG06_AtencionMedica',
                'historias_clinicas',
                $historia ? $historia->id_historia_clinica : $paciente->id_paciente,
                'CONSULTA_EXPEDIENTE',
                ['privacidad' => 'acceso_autorizado_por_turno'],
                ['paciente_ci' => $paciente->ci, 'id_cita' => $idCita],
                $user ? $user->id_usuario : null,
                $request->ip(),
                $request->userAgent()
            );
        } catch (\Throwable $e) {
            Log::warning('Bitacora expediente: ' . $e->getMessage());
        }

        return response()->json([
            'status'      => 'success',
            'case_of_use' => 'CU15_AgendaDiariaMedico',
            'cita'        => [
                'id_cita'         => $cita->id_cita,
                'codigo_cita'     => $cita->codigo_cita,
                'fecha_cita'      => Carbon::parse($cita->fecha_cita)->toDateString(),
                'hora_inicio'     => substr((string)$cita->hora_inicio, 0, 5),
                'hora_fin'        => substr((string)$cita->hora_fin, 0, 5),
                'estado_cita'     => $cita->estado_cita,
                'motivo_consulta' => $cita->motivo_consulta,
            ],
            'paciente'    => [
                'id_paciente'     => $paciente->id_paciente,
                'ci'              => $paciente->ci,
                'nombre_completo' => $paciente->nombre_completo,
                'nombres'         => $paciente->nombres,
                'apellidos'       => $paciente->apellidos,
                'fecha_nacimiento'=> $paciente->fecha_nacimiento ? Carbon::parse($paciente->fecha_nacimiento)->toDateString() : null,
                'edad'            => $paciente->edad,
                'sexo'            => $paciente->sexo,
                'telefono'        => $paciente->telefono,
                'email'           => $paciente->email,
                'direccion'       => $paciente->direccion,
            ],
            'historia_clinica' => $historia ? [
                'id_historia_clinica'       => $historia->id_historia_clinica,
                'numero_expediente'         => $historia->numero_expediente,
                'tipo_sangre'               => $historia->tipo_sangre ?: 'No registrado',
                'alergias_medicamentos'     => $historia->alergias_medicamentos ?: 'Ninguna conocida',
                'tiene_alergias'            => !empty(trim((string)$historia->alergias_medicamentos)) 
                    && stripos(trim((string)$historia->alergias_medicamentos), 'ningun') === false 
                    && strtoupper(trim((string)$historia->alergias_medicamentos)) !== 'NO'
                    && strtoupper(trim((string)$historia->alergias_medicamentos)) !== 'NEGATIVO',
                'enfermedades_hereditarias' => $historia->enfermedades_hereditarias ?: 'Sin antecedentes',
                'antecedentes_patologicos'  => $historia->antecedentes_patologicos ?: 'Sin antecedentes',
                'antecedentes_quirurgicos'  => $historia->antecedentes_quirurgicos ?: 'Sin cirugías previas',
                'fecha_apertura'            => Carbon::parse($historia->fecha_apertura)->format('d/m/Y'),
            ] : null,
            'contacto_emergencia' => $paciente->contactoEmergencia,
            'historial_atenciones'=> $historialAtenciones,
            'laboratorios'        => $laboratorios,
        ]);
    }

    /**
     * Resuelve el médico asociado al request
     */
    protected function resolverMedico(Request $request): ?Medico
    {
        // 1. Si se especifica id_medico en la petición (modo admin o switcher de demostración)
        if ($request->filled('id_medico')) {
            return Medico::with('especialidades')->find($request->input('id_medico'));
        }

        // 2. Si el usuario autenticado está vinculado a un registro de médico
        $user = $request->user();
        if ($user) {
            $medico = Medico::with('especialidades')->where('id_usuario', $user->id_usuario)->first();
            if ($medico) return $medico;
        }

        // 3. Por defecto, tomar el primer médico activo para modo demo institucional
        return Medico::with('especialidades')->where('estado', 'ACTIVO')->first();
    }

    // ==========================================
    // Alias para compatibilidad
    // ==========================================
    public function index(Request $request): JsonResponse { return $this->agendaDiaria($request); }
}
