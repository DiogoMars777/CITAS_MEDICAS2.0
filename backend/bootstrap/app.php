<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Illuminate\Support\Facades\Log::error('Database QueryException: ' . $e->getMessage(), [
                    'sql' => $e->getSql(),
                ]);

                // Violación de restricción única / concurrencia (PostgreSQL 23505 o MySQL 1062)
                $msg = $e->getMessage();
                if ($e->getCode() == '23505' || str_contains($msg, 'unique_') || str_contains($msg, 'Duplicate entry') || str_contains($msg, 'violates unique constraint')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Conflicto de concurrencia: el horario o registro solicitado ya fue reservado o ya existe.',
                    ], 409);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Error en la base de datos al procesar la solicitud.',
                ], 500);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autenticado. Inicie sesión para continuar.',
                ], 401);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado: permisos insuficientes para realizar esta operación.',
                ], 403);
            }
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return null; // Mantener formato estándar 422 de Laravel
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Recurso o endpoint no encontrado.',
                    ], 404);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage() ?: 'Error en la solicitud.',
                    ], $e->getStatusCode());
                }

                \Illuminate\Support\Facades\Log::error('Unhandled Exception: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Ocurrió un error inesperado en el servidor. El incidente ha sido registrado.',
                ], 500);
            }
        });
    })->create();
