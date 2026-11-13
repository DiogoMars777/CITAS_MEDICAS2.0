/**
 * Configuración Oficial de Paquetes y Casos de Uso (CU01 - CU24)
 * Alineada 100% con la tabla oficial del Sistema de Citas Médicas
 * Clínica Vida Salud - 2026
 */

export const SISTEMA_INFO = {
  nombre: 'Clínica Vida Salud',
  sigla: 'CVS-2026',
  subtitulo: 'Sistema Integral de Citas Médicas e Historial Clínico',
  version: '2.5.0 (Enterprise)',
  zona_horaria: 'America/La_Paz (UTC-4)',
  pais: 'Bolivia',
  motor_bd: 'PostgreSQL 16',
};

export const PACKAGES_CONFIG = [
  {
    id: 'PKG01',
    codigo: 'PKG01_Seguridad',
    nombre: 'Seguridad, Roles y Auditoría',
    descripcion: 'Control de accesos, autenticación, bitácora y respaldos',
    color: '#0d9488', // Teal
    glow: 'rgba(13, 148, 136, 0.4)',
    casosDeUso: [
      {
        id: 'CU01',
        codigo: 'CU01_Autenticacion',
        numero: 'CU01',
        titulo: 'Iniciar y cerrar sesión',
        actores: 'Todos',
        descripcion: 'Autenticación con password_verify(), control de intentos y cierre de sesión seguro.',
        estado: 'completado',
        tablas: ['usuarios', 'roles', 'password_reset_tokens'],
        controlador: 'CU01_AuthController',
      },
      {
        id: 'CU02',
        codigo: 'CU02_BitacoraAuditoria',
        numero: 'CU02',
        titulo: 'Consultar bitácora de auditoría',
        actores: 'Administrador',
        descripcion: 'Visualización filtrada de trazas de cambios (insert, update, delete, IP, JSON de cambios con Hora Bolivia).',
        estado: 'activo',
        tablas: ['bitacora_auditoria', 'usuarios'],
        controlador: 'CU02_BitacoraAuditoriaController',
      },
      {
        id: 'CU03',
        codigo: 'CU03_GestionUsuarios',
        numero: 'CU03',
        titulo: 'Gestionar usuarios internos, roles y permisos',
        actores: 'Administrador',
        descripcion: 'CRUD de cuentas de personal (admin, recepcionista, médico) y asignación de privilegios.',
        estado: 'activo',
        tablas: ['usuarios', 'roles', 'permisos', 'rol_permisos'],
        controlador: 'CU03_GestionUsuariosController',
      },
      {
        id: 'CU22',
        codigo: 'CU22_BackupRestore',
        numero: 'CU22',
        titulo: 'Gestionar copias de seguridad (Backup / Restore)',
        actores: 'Administrador',
        descripcion: 'Generación automatizada de dumps de base de datos PostgreSQL y logs de restauración.',
        estado: 'completo',
        tablas: ['backup_logs'],
        controlador: 'CU22_BackupRestoreController',
      },
    ],
  },
  {
    id: 'PKG02',
    codigo: 'PKG02_MedicosEspecialidades',
    nombre: 'Médicos y Especialidades',
    descripcion: 'Catálogo de profesionales y especialidades de la clínica',
    color: '#0284c7', // Sky Blue
    glow: 'rgba(2, 132, 199, 0.4)',
    casosDeUso: [
      {
        id: 'CU04',
        codigo: 'CU04_GestionEspecialidades',
        numero: 'CU04',
        titulo: 'Gestionar especialidades médicas',
        actores: 'Administrador',
        descripcion: 'Alta y edición de especialidades (Pediatría, Geriatría, etc.) con validación de nombres únicos.',
        estado: 'activo',
        tablas: ['especialidades'],
        controlador: 'CU04_EspecialidadController',
      },
      {
        id: 'CU05',
        codigo: 'CU05_GestionMedicos',
        numero: 'CU05',
        titulo: 'Gestionar médicos y asignación de especialidades',
        actores: 'Administrador',
        descripcion: 'Registro de médicos, número de registro profesional único y vinculación N:M con especialidades.',
        estado: 'activo',
        tablas: ['medicos', 'especialidades', 'medico_especialidades'],
        controlador: 'CU05_MedicoController',
      },
    ],
  },
  {
    id: 'PKG03',
    codigo: 'PKG03_PacientesHistorial',
    nombre: 'Pacientes e Historial Clínico',
    descripcion: 'Padrón de afiliados y antecedentes médicos primarios',
    color: '#10b981', // Emerald
    glow: 'rgba(16, 185, 129, 0.4)',
    casosDeUso: [
      {
        id: 'CU06',
        codigo: 'CU06_RegistroPaciente',
        numero: 'CU06',
        titulo: 'Registrar paciente y apertura en primera visita',
        actores: 'Recepcionista, Paciente',
        descripcion: 'Apertura obligatoria de cuenta digital en clínica (primera visita) o auto-registro web. Control de CI único.',
        estado: 'activo',
        tablas: ['pacientes', 'contactos_emergencia', 'historias_clinicas'],
        controlador: 'CU06_PacienteController',
      },
      {
        id: 'CU14',
        codigo: 'CU14_AntecedentesClinicos',
        numero: 'CU14',
        titulo: 'Registrar y actualizar antecedentes clínicos base',
        actores: 'Médico, Recepcionista',
        descripcion: 'Registro de grupo sanguíneo, alergias a medicamentos, antecedentes patológicos y factores de riesgo.',
        estado: 'activo',
        tablas: ['historias_clinicas', 'pacientes'],
        controlador: 'CU14_AntecedentesClinicosController',
      },
    ],
  },
  {
    id: 'PKG04',
    codigo: 'PKG04_AgendasHorarios',
    nombre: 'Agendas y Horarios Médicos',
    descripcion: 'Bloques de tiempo de 15 minutos, bloqueos y disponibilidad médica',
    color: '#8b5cf6', // Violet
    glow: 'rgba(139, 92, 246, 0.4)',
    casosDeUso: [
      {
        id: 'CU07',
        codigo: 'CU07_ConfigurarTurnos',
        numero: 'CU07',
        titulo: 'Configurar turnos y fraccionamiento de agenda',
        actores: 'Administrador, Médico',
        descripcion: 'Definición de turnos laborables y fraccionamiento automático en bloques de 15 minutos.',
        estado: 'activo',
        tablas: ['turnos_medicos'],
        controlador: 'CU07_TurnoMedicoController',
      },
      {
        id: 'CU08',
        codigo: 'CU08_BloqueosAgenda',
        numero: 'CU08',
        titulo: 'Registrar bloqueos de agenda médica',
        actores: 'Administrador, Médico',
        descripcion: 'Bloqueo temporal de rangos horarios por permisos, cirugías o capacitaciones.',
        estado: 'activo',
        tablas: ['bloqueos_agenda', 'medicos'],
        controlador: 'CU08_BloqueoAgendaController',
      },
      {
        id: 'CU09',
        codigo: 'CU09_DisponibilidadHorarios',
        numero: 'CU09',
        titulo: 'Consultar disponibilidad de horarios médicos',
        actores: 'Paciente, Recepcionista, Médico',
        descripcion: 'Matriz visual e interactiva de cupos libres en tiempo real por fecha, médico y especialidad.',
        estado: 'activo',
        tablas: ['turnos_medicos', 'citas', 'bloqueos_agenda'],
        controlador: 'CU09_DisponibilidadController',
      },
    ],
  },
  {
    id: 'PKG05',
    codigo: 'PKG05_GestionCitasConcurrencia',
    nombre: 'Gestión de Citas y Concurrencia',
    descripcion: 'Reservas en tiempo real con control de concurrencia, reprogramaciones, cancelaciones y asistencia',
    color: '#f59e0b', // Amber
    glow: 'rgba(245, 158, 11, 0.4)',
    casosDeUso: [
      {
        id: 'CU10',
        codigo: 'CU10_ReservaCitas',
        numero: 'CU10',
        titulo: 'Reservar cita médica con control de concurrencia',
        actores: 'Paciente, Recepcionista',
        descripcion: 'Emisión de ticket/ficha de atención con bloqueo pesimista contra reservas simultáneas.',
        estado: 'activo',
        tablas: ['citas', 'reservas', 'pacientes', 'medicos'],
        controlador: 'CU10_ReservaCitaController',
      },
      {
        id: 'CU11',
        codigo: 'CU11_ReprogramarCita',
        numero: 'CU11',
        titulo: 'Reprogramar cita médica',
        actores: 'Paciente, Recepcionista',
        descripcion: 'Liberación del cupo original y asignación de nueva fecha con bloqueo de concurrencia.',
        estado: 'activo',
        tablas: ['citas', 'historial_reprogramaciones'],
        controlador: 'CU11_ReprogramacionController',
      },
      {
        id: 'CU12',
        codigo: 'CU12_CancelarCita',
        numero: 'CU12',
        titulo: 'Cancelar cita médica',
        actores: 'Paciente, Recepcionista',
        descripcion: 'Cancelación motivada y liberación inmediata del cupo para otros pacientes en la agenda.',
        estado: 'activo',
        tablas: ['citas', 'cancelaciones_citas'],
        controlador: 'CU12_CancelacionController',
      },
      {
        id: 'CU13',
        codigo: 'CU13_ControlAsistencia',
        numero: 'CU13',
        titulo: 'Registrar asistencia e inasistencia',
        actores: 'Recepcionista',
        descripcion: 'Control de llegada en sala de espera, confirmación y registro de inasistencias.',
        estado: 'activo',
        tablas: ['citas'],
        controlador: 'CU13_ControlAsistenciaController',
      },
      {
        id: 'CU23',
        codigo: 'CU23_GestionarPagos',
        numero: 'CU23',
        titulo: 'Gestionar pagos y cobranza de citas',
        actores: 'Recepcionista, Administrador, Paciente',
        descripcion: 'Gestión y registro de pagos de consultas médicas, emisión de comprobantes y métodos de pago (Efectivo, QR, Tarjeta).',
        estado: 'en_progreso',
        tablas: ['pagos', 'citas', 'reservas'],
        controlador: 'CU23_GestionarPagosController',
      },
    ],
  },
  {
    id: 'PKG06',
    codigo: 'PKG06_AtencionMedica',
    nombre: 'Atención Médica y Evolución',
    descripcion: 'Espacio de trabajo del médico, consultas y diagnósticos CIE-10',
    color: '#ec4899', // Pink
    glow: 'rgba(236, 72, 153, 0.4)',
    casosDeUso: [
      {
        id: 'CU15',
        codigo: 'CU15_AgendaDiaria',
        numero: 'CU15',
        titulo: 'Visualizar agenda médica diaria',
        actores: 'Médico',
        descripcion: 'Bandeja del médico en consulta con lista de espera en tiempo real.',
        estado: 'completo',
        tablas: ['citas', 'pacientes'],
        controlador: 'CU15_AgendaDiariaController',
      },
      {
        id: 'CU16',
        codigo: 'CU16_ConsultaEvolucion',
        numero: 'CU16',
        titulo: 'Atender consulta y registrar evolución clínica',
        actores: 'Médico',
        descripcion: 'Anamnesis, exploración física, diagnóstico y recetas médicas.',
        estado: 'completo',
        tablas: ['consultas_medicas', 'recetas', 'diagnosticos'],
        controlador: 'CU16_ConsultaController',
      },
    ],
  },
  {
    id: 'PKG07',
    codigo: 'PKG07_Laboratorios',
    nombre: 'Laboratorios y Estudios Clínicos',
    descripcion: 'Gestión de órdenes, carga de resultados y visor digital',
    color: '#14b8a6', // Teal light
    glow: 'rgba(20, 184, 166, 0.4)',
    casosDeUso: [
      {
        id: 'CU17',
        codigo: 'CU17_CargaLaboratorios',
        numero: 'CU17',
        titulo: 'Cargar estudios y resultados de laboratorio',
        actores: 'Administrador, Recepcionista',
        descripcion: 'Subida de PDFs, analíticas de sangre y radiografías con firma digital.',
        estado: 'completo',
        tablas: ['laboratorios_estudios', 'archivos_adjuntos'],
        controlador: 'CU17_CargaLaboratoriosController',
      },
      {
        id: 'CU18',
        codigo: 'CU18_VisualizadorLaboratorio',
        numero: 'CU18',
        titulo: 'Visualizar y descargar resultados de laboratorio',
        actores: 'Paciente, Médico',
        descripcion: 'Visor seguro integrado con trazabilidad de visualizaciones y descargas.',
        estado: 'completo',
        tablas: ['laboratorios_estudios'],
        controlador: 'CU18_VisualizadorController',
      },
    ],
  },
  {
    id: 'PKG08',
    codigo: 'PKG08_DashboardReportes',
    nombre: 'Dashboard, Reportes e Inteligencia Artificial',
    descripcion: 'Métricas gerenciales, reportes estadísticos y Asistente IA por voz (Google Gemini)',
    color: '#6366f1', // Indigo
    glow: 'rgba(99, 102, 241, 0.4)',
    casosDeUso: [
      {
        id: 'CU19',
        codigo: 'CU19_RecordatoriosNotificaciones',
        numero: 'CU19',
        titulo: 'Gestionar recordatorios y notificaciones',
        actores: 'Sistema, Recepcionista',
        descripcion: 'Envío automatizado de alertas de citas por correo electrónico y SMS.',
        estado: 'completo',
        tablas: ['notificaciones'],
        controlador: 'CU19_RecordatoriosController',
      },
      {
        id: 'CU20',
        codigo: 'CU20_DashboardEjecutivo',
        numero: 'CU20',
        titulo: 'Visualizar Dashboard operativo y administrativo',
        actores: 'Administrador, Médico',
        descripcion: 'Indicadores clave de ocupación, citas atendidas y recaudación en tiempo real.',
        estado: 'completo',
        tablas: ['citas', 'usuarios', 'consultas_medicas'],
        controlador: 'CU20_DashboardController',
      },
      {
        id: 'CU21',
        codigo: 'CU21_ReportesEstadisticos',
        numero: 'CU21',
        titulo: 'Generar y exportar reportes estadísticos',
        actores: 'Administrador, Recepcionista',
        descripcion: 'Informes de productividad por médico, especialidad y períodos auditables.',
        estado: 'completo',
        tablas: ['citas', 'especialidades', 'medicos', 'atenciones_medicas', 'laboratorios_estudios'],
        controlador: 'CU21_ReportesController',
      },
      {
        id: 'CU24',
        codigo: 'CU24_AsistenteVozIA',
        numero: 'CU24',
        titulo: 'Asistente IA por voz para reserva rápida',
        actores: 'Paciente, Recepcionista, Administrador',
        descripcion: 'Asistente médico con reconocimiento y síntesis de voz (Google Gemini API) que interpreta síntomas y horarios para agendar citas en segundos.',
        estado: 'completo',
        tablas: ['citas', 'especialidades', 'medicos', 'turnos_medicos', 'ia_conversaciones'],
        controlador: 'CU24_AsistenteVozController',
      },
    ],
  },
];

/**
 * Normaliza el nombre del rol proveniente de la base de datos o API.
 */
export const normalizeRole = (role) => {
  const r = (role || '').toUpperCase().trim();
  if (r.includes('ADMIN')) return 'ADMINISTRADOR';
  if (r.includes('MEDIC') || r.includes('DOCTOR')) return 'MEDICO';
  if (r.includes('RECEP')) return 'RECEPCIONISTA';
  if (r.includes('PACIENT') || r.includes('CLIENT')) return 'PACIENTE';
  return 'ADMINISTRADOR';
};

/**
 * Matriz de Permisos y Vistas por Rol (Role-Based Access Control)
 */
export const ROLE_PERMISSIONS = {
  ADMINISTRADOR: {
    nombre: 'Administrador General',
    portalTitle: 'Panel de Administración Global',
    defaultCU: 'CU20', // Dashboard Ejecutivo
    allowedCUs: [
      'CU01', 'CU02', 'CU03', 'CU04', 'CU05', 'CU06', 'CU07', 'CU08',
      'CU09', 'CU10', 'CU11', 'CU12', 'CU13', 'CU14', 'CU15', 'CU16',
      'CU17', 'CU18', 'CU19', 'CU20', 'CU21', 'CU22', 'CU23', 'CU24'
    ],
    badgeColor: '#4338ca',
    badgeBg: '#eef2ff',
    badgeBorder: '#c7d2fe',
    descripcion: 'Control integral de la clínica, usuarios, auditoría y configuraciones.',
  },
  MEDICO: {
    nombre: 'Personal Médico',
    portalTitle: 'Portal Médico y Atención Clínica',
    defaultCU: 'CU15', // Agenda Médica Diaria
    allowedCUs: [
      'CU15', // Agenda Médica Diaria (Principal)
      'CU16', // Atender Consulta y Evolución
      'CU07', // Configurar Turnos Propios
      'CU08', // Bloqueos de Agenda
      'CU09', // Consultar Disponibilidad
      'CU06', // Directorio de Pacientes
      'CU14', // Antecedentes Clínicos Base
      'CU18', // Visualizar Resultados de Laboratorio
      'CU20', // Dashboard Operativo Médico
      'CU24', // Asistente IA Médico
      'CU01', // Sesión
    ],
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    badgeBorder: '#a7f3d0',
    descripcion: 'Atención de pacientes, evolución clínica, recetas y agenda del día.',
  },
  RECEPCIONISTA: {
    nombre: 'Recepción y Atención al Paciente',
    portalTitle: 'Módulo de Recepción y Citas',
    defaultCU: 'CU10', // Reservar Citas
    allowedCUs: [
      'CU10', // Reservar Citas (Principal)
      'CU11', // Reprogramar Cita
      'CU12', // Cancelar Cita
      'CU13', // Control de Asistencia (Sala de Espera)
      'CU23', // Gestión de Pagos / Cobranza
      'CU06', // Registro de Paciente (Apertura Ficha)
      'CU14', // Antecedentes Clínicos Base
      'CU09', // Consultar Disponibilidad
      'CU04', // Especialidades Médicas
      'CU05', // Directorio de Médicos
      'CU17', // Carga de Resultados de Laboratorio
      'CU18', // Visualizar Resultados
      'CU19', // Recordatorios y Notificaciones
      'CU21', // Reportes Estadísticos de Citas
      'CU24', // Asistente IA Reserva Rápida
      'CU01', // Sesión
    ],
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe',
    badgeBorder: '#bae6fd',
    descripcion: 'Agendamiento, recepción en sala de espera, cobros y alta de pacientes.',
  },
  PACIENTE: {
    nombre: 'Portal del Paciente',
    portalTitle: 'Portal del Paciente - Salud Digital',
    defaultCU: 'CU10', // Reservar Cita
    allowedCUs: [
      'CU10', // Reservar Cita (Ticket Digital)
      'CU11', // Reprogramar mi Cita
      'CU12', // Cancelar mi Cita
      'CU09', // Consultar Horarios Disponibles
      'CU23', // Mis Pagos y Comprobantes
      'CU14', // Mis Antecedentes y Alergias
      'CU18', // Mis Resultados de Laboratorio
      'CU24', // Asistente IA para Reserva por Voz
      'CU01', // Sesión
    ],
    badgeColor: '#d97706',
    badgeBg: '#fef3c7',
    badgeBorder: '#fde68a',
    descripcion: 'Reserva ágil de citas, consulta de horarios, pagos y descarga de análisis.',
  },
};

