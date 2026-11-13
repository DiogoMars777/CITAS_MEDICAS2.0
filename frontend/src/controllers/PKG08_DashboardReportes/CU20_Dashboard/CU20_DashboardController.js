import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.dashboard;

/**
 * Controller Hook para CU20 - Visualizar Dashboard operativo y administrativo
 */
export const useCU20DashboardController = () => {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [periodo, setPeriodo] = useState('hoy'); // 'hoy' | 'semana' | 'mes'
  const [rolActivo, setRolActivo] = useState('ADMIN'); // 'ADMIN' | 'MEDICO'
  const [idMedico, setIdMedico] = useState(1);

  /**
   * Cargar métricas actualizadas
   */
  const cargarMetricas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/metricas?periodo=${periodo}&rol=${rolActivo}&id_medico=${idMedico}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al obtener métricas del dashboard.');
      }

      setMetricas(data.data);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servicio de estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [periodo, rolActivo, idMedico]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  return {
    metricas,
    loading,
    error,
    periodo,
    setPeriodo,
    rolActivo,
    setRolActivo,
    idMedico,
    setIdMedico,
    recargar: cargarMetricas,
    limpiarError: () => setError(null),
  };
};

export default useCU20DashboardController;
