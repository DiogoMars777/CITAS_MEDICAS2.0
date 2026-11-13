import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.pacientes;

/**
 * Controller Hook para CU06 - Registro de Pacientes y Apertura en Primera Visita
 */
export const useCU06PacienteController = () => {
  // Lista y Paginación
  const [pacientes, setPacientes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });

  // Métricas analíticas
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    primera_visita: 0,
    expedientes_aperturados: 0,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrimeraVisita, setFilterPrimeraVisita] = useState('');
  const [filterSexo, setFilterSexo] = useState('');

  // Estados de carga y alertas
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [pacienteToEdit, setPacienteToEdit] = useState(null);

  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [pacienteForStatus, setPacienteForStatus] = useState(null);
  const [nextStatusTarget, setNextStatusTarget] = useState('ACTIVO');

  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [pacienteDetail, setPacienteDetail] = useState(null);

  /**
   * 1. Cargar Pacientes desde PostgreSQL
   */
  const fetchPacientes = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '10');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterEstado) params.append('estado', filterEstado);
      if (filterPrimeraVisita) params.append('primera_visita', filterPrimeraVisita);
      if (filterSexo) params.append('sexo', filterSexo);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setPacientes(data.data.data || []);
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
      console.error('Error fetching pacientes:', err);
      setError('No se pudo cargar el padrón de pacientes desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterEstado, filterPrimeraVisita, filterSexo]);

  useEffect(() => {
    fetchPacientes(1);
  }, [fetchPacientes]);

  /**
   * 2. Registrar o Actualizar Paciente
   */
  const handleSavePaciente = async (formData, id = null) => {
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
        let msg = data.message || 'Error al guardar los datos del paciente.';
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) msg = firstErr[0];
        }
        return { success: false, message: msg };
      }

      setSuccessMsg(data.message || (isEdit ? 'Ficha de paciente actualizada.' : 'Paciente registrado con éxito.'));
      setModalFormOpen(false);
      setPacienteToEdit(null);
      await fetchPacientes(pagination.currentPage);

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
  const handleConfirmChangeStatus = async (paciente, nextStatus) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${paciente.id_paciente}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el estado.');

      setSuccessMsg(data.message);
      setModalStatusOpen(false);
      setPacienteForStatus(null);
      await fetchPacientes(pagination.currentPage);
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
    setPacienteToEdit(null);
    setModalFormOpen(true);
  };

  const openEditModal = (paciente) => {
    setPacienteToEdit(paciente);
    setModalFormOpen(true);
  };

  const openStatusModal = (paciente, nextStatus) => {
    setPacienteForStatus(paciente);
    setNextStatusTarget(nextStatus);
    setModalStatusOpen(true);
  };

  const openDetailModal = (paciente) => {
    setPacienteDetail(paciente);
    setModalDetailOpen(true);
  };

  const closeModals = () => {
    setModalFormOpen(false);
    setPacienteToEdit(null);
    setModalStatusOpen(false);
    setPacienteForStatus(null);
    setModalDetailOpen(false);
    setPacienteDetail(null);
  };

  return {
    pacientes,
    pagination,
    stats,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterPrimeraVisita,
    setFilterPrimeraVisita,
    filterSexo,
    setFilterSexo,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    pacienteToEdit,
    modalStatusOpen,
    pacienteForStatus,
    nextStatusTarget,
    modalDetailOpen,
    pacienteDetail,
    fetchPacientes,
    handleSavePaciente,
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

export default useCU06PacienteController;
