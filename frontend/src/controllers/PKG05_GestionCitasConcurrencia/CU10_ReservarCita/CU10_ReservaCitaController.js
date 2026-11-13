import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.citas;

export const useCU10ReservaCitaController = () => {
  // Lista de citas y paginación
  const [citas, setCitas] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });

  // Métricas analíticas KPI
  const [kpis, setKpis] = useState({
    total_citas: 0,
    citas_programadas: 0,
    citas_confirmadas: 0,
    citas_atendidas: 0,
    citas_canceladas: 0,
    citas_hoy: 0,
  });

  // Metadatos para selectores
  const [pacientesMeta, setPacientesMeta] = useState([]);
  const [especialidadesMeta, setEspecialidadesMeta] = useState([]);
  const [medicosMeta, setMedicosMeta] = useState([]);
  const [estadosMeta, setEstadosMeta] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalReservaOpen, setModalReservaOpen] = useState(false);
  const [modalFichaOpen, setModalFichaOpen] = useState(false);
  const [citaForFicha, setCitaForFicha] = useState(null);

  /**
   * 1. Cargar Citas Médicas desde PostgreSQL
   */
  const fetchCitas = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '15');

      if (searchTerm) params.append('search', searchTerm);
      if (filterMedico) params.append('id_medico', filterMedico);
      if (filterEspecialidad) params.append('id_especialidad', filterEspecialidad);
      if (filterEstado) params.append('estado_cita', filterEstado);
      if (filterFecha) params.append('fecha', filterFecha);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setCitas(data.data.data || []);
        setPagination({
          currentPage: data.data.current_page || 1,
          lastPage: data.data.last_page || 1,
          perPage: data.data.per_page || 15,
          total: data.data.total || 0,
        });
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      setError(err.message || 'Error al obtener la lista de citas.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterMedico, filterEspecialidad, filterEstado, filterFecha]);

  /**
   * 2. Cargar Metadatos para Filtros y Formulario
   */
  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setPacientesMeta(data.pacientes || []);
        setEspecialidadesMeta(data.especialidades || []);
        setMedicosMeta(data.medicos || []);
        setEstadosMeta(data.estados || []);
      }
    } catch (err) {
      console.error('Error al cargar metadatos de citas:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchCitas(1);
  }, [fetchCitas]);

  /**
   * 3. Reservar Cita Médica (Pessimistic Lock & Concurrencia)
   */
  const reservarCita = async (formData) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al procesar la reserva de cita.');
      }

      setSuccessMsg(`¡Cita médica ${data.data.codigo_cita} agendada con éxito!`);
      setModalReservaOpen(false);

      // Abrir ficha médica automáticamente tras la reserva
      setCitaForFicha(data.data);
      setModalFichaOpen(true);

      // Recargar citas
      fetchCitas(pagination.currentPage);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 4. Ver Ficha Médica de la Cita
   */
  const verFichaCita = async (idCita) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${idCita}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo obtener la ficha médica.');
      }

      setCitaForFicha(data.data);
      setModalFichaOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 5. Cambiar Estado de la Cita
   */
  const cambiarEstadoCita = async (idCita, nuevoEstado) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idCita}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_cita: nuevoEstado }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar el estado de la cita.');
      }

      setSuccessMsg(data.message);
      fetchCitas(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    citas,
    pagination,
    kpis,
    pacientesMeta,
    especialidadesMeta,
    medicosMeta,
    estadosMeta,
    searchTerm,
    setSearchTerm,
    filterMedico,
    setFilterMedico,
    filterEspecialidad,
    setFilterEspecialidad,
    filterEstado,
    setFilterEstado,
    filterFecha,
    setFilterFecha,
    loading,
    actionLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    modalReservaOpen,
    setModalReservaOpen,
    modalFichaOpen,
    setModalFichaOpen,
    citaForFicha,
    setCitaForFicha,
    fetchCitas,
    reservarCita,
    verFichaCita,
    cambiarEstadoCita,
  };
};
