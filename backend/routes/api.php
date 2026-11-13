<?php

use Illuminate\Support\Facades\Route;
use App\Controllers\PKG01_Seguridad\CU01_Autenticacion\CU01_AutenticacionController;
use App\Controllers\PKG01_Seguridad\CU02_BitacoraAuditoria\CU02_BitacoraAuditoriaController;
use App\Controllers\PKG01_Seguridad\CU03_GestionUsuarios\CU03_GestionUsuariosController;
use App\Controllers\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\CU04_EspecialidadController;
use App\Controllers\PKG02_MedicosEspecialidades\CU05_GestionMedicos\CU05_MedicoController;
use App\Controllers\PKG03_PacientesHistorial\CU06_RegistroPaciente\CU06_PacienteController;
use App\Controllers\PKG03_PacientesHistorial\PacientePortalController;
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
// Health Check Básico y Seguro
// ==========================================
Route::get('/health-check', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('Health check DB error: ' . $e->getMessage());
        $dbOk = false;
    }

    return response()->json([
        'status'    => $dbOk ? 'online' : 'degraded',
        'timestamp' => now()->toIso8601String(),
    ], $dbOk ? 200 : 503);
});

// ==========================================
// Autenticación Pública
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [CU01_AutenticacionController::class, 'iniciarSesion']);
    Route::post('/forgot-password', [CU01_AutenticacionController::class, 'solicitarRecuperacion']);
    Route::post('/verify-otp', [CU01_AutenticacionController::class, 'verificarCodigoOtp']);
    Route::post('/reset-password', [CU01_AutenticacionController::class, 'restablecerContrasena']);
});

// ==========================================
// Rutas Privadas Protegidas con Sanctum y Roles
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [CU01_AutenticacionController::class, 'cerrarSesion']);
        Route::get('/me', [CU01_AutenticacionController::class, 'obtenerUsuarioActual']);
    });

    // Portal Autoservicio del Paciente
    Route::prefix('paciente')->group(function () {
        Route::get('/me', [PacientePortalController::class, 'obtenerMiPerfil']);
        Route::put('/me', [PacientePortalController::class, 'actualizarMiPerfil']);
        Route::get('/me/citas', [PacientePortalController::class, 'misCitas']);
        Route::get('/me/historial', [PacientePortalController::class, 'miHistorial']);
    });

    // CU02: Bitácora de Auditoría
    Route::prefix('audit')->middleware('role:ADMINISTRADOR')->group(function () {
        Route::get('/logs', [CU02_BitacoraAuditoriaController::class, 'listarAuditoria']);
        Route::get('/stats', [CU02_BitacoraAuditoriaController::class, 'estadisticasAuditoria']);
        Route::get('/logs/{id}', [CU02_BitacoraAuditoriaController::class, 'obtenerDetalleAuditoria']);
    });

    // CU03: Gestión de Usuarios
    Route::prefix('usuarios')->middleware('role:ADMINISTRADOR')->group(function () {
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

    // CU22: Backups
    Route::prefix('backups')->middleware('role:ADMINISTRADOR')->group(function () {
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

    // CU04: Especialidades
    Route::prefix('especialidades')->group(function () {
        Route::get('/', [CU04_EspecialidadController::class, 'index']);
        Route::get('/{id}', [CU04_EspecialidadController::class, 'show']);
        Route::middleware('role:ADMINISTRADOR')->group(function () {
            Route::post('/', [CU04_EspecialidadController::class, 'store']);
            Route::put('/{id}', [CU04_EspecialidadController::class, 'update']);
            Route::patch('/{id}/estado', [CU04_EspecialidadController::class, 'cambiarEstado']);
            Route::delete('/{id}', [CU04_EspecialidadController::class, 'destroy']);
        });
    });

    // CU05: Médicos
    Route::prefix('medicos')->group(function () {
        Route::get('/', [CU05_MedicoController::class, 'index']);
        Route::get('/meta', [CU05_MedicoController::class, 'meta']);
        Route::get('/{id}', [CU05_MedicoController::class, 'show']);
        Route::middleware('role:ADMINISTRADOR')->group(function () {
            Route::post('/', [CU05_MedicoController::class, 'store']);
            Route::put('/{id}', [CU05_MedicoController::class, 'update']);
            Route::patch('/{id}/estado', [CU05_MedicoController::class, 'cambiarEstado']);
            Route::delete('/{id}', [CU05_MedicoController::class, 'destroy']);
        });
    });

    // CU06: Pacientes
    Route::prefix('pacientes')->group(function () {
        Route::get('/', [CU06_PacienteController::class, 'index'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::get('/{id}', [CU06_PacienteController::class, 'show'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
            Route::post('/', [CU06_PacienteController::class, 'store']);
            Route::put('/{id}', [CU06_PacienteController::class, 'update']);
            Route::patch('/{id}/estado', [CU06_PacienteController::class, 'cambiarEstado']);
            Route::delete('/{id}', [CU06_PacienteController::class, 'destroy']);
        });
    });

    // CU07: Turnos
    Route::prefix('turnos')->group(function () {
        Route::get('/', [CU07_TurnoMedicoController::class, 'index'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::get('/meta', [CU07_TurnoMedicoController::class, 'meta'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::get('/medico/{idMedico}/semanal', [CU07_TurnoMedicoController::class, 'agendaSemanalMedico'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::get('/{id}', [CU07_TurnoMedicoController::class, 'show'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::middleware('role:ADMINISTRADOR,MEDICO')->group(function () {
            Route::post('/', [CU07_TurnoMedicoController::class, 'store']);
            Route::put('/{id}', [CU07_TurnoMedicoController::class, 'update']);
            Route::patch('/{id}/estado', [CU07_TurnoMedicoController::class, 'cambiarEstado']);
            Route::delete('/{id}', [CU07_TurnoMedicoController::class, 'destroy']);
        });
    });

    // CU08: Bloqueos
    Route::prefix('bloqueos')->middleware('role:ADMINISTRADOR,MEDICO,RECEPCIONISTA')->group(function () {
        Route::get('/', [CU08_BloqueoAgendaController::class, 'index']);
        Route::get('/meta', [CU08_BloqueoAgendaController::class, 'meta']);
        Route::post('/', [CU08_BloqueoAgendaController::class, 'store']);
        Route::delete('/{id}', [CU08_BloqueoAgendaController::class, 'destroy']);
    });

    // CU09: Disponibilidad
    Route::prefix('disponibilidad')->group(function () {
        Route::get('/meta', [CU09_DisponibilidadController::class, 'meta']);
        Route::get('/', [CU09_DisponibilidadController::class, 'consultar']);
        Route::get('/bloqueos', [CU08_BloqueoAgendaController::class, 'index']);
        Route::post('/bloqueos', [CU08_BloqueoAgendaController::class, 'store'])->middleware('role:ADMINISTRADOR,MEDICO');
        Route::delete('/bloqueos/{id}', [CU08_BloqueoAgendaController::class, 'destroy'])->middleware('role:ADMINISTRADOR,MEDICO');
    });

    // CU10, CU11, CU12: Citas
    Route::prefix('citas')->group(function () {
        Route::get('/', [CU10_ReservaCitaController::class, 'index']);
        Route::get('/meta', [CU10_ReservaCitaController::class, 'meta']);
        Route::get('/{id}', [CU10_ReservaCitaController::class, 'show']);
        Route::get('/{id}/historial', [CU11_ReprogramacionController::class, 'historial']);
        Route::get('/{id}/cancelacion', [CU12_CancelacionController::class, 'detalleCancelacion']);

        Route::middleware('role:ADMINISTRADOR,RECEPCIONISTA,PACIENTE')->group(function () {
            Route::post('/', [CU10_ReservaCitaController::class, 'store']);
            Route::post('/{id}/reprogramar', [CU11_ReprogramacionController::class, 'reprogramarCita']);
            Route::patch('/{id}/cancelar', [CU12_CancelacionController::class, 'cancelarCita']);
        });

        Route::middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
            Route::patch('/{id}/estado', [CU10_ReservaCitaController::class, 'cambiarEstado']);
            Route::patch('/{id}/asistencia', [CU13_AsistenciaController::class, 'registrarAsistencia']);
        });
    });

    // CU13: Asistencia
    Route::prefix('asistencia')->middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
        Route::get('/', [CU13_AsistenciaController::class, 'index']);
        Route::patch('/{id}', [CU13_AsistenciaController::class, 'registrarAsistencia']);
    });

    // CU23: Pagos
    Route::prefix('pagos')->group(function () {
        Route::get('/cita/{idCita}', [CU23_GestionarPagosController::class, 'estadoPagoCita']);
        Route::get('/comprobante/{idPago}', [CU23_GestionarPagosController::class, 'obtenerComprobante']);
        Route::post('/', [CU23_GestionarPagosController::class, 'registrarPago'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,PACIENTE');
        Route::post('/verificar-qr', [CU23_GestionarPagosController::class, 'verificarQR']);
        Route::post('/simular-qr', [CU23_GestionarPagosController::class, 'verificarQR']);
        Route::post('/verificar-paypal', [CU23_GestionarPagosController::class, 'checkoutPayPal']);
        Route::post('/simular-paypal', [CU23_GestionarPagosController::class, 'checkoutPayPal']);

        Route::middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
            Route::get('/', [CU23_GestionarPagosController::class, 'index']);
            Route::get('/pendientes', [CU23_GestionarPagosController::class, 'pendientes']);
            Route::get('/resumen-caja', [CU23_GestionarPagosController::class, 'resumenCaja']);
        });
    });

    // CU14: Antecedentes Clínicos
    Route::prefix('antecedentes-clinicos')->group(function () {
        Route::get('/', [CU14_AntecedentesClinicosController::class, 'index'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::get('/paciente/{idPaciente}', [CU14_AntecedentesClinicosController::class, 'show'])->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO');
        Route::put('/paciente/{idPaciente}', [CU14_AntecedentesClinicosController::class, 'update'])->middleware('role:ADMINISTRADOR,MEDICO');
    });

    // CU15: Agenda Médica
    Route::prefix('agenda-medica')->middleware('role:ADMINISTRADOR,MEDICO')->group(function () {
        Route::get('/', [CU15_AgendaMedicoController::class, 'agendaDiaria']);
        Route::get('/expediente/{idCita}', [CU15_AgendaMedicoController::class, 'expedientePaciente']);
    });

    // CU16: Atención Médica
    Route::prefix('atencion-medica')->middleware('role:ADMINISTRADOR,MEDICO')->group(function () {
        Route::get('/cita/{idCita}', [CU16_AtencionMedicaController::class, 'iniciarConsulta']);
        Route::post('/cita/{idCita}', [CU16_AtencionMedicaController::class, 'guardarAtencion']);
    });

    // CU17 & CU18: Laboratorios
    Route::prefix('laboratorios/carga')->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO')->group(function () {
        Route::get('/', [CU17_CargaEstudioController::class, 'index']);
        Route::get('/buscar-paciente/{identificador}', [CU17_CargaEstudioController::class, 'buscarPaciente']);
        Route::post('/', [CU17_CargaEstudioController::class, 'store']);
        Route::post('/{id}/resultado', [CU17_CargaEstudioController::class, 'guardarResultado']);
    });

    Route::prefix('laboratorios/visor')->group(function () {
        Route::get('/', [CU18_VisualizarEstudiosController::class, 'index']);
        Route::get('/{id}', [CU18_VisualizarEstudiosController::class, 'show']);
    });

    // CU19: Recordatorios
    Route::prefix('recordatorios')->middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
        Route::get('/', [CU19_RecordatorioController::class, 'index']);
        Route::post('/escanear-24h', [CU19_RecordatorioController::class, 'escanearProximas24Horas']);
        Route::post('/{id}/reenviar', [CU19_RecordatorioController::class, 'reenviar']);
        Route::post('/', [CU19_RecordatorioController::class, 'store']);
    });

    // CU20: Dashboard
    Route::prefix('dashboard')->middleware('role:ADMINISTRADOR,RECEPCIONISTA,MEDICO')->group(function () {
        Route::get('/metricas', [CU20_DashboardController::class, 'metricas']);
    });

    // CU21: Reportes
    Route::prefix('reportes')->middleware('role:ADMINISTRADOR,RECEPCIONISTA')->group(function () {
        Route::get('/meta', [CU21_ReportesController::class, 'meta']);
        Route::get('/productividad-medica', [CU21_ReportesController::class, 'productividadMedica']);
        Route::get('/morbilidad-cie10', [CU21_ReportesController::class, 'morbilidadCie10']);
        Route::get('/laboratorios-estudios', [CU21_ReportesController::class, 'laboratoriosEstudios']);
        Route::get('/cancelaciones-inasistencias', [CU21_ReportesController::class, 'cancelacionesInasistencias']);
        Route::post('/auditar-exportacion', [CU21_ReportesController::class, 'auditarExportacion']);
    });

    // CU24: Asistente IA
    Route::prefix('ia-asistente')->group(function () {
        Route::middleware('role:ADMINISTRADOR,RECEPCIONISTA,PACIENTE')->group(function () {
            Route::post('/interpretar-voz', [CU24_AsistenteVozController::class, 'interpretarVoz']);
            Route::post('/confirmar-reserva', [CU24_AsistenteVozController::class, 'confirmarReserva']);
            Route::get('/ejemplos', [CU24_AsistenteVozController::class, 'ejemplos']);
            Route::get('/estado-motor', [CU24_AsistenteVozController::class, 'estadoMotor']);
            Route::get('/historial', [CU24_AsistenteVozController::class, 'historial']);
        });
        Route::post('/configuracion-gemini', [CU24_AsistenteVozController::class, 'guardarConfiguracion'])->middleware('role:ADMINISTRADOR');
    });

});
