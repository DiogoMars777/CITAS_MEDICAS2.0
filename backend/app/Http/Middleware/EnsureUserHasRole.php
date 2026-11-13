<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Valida que el usuario autenticado tenga al menos uno de los roles especificados.
     * El ADMINISTRADOR siempre tiene acceso de superusuario a todas las funciones.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado. Se requiere un token de sesión válido.',
            ], 401);
        }

        if (!empty($roles) && !$user->tieneRol(...$roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso denegado: su rol no tiene privilegios suficientes para este recurso.',
            ], 403);
        }

        return $next($request);
    }
}

