<?php

use Illuminate\Support\Facades\Route;
use App\Controllers\PKG01_Seguridad\CU01_Autenticacion\CU01_AutenticacionController;
use App\Controllers\PKG01_Seguridad\CU02_BitacoraAuditoria\CU02_BitacoraAuditoriaController;
use App\Controllers\PKG01_Seguridad\CU03_GestionUsuarios\CU03_GestionUsuariosController;
use App\Controllers\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\CU04_EspecialidadController;
use App\Controllers\PKG02_MedicosEspecialidades\CU05_GestionMedicos\CU05_MedicoController;
use App\Controllers\PKG03_PacientesHistorial\CU06_RegistroPaciente\CU06_PacienteController;
use App\Controllers\PKG04_AgendasHorarios\CU07_ConfigurarTurnos\CU07_TurnoMedicoController;
use App\Controllers\PKG04_AgendasHorarios\CU08_BloqueosAgenda\CU08_BloqueoAgendaController;
use App\Controllers\PKG04_AgendasHorarios\CU09_ConsultarDisponibilidad\CU09_DisponibilidadController;
use App\Controllers\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\CU10_ReservaCitaController;
use App\Controllers\PKG05_GestionCitasConcurrencia\CU11_ReprogramarCita\CU11_ReprogramacionController;
use App\Controllers\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CU12_CancelacionController;
use App\Controllers\PKG05_GestionCitasConcurrencia\CU13_ControlAsistencia\CU13_AsistenciaController;
use App\Controllers\PKG05_GestionCitasConcurrencia\CU23_GestionarPagos\CU23_GestionarPagosController;
use App\Controllers\PKG03_PacientesHistorial\CU14_AntecedentesClinicos\CU14_AntecedentesClinicosController;
use App\Controllers\PKG06_AtencionMedica\CU15_AgendaDiariaMedico\CU15_AgendaMedicoController;
use App\Controllers\PKG06_AtencionMedica\CU16_AtenderConsulta\CU16_AtencionMedicaController;
use App\Controllers\PKG07_Laboratorios\CU17_CargarEstudios\CU17_CargaEstudioController;
use App\Controllers\PKG07_Laboratorios\CU18_VisualizarEstudios\CU18_VisualizarEstudiosController;
use App\Controllers\PKG08_DashboardReportes\CU19_Recordatorios\CU19_RecordatorioController;
use App\Controllers\PKG08_DashboardReportes\CU20_Dashboard\CU20_DashboardController;
use App\Controllers\PKG08_DashboardReportes\CU21_Reportes\CU21_ReportesController;
use App\Controllers\PKG01_Seguridad\CU22_BackupRestore\CU22_BackupRestoreController;
use App\Controllers\PKG08_DashboardReportes\CU24_AsistenteVozIA\CU24_AsistenteVozController;

/*
|--------------------------------------------------------------------------
| API Routes - Clínica Vida Salud
|--------------------------------------------------------------------------
*/

// ==========================================
// Health & Diagnóstico Railway
// ==========================================
Route::get('/health-check', function () {
    $info = [
        'status' => 'online',
        'php' => PHP_VERSION,
        'app_env' => config('app.env'),
        'app_key_present' => !empty(config('app.key')),
        'db_connection' => config('database.default'),
        'db_host' => config('database.connections.pgsql.host'),
        'db_port' => config('database.connections.pgsql.port'),
        'db_database' => config('database.connections.pgsql.database'),
        'db_username' => config('database.connections.pgsql.username'),
    ];

    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $info['db_status'] = 'CONNECTED';
        $info['db_usuarios_count'] = \Illuminate\Support\Facades\DB::table('usuarios')->count();
    } catch (\Throwable $e) {
        $info['db_status'] = 'FAILED: ' . $e->getMessage();
    }

    try {
        \Illuminate\Support\Facades\Cache::put('health_test', 1, 10);
        $info['cache_status'] = \Illuminate\Support\Facades\Cache::get('health_test') == 1 ? 'OK' : 'MISMATCH';
    } catch (\Throwable $e) {
        $info['cache_status'] = 'FAILED: ' . $e->getMessage();
    }

    return response()->json($info);
});

// ==========================================
// CU01: Autenticación y Recuperación
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [CU01_AutenticacionController::class, 'iniciarSesion']);
    Route::post('/forgot-password', [CU01_AutenticacionController::class, 'solicitarRecuperacion']);
    Route::post('/verify-otp', [CU01_AutenticacionController::class, 'verificarCodigoOtp']);
    Route::post('/reset-password', [CU01_AutenticacionController::class, 'restablecerContrasena']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [CU01_AutenticacionController::class, 'cerrarSesion']);
        Route::get('/me', [CU01_AutenticacionController::class, 'obtenerUsuarioActual']);
    });
});

// ==========================================
// CU02: Bitácora de Auditoría (Hora Bolivia)
// ==========================================
Route::prefix('audit')->group(function () {
    Route::get('/logs', [CU02_BitacoraAuditoriaController::class, 'listarAuditoria']);
    Route::get('/stats', [CU02_BitacoraAuditoriaController::class, 'estadisticasAuditoria']);
    Route::get('/logs/{id}', [CU02_BitacoraAuditoriaController::class, 'obtenerDetalleAuditoria']);
});

// ==========================================
// CU03: Gestión de Usuarios Internos, Roles y Permisos
// ==========================================
Route::prefix('usuarios')->group(function () {
    Route::get('/', [CU03_GestionUsuariosController::class, 'listarUsuarios']);
    Route::post('/', [CU03_GestionUsuariosController::class, 'crearUsuario']);
    Route::get('/meta/roles', [CU03_GestionUsuariosController::class, 'obtenerRoles']);
    Route::get('/meta/permisos', [CU03_GestionUsuariosController::class, 'obtenerPermisos']);
    Route::post('/meta/roles/{idRol}/permisos', [CU03_GestionUsuariosController::class, 'asignarPermisosRol']);
    Route::get('/{id}', [CU03_GestionUsuariosController::class, 'obtenerUsuario']);
    Route::put('/{id}', [CU03_GestionUsuariosController::class, 'actualizarUsuario']);
    Route::patch('/{id}/estado', [CU03_GestionUsuariosController::class, 'cambiarEstado']);
    Route::delete('/{id}', [CU03_GestionUsuariosController::class, 'eliminarUsuario']);
});

// ==========================================
// CU04: Gestión de Especialidades Médicas
// ==========================================
Route::prefix('especialidades')->group(function () {
    Route::get('/', [CU04_EspecialidadController::class, 'index']);
    Route::post('/', [CU04_EspecialidadController::class, 'store']);
    Route::get('/{id}', [CU04_EspecialidadController::class, 'show']);
    Route::put('/{id}', [CU04_EspecialidadController::class, 'update']);
    Route::patch('/{id}/estado', [CU04_EspecialidadController::class, 'cambiarEstado']);
    Route::delete('/{id}', [CU04_EspecialidadController::class, 'destroy']);
});

// ==========================================
// CU05: Gestión de Médicos y Asignación de Especialidades
// ==========================================
Route::prefix('medicos')->group(function () {
    Route::get('/', [CU05_MedicoController::class, 'index']);
    Route::get('/meta', [CU05_MedicoController::class, 'meta']);
    Route::post('/', [CU05_MedicoController::class, 'store']);
    Route::get('/{id}', [CU05_MedicoController::class, 'show']);
    Route::put('/{id}', [CU05_MedicoController::class, 'update']);
    Route::patch('/{id}/estado', [CU05_MedicoController::class, 'cambiarEstado']);
    Route::delete('/{id}', [CU05_MedicoController::class, 'destroy']);
});

// ==========================================
// CU06: Registro de Paciente y Apertura en Primera Visita
// ==========================================
Route::prefix('pacientes')->group(function () {
    Route::get('/', [CU06_PacienteController::class, 'index']);
    Route::post('/', [CU06_PacienteController::class, 'store']);
    Route::get('/{id}', [CU06_PacienteController::class, 'show']);
    Route::put('/{id}', [CU06_PacienteController::class, 'update']);
    Route::patch('/{id}/estado', [CU06_PacienteController::class, 'cambiarEstado']);
    Route::delete('/{id}', [CU06_PacienteController::class, 'destroy']);
});

// ==========================================
// CU07: Configuración de Agenda y Horarios Médicos (15 min)
// ==========================================
Route::prefix('turnos')->group(function () {
    Route::get('/', [CU07_TurnoMedicoController::class, 'index']);
    Route::get('/meta', [CU07_TurnoMedicoController::class, 'meta']);
    Route::get('/medico/{idMedico}/semanal', [CU07_TurnoMedicoController::class, 'agendaSemanalMedico']);
    Route::post('/', [CU07_TurnoMedicoController::class, 'store']);
    Route::get('/{id}', [CU07_TurnoMedicoController::class, 'show']);
    Route::put('/{id}', [CU07_TurnoMedicoController::class, 'update']);
    Route::patch('/{id}/estado', [CU07_TurnoMedicoController::class, 'cambiarEstado']);
    Route::delete('/{id}', [CU07_TurnoMedicoController::class, 'destroy']);
});

// ==========================================
// CU08: Registrar bloqueos de agenda médica
// ==========================================
Route::prefix('bloqueos')->group(function () {
    Route::get('/', [CU08_BloqueoAgendaController::class, 'index']);
    Route::get('/meta', [CU08_BloqueoAgendaController::class, 'meta']);
    Route::post('/', [CU08_BloqueoAgendaController::class, 'store']);
    Route::delete('/{id}', [CU08_BloqueoAgendaController::class, 'destroy']);
});

// ==========================================
// CU09: Consultar disponibilidad de horarios médicos
// ==========================================
Route::prefix('disponibilidad')->group(function () {
    Route::get('/meta', [CU09_DisponibilidadController::class, 'meta']);
    Route::get('/', [CU09_DisponibilidadController::class, 'consultar']);
    // Compatibilidad
    Route::get('/bloqueos', [CU08_BloqueoAgendaController::class, 'index']);
    Route::post('/bloqueos', [CU08_BloqueoAgendaController::class, 'store']);
    Route::delete('/bloqueos/{id}', [CU08_BloqueoAgendaController::class, 'destroy']);
});

// ==========================================
// CU10: Reservar cita médica con control de concurrencia
// ==========================================
Route::prefix('citas')->group(function () {
    Route::get('/', [CU10_ReservaCitaController::class, 'index']);
    Route::get('/meta', [CU10_ReservaCitaController::class, 'meta']);
    Route::post('/', [CU10_ReservaCitaController::class, 'store']);
    Route::get('/{id}', [CU10_ReservaCitaController::class, 'show']);

    // CU11: Reprogramar cita médica
    Route::post('/{id}/reprogramar', [CU11_ReprogramacionController::class, 'reprogramarCita']);
    Route::get('/{id}/historial', [CU11_ReprogramacionController::class, 'historial']);

    // CU12: Cancelar cita médica
    Route::patch('/{id}/cancelar', [CU12_CancelacionController::class, 'cancelarCita']);
    Route::get('/{id}/cancelacion', [CU12_CancelacionController::class, 'detalleCancelacion']);

    // CU13: Registrar asistencia e inasistencia
    Route::patch('/{id}/estado', [CU10_ReservaCitaController::class, 'cambiarEstado']);
    Route::patch('/{id}/asistencia', [CU13_AsistenciaController::class, 'registrarAsistencia']);
});

// ==========================================
// CU13: Bandeja de Control de Asistencia en Sala de Espera
// ==========================================
Route::prefix('asistencia')->group(function () {
    Route::get('/', [CU13_AsistenciaController::class, 'index']);
    Route::patch('/{id}', [CU13_AsistenciaController::class, 'registrarAsistencia']);
});

// ==========================================
// CU23: Gestionar Pagos y Cobranza de Citas Médicas
// ==========================================
Route::prefix('pagos')->group(function () {
    Route::get('/', [CU23_GestionarPagosController::class, 'index']);
    Route::get('/pendientes', [CU23_GestionarPagosController::class, 'pendientes']);
    Route::get('/resumen-caja', [CU23_GestionarPagosController::class, 'resumenCaja']);
    Route::get('/cita/{idCita}', [CU23_GestionarPagosController::class, 'estadoPagoCita']);
    Route::post('/', [CU23_GestionarPagosController::class, 'registrarPago']);
    Route::post('/verificar-qr', [CU23_GestionarPagosController::class, 'verificarQR']);
    Route::post('/simular-qr', [CU23_GestionarPagosController::class, 'verificarQR']);
    Route::post('/verificar-paypal', [CU23_GestionarPagosController::class, 'checkoutPayPal']);
    Route::post('/simular-paypal', [CU23_GestionarPagosController::class, 'checkoutPayPal']);
    Route::get('/comprobante/{idPago}', [CU23_GestionarPagosController::class, 'obtenerComprobante']);
});

// ==========================================
// CU14: Registrar y actualizar antecedentes clínicos base
// ==========================================
Route::prefix('antecedentes-clinicos')->group(function () {
    Route::get('/', [CU14_AntecedentesClinicosController::class, 'index']);
    Route::get('/paciente/{idPaciente}', [CU14_AntecedentesClinicosController::class, 'show']);
    Route::put('/paciente/{idPaciente}', [CU14_AntecedentesClinicosController::class, 'update']);
});

// ==========================================
// CU15: Visualizar Agenda Médica Diaria (Privacidad Estricta)
// ==========================================
Route::prefix('agenda-medica')->group(function () {
    Route::get('/', [CU15_AgendaMedicoController::class, 'agendaDiaria']);
    Route::get('/expediente/{idCita}', [CU15_AgendaMedicoController::class, 'expedientePaciente']);
});

// ==========================================
// CU16: Atender Consulta y Registrar Evolución Clínica
// ==========================================
Route::prefix('atencion-medica')->group(function () {
    Route::get('/cita/{idCita}', [CU16_AtencionMedicaController::class, 'iniciarConsulta']);
    Route::post('/cita/{idCita}', [CU16_AtencionMedicaController::class, 'guardarAtencion']);
});

// ==========================================
// CU17: Cargar Estudios y Resultados de Laboratorio
// ==========================================
Route::prefix('laboratorios/carga')->group(function () {
    Route::get('/', [CU17_CargaEstudioController::class, 'index']);
    Route::get('/buscar-paciente/{identificador}', [CU17_CargaEstudioController::class, 'buscarPaciente']);
    Route::post('/', [CU17_CargaEstudioController::class, 'store']);
    Route::post('/{id}/resultado', [CU17_CargaEstudioController::class, 'guardarResultado']);
});

// ==========================================
// CU18: Visualizar y Descargar Resultados de Laboratorio
// ==========================================
Route::prefix('laboratorios/visor')->group(function () {
    Route::get('/', [CU18_VisualizarEstudiosController::class, 'index']);
    Route::get('/{id}', [CU18_VisualizarEstudiosController::class, 'show']);
});

// ==========================================
// CU19: Gestionar Recordatorios y Notificaciones
// ==========================================
Route::prefix('recordatorios')->group(function () {
    Route::get('/', [CU19_RecordatorioController::class, 'index']);
    Route::post('/escanear-24h', [CU19_RecordatorioController::class, 'escanearProximas24Horas']);
    Route::post('/{id}/reenviar', [CU19_RecordatorioController::class, 'reenviar']);
    Route::post('/', [CU19_RecordatorioController::class, 'store']);
});

// ==========================================
// CU20: Dashboard Operativo y Administrativo
// ==========================================
Route::prefix('dashboard')->group(function () {
    Route::get('/metricas', [CU20_DashboardController::class, 'metricas']);
});

// ==========================================
// CU21: Generar Reportes Clínicos y Estadísticos
// ==========================================
Route::prefix('reportes')->group(function () {
    Route::get('/meta', [CU21_ReportesController::class, 'meta']);
    Route::get('/productividad-medica', [CU21_ReportesController::class, 'productividadMedica']);
    Route::get('/morbilidad-cie10', [CU21_ReportesController::class, 'morbilidadCie10']);
    Route::get('/laboratorios-estudios', [CU21_ReportesController::class, 'laboratoriosEstudios']);
    Route::get('/cancelaciones-inasistencias', [CU21_ReportesController::class, 'cancelacionesInasistencias']);
    Route::post('/auditar-exportacion', [CU21_ReportesController::class, 'auditarExportacion']);
});

// ==========================================
// CU22: Copias de Seguridad y Restauración (Backup / Restore)
// ==========================================
Route::prefix('backups')->group(function () {
    Route::get('/', [CU22_BackupRestoreController::class, 'index']);
    Route::get('/estado-sistema', [CU22_BackupRestoreController::class, 'estadoSistema']);
    Route::get('/configuracion', [CU22_BackupRestoreController::class, 'configuracion']);
    Route::put('/configuracion', [CU22_BackupRestoreController::class, 'actualizarConfiguracion']);
    Route::post('/ejecutar-programado', [CU22_BackupRestoreController::class, 'ejecutarProgramado']);
    Route::post('/generar', [CU22_BackupRestoreController::class, 'generar']);
    Route::get('/{id}/descargar', [CU22_BackupRestoreController::class, 'descargar']);
    Route::post('/{id}/restaurar', [CU22_BackupRestoreController::class, 'restaurar']);
    Route::delete('/{id}', [CU22_BackupRestoreController::class, 'destroy']);
});

// ==========================================
// CU24: Asistente IA por Voz para Reserva Rápida de Citas (Google Gemini API)
// ==========================================
Route::prefix('ia-asistente')->group(function () {
    Route::post('/interpretar-voz', [CU24_AsistenteVozController::class, 'interpretarVoz']);
    Route::post('/confirmar-reserva', [CU24_AsistenteVozController::class, 'confirmarReserva']);
    Route::get('/ejemplos', [CU24_AsistenteVozController::class, 'ejemplos']);
    Route::get('/estado-motor', [CU24_AsistenteVozController::class, 'estadoMotor']);
    Route::post('/configuracion-gemini', [CU24_AsistenteVozController::class, 'guardarConfiguracion']);
    Route::get('/historial', [CU24_AsistenteVozController::class, 'historial']);
});









