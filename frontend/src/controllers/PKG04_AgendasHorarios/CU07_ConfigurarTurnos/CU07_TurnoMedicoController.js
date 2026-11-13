import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.turnos;

/**
 * Controller Hook para CU07 - Configuración de Agenda y Horarios Médicos (15 min)
 */
export const useCU07TurnoMedicoController = () => {
  // Lista de turnos y paginación
  const [turnos, setTurnos] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });

  // Métricas analíticas
  const [stats, setStats] = useState({
    total_turnos: 0,
    turnos_activos: 0,
    turnos_inactivos: 0,
    medicos_con_agenda: 0,
    cupos_semanales_totales: 0,
  });

  // Metadatos (médicos activos, días de la semana, duraciones)
  const [medicosMeta, setMedicosMeta] = useState([]);
  const [diasSemanaMeta, setDiasSemanaMeta] = useState([]);
  const [duracionesMeta, setDuracionesMeta] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterDia, setFilterDia] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [turnoToEdit, setTurnoToEdit] = useState(null);

  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [turnoForStatus, setTurnoForStatus] = useState(null);
  const [nextStatusTarget, setNextStatusTarget] = useState('ACTIVO');

  const [modalSlotsOpen, setModalSlotsOpen] = useState(false);
  const [turnoForSlots, setTurnoForSlots] = useState(null);

  const [modalSemanalOpen, setModalSemanalOpen] = useState(false);
  const [agendaSemanalData, setAgendaSemanalData] = useState(null);
  const [loadingSemanal, setLoadingSemanal] = useState(false);

  /**
   * 1. Cargar Turnos desde PostgreSQL
   */
  const fetchTurnos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '15');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterMedico) params.append('id_medico', filterMedico);
      if (filterDia) params.append('dia_semana', filterDia);
      if (filterEstado) params.append('estado', filterEstado);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setTurnos(data.data.data || []);
      setPagination({
        currentPage: data.data.current_page || 1,
        lastPage: data.data.last_page || 1,
        perPage: data.data.per_page || 15,
        total: data.data.total || 0,
      });

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching turnos:', err);
      setError('No se pudo cargar la configuración de turnos desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterMedico, filterDia, filterEstado]);

  /**
   * 2. Cargar Metadatos de Médicos y Días
   */
  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setMedicosMeta(json.medicos || []);
      setDiasSemanaMeta(json.dias_semana || []);
      setDuracionesMeta(json.duraciones || []);
    } catch (err) {
      console.error('Error fetching meta turnos:', err);
    }
  }, []);

  useEffect(() => {
    fetchTurnos(1);
  }, [fetchTurnos]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  /**
   * 3. Registrar o Editar Turno(s)
   */
  const handleSaveTurno = async (formData, id = null) => {
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
        let msg = data.message || 'Error al guardar el turno.';
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) msg = firstErr[0];
        }
        return { success: false, message: msg };
      }

      setSuccessMsg(data.message || (isEdit ? 'Turno actualizado.' : 'Turno(s) configurado(s) exitosamente.'));
      setModalFormOpen(false);
      setTurnoToEdit(null);
      await fetchTurnos(pagination.currentPage);

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
  const handleConfirmChangeStatus = async (turno, nextStatus) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${turno.id_turno}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el estado.');

      setSuccessMsg(data.message);
      setModalStatusOpen(false);
      setTurnoForStatus(null);
      await fetchTurnos(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 5. Eliminar Turno
   */
  const handleDeleteTurno = async (turno) => {
    if (!window.confirm(`¿Está seguro de eliminar el turno del día ${turno.dia_nombre} (${turno.horario_rango})?`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${turno.id_turno}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo eliminar el turno.');

      setSuccessMsg(data.message);
      await fetchTurnos(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 6. Consultar Agenda Semanal de un Médico
   */
  const fetchAgendaSemanal = async (idMedico) => {
    setLoadingSemanal(true);
    setAgendaSemanalData(null);
    setModalSemanalOpen(true);

    try {
      const res = await fetch(`${API_BASE}/medico/${idMedico}/semanal`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setAgendaSemanalData(json);
    } catch (err) {
      setError('No se pudo cargar la cuadrícula semanal del médico.');
    } finally {
      setLoadingSemanal(false);
    }
  };

  /**
   * Apertura y Cierre de Modales
   */
  const openCreateModal = () => {
    setTurnoToEdit(null);
    setModalFormOpen(true);
    fetchMeta();
  };

  const openEditModal = (turno) => {
    setTurnoToEdit(turno);
    setModalFormOpen(true);
    fetchMeta();
  };

  const openStatusModal = (turno, nextStatus) => {
    setTurnoForStatus(turno);
    setNextStatusTarget(nextStatus);
    setModalStatusOpen(true);
  };

  const openSlotsModal = (turno) => {
    setTurnoForSlots(turno);
    setModalSlotsOpen(true);
  };

  const closeModals = () => {
    setModalFormOpen(false);
    setTurnoToEdit(null);
    setModalStatusOpen(false);
    setTurnoForStatus(null);
    setModalSlotsOpen(false);
    setTurnoForSlots(null);
    setModalSemanalOpen(false);
    setAgendaSemanalData(null);
  };

  return {
    turnos,
    pagination,
    stats,
    medicosMeta,
    diasSemanaMeta,
    duracionesMeta,
    searchTerm,
    setSearchTerm,
    filterMedico,
    setFilterMedico,
    filterDia,
    setFilterDia,
    filterEstado,
    setFilterEstado,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    turnoToEdit,
    modalStatusOpen,
    turnoForStatus,
    nextStatusTarget,
    modalSlotsOpen,
    turnoForSlots,
    modalSemanalOpen,
    agendaSemanalData,
    loadingSemanal,
    fetchTurnos,
    fetchMeta,
    handleSaveTurno,
    handleConfirmChangeStatus,
    handleDeleteTurno,
    fetchAgendaSemanal,
    openCreateModal,
    openEditModal,
    openStatusModal,
    openSlotsModal,
    closeModals,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
  };
};

export default useCU07TurnoMedicoController;
