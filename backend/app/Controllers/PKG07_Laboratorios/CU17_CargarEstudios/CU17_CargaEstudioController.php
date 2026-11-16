<?php

namespace App\Controllers\PKG07_Laboratorios\CU17_CargarEstudios;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PKG07_Laboratorios\CU17_CargarEstudios\LaboratorioEstudioCarga;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG08_DashboardReportes\CU19_Recordatorios\Recordatorio;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;
use Illuminate\Support\Facades\Log;

class CU17_CargaEstudioController extends Controller
{
    /**
     * Parámetros de referencia clínicos segmentados por grupo de edad
     */
    private function obtenerParametrosReferenciaPorEdad(int $edad): array
    {
        if ($edad < 12) {
            $grupo = 'Pediátrico (0 - 11 años)';
            $parametros = [
                'Hemoglobina' => '11.5 - 13.5 g/dL',
                'Leucocitos'  => '5,000 - 12,000 /mm³',
                'Plaquetas'   => '150,000 - 400,000 /mm³',
                'Glucemia'    => '60 - 100 mg/dL',
                'Creatinina'  => '0.3 - 0.7 mg/dL',
            ];
        } elseif ($edad < 18) {
            $grupo = 'Adolescente (12 - 17 años)';
            $parametros = [
                'Hemoglobina' => '12.0 - 15.0 g/dL',
                'Leucocitos'  => '4,500 - 11,000 /mm³',
                'Plaquetas'   => '150,000 - 450,000 /mm³',
                'Glucemia'    => '70 - 100 mg/dL',
                'Creatinina'  => '0.5 - 0.9 mg/dL',
            ];
        } elseif ($edad < 60) {
            $grupo = 'Adulto (18 - 59 años)';
            $parametros = [
                'Hemoglobina' => '13.0 - 16.5 g/dL (H) / 12.0 - 15.5 g/dL (M)',
                'Leucocitos'  => '4,500 - 10,000 /mm³',
                'Plaquetas'   => '150,000 - 450,000 /mm³',
                'Glucemia'    => '70 - 105 mg/dL',
                'Creatinina'  => '0.7 - 1.2 mg/dL',
                'Colesterol'  => 'Deseable: < 200 mg/dL',
                'Triglicéridos' => 'Deseable: < 150 mg/dL',
            ];
        } else {
            $grupo = 'Adulto Mayor (60+ años)';
            $parametros = [
                'Hemoglobina' => '12.0 - 15.5 g/dL',
                'Leucocitos'  => '4,000 - 10,000 /mm³',
                'Plaquetas'   => '140,000 - 400,000 /mm³',
                'Glucemia'    => '70 - 115 mg/dL',
                'Creatinina'  => '0.8 - 1.3 mg/dL',
                'Filtrado Glomerular' => '> 60 mL/min/1.73m²',
            ];
        }

        return [
            'grupo_etario' => $grupo,
            'parametros'   => $parametros,
        ];
    }

    /**
     * Listado general de estudios para la mesa de entrada de laboratorio
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = LaboratorioEstudioCarga::with(['paciente', 'medico', 'cita']);

            // Filtro por estado
            if ($request->filled('estado')) {
                $estado = strtoupper($request->query('estado'));
                if ($estado === 'COMPLETADO') {
                    $query->whereIn('estado', ['COMPLETADO', 'PUBLICADO']);
                } else {
                    $query->where('estado', $estado);
                }
            }

            // Búsqueda por texto (código, nombre estudio, nombre paciente, CI)
            if ($request->filled('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('codigo_estudio', 'like', "%{$search}%")
                      ->orWhere('nombre_estudio', 'like', "%{$search}%")
                      ->orWhereHas('paciente', function ($qp) use ($search) {
                          $qp->where('ci', 'like', "%{$search}%")
                             ->orWhere('nombres', 'like', "%{$search}%")
                             ->orWhere('apellidos', 'like', "%{$search}%");
                      });
                });
            }

            $estudios = $query->orderBy('fecha_solicitud', 'desc')->get();

            $resultado = $estudios->map(function ($est) {
                $edad = $est->paciente && $est->paciente->fecha_nacimiento
                    ? Carbon::parse($est->paciente->fecha_nacimiento)->age
                    : 30;
                $ref = $this->obtenerParametrosReferenciaPorEdad($edad);

                return [
                    'id_estudio'            => $est->id_estudio,
                    'codigo_estudio'        => $est->codigo_estudio,
                    'id_paciente'           => $est->id_paciente,
                    'paciente_nombre'       => $est->paciente ? "{$est->paciente->nombres} {$est->paciente->apellidos}" : 'N/A',
                    'paciente_ci'           => $est->paciente->ci ?? 'S/N',
                    'paciente_edad'         => $edad,
                    'paciente_nacimiento'   => $est->paciente->fecha_nacimiento ?? 'N/D',
                    'grupo_etario'          => $ref['grupo_etario'],
                    'parametros_referencia' => $ref['parametros'],
                    'id_medico_solicitante' => $est->id_medico_solicitante,
                    'medico_solicitante'    => $est->medico ? "Dr(a). {$est->medico->nombres} {$est->medico->apellidos}" : 'Médico Institucional',
                    'nombre_estudio'        => $est->nombre_estudio,
                    'tipo_estudio'          => $est->tipo_estudio,
                    'descripcion'           => $est->descripcion,
                    'fecha_solicitud'       => Carbon::parse($est->fecha_solicitud)->format('Y-m-d H:i'),
                    'estado'                => in_array($est->estado, ['COMPLETADO', 'PUBLICADO']) ? 'COMPLETADO' : $est->estado,
                    'resultado_diagnostico' => $est->resultado_diagnostico,
                    'archivo_resultado_url' => $est->archivo_resultado_url,
                    'publicado_en'          => $est->publicado_en ? Carbon::parse($est->publicado_en)->format('Y-m-d H:i') : null,
                ];
            });

            // Conteo para KPIs
            $totalEstudios = LaboratorioEstudioCarga::count();
            $pendientes = LaboratorioEstudioCarga::whereIn('estado', ['PENDIENTE', 'EN_PROCESO'])->count();
            $completados = LaboratorioEstudioCarga::whereIn('estado', ['COMPLETADO', 'PUBLICADO'])->count();

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'estudios'    => $resultado,
                    'kpis'        => [
                        'total'       => $totalEstudios,
                        'pendientes'  => $pendientes,
                        'completados' => $completados,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al listar estudios de laboratorio: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Búsqueda de paciente con cálculo de edad y tabla de valores normales de referencia
     */
    public function buscarPaciente(Request $request, $identificador): JsonResponse
    {
        try {
            $paciente = Paciente::where('ci', $identificador)
                ->orWhere('id_paciente', $identificador)
                ->orWhere(DB::raw("nombres || ' ' || apellidos"), 'like', "%{$identificador}%")
                ->first();

            if (!$paciente) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Paciente no encontrado con el identificador ingresado.',
                ], 404);
            }

            $edad = $paciente->fecha_nacimiento ? Carbon::parse($paciente->fecha_nacimiento)->age : 30;
            $ref = $this->obtenerParametrosReferenciaPorEdad($edad);

            // Estudios pendientes del paciente
            $estudiosPendientes = LaboratorioEstudioCarga::where('id_paciente', $paciente->id_paciente)
                ->whereIn('estado', ['PENDIENTE', 'EN_PROCESO'])
                ->get();

            return response()->json([
                'status'   => 'success',
                'paciente' => [
                    'id_paciente'           => $paciente->id_paciente,
                    'nombre_completo'       => "{$paciente->nombres} {$paciente->apellidos}",
                    'ci'                    => $paciente->ci,
                    'fecha_nacimiento'      => $paciente->fecha_nacimiento,
                    'edad'                  => $edad,
                    'sexo'                  => $paciente->sexo,
                    'telefono'              => $paciente->telefono,
                    'email'                 => $paciente->email,
                    'grupo_etario'          => $ref['grupo_etario'],
                    'parametros_referencia' => $ref['parametros'],
                    'estudios_pendientes'   => $estudiosPendientes,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al buscar paciente: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear orden de estudio manualmente desde mesa de laboratorio
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_paciente'           => 'required|integer|exists:pacientes,id_paciente',
            'id_medico_solicitante' => 'nullable|integer|exists:medicos,id_medico',
            'nombre_estudio'        => 'required|string|max:120',
            'tipo_estudio'          => 'required|string|max:80',
            'descripcion'           => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $codigo = 'LAB-' . date('Ymd') . '-' . str_pad(rand(100, 9999), 4, '0', STR_PAD_LEFT);
            $medicoId = $validated['id_medico_solicitante'] ?? 1;

            $estudio = LaboratorioEstudioCarga::create([
                'codigo_estudio'        => $codigo,
                'id_paciente'           => $validated['id_paciente'],
                'id_medico_solicitante' => $medicoId,
                'id_cita'               => null,
                'nombre_estudio'        => $validated['nombre_estudio'],
                'tipo_estudio'          => $validated['tipo_estudio'],
                'descripcion'           => $validated['descripcion'] ?? 'Orden generada en laboratorio',
                'fecha_solicitud'       => Carbon::now('America/La_Paz'),
                'estado'                => 'PENDIENTE',
            ]);

            // Auditoría segura
            try {
                BitacoraAuditoria::registrar(
                    'PKG07_Laboratorios',
                    'laboratorio_estudios',
                    $estudio->id_estudio,
                    'INSERT',
                    null,
                    $estudio->toArray(),
                    $request->user()?->id_usuario ?? auth()->id() ?? 1,
                    $request->ip() ?? '127.0.0.1',
                    $request->userAgent() ?? 'Sistema Web'
                );
            } catch (\Throwable $ae) {
                Log::warning('Bitacora lab store error: ' . $ae->getMessage());
            }

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => "Orden de laboratorio {$codigo} creada exitosamente.",
                'data'    => $estudio,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al crear orden de laboratorio: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cargar resultados, adjuntar archivo digital y habilitar/completar estudio
     */
    public function guardarResultado(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'resultado_diagnostico' => 'required|string',
            'observaciones'         => 'nullable|string',
            'archivo_resultado_url' => 'nullable|string',
            'archivo_nombre'        => 'nullable|string',
            'estado'                => 'nullable|string|in:COMPLETADO,PUBLICADO,EN_PROCESO,PENDIENTE',
        ]);

        try {
            DB::beginTransaction();

            $estudio = LaboratorioEstudioCarga::with(['paciente', 'medico'])->findOrFail($id);
            $valoresAntiguos = $estudio->toArray();

            $estadoFinal = $validated['estado'] ?? 'COMPLETADO';
            if ($estadoFinal === 'COMPLETADO') {
                $estadoFinal = 'PUBLICADO'; // En la BD se almacena como PUBLICADO/COMPLETADO
            }

            $archivoUrl = $validated['archivo_resultado_url'] ?? $estudio->archivo_resultado_url;
            if (!$archivoUrl) {
                // Simulación o enlace al visor seguro institucional
                $archivoUrl = '/laboratorios/descargas/' . strtolower($estudio->codigo_estudio) . '.pdf';
            }

            $observaciones = $validated['observaciones'] ?? '';
            $descripcionActual = $estudio->descripcion ?? '';
            if ($observaciones && !str_contains($descripcionActual, $observaciones)) {
                $descripcionActual = $descripcionActual ? "{$descripcionActual} | Obs: {$observaciones}" : "Obs: {$observaciones}";
            }

            $estudio->resultado_diagnostico = $validated['resultado_diagnostico'];
            $estudio->archivo_resultado_url = $archivoUrl;
            $estudio->estado                = $estadoFinal;
            $estudio->descripcion           = $descripcionActual;
            $estudio->publicado_en          = Carbon::now('America/La_Paz');
            $estudio->save();

            // Vincular cita reciente del paciente si no tiene una asignada
            if (!$estudio->id_cita && $estudio->id_paciente) {
                $citaReciente = \App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita::where('id_paciente', $estudio->id_paciente)
                    ->latest('id_cita')
                    ->first();
                if ($citaReciente) {
                    $estudio->id_cita = $citaReciente->id_cita;
                    $estudio->save();
                }
            }

            // Notificación al Paciente (CU19)
            if ($estudio->paciente && $estudio->id_cita) {
                try {
                    $pacienteNom = $estudio->paciente->nombres ?? 'Paciente';
                    Recordatorio::create([
                        'id_cita'          => $estudio->id_cita,
                        'tipo_canal'       => 'WHATSAPP',
                        'fecha_programada' => Carbon::now('America/La_Paz'),
                        'fecha_envio'      => Carbon::now('America/La_Paz'),
                        'estado_envio'     => 'ENVIADO',
                        'intentos'         => 1,
                        'mensaje'          => "LABORATORIO DISPONIBLE: Estimado(a) {$pacienteNom}, sus resultados del estudio '{$estudio->nombre_estudio}' (#{$estudio->codigo_estudio}) ya se encuentran disponibles en su Portal de Paciente (CU18) para visualización y descarga en PDF.",
                    ]);
                } catch (\Throwable $te) {
                    Log::warning('Recordatorio lab error: ' . $te->getMessage());
                }
            }

            // Auditoría segura
            try {
                BitacoraAuditoria::registrar(
                    'PKG07_Laboratorios',
                    'laboratorio_estudios',
                    $estudio->id_estudio,
                    'UPDATE',
                    $valoresAntiguos,
                    $estudio->fresh()->toArray(),
                    $request->user()?->id_usuario ?? auth()->id() ?? 1,
                    $request->ip() ?? '127.0.0.1',
                    $request->userAgent() ?? 'Sistema Web'
                );
            } catch (\Throwable $ae) {
                Log::warning('Bitacora lab update error: ' . $ae->getMessage());
            }

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => "¡Resultado del estudio {$estudio->codigo_estudio} digitalizado y publicado con éxito! Disponible para paciente y médico.",
                'data'    => $estudio->fresh(),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al guardar resultado de laboratorio: ' . $e->getMessage(),
            ], 500);
        }
    }
}
