<?php

namespace App\Controllers\PKG03_PacientesHistorial;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\ContactoEmergencia;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

/**
 * Controlador de Autoservicio y Portal del Paciente
 * Implementa endpoints seguros donde la identidad se deriva estrictamente del token Sanctum.
 */
class PacientePortalController extends Controller
{
    /**
     * Resuelve el paciente asociado al usuario autenticado.
     */
    protected function getPacienteAutenticado(Request $request): ?Paciente
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }

        return Paciente::with(['contactoEmergencia', 'historiaClinica'])
            ->where('id_usuario', $user->id_usuario)
            ->first();
    }

    /**
     * GET /api/paciente/me
     * Retorna el perfil completo del paciente autenticado.
     */
    public function obtenerMiPerfil(Request $request): JsonResponse
    {
        $paciente = $this->getPacienteAutenticado($request);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró un registro de paciente asociado a su cuenta.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id_paciente'         => $paciente->id_paciente,
                'ci'                  => $paciente->ci,
                'nombres'             => $paciente->nombres,
                'apellidos'           => $paciente->apellidos,
                'nombre_completo'     => $paciente->nombre_completo,
                'fecha_nacimiento'    => $paciente->fecha_nacimiento ? Carbon::parse($paciente->fecha_nacimiento)->format('Y-m-d') : null,
                'edad'                => $paciente->edad,
                'sexo'                => $paciente->sexo,
                'telefono'            => $paciente->telefono,
                'email'               => $paciente->email,
                'direccion'           => $paciente->direccion,
                'estado'              => $paciente->estado,
                'numero_expediente'   => $paciente->historiaClinica?->numero_expediente ?? 'Sin expediente',
                'tipo_sangre'         => $paciente->historiaClinica?->tipo_sangre,
                'alergias'            => $paciente->historiaClinica?->alergias_medicamentos,
                'contacto_emergencia' => $paciente->contactoEmergencia ? [
                    'nombre'     => $paciente->contactoEmergencia->nombre_completo,
                    'parentesco' => $paciente->contactoEmergencia->parentesco,
                    'telefono'   => $paciente->contactoEmergencia->telefono,
                    'direccion'  => $paciente->contactoEmergencia->direccion,
                ] : null,
            ],
        ]);
    }

    /**
     * PUT /api/paciente/me
     * Permite al paciente actualizar exclusivamente sus datos de contacto y emergencia.
     */
    public function actualizarMiPerfil(Request $request): JsonResponse
    {
        $paciente = $this->getPacienteAutenticado($request);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró el paciente asociado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'telefono'            => 'nullable|string|max:25',
            'email'               => 'nullable|email|max:100',
            'direccion'           => 'nullable|string|max:200',
            'contacto_nombre'     => 'nullable|string|max:120',
            'contacto_parentesco' => 'nullable|string|max:40',
            'contacto_telefono'   => 'nullable|string|max:25',
            'contacto_direccion'  => 'nullable|string|max:200',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de contacto inválidos.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        DB::transaction(function () use ($paciente, $request) {
            // Actualizar únicamente campos permitidos en paciente
            if ($request->has('telefono')) {
                $paciente->telefono = $request->input('telefono');
            }
            if ($request->has('email')) {
                $paciente->email = $request->input('email');
            }
            if ($request->has('direccion')) {
                $paciente->direccion = $request->input('direccion');
            }
            $paciente->save();

            // Actualizar o crear contacto de emergencia
            if ($request->filled('contacto_nombre') || $request->filled('contacto_telefono')) {
                ContactoEmergencia::updateOrCreate(
                    ['id_paciente' => $paciente->id_paciente],
                    [
                        'nombre_completo' => $request->input('contacto_nombre', $paciente->contactoEmergencia?->nombre_completo ?? 'Contacto'),
                        'parentesco'      => $request->input('contacto_parentesco', $paciente->contactoEmergencia?->parentesco ?? 'Familiar'),
                        'telefono'        => $request->input('contacto_telefono', $paciente->contactoEmergencia?->telefono ?? $paciente->telefono),
                        'direccion'       => $request->input('contacto_direccion', $paciente->contactoEmergencia?->direccion ?? $paciente->direccion),
                    ]
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente.',
            'data'    => $this->obtenerMiPerfil($request)->getData(true)['data'] ?? [],
        ]);
    }

    /**
     * GET /api/paciente/me/citas
     * Retorna única y exclusivamente las citas médicas del paciente autenticado.
     */
    public function misCitas(Request $request): JsonResponse
    {
        $paciente = $this->getPacienteAutenticado($request);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para consultar citas.',
            ], 403);
        }

        $citas = Cita::with(['medico.especialidades', 'especialidad', 'ultimoPago', 'cancelacion'])
            ->where('id_paciente', $paciente->id_paciente)
            ->orderBy('fecha_cita', 'desc')
            ->orderBy('hora_inicio', 'desc')
            ->get()
            ->map(function ($c) {
                return [
                    'id_cita'             => $c->id_cita,
                    'codigo_cita'         => $c->codigo_cita,
                    'fecha_cita'          => Carbon::parse($c->fecha_cita)->format('Y-m-d'),
                    'hora_inicio'         => substr($c->hora_inicio, 0, 5),
                    'hora_fin'            => substr($c->hora_fin, 0, 5),
                    'horario'             => substr($c->hora_inicio, 0, 5) . ' - ' . substr($c->hora_fin, 0, 5),
                    'estado_cita'         => $c->estado_cita,
                    'motivo_consulta'     => $c->motivo_consulta,
                    'medico_nombre'       => $c->medico ? "Dr(a). {$c->medico->nombre_completo}" : '',
                    'id_medico'           => $c->id_medico,
                    'especialidad_nombre' => $c->especialidad?->nombre ?? 'Medicina General',
                    'id_especialidad'     => $c->id_especialidad,
                    'esta_pagada'         => $c->estaPagada(),
                    'ultimo_pago'         => $c->ultimoPago ? [
                        'monto'       => $c->ultimoPago->monto,
                        'metodo_pago' => $c->ultimoPago->metodo_pago,
                        'estado_pago' => $c->ultimoPago->estado_pago,
                        'fecha_pago'  => $c->ultimoPago->fecha_pago,
                    ] : null,
                    'cancelacion'         => $c->cancelacion ? [
                        'motivo'            => $c->cancelacion->motivo_cancelacion,
                        'fecha_cancelacion' => $c->cancelacion->fecha_cancelacion,
                    ] : null,
                    'fecha_creacion'      => $c->fecha_creacion ? Carbon::parse($c->fecha_creacion)->toIso8601String() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $citas,
        ]);
    }

    /**
     * GET /api/paciente/me/historial
     * Retorna el historial médico clínico y cronológico del paciente con citas, reprogramaciones y cancelaciones.
     */
    public function miHistorial(Request $request): JsonResponse
    {
        $paciente = $this->getPacienteAutenticado($request);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado.',
            ], 403);
        }

        $citas = Cita::with([
            'medico',
            'especialidad',
            'atencionMedica',
            'cancelacion',
            'reprogramaciones.medicoAnterior',
            'reprogramaciones.medicoNuevo',
            'pagos'
        ])
            ->where('id_paciente', $paciente->id_paciente)
            ->orderBy('fecha_cita', 'desc')
            ->orderBy('hora_inicio', 'desc')
            ->get()
            ->map(function ($c) {
                return [
                    'id_cita'             => $c->id_cita,
                    'codigo_cita'         => $c->codigo_cita,
                    'fecha_cita'          => Carbon::parse($c->fecha_cita)->format('Y-m-d'),
                    'horario'             => substr($c->hora_inicio, 0, 5) . ' - ' . substr($c->hora_fin, 0, 5),
                    'estado_cita'         => $c->estado_cita,
                    'motivo_consulta'     => $c->motivo_consulta,
                    'medico'              => $c->medico ? "Dr(a). {$c->medico->nombre_completo}" : '',
                    'especialidad'        => $c->especialidad?->nombre ?? 'Medicina General',
                    'fecha_creacion'      => $c->fecha_creacion ? Carbon::parse($c->fecha_creacion)->toIso8601String() : null,
                    'atencion_medica'     => $c->atencionMedica ? [
                        'diagnostico'          => $c->atencionMedica->diagnostico,
                        'tratamiento'          => $c->atencionMedica->tratamiento,
                        'indicaciones_medicas' => $c->atencionMedica->indicaciones_medicas,
                        'fecha_atencion'       => $c->atencionMedica->fecha_atencion,
                    ] : null,
                    'cancelacion'         => $c->cancelacion ? [
                        'motivo'            => $c->cancelacion->motivo_cancelacion,
                        'fecha_cancelacion' => $c->cancelacion->fecha_cancelacion,
                    ] : null,
                    'reprogramaciones'    => $c->reprogramaciones->map(function ($r) {
                        return [
                            'fecha_anterior'       => $r->fecha_anterior,
                            'horario_anterior'     => substr($r->hora_inicio_anterior, 0, 5) . ' - ' . substr($r->hora_fin_anterior, 0, 5),
                            'fecha_nueva'          => $r->fecha_nueva,
                            'horario_nuevo'        => substr($r->hora_inicio_nueva, 0, 5) . ' - ' . substr($r->hora_fin_nueva, 0, 5),
                            'motivo_reprogramacion'=> $r->motivo_reprogramacion,
                            'fecha_operacion'      => $r->fecha_operacion,
                        ];
                    }),
                    'esta_pagada'         => $c->estaPagada(),
                ];
            });

        return response()->json([
            'success'   => true,
            'paciente'  => [
                'nombre_completo'   => $paciente->nombre_completo,
                'ci'                => $paciente->ci,
                'numero_expediente' => $paciente->historiaClinica?->numero_expediente ?? 'Sin expediente',
                'tipo_sangre'       => $paciente->historiaClinica?->tipo_sangre,
            ],
            'historial' => $citas,
        ]);
    }
}

