import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.disponibilidad;

export const useCU09DisponibilidadController = () => {
  // Filtros principales
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoyStr);
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [idMedico, setIdMedico] = useState('');
  const [turnoFiltro, setTurnoFiltro] = useState('TODOS');

  // Metadatos para selectores
  const [especialidades, setEspecialidades] = useState([]);
  const [medicosMeta, setMedicosMeta] = useState([]);
  const [franjasHorarias, setFranjasHorarias] = useState([]);

  // Datos principales de la consulta
  const [consultaInfo, setConsultaInfo] = useState(null);
  const [kpis, setKpis] = useState({
    total_cupos: 0,
    cupos_disponibles: 0,
    cupos_ocupados: 0,
    cupos_bloqueados: 0,
    cupos_expirados: 0,
    porcentaje_ocupacion: 0,
    total_medicos: 0,
  });
  const [medicosResult, setMedicosResult] = useState([]);
  const [proximosDias, setProximosDias] = useState([]);

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal Detalle de Slot
  const [modalSlotOpen, setModalSlotOpen] = useState(false);
  const [slotSelected, setSlotSelected] = useState(null);
  const [medicoSelected, setMedicoSelected] = useState(null);

  /**
   * 1. Cargar Metadatos de Filtros
   */
  const fetchMeta = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (idEspecialidad) params.append('id_especialidad', idEspecialidad);

      const res = await fetch(`${API_BASE}/meta?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setEspecialidades(data.especialidades || []);
      setMedicosMeta(data.medicos || []);
      setFranjasHorarias(data.franjas_horarias || []);
    } catch (err) {
      console.error('Error al cargar metadatos de disponibilidad:', err);
    }
  }, [idEspecialidad]);

  /**
   * 2. Consultar Disponibilidad de Horarios (CU09)
   */
  const consultarDisponibilidad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fecha) params.append('fecha', fecha);
      if (idEspecialidad) params.append('id_especialidad', idEspecialidad);
      if (idMedico) params.append('id_medico', idMedico);
      if (turnoFiltro) params.append('turno_filtro', turnoFiltro);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al consultar disponibilidad');
      }

      setConsultaInfo(data.consulta);
      setKpis(data.kpis);
      setMedicosResult(data.medicos || []);
      setProximosDias(data.proximos_dias || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fecha, idEspecialidad, idMedico, turnoFiltro]);

  // Carga inicial de metadatos
  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Consulta automática al cambiar filtros principales
  useEffect(() => {
    consultarDisponibilidad();
  }, [consultarDisponibilidad]);

  /**
   * Acciones sobre slots
   */
  const abrirDetalleSlot = (slot, medico) => {
    setSlotSelected(slot);
    setMedicoSelected(medico);
    setModalSlotOpen(true);
  };

  const cerrarDetalleSlot = () => {
    setSlotSelected(null);
    setMedicoSelected(null);
    setModalSlotOpen(false);
  };

  const seleccionarDiaCalendario = (fechaSeleccionada) => {
    setFecha(fechaSeleccionada);
  };

  return {
    fecha,
    setFecha,
    idEspecialidad,
    setIdEspecialidad,
    idMedico,
    setIdMedico,
    turnoFiltro,
    setTurnoFiltro,
    especialidades,
    medicosMeta,
    franjasHorarias,
    consultaInfo,
    kpis,
    proximosDias,
    medicosResult,
    loading,
    actionLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    consultarDisponibilidad,
    modalSlotOpen,
    slotSelected,
    medicoSelected,
    abrirDetalleSlot,
    cerrarDetalleSlot,
    seleccionarDiaCalendario,
  };
};
