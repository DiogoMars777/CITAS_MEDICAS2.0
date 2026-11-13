import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.medicos;

/**
 * Controller Hook para CU05 - Gestión de Médicos y Asignación de Especialidades
 */
export const useCU05MedicoController = () => {
  // Datos y Paginación
  const [medicos, setMedicos] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });

  // Métricas
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    con_especialidad: 0,
    total_asignaciones: 0,
  });

  // Metadatos (catálogo de especialidades y usuarios disponibles)
  const [especialidadesMeta, setEspecialidadesMeta] = useState([]);
  const [usuariosDisponiblesMeta, setUsuariosDisponiblesMeta] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [medicoToEdit, setMedicoToEdit] = useState(null);

  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [medicoForStatus, setMedicoForStatus] = useState(null);
  const [nextStatusTarget, setNextStatusTarget] = useState('ACTIVO');

  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [medicoDetail, setMedicoDetail] = useState(null);

  /**
   * 1. Cargar Médicos desde Backend PostgreSQL
   */
  const fetchMedicos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '10');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterEspecialidad) params.append('id_especialidad', filterEspecialidad);
      if (filterEstado) params.append('estado', filterEstado);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setMedicos(data.data.data || []);
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
      console.error('Error fetching médicos:', err);
      setError('No se pudo cargar el catálogo de médicos desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterEspecialidad, filterEstado]);

  /**
   * 2. Cargar Metadatos (especialidades y usuarios de rol médico sin perfil)
   */
  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setEspecialidadesMeta(json.especialidades || []);
      setUsuariosDisponiblesMeta(json.usuarios_disponibles || []);
    } catch (err) {
      console.error('Error fetching meta médicos:', err);
    }
  }, []);

  useEffect(() => {
    fetchMedicos(1);
  }, [fetchMedicos]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  /**
   * 3. Registrar o Editar Médico
   */
  const handleSaveMedico = async (formData, id = null) => {
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
        let msg = data.message || 'Error al guardar los datos del médico.';
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) msg = firstErr[0];
        }
        return { success: false, message: msg };
      }

      setSuccessMsg(data.message || (isEdit ? 'Médico actualizado.' : 'Médico registrado exitosamente.'));
      setModalFormOpen(false);
      setMedicoToEdit(null);
      await fetchMedicos(pagination.currentPage);
      await fetchMeta(); // Actualizar lista de usuarios disponibles

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Error de red con el servidor.' };
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 4. Alternar Estado (ACTIVO / INACTIVO)
   */
  const handleConfirmChangeStatus = async (medico, nextStatus) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${medico.id_medico}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el estado.');

      setSuccessMsg(data.message);
      setModalStatusOpen(false);
      setMedicoForStatus(null);
      await fetchMedicos(pagination.currentPage);
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
    setMedicoToEdit(null);
    setModalFormOpen(true);
    fetchMeta();
  };

  const openEditModal = (medico) => {
    setMedicoToEdit(medico);
    setModalFormOpen(true);
    fetchMeta();
  };

  const openStatusModal = (medico, nextStatus) => {
    setMedicoForStatus(medico);
    setNextStatusTarget(nextStatus);
    setModalStatusOpen(true);
  };

  const openDetailModal = (medico) => {
    setMedicoDetail(medico);
    setModalDetailOpen(true);
  };

  const closeModals = () => {
    setModalFormOpen(false);
    setMedicoToEdit(null);
    setModalStatusOpen(false);
    setMedicoForStatus(null);
    setModalDetailOpen(false);
    setMedicoDetail(null);
  };

  return {
    medicos,
    pagination,
    stats,
    especialidadesMeta,
    usuariosDisponiblesMeta,
    searchTerm,
    setSearchTerm,
    filterEspecialidad,
    setFilterEspecialidad,
    filterEstado,
    setFilterEstado,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    medicoToEdit,
    modalStatusOpen,
    medicoForStatus,
    nextStatusTarget,
    modalDetailOpen,
    medicoDetail,
    fetchMedicos,
    fetchMeta,
    handleSaveMedico,
    handleConfirmChangeStatus,
    openCreateModal,
    openEditModal,
    openStatusModal,
    openDetailModal,
    closeModals,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
  };
};

export default useCU05MedicoController;
