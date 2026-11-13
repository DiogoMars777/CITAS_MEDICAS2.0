import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_ENDPOINTS.audit;

/**
 * Controller Hook para CU02 - Consultar Bitácora de Auditoría
 * Soporta filtros en tiempo real, paginación, métricas e inspección JSON.
 */
export const useCU02BitacoraAuditoriaController = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  const [stats, setStats] = useState({
    total_registros: 0,
    total_hoy: 0,
    operaciones_criticas: 0,
    total_accesos: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filtros de búsqueda
  const [filters, setFilters] = useState({
    search: '',
    modulo: 'TODOS',
    operacion: 'TODOS',
    fecha_inicio: '',
    fecha_fin: '',
    page: 1,
  });

  // Cargar estadísticas globales
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const data = await res.json();
      if (data.status === 'success' && data.metrics) {
        setStats(data.metrics);
      }
    } catch (err) {
      console.warn('No se pudo cargar estadísticas de auditoría:', err.message);
    }
  }, []);

  // Cargar registros paginados con filtros
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.modulo && filters.modulo !== 'TODOS') queryParams.append('modulo', filters.modulo);
      if (filters.operacion && filters.operacion !== 'TODOS') queryParams.append('operacion', filters.operacion);
      if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
      queryParams.append('page', String(filters.page || 1));
      queryParams.append('per_page', '15');

      const res = await fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error al obtener registros de auditoría.');
      }

      setLogs(result.data.data || []);
      setPagination({
        currentPage: result.data.current_page || 1,
        lastPage: result.data.last_page || 1,
        total: result.data.total || 0,
        perPage: result.data.per_page || 15,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Actualizar filtros
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reiniciar a página 1 al cambiar filtro
    }));
  };

  const setPage = (pageNumber) => {
    setFilters((prev) => ({ ...prev, page: pageNumber }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      modulo: 'TODOS',
      operacion: 'TODOS',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
    });
  };

  return {
    logs,
    pagination,
    stats,
    loading,
    error,
    filters,
    selectedLog,
    setSelectedLog,
    // Funciones en Español
    cargarEstadisticas: loadStats,
    cargarRegistros: loadLogs,
    actualizarFiltro: updateFilter,
    establecerPagina: setPage,
    reiniciarFiltros: resetFilters,
    recargar: () => { loadStats(); loadLogs(); },
    seleccionarRegistro: setSelectedLog,

    // Compatibilidad
    updateFilter,
    setPage,
    resetFilters,
    reload: () => { loadStats(); loadLogs(); },
  };
};

/**
 * Hook para obtener la Hora Oficial Boliviana en vivo (America/La_Paz - UTC-4)
 */
export const useHoraBoliviana = () => {
  const [horaBolivia, setHoraBolivia] = useState(() => getFormatedHoraBolivia());

  useEffect(() => {
    const interval = setInterval(() => {
      setHoraBolivia(getFormatedHoraBolivia());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return horaBolivia;
};

function getFormatedHoraBolivia() {
  const now = new Date();
  const optionsTime = {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const optionsDate = {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  const timeStr = new Intl.DateTimeFormat('es-BO', optionsTime).format(now);
  const dateStr = new Intl.DateTimeFormat('es-BO', optionsDate).format(now);

  return {
    time: timeStr,
    date: dateStr,
    full: `${dateStr} • ${timeStr} BOT (UTC-4)`,
  };
}
