/**
 * Configuración centralizada de API para Clínica Vida Salud
 * Permite cambiar dinámicamente entre entorno Local (http://localhost:8000/api)
 * y Producción en Railway (VITE_API_URL) sin alterar el código de los componentes.
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:8000/api';
  }
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  base: API_BASE_URL,
  auth: `${API_BASE_URL}/auth`,
  audit: `${API_BASE_URL}/audit`,
  usuarios: `${API_BASE_URL}/usuarios`,
  backups: `${API_BASE_URL}/backups`,
  especialidades: `${API_BASE_URL}/especialidades`,
  medicos: `${API_BASE_URL}/medicos`,
  pacientes: `${API_BASE_URL}/pacientes`,
  antecedentes: `${API_BASE_URL}/antecedentes-clinicos`,
  turnos: `${API_BASE_URL}/turnos`,
  bloqueos: `${API_BASE_URL}/bloqueos`,
  disponibilidad: `${API_BASE_URL}/disponibilidad`,
  citas: `${API_BASE_URL}/citas`,
  asistencia: `${API_BASE_URL}/asistencia`,
  pagos: `${API_BASE_URL}/pagos`,
  agendaMedica: `${API_BASE_URL}/agenda-medica`,
  atencionMedica: `${API_BASE_URL}/atencion-medica`,
  laboratoriosCarga: `${API_BASE_URL}/laboratorios/carga`,
  laboratoriosVisor: `${API_BASE_URL}/laboratorios/visor`,
  recordatorios: `${API_BASE_URL}/recordatorios`,
  dashboard: `${API_BASE_URL}/dashboard`,
  reportes: `${API_BASE_URL}/reportes`,
  iaAsistente: `${API_BASE_URL}/ia-asistente`,
};

export default API_ENDPOINTS;

