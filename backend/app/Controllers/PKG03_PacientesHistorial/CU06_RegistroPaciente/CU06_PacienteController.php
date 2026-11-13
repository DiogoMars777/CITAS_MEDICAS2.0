<?php

namespace App\Controllers\PKG03_PacientesHistorial\CU06_RegistroPaciente;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\ContactoEmergencia;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\HistoriaClinica;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU06_PacienteController extends Controller
{
    /**
     * CU06 - Listado general de pacientes con filtros, métricas y búsqueda por CI/Expediente
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Paciente::with(['usuario', 'contactoEmergencia', 'historiaClinica']);

        // Regla de Privacidad: Pacientes solo pueden ver su propio registro (Recepcionistas y Admin ven todos)
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE'])) {
                $query->where('pacientes.id_usuario', $user->id_usuario);
            }
        }

        // 1. Filtro por Estado (ACTIVO / INACTIVO)
        if ($request->filled('estado')) {
            $query->where('pacientes.estado', strtoupper($request->input('estado')));
        }

        // 2. Filtro por Primera Visita (SI / NO)
        if ($request->filled('primera_visita')) {
            $esPrimera = filter_var($request->input('primera_visita'), FILTER_VALIDATE_BOOLEAN);
            $query->where('pacientes.primera_visita', $esPrimera);
        }

        // 3. Filtro por Sexo
        if ($request->filled('sexo')) {
            $query->where('pacientes.sexo', strtoupper($request->input('sexo')));
        }

        // 4. Búsqueda por CI, Nombres, Apellidos, Teléfono, Email o Nro Expediente
        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(pacientes.ci) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(pacientes.nombres) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(pacientes.apellidos) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(pacientes.telefono) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(pacientes.email) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('historiaClinica', function ($sub) use ($search) {
                      $sub->whereRaw('LOWER(numero_expediente) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        // 5. Ordenamiento (más recientes primero)
        $query->orderBy('pacientes.fecha_creacion', 'desc');

        // 6. Paginación
        $perPage = (int) $request->input('per_page', 10);
        $pacientes = $query->paginate($perPage);

        // Transformación enriquecida
        $pacientes->getCollection()->transform(function ($paciente) {
            $totalCitas = DB::table('citas')
                ->where('id_paciente', $paciente->id_paciente)
                ->count();

            return [
                'id_paciente'         => $paciente->id_paciente,
                'id_usuario'          => $paciente->id_usuario,
                'username'            => $paciente->usuario?->username,
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
                'primera_visita'      => (bool) $paciente->primera_visita,
                'estado'              => $paciente->estado,
                'fecha_creacion'      => $paciente->fecha_creacion ? Carbon::parse($paciente->fecha_creacion)->timezone('America/La_Paz')->format('d/m/Y H:i') : null,
                'numero_expediente'   => $paciente->historiaClinica?->numero_expediente ?? 'Sin expediente',
                'tipo_sangre'         => $paciente->historiaClinica?->tipo_sangre,
                'alergias'            => $paciente->historiaClinica?->alergias_medicamentos,
                'contacto_emergencia' => $paciente->contactoEmergencia ? [
                    'nombre'     => $paciente->contactoEmergencia->nombre_completo,
                    'parentesco' => $paciente->contactoEmergencia->parentesco,
                    'telefono'   => $paciente->contactoEmergencia->telefono,
                ] : null,
                'total_citas'         => $totalCitas,
            ];
        });

        // Métricas analíticas para el encabezado
        $stats = [
            'total'                  => Paciente::count(),
            'activos'                => Paciente::where('estado', 'ACTIVO')->count(),
            'inactivos'              => Paciente::where('estado', 'INACTIVO')->count(),
            'primera_visita'         => Paciente::where('primera_visita', true)->count(),
            'expedientes_aperturados'=> HistoriaClinica::count(),
        ];

        return response()->json([
            'status'                => 'success',
            'case_of_use'           => 'CU06_RegistroPaciente',
            'timezone'              => 'America/La_Paz (UTC-4)',
            'hora_servidor_bolivia' => Carbon::now('America/La_Paz')->format('d/m/Y H:i:s') . ' [BOT]',
            'stats'                 => $stats,
            'data'                  => $pacientes,
        ]);
    }

    /**
     * CU06 - Registrar nuevo paciente con apertura de expediente y contacto de emergencia
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $rol = strtoupper($user->rol?->nombre_rol ?? '');
            if (in_array($rol, ['PACIENTE', 'CLIENTE', 'MEDICO'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado: Solo el personal de Recepción o Administración tiene autorización para registrar pacientes y aperturar historias clínicas.',
                ], 403);
            }
        }

        // FASE 10: Normalización de CI antes de validar unicidad
        if ($request->has('ci')) {
            $request->merge(['ci' => strtoupper(trim(preg_replace('/\s+/', ' ', (string) $request->input('ci'))))]);
        }
        $rules = [
            'ci'               => 'required|string|min:4|max:20|unique:pacientes,ci',
            'nombres'          => 'required|string|min:2|max:80',
            'apellidos'        => 'required|string|min:2|max:80',
            'fecha_nacimiento' => 'required|date|before_or_equal:today',
            'sexo'             => 'required|string|in:MASCULINO,FEMENINO,OTRO',
            'telefono'         => 'required|string|max:25',
            'email'            => 'nullable|email|max:100',
            'direccion'        => 'nullable|string|max:200',
            'primera_visita'   => 'nullable|boolean',
            'estado'           => 'nullable|string|in:ACTIVO,INACTIVO',

            // Cuenta digital
            'crear_usuario'    => 'nullable|boolean',
            'username'         => 'required_if:crear_usuario,true|nullable|string|min:3|max:50|unique:usuarios,username',
            'password'         => 'required_if:crear_usuario,true|nullable|string|min:8',

            // Contacto de emergencia
            'contacto_nombre'     => 'nullable|string|max:120',
            'contacto_parentesco' => 'nullable|string|max:40',
            'contacto_telefono'   => 'nullable|string|max:25',
            'contacto_direccion'  => 'nullable|string|max:200',

            // Expediente clínico base
            'aperturar_expediente'      => 'nullable|boolean',
            'tipo_sangre'               => 'nullable|string|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
            'alergias_medicamentos'     => 'nullable|string',
            'enfermedades_hereditarias' => 'nullable|string',
            'antecedentes_patologicos'  => 'nullable|string',
            'antecedentes_quirurgicos'  => 'nullable|string',
        ];

        $messages = [
            'ci.required'               => 'El Carnet de Identidad (CI) es obligatorio.',
            'ci.unique'                 => 'Ya existe un paciente registrado con este número de CI.',
            'nombres.required'          => 'El nombre del paciente es obligatorio.',
            'apellidos.required'        => 'Los apellidos son obligatorios.',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria.',
            'fecha_nacimiento.before_or_equal' => 'La fecha de nacimiento no puede ser posterior a hoy.',
            'sexo.required'             => 'Debe seleccionar el sexo biológico del paciente.',
            'telefono.required'         => 'El teléfono o celular es obligatorio para contacto y confirmación de citas.',
            'username.unique'           => 'El nombre de usuario elegido ya se encuentra en uso.',
            'password.min'              => 'La contraseña de la cuenta digital debe contener al menos 8 caracteres.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos del paciente.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $nowBolivia = Carbon::now('America/La_Paz');
                $idUsuario = null;

                // 1. Crear cuenta digital si fue solicitada
                if ($request->boolean('crear_usuario')) {
                    $emailUser = $request->filled('email') 
                        ? trim($request->input('email')) 
                        : trim($request->input('username')) . '@paciente.clinicavidasalud.com';

                    $usuario = Usuario::create([
                        'id_rol'              => 4, // Rol Paciente
                        'username'            => trim($request->input('username')),
                        'email'               => $emailUser,
                        'password_hash'       => Hash::make($request->input('password')),
                        'estado'              => 'ACTIVO',
                        'fecha_creacion'      => $nowBolivia,
                        'fecha_actualizacion' => $nowBolivia,
                    ]);
                    $idUsuario = $usuario->id_usuario;

                    // Auditoría de cuenta de usuario
                    BitacoraAuditoria::registrar(
                        'PKG01_Seguridad',
                        'usuarios',
                        $idUsuario,
                        'INSERT',
                        null,
                        [
                            'username' => $usuario->username,
                            'id_rol'   => 4,
                            'email'    => $usuario->email,
                            'origen'   => 'CU06_RegistroPaciente'
                        ],
                        $request->user()?->id_usuario ?? 1,
                        $request->ip(),
                        $request->userAgent()
                    );
                }

                // 2. Registrar Paciente
                $paciente = Paciente::create([
                    'id_usuario'       => $idUsuario,
                    'ci'               => strtoupper(trim($request->input('ci'))),
                    'nombres'          => trim($request->input('nombres')),
                    'apellidos'        => trim($request->input('apellidos')),
                    'fecha_nacimiento' => $request->input('fecha_nacimiento'),
                    'sexo'             => $request->input('sexo'),
                    'telefono'         => trim($request->input('telefono')),
                    'email'            => $request->filled('email') ? trim($request->input('email')) : null,
                    'direccion'        => $request->filled('direccion') ? trim($request->input('direccion')) : null,
                    'primera_visita'   => $request->boolean('primera_visita', true),
                    'estado'           => $request->input('estado', 'ACTIVO'),
                ]);

                // 3. Registrar Contacto de Emergencia si se especificó
                $contactoData = null;
                if ($request->filled('contacto_nombre') && $request->filled('contacto_telefono')) {
                    $contacto = ContactoEmergencia::create([
                        'id_paciente'     => $paciente->id_paciente,
                        'nombre_completo' => trim($request->input('contacto_nombre')),
                        'parentesco'      => $request->filled('contacto_parentesco') ? trim($request->input('contacto_parentesco')) : 'Familiar',
                        'telefono'        => trim($request->input('contacto_telefono')),
                        'direccion'       => $request->filled('contacto_direccion') ? trim($request->input('contacto_direccion')) : null,
                    ]);
                    $contactoData = [
                        'nombre_completo' => $contacto->nombre_completo,
                        'parentesco'      => $contacto->parentesco,
                        'telefono'        => $contacto->telefono,
                    ];
                }

                // 4. Aperturar Historia Clínica / Expediente
                $historiaData = null;
                if ($request->boolean('aperturar_expediente', true)) {
                    $anio = Carbon::now('America/La_Paz')->format('Y');
                    $correlativo = str_pad($paciente->id_paciente, 5, '0', STR_PAD_LEFT);
                    $nroExpediente = "HC-{$anio}-{$correlativo}";

                    $historia = HistoriaClinica::create([
                        'id_paciente'               => $paciente->id_paciente,
                        'numero_expediente'         => $nroExpediente,
                        'tipo_sangre'               => $request->input('tipo_sangre'),
                        'alergias_medicamentos'     => $request->filled('alergias_medicamentos') ? trim($request->input('alergias_medicamentos')) : 'Ninguna conocida',
                        'enfermedades_hereditarias' => $request->filled('enfermedades_hereditarias') ? trim($request->input('enfermedades_hereditarias')) : null,
                        'antecedentes_patologicos'  => $request->filled('antecedentes_patologicos') ? trim($request->input('antecedentes_patologicos')) : null,
                        'antecedentes_quirurgicos'  => $request->filled('antecedentes_quirurgicos') ? trim($request->input('antecedentes_quirurgicos')) : null,
                    ]);

                    $historiaData = [
                        'numero_expediente'     => $historia->numero_expediente,
                        'tipo_sangre'           => $historia->tipo_sangre,
                        'alergias_medicamentos' => $historia->alergias_medicamentos,
                    ];
                }

                // 5. Auditoría CU02
                BitacoraAuditoria::registrar(
                    'PKG03_PacientesHistorial',
                    'pacientes',
                    $paciente->id_paciente,
                    'INSERT',
                    null,
                    [
                        'ci'                  => $paciente->ci,
                        'nombres'             => $paciente->nombres,
                        'apellidos'           => $paciente->apellidos,
                        'telefono'            => $paciente->telefono,
                        'email'               => $paciente->email,
                        'primera_visita'      => $paciente->primera_visita,
                        'contacto_emergencia' => $contactoData,
                        'historia_clinica'    => $historiaData,
                        'usuario_creado'      => $idUsuario ? true : false,
                    ],
                    $request->user()?->id_usuario ?? 1,
                    $request->ip(),
                    $request->userAgent()
                );

                return response()->json([
                    'success' => true,
                    'message' => "Paciente {$paciente->nombre_completo} (CI: {$paciente->ci}) registrado exitosamente.",
                    'data'    => $paciente->load(['contactoEmergencia', 'historiaClinica', 'usuario']),
                ], 201);
            });
        } catch (\Throwable $e) {
            Log::error('Error en CU06 store paciente: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar el paciente en la base de datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU06 - Consultar detalle completo de paciente
     */
    public function show(int $id): JsonResponse
    {
        $paciente = Paciente::with(['usuario', 'contactoEmergencia', 'historiaClinica'])->find($id);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'El paciente solicitado no fue encontrado.',
            ], 404);
        }

        $totalCitas = DB::table('citas')->where('id_paciente', $paciente->id_paciente)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'id_paciente'         => $paciente->id_paciente,
                'id_usuario'          => $paciente->id_usuario,
                'username'            => $paciente->usuario?->username,
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
                'primera_visita'      => (bool) $paciente->primera_visita,
                'estado'              => $paciente->estado,
                'contacto_emergencia' => $paciente->contactoEmergencia,
                'historia_clinica'    => $paciente->historiaClinica,
                'total_citas'         => $totalCitas,
            ],
        ]);
    }

    /**
     * CU06 - Actualizar datos de paciente, contacto y expediente
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $paciente = Paciente::with(['contactoEmergencia', 'historiaClinica'])->find($id);

        if (!$paciente) {
            return response()->json([
                'success' => false,
                'message' => 'El paciente no existe.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'ci'               => "required|string|min:4|max:20|unique:pacientes,ci,{$id},id_paciente",
            'nombres'          => 'required|string|min:2|max:80',
            'apellidos'        => 'required|string|min:2|max:80',
            'fecha_nacimiento' => 'required|date|before_or_equal:today',
            'sexo'             => 'required|string|in:MASCULINO,FEMENINO,OTRO',
            'telefono'         => 'required|string|max:25',
            'email'            => 'nullable|email|max:100',
            'direccion'        => 'nullable|string|max:200',
            'primera_visita'   => 'nullable|boolean',
            'estado'           => 'required|string|in:ACTIVO,INACTIVO',

            // Contacto
            'contacto_nombre'     => 'nullable|string|max:120',
            'contacto_parentesco' => 'nullable|string|max:40',
            'contacto_telefono'   => 'nullable|string|max:25',
            'contacto_direccion'  => 'nullable|string|max:200',

            // Expediente
            'tipo_sangre'               => 'nullable|string|in:O+,O-,A+,A-,B+,B-,AB+,AB-',
            'alergias_medicamentos'     => 'nullable|string',
            'enfermedades_hereditarias' => 'nullable|string',
            'antecedentes_patologicos'  => 'nullable|string',
            'antecedentes_quirurgicos'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos para actualización.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request, $paciente) {
                $valoresAnteriores = [
                    'ci'                  => $paciente->ci,
                    'nombres'             => $paciente->nombres,
                    'apellidos'           => $paciente->apellidos,
                    'telefono'            => $paciente->telefono,
                    'email'               => $paciente->email,
                    'direccion'           => $paciente->direccion,
                    'primera_visita'      => $paciente->primera_visita,
                    'estado'              => $paciente->estado,
                ];

                // Actualizar paciente
                $paciente->ci               = strtoupper(trim($request->input('ci')));
                $paciente->nombres          = trim($request->input('nombres'));
                $paciente->apellidos        = trim($request->input('apellidos'));
                $paciente->fecha_nacimiento = $request->input('fecha_nacimiento');
                $paciente->sexo             = $request->input('sexo');
                $paciente->telefono         = trim($request->input('telefono'));
                $paciente->email            = $request->filled('email') ? trim($request->input('email')) : null;
                $paciente->direccion        = $request->filled('direccion') ? trim($request->input('direccion')) : null;
                $paciente->primera_visita   = $request->boolean('primera_visita', false);
                $paciente->estado           = $request->input('estado');
                $paciente->save();

                // Contacto de emergencia
                if ($request->filled('contacto_nombre')) {
                    if ($paciente->contactoEmergencia) {
                        $paciente->contactoEmergencia->update([
                            'nombre_completo' => trim($request->input('contacto_nombre')),
                            'parentesco'      => $request->input('contacto_parentesco', 'Familiar'),
                            'telefono'        => trim($request->input('contacto_telefono')),
                            'direccion'       => $request->input('contacto_direccion'),
                        ]);
                    } else {
                        ContactoEmergencia::create([
                            'id_paciente'     => $paciente->id_paciente,
                            'nombre_completo' => trim($request->input('contacto_nombre')),
                            'parentesco'      => $request->input('contacto_parentesco', 'Familiar'),
                            'telefono'        => trim($request->input('contacto_telefono')),
                            'direccion'       => $request->input('contacto_direccion'),
                        ]);
                    }
                }

                // Historia clínica
                if ($paciente->historiaClinica) {
                    $paciente->historiaClinica->update([
                        'tipo_sangre'               => $request->input('tipo_sangre'),
                        'alergias_medicamentos'     => $request->input('alergias_medicamentos'),
                        'enfermedades_hereditarias' => $request->input('enfermedades_hereditarias'),
                        'antecedentes_patologicos'  => $request->input('antecedentes_patologicos'),
                        'antecedentes_quirurgicos'  => $request->input('antecedentes_quirurgicos'),
                    ]);
                }

                $valoresNuevos = [
                    'ci'                  => $paciente->ci,
                    'nombres'             => $paciente->nombres,
                    'apellidos'           => $paciente->apellidos,
                    'telefono'            => $paciente->telefono,
                    'email'               => $paciente->email,
                    'direccion'           => $paciente->direccion,
                    'primera_visita'      => $paciente->primera_visita,
                    'estado'              => $paciente->estado,
                ];

                BitacoraAuditoria::registrar(
                    'PKG03_PacientesHistorial',
                    'pacientes',
                    $paciente->id_paciente,
                    'UPDATE',
                    $valoresAnteriores,
                    $valoresNuevos,
                    $request->user()?->id_usuario ?? 1,
                    $request->ip(),
                    $request->userAgent()
                );

                return response()->json([
                    'success' => true,
                    'message' => "Datos del paciente {$paciente->nombre_completo} actualizados correctamente.",
                    'data'    => $paciente->load(['contactoEmergencia', 'historiaClinica']),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('Error en CU06 update paciente: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar modificaciones: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU06 - Cambiar rápidamente estado (ACTIVO / INACTIVO)
     */
    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:ACTIVO,INACTIVO',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Estado inválido.'], 422);
        }

        $paciente = Paciente::find($id);
        if (!$paciente) {
            return response()->json(['success' => false, 'message' => 'Paciente no encontrado.'], 404);
        }

        $nuevoEstado = strtoupper($request->input('estado'));
        $estadoAnterior = $paciente->estado;

        $paciente->estado = $nuevoEstado;
        $paciente->save();

        if ($paciente->usuario) {
            $paciente->usuario->estado = $nuevoEstado;
            $paciente->usuario->save();
        }

        BitacoraAuditoria::registrar(
            'PKG03_PacientesHistorial',
            'pacientes',
            $paciente->id_paciente,
            'CAMBIO_ESTADO',
            ['estado' => $estadoAnterior],
            ['estado' => $nuevoEstado],
            $request->user()?->id_usuario ?? 1,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => "Estado del paciente {$paciente->nombre_completo} actualizado a {$nuevoEstado}.",
            'data'    => ['id_paciente' => $paciente->id_paciente, 'estado' => $nuevoEstado],
        ]);
    }

    /**
     * CU06 - Baja lógica
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $paciente = Paciente::find($id);
        if (!$paciente) {
            return response()->json(['success' => false, 'message' => 'Paciente no encontrado.'], 404);
        }

        $paciente->estado = 'INACTIVO';
        $paciente->save();

        if ($paciente->usuario) {
            $paciente->usuario->estado = 'INACTIVO';
            $paciente->usuario->save();
        }

        BitacoraAuditoria::registrar(
            'PKG03_PacientesHistorial',
            'pacientes',
            $paciente->id_paciente,
            'DELETE',
            ['estado' => 'ACTIVO'],
            ['estado' => 'INACTIVO', 'motivo' => 'Baja de ficha de paciente'],
            $request->user()?->id_usuario ?? 1,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => "Ficha del paciente {$paciente->nombre_completo} dada de baja (Estado: INACTIVO).",
        ]);
    }
}
