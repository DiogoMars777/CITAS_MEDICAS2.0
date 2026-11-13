<?php

namespace App\Controllers\PKG01_Seguridad\CU01_Autenticacion;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Mail\PasswordResetOtpMail;

class CU01_AutenticacionController extends Controller
{
    /**
     * CU01 - Inicio de sesión con bloqueo de 2 minutos por intentos fallidos
     */
    public function iniciarSesion(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'login'    => 'required|string',
                'password' => 'required|string',
            ], [
                'login.required'    => 'El correo electrónico o nombre de usuario es obligatorio.',
                'password.required' => 'La contraseña es obligatoria.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $login = strtolower(trim($request->input('login')));
            $password = $request->input('password');

            // Claves para el control de reintento y bloqueo de 2 minutos (120 segundos)
            $clientIp = $request->ip() ?? '127.0.0.1';
            $lockoutKey = 'login_lockout_' . md5($login . '_' . $clientIp);
            $attemptsKey = 'login_attempts_' . md5($login . '_' . $clientIp);

            // 1. Verificar si ya se encuentra en bloqueo de 2 minutos
            try {
                if (Cache::has($lockoutKey)) {
                    $lockUntil = Carbon::parse(Cache::get($lockoutKey));
                    $remainingSeconds = (int) max(1, Carbon::now()->diffInSeconds($lockUntil, false));

                    if ($remainingSeconds > 0) {
                        return response()->json([
                            'success'          => false,
                            'message'          => "Acceso retenido por seguridad debido a intentos fallidos. Inténtalo de nuevo en {$remainingSeconds} segundos.",
                            'cooldown_seconds' => $remainingSeconds,
                            'locked'           => true,
                        ], 429);
                    }
                }
            } catch (\Throwable $ce) {
                Log::warning('Cache check failed: ' . $ce->getMessage());
            }

            // 2. Buscar usuario por email o username
            $user = Usuario::whereRaw('LOWER(email) = ?', [$login])
                ->orWhereRaw('LOWER(username) = ?', [$login])
                ->first();

            // 3. Si no existe o la contraseña falla, procesar intento fallido
            if (!$user || !password_verify($password, $user->password_hash)) {
                $currentAttempts = 1;
                try {
                    $currentAttempts = (int) Cache::get($attemptsKey, 0) + 1;
                    Cache::put($attemptsKey, $currentAttempts, Carbon::now()->addMinutes(5));
                } catch (\Throwable $ce) {
                    Log::warning('Cache write failed: ' . $ce->getMessage());
                }

                $maxAllowed = 3; // Bloqueo al tercer intento fallido

                if ($currentAttempts >= $maxAllowed) {
                    $cooldownTime = 120; // 2 minutos (120 segundos)
                    try {
                        $lockExpiry = Carbon::now()->addSeconds($cooldownTime);
                        Cache::put($lockoutKey, $lockExpiry->toDateTimeString(), $cooldownTime);
                        Cache::forget($attemptsKey);
                    } catch (\Throwable $ce) {
                        Log::warning('Cache lockout write failed: ' . $ce->getMessage());
                    }

                    return response()->json([
                        'success'          => false,
                        'message'          => "Contraseña incorrecta. Has alcanzado los {$maxAllowed} intentos permitidos. Tu acceso ha sido bloqueado por 2 minutos.",
                        'cooldown_seconds' => $cooldownTime,
                        'locked'           => true,
                        'attempts_left'    => 0,
                    ], 429);
                }

                $attemptsLeft = $maxAllowed - $currentAttempts;
                return response()->json([
                    'success'       => false,
                    'message'       => "Contraseña incorrecta. Te quedan {$attemptsLeft} intento(s) antes del bloqueo de seguridad de 2 minutos.",
                    'attempts_left' => $attemptsLeft,
                    'locked'        => false,
                ], 401);
            }

            // 4. Validar estado de la cuenta
            if ($user->estado !== 'ACTIVO') {
                return response()->json([
                    'success' => false,
                    'message' => 'Su cuenta se encuentra inactiva o bloqueada por la administración.',
                ], 403);
            }

            // 5. Éxito: Limpiar intentos fallidos y registrar último acceso
            try {
                Cache::forget($attemptsKey);
                Cache::forget($lockoutKey);
            } catch (\Throwable $ce) {
                // Ignore cache clear error
            }

            $user->ultimo_login = Carbon::now();
            $user->save();

            // Obtener nombre del Rol
            $rolNombre = DB::table('roles')->where('id_rol', $user->id_rol)->value('nombre_rol') ?? 'USUARIO';

            // Generar token Sanctum
            $token = $user->createToken('auth_token_' . $user->username)->plainTextToken;

            // Registrar en Bitácora de Auditoría (CU02)
            try {
                BitacoraAuditoria::registrar(
                    'PKG01_Seguridad',
                    'usuarios',
                    $user->id_usuario,
                    'LOGIN',
                    null,
                    ['rol' => $rolNombre, 'login_timestamp' => Carbon::now('America/La_Paz')->toDateTimeString()],
                    $user->id_usuario,
                    $clientIp,
                    $request->userAgent()
                );
            } catch (\Throwable $e) {
                Log::warning('No se pudo registrar bitacora de login: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Inicio de sesión exitoso. Bienvenido a la Clínica Vida Salud.',
                'token'   => $token,
                'user'    => [
                    'id_usuario'   => $user->id_usuario,
                    'username'     => $user->username,
                    'email'        => $user->email,
                    'rol'          => $rolNombre,
                    'ultimo_login' => $user->ultimo_login,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Excepción crítica en iniciarSesion: ' . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar sesión: ' . $e->getMessage(),
                'error'   => [
                    'file' => basename($e->getFile()) . ':' . $e->getLine(),
                ],
            ], 500);
        }
    }

    /**
     * CU01 - Solicitar código de recuperación por correo (Gmail) con bloqueo de 2 minutos
     */
    public function solicitarRecuperacion(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email'    => 'Por favor, ingrese un formato de correo electrónico válido.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $user = Usuario::whereRaw('LOWER(email) = ?', [$email])->first();

        // Control estricto de bloqueo de 2 minutos (120 segundos)
        $existing = DB::table('password_reset_tokens')->where('email', $email)->first();
        if ($existing && $existing->created_at) {
            $created = Carbon::parse($existing->created_at);
            $secondsDiff = Carbon::now()->diffInSeconds($created);

            if ($secondsDiff < 120) {
                $wait = 120 - $secondsDiff;
                return response()->json([
                    'success'          => false,
                    'message'          => "Debes esperar {$wait} segundos antes de solicitar un nuevo código de recuperación.",
                    'cooldown_seconds' => $wait,
                    'locked'           => true,
                ], 429);
            }
        }

        // Si el usuario no existe
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró ninguna cuenta asociada a este correo electrónico en la clínica.',
            ], 404);
        }

        // Generar código numérico de 6 dígitos
        $otp = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        // Guardar token encriptado en password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token'      => Hash::make($otp),
                'created_at' => Carbon::now()
            ]
        );

        $mailSent = false;
        try {
            Mail::to($email)->send(new PasswordResetOtpMail($otp, $user->username));
            $mailSent = true;
        } catch (\Throwable $e) {
            Log::warning('Aviso SMTP Gmail: No se pudo despachar el correo (Verifique .env): ' . $e->getMessage());
        }

        return response()->json([
            'success'          => true,
            'message'          => 'Código de seguridad de 6 dígitos enviado. Revisa tu correo.',
            'cooldown_seconds' => 120,
            'mail_sent'        => $mailSent,
            'dev_otp'          => app()->environment('local') ? $otp : null,
        ]);
    }

    /**
     * CU01 - Verificar código OTP de 6 dígitos
     */
    public function verificarCodigoOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ], [
            'email.required' => 'El correo es obligatorio.',
            'otp.required'   => 'El código de verificación es obligatorio.',
            'otp.size'       => 'El código debe contener exactamente 6 dígitos.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $otp = trim($request->input('otp'));

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No hay ninguna solicitud activa para este correo o el código ya expiró.',
            ], 404);
        }

        // Expiración de 15 minutos
        if (Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación ha expirado. Por favor, solicita uno nuevo.',
            ], 410);
        }

        // Validar hash del OTP
        if (!Hash::check($otp, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'El código de 6 dígitos ingresado es incorrecto.',
            ], 422);
        }

        // Generar ticket de cambio de contraseña temporal
        $resetTicket = bin2hex(random_bytes(32));
        DB::table('password_reset_tokens')->where('email', $email)->update([
            'token' => Hash::make($resetTicket),
        ]);

        return response()->json([
            'success'      => true,
            'message'      => 'Código verificado con éxito. Procede a ingresar tu nueva contraseña.',
            'reset_ticket' => $resetTicket,
        ]);
    }

    /**
     * CU01 - Restablecer contraseña con validaciones estrictas
     * (Mínimo 8 caracteres, mayúscula, minúscula, número, símbolo y confirmación)
     */
    public function restablecerContrasena(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'        => 'required|email',
            'reset_ticket' => 'required|string',
            'password'     => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*?&#^()_+\-=\[\]{};\':"\\|,.<>\/]/',
                'confirmed',
            ],
        ], [
            'email.required'        => 'El correo es obligatorio.',
            'reset_ticket.required' => 'El ticket de seguridad es requerido.',
            'password.required'     => 'La nueva contraseña es obligatoria.',
            'password.min'          => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex'        => 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo especial.',
            'password.confirmed'    => 'Las contraseñas no coinciden. Verifique la confirmación.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $ticket = $request->input('reset_ticket');

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record || !Hash::check($ticket, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'La sesión de recuperación es inválida o ha caducado. Vuelve a iniciar el proceso.',
            ], 403);
        }

        $user = Usuario::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        // Actualizar contraseña con password_hash y BCRYPT
        $user->password_hash = password_hash($request->input('password'), PASSWORD_BCRYPT);
        $user->fecha_actualizacion = Carbon::now();
        $user->save();

        // Eliminar token usado
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return response()->json([
            'success' => true,
            'message' => '¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión.',
        ]);
    }

    /**
     * CU01 - Cierre de sesión seguro
     */
    public function cerrarSesion(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            try {
                BitacoraAuditoria::registrar(
                    'PKG01_Seguridad',
                    'usuarios',
                    $user->id_usuario,
                    'LOGOUT',
                    ['sesion' => 'activa'],
                    ['sesion' => 'cerrada', 'logout_timestamp' => Carbon::now('America/La_Paz')->toDateTimeString()],
                    $user->id_usuario,
                    $request->ip(),
                    $request->userAgent()
                );
            } catch (\Throwable $e) {
                Log::warning('No se pudo registrar bitacora de logout: ' . $e->getMessage());
            }

            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * CU01 - Consultar usuario actual autenticado
     */
    public function obtenerUsuarioActual(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $rolNombre = DB::table('roles')->where('id_rol', $user->id_rol)->value('nombre_rol') ?? 'USUARIO';

        return response()->json([
            'success' => true,
            'user'    => [
                'id_usuario'   => $user->id_usuario,
                'username'     => $user->username,
                'email'        => $user->email,
                'rol'          => $rolNombre,
                'ultimo_login' => $user->ultimo_login,
            ]
        ]);
    }

    // ==========================================
    // Alias en inglés para compatibilidad total
    // ==========================================
    public function login(Request $request): JsonResponse { return $this->iniciarSesion($request); }
    public function forgotPassword(Request $request): JsonResponse { return $this->solicitarRecuperacion($request); }
    public function verifyOtp(Request $request): JsonResponse { return $this->verificarCodigoOtp($request); }
    public function resetPassword(Request $request): JsonResponse { return $this->restablecerContrasena($request); }
    public function logout(Request $request): JsonResponse { return $this->cerrarSesion($request); }
    public function me(Request $request): JsonResponse { return $this->obtenerUsuarioActual($request); }
}
