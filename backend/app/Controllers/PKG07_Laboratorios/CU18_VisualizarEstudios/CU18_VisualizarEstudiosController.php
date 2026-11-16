<?php

namespace App\Controllers\PKG07_Laboratorios\CU18_VisualizarEstudios;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;

class CU18_VisualizarEstudiosController extends Controller
{
    /**
     * Parámetros de referencia clínicos segmentados por edad
     */
    private function obtenerParametrosReferenciaPorEdad(int $edad): array
    {
        if ($edad < 12) {
            $grupo = 'Pediátrico (0 - 11 años)';
            $parametros = [
                ['parametro' => 'Hemoglobina', 'rango_normal' => '11.5 - 13.5 g/dL', 'unidad' => 'g/dL'],
                ['parametro' => 'Leucocitos', 'rango_normal' => '5,000 - 12,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Plaquetas', 'rango_normal' => '150,000 - 400,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Glucemia en ayunas', 'rango_normal' => '60 - 100 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Creatinina sérica', 'rango_normal' => '0.3 - 0.7 mg/dL', 'unidad' => 'mg/dL'],
            ];
        } elseif ($edad < 18) {
            $grupo = 'Adolescente (12 - 17 años)';
            $parametros = [
                ['parametro' => 'Hemoglobina', 'rango_normal' => '12.0 - 15.0 g/dL', 'unidad' => 'g/dL'],
                ['parametro' => 'Leucocitos', 'rango_normal' => '4,500 - 11,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Plaquetas', 'rango_normal' => '150,000 - 450,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Glucemia en ayunas', 'rango_normal' => '70 - 100 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Creatinina sérica', 'rango_normal' => '0.5 - 0.9 mg/dL', 'unidad' => 'mg/dL'],
            ];
        } elseif ($edad < 60) {
            $grupo = 'Adulto (18 - 59 años)';
            $parametros = [
                ['parametro' => 'Hemoglobina', 'rango_normal' => '13.0 - 16.5 g/dL (H) / 12.0 - 15.5 g/dL (M)', 'unidad' => 'g/dL'],
                ['parametro' => 'Leucocitos totales', 'rango_normal' => '4,500 - 10,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Plaquetas', 'rango_normal' => '150,000 - 450,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Glucemia en ayunas', 'rango_normal' => '70 - 105 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Creatinina sérica', 'rango_normal' => '0.7 - 1.2 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Colesterol Total', 'rango_normal' => '< 200 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Triglicéridos', 'rango_normal' => '< 150 mg/dL', 'unidad' => 'mg/dL'],
            ];
        } else {
            $grupo = 'Adulto Mayor (60+ años)';
            $parametros = [
                ['parametro' => 'Hemoglobina', 'rango_normal' => '12.0 - 15.5 g/dL', 'unidad' => 'g/dL'],
                ['parametro' => 'Leucocitos totales', 'rango_normal' => '4,000 - 10,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Plaquetas', 'rango_normal' => '140,000 - 400,000 /mm³', 'unidad' => '/mm³'],
                ['parametro' => 'Glucemia en ayunas', 'rango_normal' => '70 - 115 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Creatinina sérica', 'rango_normal' => '0.8 - 1.3 mg/dL', 'unidad' => 'mg/dL'],
                ['parametro' => 'Filtrado Glomerular eGFR', 'rango_normal' => '> 60 mL/min/1.73m²', 'unidad' => 'mL/min'],
            ];
        }

        return [
            'grupo_etario' => $grupo,
            'parametros'   => $parametros,
        ];
    }

    /**
     * Listado para el visor de resultados (Paciente o Médico)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = LaboratorioEstudioConsulta::with(['paciente', 'medico', 'cita']);

            // Aislamiento estricto de privacidad según rol autenticado
            $user = $request->user();
            if ($user) {
                if ($user->esMedico()) {
                    $medico = $user->medico;
                    if ($medico) {
                        $query->where('id_medico_solicitante', $medico->id_medico);
                    }
                } elseif ($user->esPaciente()) {
                    $paciente = $user->paciente;
                    if ($paciente) {
                        $query->where('id_paciente', $paciente->id_paciente);
                    }
                }
            }

            // Si se filtra por paciente (solo si no es médico con pacientes acotados)
            if ($request->filled('id_paciente') && (!$user || !$user->esPaciente())) {
                $query->where('id_paciente', $request->query('id_paciente'));
            }

            // Si se filtra por médico (solo si no está ya acotado a otro médico)
            if ($request->filled('id_medico') && (!$user || !$user->esMedico())) {
                $query->where('id_medico_solicitante', $request->query('id_medico'));
            }

            // Filtro por estado
            if ($request->filled('estado')) {
                $estado = strtoupper($request->query('estado'));
                if ($estado === 'HABILITADO' || $estado === 'COMPLETADO') {
                    $query->whereIn('estado', ['COMPLETADO', 'PUBLICADO']);
                } else {
                    $query->where('estado', $estado);
                }
            }

            // Búsqueda por término
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
                $habilitado = in_array($est->estado, ['COMPLETADO', 'PUBLICADO']);

                return [
                    'id_estudio'            => $est->id_estudio,
                    'codigo_estudio'        => $est->codigo_estudio,
                    'id_paciente'           => $est->id_paciente,
                    'paciente_nombre'       => $est->paciente ? "{$est->paciente->nombres} {$est->paciente->apellidos}" : 'N/A',
                    'paciente_ci'           => $est->paciente->ci ?? 'S/N',
                    'paciente_edad'         => $edad,
                    'paciente_sexo'         => $est->paciente->sexo ?? 'N/D',
                    'grupo_etario'          => $ref['grupo_etario'],
                    'medico_solicitante'    => $est->medico ? "Dr(a). {$est->medico->nombres} {$est->medico->apellidos}" : 'Médico Institucional',
                    'nombre_estudio'        => $est->nombre_estudio,
                    'tipo_estudio'          => $est->tipo_estudio,
                    'descripcion'           => $est->descripcion,
                    'fecha_solicitud'       => Carbon::parse($est->fecha_solicitud)->format('Y-m-d'),
                    'estado'                => $habilitado ? 'HABILITADO' : 'PENDIENTE',
                    'estado_original'       => $est->estado,
                    'resultado_diagnostico' => $est->resultado_diagnostico,
                    'archivo_resultado_url' => $est->archivo_resultado_url,
                    'publicado_en'          => $est->publicado_en ? Carbon::parse($est->publicado_en)->format('Y-m-d H:i') : null,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'estudios' => $resultado,
                    'total'    => $resultado->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al consultar visor de laboratorios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ver detalle completo de un estudio médico con parámetros de referencia
     */
    public function show($id): JsonResponse
    {
        try {
            $estudio = LaboratorioEstudioConsulta::with(['paciente', 'medico', 'cita'])->findOrFail($id);

            $edad = $estudio->paciente && $estudio->paciente->fecha_nacimiento
                ? Carbon::parse($estudio->paciente->fecha_nacimiento)->age
                : 30;

            $ref = $this->obtenerParametrosReferenciaPorEdad($edad);
            $habilitado = in_array($estudio->estado, ['COMPLETADO', 'PUBLICADO']);

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id_estudio'            => $estudio->id_estudio,
                    'codigo_estudio'        => $estudio->codigo_estudio,
                    'estado'                => $habilitado ? 'HABILITADO' : 'PENDIENTE',
                    'habilitado'            => $habilitado,
                    'nombre_estudio'        => $estudio->nombre_estudio,
                    'tipo_estudio'          => $estudio->tipo_estudio,
                    'descripcion'           => $estudio->descripcion,
                    'resultado_diagnostico' => $estudio->resultado_diagnostico,
                    'archivo_resultado_url' => $estudio->archivo_resultado_url,
                    'fecha_solicitud'       => Carbon::parse($estudio->fecha_solicitud)->format('d/m/Y H:i'),
                    'publicado_en'          => $estudio->publicado_en ? Carbon::parse($estudio->publicado_en)->format('d/m/Y H:i') : null,
                    'paciente'              => [
                        'id_paciente'      => $estudio->paciente->id_paciente ?? null,
                        'nombre_completo'  => $estudio->paciente ? "{$estudio->paciente->nombres} {$estudio->paciente->apellidos}" : 'N/A',
                        'ci'               => $estudio->paciente->ci ?? 'S/N',
                        'edad'             => $edad,
                        'sexo'             => $estudio->paciente->sexo ?? 'N/D',
                        'fecha_nacimiento' => $estudio->paciente->fecha_nacimiento ?? 'N/D',
                        'grupo_etario'     => $ref['grupo_etario'],
                    ],
                    'medico'                => [
                        'id_medico'        => $estudio->medico->id_medico ?? null,
                        'nombre_completo'  => $estudio->medico ? "Dr(a). {$estudio->medico->nombres} {$estudio->medico->apellidos}" : 'Médico Institucional',
                        'matricula'        => $estudio->medico->matricula_profesional ?? 'MP-INSP',
                    ],
                    'parametros_referencia' => $ref['parametros'],
                    'institucion'           => [
                        'nombre'    => 'Clínica Vida Salud',
                        'sucursal'  => 'Sede Central - Laboratorio de Análisis Clínico',
                        'direccion' => 'Av. San Martín #1024, Santa Cruz de la Sierra',
                        'telefono'  => '(+591) 3-3344556',
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No se encontró el estudio solicitado: ' . $e->getMessage(),
            ], 404);
        }
    }
}
