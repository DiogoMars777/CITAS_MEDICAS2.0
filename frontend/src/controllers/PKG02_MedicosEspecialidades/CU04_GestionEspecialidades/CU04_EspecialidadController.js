import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.especialidades;

/**
 * Controller Hook para CU04 - Gestión de Especialidades Médicas
 */
export const useCU04EspecialidadController = () => {
  // Lista y Paginación
  const [especialidades, setEspecialidades] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });

  // Métricas
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    inactivas: 0,
    medicos_vinculados: 0,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Estados de carga y alertas
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [especialidadToEdit, setEspecialidadToEdit] = useState(null);

  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [especialidadForStatus, setEspecialidadForStatus] = useState(null);
  const [nextStatusTarget, setNextStatusTarget] = useState('ACTIVO');

  /**
   * 1. Cargar Especialidades con filtros y conteos
   */
  const fetchEspecialidades = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '10');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterEstado) params.append('estado', filterEstado);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setEspecialidades(data.data.data || []);
      setPagination({
        currentPage: data.data.current_page || 1,
        lastPage: data.data.last_page || 1,
        perPage: data.data.per_page || 10,
        total: data.data.total || 0,
      });

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching especialidades:', err);
      setError('No se pudo cargar la lista de especialidades médicas.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterEstado]);

  useEffect(() => {
    fetchEspecialidades(1);
  }, [fetchEspecialidades]);

  /**
   * 2. Crear o Editar Especialidad
   */
  const handleSaveEspecialidad = async (formData, id = null) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    const isEdit = Boolean(id);
    const url = isEdit ? `${API_BASE}/${id}` : API_BASE;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || 'Error al guardar la especialidad.';
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) msg = firstErr[0];
        }
        return { success: false, message: msg };
      }

      setSuccessMsg(data.message || (isEdit ? 'Especialidad actualizada.' : 'Especialidad registrada.'));
      setModalFormOpen(false);
      setEspecialidadToEdit(null);
      await fetchEspecialidades(pagination.currentPage);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Error de comunicación con el servidor.' };
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 3. Cambiar Estado (ACTIVO / INACTIVO)
   */
  const handleConfirmChangeStatus = async (esp, nextStatus) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${esp.id_especialidad}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo cambiar el estado.');

      setSuccessMsg(data.message);
      setModalStatusOpen(false);
      setEspecialidadForStatus(null);
      await fetchEspecialidades(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Modales
   */
  const openCreateModal = () => {
    setEspecialidadToEdit(null);
    setModalFormOpen(true);
  };

  const openEditModal = (esp) => {
    setEspecialidadToEdit(esp);
    setModalFormOpen(true);
  };

  const openStatusModal = (esp, nextStatus) => {
    setEspecialidadForStatus(esp);
    setNextStatusTarget(nextStatus);
    setModalStatusOpen(true);
  };

  const closeModals = () => {
    setModalFormOpen(false);
    setEspecialidadToEdit(null);
    setModalStatusOpen(false);
    setEspecialidadForStatus(null);
  };

  return {
    especialidades,
    pagination,
    stats,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    especialidadToEdit,
    modalStatusOpen,
    especialidadForStatus,
    nextStatusTarget,
    fetchEspecialidades,
    handleSaveEspecialidad,
    handleConfirmChangeStatus,
    openCreateModal,
    openEditModal,
    openStatusModal,
    closeModals,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
  };
};

export default useCU04EspecialidadController;
