<?php

namespace App\Controllers\PKG06_AtencionMedica\CU16_AtenderConsulta;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\HistoriaClinica;
use App\Models\PKG06_AtencionMedica\CU16_AtenderConsulta\AtencionMedica;
use App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU16_AtencionMedicaController extends Controller
{
    /**
     * CU16 - Iniciar atención médica: Cargar expediente y verificar precondiciones
     */
    public function iniciarConsulta(Request $request, int $idCita): JsonResponse
    {
        $cita = Cita::with(['paciente.historiaClinica', 'paciente.contactoEmergencia', 'medico', 'especialidad', 'atencionMedica'])->find($idCita);

        if (!$cita) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cita médica no encontrada.',
            ], 404);
        }

        if (in_array($cita->estado_cita, ['CANCELADA', 'INASISTENCIA'])) {
            return response()->json([
                'status'  => 'error',
                'message' => "La cita se encuentra en estado '{$cita->estado_cita}' y no puede ser atendida.",
            ], 422);
        }

        // Precondición de Atención Clínica: La cita debe estar pagada (al menos 1 día antes o regularizada)
        if (!$cita->estaPagada()) {
            return response()->json([
                'status'           => 'error',
                'payment_required' => true,
                'message'          => 'Precondición de Atención: El paciente debe abonar y confirmar el pago de la consulta antes de ingresar a consultorio.',
            ], 402); // HTTP 402 Payment Required
        }

        $paciente = $cita->paciente;
        $historia = $paciente ? $paciente->historiaClinica : null;

        // Si no tiene historia clínica base, crearla automáticamente para asegurar la precondición
        if ($paciente && !$historia) {
            $historia = HistoriaClinica::create([
                'id_paciente'               => $paciente->id_paciente,
                'numero_expediente'         => 'EXP-' . date('Y') . '-' . str_pad($paciente->id_paciente, 4, '0', STR_PAD_LEFT),
                'tipo_sangre'               => 'O+',
                'alergias_medicamentos'     => 'Ninguna conocida',
                'enfermedades_hereditarias' => 'Ninguna reportada',
                'antecedentes_patologicos'  => 'Sin antecedentes',
                'antecedentes_quirurgicos'  => 'Sin cirugías previas',
                'fecha_apertura'            => Carbon::now('America/La_Paz'),
            ]);
        }

        $alergias = $historia ? $historia->alergias_medicamentos : null;
        $tieneAlergias = !empty(trim((string)$alergias)) 
            && stripos(trim((string)$alergias), 'ningun') === false 
            && strtoupper(trim((string)$alergias)) !== 'NO'
            && strtoupper(trim((string)$alergias)) !== 'NEGATIVO';

        // Laboratorios previos del paciente
        $laboratoriosPrevios = LaboratorioEstudioConsulta::where('id_paciente', $paciente->id_paciente)
            ->orderBy('fecha_solicitud', 'desc')
            ->limit(10)
            ->get();

        // Atenciones previas para la evolución cronológica
        $atencionesPrevias = AtencionMedica::where('id_historia_clinica', $historia->id_historia_clinica)
            ->with('medico')
            ->orderBy('fecha_atencion', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'status'      => 'success',
            'case_of_use' => 'CU16_AtenderConsulta',
            'cita'        => [
                'id_cita'         => $cita->id_cita,
                'codigo_cita'     => $cita->codigo_cita,
                'fecha_cita'      => Carbon::parse($cita->fecha_cita)->toDateString(),
                'hora_inicio'     => substr((string)$cita->hora_inicio, 0, 5),
                'hora_fin'        => substr((string)$cita->hora_fin, 0, 5),
                'motivo_consulta' => $cita->motivo_consulta,
                'estado_cita'     => $cita->estado_cita,
                'especialidad'    => $cita->especialidad ? $cita->especialidad->nombre : 'Medicina General',
            ],
            'medico'      => [
                'id_medico'                   => $cita->medico ? $cita->medico->id_medico : null,
                'nombre_completo'             => $cita->medico ? $cita->medico->nombre_completo : null,
                'numero_registro_profesional' => $cita->medico ? $cita->medico->numero_registro_profesional : null,
            ],
            'paciente'    => [
                'id_paciente'     => $paciente->id_paciente,
                'ci'              => $paciente->ci,
                'nombre_completo' => $paciente->nombre_completo,
                'nombres'         => $paciente->nombres,
                'apellidos'       => $paciente->apellidos,
                'edad'            => $paciente->edad,
                'fecha_nacimiento'=> $paciente->fecha_nacimiento ? Carbon::parse($paciente->fecha_nacimiento)->toDateString() : null,
                'sexo'            => $paciente->sexo,
                'telefono'        => $paciente->telefono,
                'email'           => $paciente->email,
            ],
            'historia_clinica' => [
                'id_historia_clinica'        => $historia->id_historia_clinica,
                'numero_expediente'          => $historia->numero_expediente,
                'tipo_sangre'                => $historia->tipo_sangre,
                'alergias_medicamentos'      => $historia->alergias_medicamentos,
                'tiene_alergias'             => $tieneAlergias,
                'enfermedades_hereditarias'  => $historia->enfermedades_hereditarias,
                'antecedentes_patologicos'   => $historia->antecedentes_patologicos,
                'antecedentes_quirurgicos'   => $historia->antecedentes_quirurgicos,
            ],
            'atencion_existente'   => $cita->atencionMedica,
            'atenciones_previas'   => $atencionesPrevias,
            'laboratorios_previos' => $laboratoriosPrevios,
            'catalogo_cie10'       => $this->obtenerCatalogoCie10(),
            'catalogo_estudios'    => $this->obtenerCatalogoEstudios(),
        ]);
    }

    /**
     * CU16 - Registrar y guardar la atención médica, evolución clínica y órdenes
     * Actualiza el estado de la cita a 'ATENDIDA' e inserta bitácora.
     */
    public function guardarAtencion(Request $request, int $idCita): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'motivo_consulta'          => 'required|string|max:255',
            'diagnostico_descripcion'  => 'required|string|min:5',
            'diagnostico_cie10'        => 'nullable|string|max:20',
            'sintomas'                 => 'nullable|string',
            'tratamiento'              => 'nullable|string',
            'receta_medica'            => 'nullable|string',
            'derivacion_especialidad'  => 'nullable|string|max:100',
            'signos_vitales'           => 'nullable|array',
            'ordenes_laboratorio'      => 'nullable|array',
            'actualizar_alergias'      => 'nullable|string|max:255',
        ], [
            'motivo_consulta.required'         => 'El motivo de la consulta es obligatorio.',
            'diagnostico_descripcion.required' => 'La descripción del diagnóstico o evolución médica es obligatoria.',
            'diagnostico_descripcion.min'      => 'El diagnóstico debe ser descriptivo (mínimo 5 caracteres).',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cita = Cita::with(['paciente.historiaClinica'])->find($idCita);

        if (!$cita) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cita no encontrada.',
            ], 404);
        }

        $paciente = $cita->paciente;
        $historia = $paciente ? $paciente->historiaClinica : null;

        if (!$historia && $paciente) {
            $historia = HistoriaClinica::create([
                'id_paciente'               => $paciente->id_paciente,
                'numero_expediente'         => 'EXP-' . date('Y') . '-' . str_pad($paciente->id_paciente, 4, '0', STR_PAD_LEFT),
                'tipo_sangre'               => 'O+',
                'alergias_medicamentos'     => 'Ninguna conocida',
                'enfermedades_hereditarias' => 'Ninguna reportada',
                'antecedentes_patologicos'  => 'Sin antecedentes',
                'antecedentes_quirurgicos'  => 'Sin cirugías previas',
                'fecha_apertura'            => Carbon::now('America/La_Paz'),
            ]);
        }

        // VALIDACIÓN DE SEGURIDAD FARMACOLÓGICA:
        // Alertar si en la receta se prescribió un fármaco al que el paciente es alérgico
        $alertaAlergiaDetectada = null;
        $alergiasConocidas = $historia->alergias_medicamentos;
        $receta = $request->input('receta_medica', '');
        if ($alergiasConocidas && $receta && stripos($receta, $alergiasConocidas) !== false) {
            $alertaAlergiaDetectada = "Atención: La prescripción contiene términos coincidentes con las alergias registradas del paciente ({$alergiasConocidas}).";
        }

        DB::beginTransaction();
        try {
            $ahora = Carbon::now('America/La_Paz');

            // 1. Guardar o actualizar la atención médica (inmutable)
            $atencion = AtencionMedica::updateOrCreate(
                ['id_cita' => $cita->id_cita],
                [
                    'id_historia_clinica'     => $historia->id_historia_clinica,
                    'id_medico'               => $cita->id_medico,
                    'motivo_consulta'         => $request->input('motivo_consulta'),
                    'sintomas'                => $request->input('sintomas'),
                    'signos_vitales'          => $request->input('signos_vitales'),
                    'diagnostico_cie10'       => $request->input('diagnostico_cie10'),
                    'diagnostico_descripcion' => $request->input('diagnostico_descripcion'),
                    'tratamiento'             => $request->input('tratamiento'),
                    'receta_medica'           => $request->input('receta_medica'),
                    'derivacion_especialidad' => $request->input('derivacion_especialidad'),
                    'fecha_atencion'          => $ahora,
                    'fecha_creacion'          => $ahora,
                ]
            );

            // 2. Si se actualizaron alergias desde la consulta, persistir en Historia Clínica
            if ($request->filled('actualizar_alergias')) {
                $historia->alergias_medicamentos = $request->input('actualizar_alergias');
                $historia->fecha_actualizacion = $ahora;
                $historia->save();
            }

            // 3. Generar órdenes de estudios de laboratorio solicitadas
            $ordenesCreadas = [];
            $ordenesLab = $request->input('ordenes_laboratorio', []);
            if (is_array($ordenesLab) && count($ordenesLab) > 0) {
                foreach ($ordenesLab as $nombreEstudio) {
                    $nombreLimpio = trim((string)$nombreEstudio);
                    if (empty($nombreLimpio)) continue;

                    $codigo = 'LAB-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));
                    $tipo = (stripos($nombreLimpio, 'rayos') !== false || stripos($nombreLimpio, 'ecograf') !== false)
                        ? 'Imagenología Médica'
                        : 'Laboratorio Clínico';

                    $estudio = LaboratorioEstudioConsulta::create([
                        'codigo_estudio'        => $codigo,
                        'id_paciente'           => $paciente->id_paciente,
                        'id_medico_solicitante' => $cita->id_medico,
                        'id_cita'               => $cita->id_cita,
                        'nombre_estudio'        => $nombreLimpio,
                        'tipo_estudio'          => $tipo,
                        'descripcion'           => "Orden generada en consulta médica por {$cita->medico->nombre_completo} para diagnóstico de: {$atencion->diagnostico_descripcion}",
                        'fecha_solicitud'       => $ahora,
                        'estado'                => 'PENDIENTE',
                    ]);

                    $ordenesCreadas[] = [
                        'codigo' => $codigo,
                        'nombre' => $nombreLimpio,
                        'tipo'   => $tipo,
                    ];
                }
            }

            // 4. Cambiar estado de la cita a 'ATENDIDA'
            $cita->estado_cita = 'ATENDIDA';
            $cita->fecha_actualizacion = $ahora;
            $cita->save();

            // 5. Registrar en Bitácora de Auditoría
            try {
                $user = $request->user();
                BitacoraAuditoria::registrar(
                    'PKG06_AtencionMedica',
                    'atenciones_medicas',
                    $atencion->id_atencion,
                    'ATENDER_CONSULTA',
                    ['estado_anterior' => 'EN_CONSULTA'],
                    [
                        'id_cita'              => $cita->id_cita,
                        'id_paciente'          => $paciente->id_paciente,
                        'diagnostico_cie10'    => $atencion->diagnostico_cie10,
                        'ordenes_laboratorio'  => count($ordenesCreadas),
                        'derivacion'           => $atencion->derivacion_especialidad,
                        'estado_cita'          => 'ATENDIDA',
                    ],
                    $user ? $user->id_usuario : null,
                    $request->ip(),
                    $request->userAgent()
                );
            } catch (\Throwable $e) {
                Log::warning('Bitacora CU16: ' . $e->getMessage());
            }

            DB::commit();

            return response()->json([
                'status'           => 'success',
                'case_of_use'      => 'CU16_AtenderConsulta',
                'message'          => "Consulta médica guardada con éxito. Cita {$cita->codigo_cita} marcada como ATENDIDA.",
                'alerta_farmaco'   => $alertaAlergiaDetectada,
                'data'             => [
                    'id_atencion'        => $atencion->id_atencion,
                    'id_cita'            => $cita->id_cita,
                    'codigo_cita'        => $cita->codigo_cita,
                    'estado_cita'        => $cita->estado_cita,
                    'diagnostico_cie10'  => $atencion->diagnostico_cie10,
                    'diagnostico'        => $atencion->diagnostico_descripcion,
                    'ordenes_generadas'  => $ordenesCreadas,
                    'fecha_atencion'     => $ahora->format('d/m/Y H:i:s'),
                ]
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error al guardar atención médica CU16: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Ocurrió un error al registrar la consulta médica: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU16 - Catálogo de diagnósticos frecuentes CIE-10 para autocompletado rápido
     */
    protected function obtenerCatalogoCie10(): array
    {
        return [
            ['codigo' => 'J00', 'descripcion' => 'Rinofaringitis aguda [resfriado común]'],
            ['codigo' => 'J02', 'descripcion' => 'Faringitis aguda'],
            ['codigo' => 'J03', 'descripcion' => 'Amigdalitis aguda'],
            ['codigo' => 'J20', 'descripcion' => 'Bronquitis aguda'],
            ['codigo' => 'I10', 'descripcion' => 'Hipertensión esencial (primaria)'],
            ['codigo' => 'E11', 'descripcion' => 'Diabetes mellitus no insulinodependiente [tipo 2]'],
            ['codigo' => 'K29', 'descripcion' => 'Gastritis y duodenitis'],
            ['codigo' => 'R51', 'descripcion' => 'Cefalea y dolor de cabeza'],
            ['codigo' => 'M54', 'descripcion' => 'Dorsalgia y lumbalgia'],
            ['codigo' => 'N39', 'descripcion' => 'Infección de vías urinarias'],
            ['codigo' => 'A09', 'descripcion' => 'Gastroenteritis y colitis de origen infeccioso'],
            ['codigo' => 'B34', 'descripcion' => 'Infección viral de sitio no especificado'],
        ];
    }

    /**
     * Catálogo de exámenes de laboratorio e imagenología disponibles
     */
    protected function obtenerCatalogoEstudios(): array
    {
        return [
            'Hemograma Completo',
            'Perfil Lipídico (Colesterol, Triglicéridos, HDL, LDL)',
            'Glicemia Basal / Hemoglobina Glicosilada',
            'Examen General de Orina (EGO)',
            'Urocultivo con Antibiograma',
            'Creatinina y Urea en Sangre',
            'Pruebas de Función Hepática (TGO, TGP, Bilirrubina)',
            'Electrolitos Séricos (Sodio, Potasio, Cloro)',
            'Radiografía de Tórax AP y Lateral',
            'Ecografía Abdominal Completa',
        ];
    }

    // ==========================================
    // Alias para compatibilidad
    // ==========================================
    public function index(Request $request): JsonResponse { return response()->json(['status' => 'success', 'case_of_use' => 'CU16_AtenderConsulta']); }
    public function show(Request $request, int $id): JsonResponse { return $this->iniciarConsulta($request, $id); }
    public function store(Request $request, int $id): JsonResponse { return $this->guardarAtencion($request, $id); }
}
