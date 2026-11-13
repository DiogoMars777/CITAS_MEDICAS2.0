<?php

namespace App\Controllers\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU04_EspecialidadController extends Controller
{
    /**
     * CU04 - Listado de especialidades médicas con filtros, conteos y estadísticas
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Especialidad::query();

            // 1. Filtro por Estado (ACTIVO / INACTIVO)
            if ($request->filled('estado')) {
                $query->where('estado', strtoupper($request->input('estado')));
            }

            // 2. Filtro por Búsqueda (nombre o descripción)
            if ($request->filled('search')) {
                $search = strtolower(trim($request->input('search')));
                $query->where(function ($q) use ($search) {
                    $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$search}%"]);
                });
            }

            // 3. Ordenamiento
            $query->orderBy('nombre', 'asc');

            // 4. Paginación
            $perPage = (int) $request->input('per_page', 10);
            $especialidades = $query->paginate($perPage);

            // Enriquecer cada especialidad con conteo real de médicos y citas
            $especialidades->getCollection()->transform(function ($esp) {
                $totalMedicos = DB::table('medico_especialidades')
                    ->where('id_especialidad', $esp->id_especialidad)
                    ->count();

                $totalCitas = DB::table('citas')
                    ->where('id_especialidad', $esp->id_especialidad)
                    ->count();

                return [
                    'id_especialidad' => $esp->id_especialidad,
                    'nombre'          => $esp->nombre,
                    'descripcion'     => $esp->descripcion,
                    'estado'          => $esp->estado,
                    'total_medicos'   => $totalMedicos,
                    'total_citas'     => $totalCitas,
                ];
            });

            // Métricas resumidas
            $stats = [
                'total'              => Especialidad::count(),
                'activas'            => Especialidad::where('estado', 'ACTIVO')->count(),
                'inactivas'          => Especialidad::where('estado', 'INACTIVO')->count(),
                'medicos_vinculados' => DB::table('medico_especialidades')->distinct('id_medico')->count('id_medico'),
            ];

            return response()->json([
                'status'                => 'success',
                'case_of_use'           => 'CU04_GestionEspecialidades',
                'timezone'              => 'America/La_Paz (UTC-4)',
                'hora_servidor_bolivia' => Carbon::now('America/La_Paz')->format('d/m/Y H:i:s') . ' [BOT]',
                'stats'                 => $stats,
                'data'                  => $especialidades,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error en listar especialidades: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al obtener especialidades: ' . $e->getMessage(),
                'file'    => basename($e->getFile()) . ':' . $e->getLine()
            ], 500);
        }
    }

    /**
     * CU04 - Registrar nueva especialidad médica con validación de nombre único
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre'      => 'required|string|min:3|max:100|unique:especialidades,nombre',
            'descripcion' => 'nullable|string|max:255',
            'estado'      => 'nullable|string|in:ACTIVO,INACTIVO',
        ], [
            'nombre.required' => 'El nombre de la especialidad es obligatorio.',
            'nombre.min'      => 'El nombre debe contener al menos 3 caracteres.',
            'nombre.unique'   => 'Ya existe una especialidad médica registrada con este nombre.',
            'descripcion.max' => 'La descripción no puede exceder los 255 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Por favor verifique los datos de la especialidad.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $especialidad = Especialidad::create([
                'nombre'      => trim($request->input('nombre')),
                'descripcion' => $request->filled('descripcion') ? trim($request->input('descripcion')) : null,
                'estado'      => $request->input('estado', 'ACTIVO'),
            ]);

            // Registrar en Bitácora de Auditoría (CU02)
            \App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria::registrar(
                'PKG02_MedicosEspecialidades',
                'especialidades',
                $especialidad->id_especialidad,
                'INSERT',
                null,
                [
                    'nombre'      => $especialidad->nombre,
                    'descripcion' => $especialidad->descripcion,
                    'estado'      => $especialidad->estado,
                ],
                $request->user()?->id_usuario ?? 1,
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'success' => true,
                'message' => "Especialidad '{$especialidad->nombre}' registrada exitosamente en el catálogo médico.",
                'data'    => $especialidad,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error al registrar especialidad CU04: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar la especialidad en la base de datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU04 - Consultar detalle de una especialidad médica
     */
    public function show(int $id): JsonResponse
    {
        $esp = Especialidad::find($id);

        if (!$esp) {
            return response()->json([
                'success' => false,
                'message' => 'La especialidad médica no existe.',
            ], 404);
        }

        // Médicos que tienen asignada esta especialidad
        $medicos = DB::table('medico_especialidades')
            ->join('medicos', 'medico_especialidades.id_medico', '=', 'medicos.id_medico')
            ->where('medico_especialidades.id_especialidad', $id)
            ->select('medicos.id_medico', 'medicos.nombres', 'medicos.apellidos', 'medicos.nro_registro_profesional', 'medico_especialidades.es_principal')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'id_especialidad' => $esp->id_especialidad,
                'nombre'          => $esp->nombre,
                'descripcion'     => $esp->descripcion,
                'estado'          => $esp->estado,
                'total_medicos'   => count($medicos),
                'medicos'         => $medicos,
            ],
        ]);
    }

    /**
     * CU04 - Actualizar datos de especialidad médica (validación de nombre único)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $esp = Especialidad::find($id);

        if (!$esp) {
            return response()->json([
                'success' => false,
                'message' => 'La especialidad solicitada no fue encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre'      => "required|string|min:3|max:100|unique:especialidades,nombre,{$id},id_especialidad",
            'descripcion' => 'nullable|string|max:255',
            'estado'      => 'required|string|in:ACTIVO,INACTIVO',
        ], [
            'nombre.required' => 'El nombre de la especialidad es obligatorio.',
            'nombre.unique'   => 'Ya existe otra especialidad médica con este nombre.',
            'estado.required' => 'El estado de la especialidad es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos para actualización.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $valoresAnteriores = [
                'nombre'      => $esp->nombre,
                'descripcion' => $esp->descripcion,
                'estado'      => $esp->estado,
            ];

            $esp->nombre = trim($request->input('nombre'));
            $esp->descripcion = $request->filled('descripcion') ? trim($request->input('descripcion')) : null;
            $esp->estado = $request->input('estado');
            $esp->save();

            $valoresNuevos = [
                'nombre'      => $esp->nombre,
                'descripcion' => $esp->descripcion,
                'estado'      => $esp->estado,
            ];

            // Registrar en Bitácora de Auditoría (CU02)
            \App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria::registrar(
                'PKG02_MedicosEspecialidades',
                'especialidades',
                $esp->id_especialidad,
                'UPDATE',
                $valoresAnteriores,
                $valoresNuevos,
                $request->user()?->id_usuario ?? 1,
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'success' => true,
                'message' => "Especialidad '{$esp->nombre}' actualizada correctamente.",
                'data'    => $esp,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar especialidad CU04: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar cambios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * CU04 - Cambiar rápidamente el estado (ACTIVO / INACTIVO)
     */
    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:ACTIVO,INACTIVO',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Estado no válido.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $esp = Especialidad::find($id);
        if (!$esp) {
            return response()->json(['success' => false, 'message' => 'Especialidad no encontrada.'], 404);
        }

        $nuevoEstado = strtoupper($request->input('estado'));
        $estadoAnterior = $esp->estado;

        $esp->estado = $nuevoEstado;
        $esp->save();

        // Registrar en Bitácora de Auditoría
        \App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria::registrar(
            'PKG02_MedicosEspecialidades',
            'especialidades',
            $esp->id_especialidad,
            'CAMBIO_ESTADO',
            ['estado' => $estadoAnterior],
            ['estado' => $nuevoEstado],
            $request->user()?->id_usuario ?? 1,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => "Estado de la especialidad '{$esp->nombre}' actualizado a {$nuevoEstado}.",
            'data'    => [
                'id_especialidad' => $esp->id_especialidad,
                'estado'          => $nuevoEstado,
            ],
        ]);
    }

    /**
     * CU04 - Baja o eliminación lógica
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $esp = Especialidad::find($id);
        if (!$esp) {
            return response()->json(['success' => false, 'message' => 'Especialidad no encontrada.'], 404);
        }

        // Baja lógica para preservar integridad referencial de citas históricas y médicos
        $esp->estado = 'INACTIVO';
        $esp->save();

        \App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria::registrar(
            'PKG02_MedicosEspecialidades',
            'especialidades',
            $esp->id_especialidad,
            'DELETE',
            ['estado' => 'ACTIVO'],
            ['estado' => 'INACTIVO', 'motivo' => 'Baja lógica de especialidad médica'],
            $request->user()?->id_usuario ?? 1,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'message' => "Especialidad '{$esp->nombre}' dada de baja (Estado: INACTIVO).",
        ]);
    }
}
