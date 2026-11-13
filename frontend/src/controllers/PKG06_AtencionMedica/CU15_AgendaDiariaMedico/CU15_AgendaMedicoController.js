import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.agendaMedica;

/**
 * Controller Hook para CU15 - Visualizar agenda médica diaria
 * Filtrado exclusivo y seguro por médico autenticado y fecha.
 */
export const useCU15AgendaMedicoController = (initialFecha = null, initialMedicoId = null) => {
  const getFechaHoy = () => new Date().toISOString().split('T')[0];

  const [fecha, setFecha] = useState(initialFecha || getFechaHoy());
  const [medicoId, setMedicoId] = useState(initialMedicoId);
  const [agenda, setAgenda] = useState([]);
  const [medico, setMedico] = useState(null);
  const [kpis, setKpis] = useState({
    total_citas: 0,
    atendidas: 0,
    en_espera: 0,
    programadas: 0,
    canceladas: 0,
  });

  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal de expediente clínico confidencial
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [modalExpedienteOpen, setModalExpedienteOpen] = useState(false);
  const [loadingExpediente, setLoadingExpediente] = useState(false);
  const [securityViolation, setSecurityViolation] = useState(null);

  /**
   * Cargar la agenda médica del día
   */
  const cargarAgenda = useCallback(async (targetFecha = fecha, targetMedicoId = medicoId) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (targetFecha) params.append('fecha', targetFecha);
      if (targetMedicoId) params.append('id_medico', String(targetMedicoId));

      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al cargar la agenda médica diaria.');
      }

      setAgenda(data.data || []);
      if (data.kpis) setKpis(data.kpis);
      if (data.medico) setMedico(data.medico);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [fecha, medicoId]);

  /**
   * Consultar expediente clínico de forma segura
   * Aplica la regla 5 del CU15: Protección estricta de privacidad
   */
  const abrirExpediente = async (idCita) => {
    setLoadingExpediente(true);
    setSecurityViolation(null);
    setSelectedExpediente(null);
    setModalExpedienteOpen(true);

    try {
      const params = new URLSearchParams();
      if (medicoId) params.append('id_medico', String(medicoId));

      const res = await fetch(`${API_BASE}/expediente/${idCita}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.security_violation || res.status === 403) {
          setSecurityViolation(data.message || 'Violación de Privacidad: Paciente no asignado a su turno.');
        } else {
          throw new Error(data.message || 'Error al consultar expediente.');
        }
        return;
      }

      setSelectedExpediente(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingExpediente(false);
    }
  };

  const cerrarExpediente = () => {
    setModalExpedienteOpen(false);
    setSelectedExpediente(null);
    setSecurityViolation(null);
  };

  const cambiarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
  };

  const avanzarDia = () => {
    const d = new Date(fecha + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setFecha(d.toISOString().split('T')[0]);
  };

  const retrocederDia = () => {
    const d = new Date(fecha + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setFecha(d.toISOString().split('T')[0]);
  };

  const irAHoy = () => {
    setFecha(getFechaHoy());
  };

  useEffect(() => {
    cargarAgenda(fecha, medicoId);
  }, [cargarAgenda, fecha, medicoId]);

  // Filtrado reactivo en memoria
  const agendaFiltrada = agenda.filter((item) => {
    const matchesEstado =
      filtroEstado === 'TODOS' ||
      item.estado_cita === filtroEstado ||
      (filtroEstado === 'EN_ESPERA' && ['EN_ESPERA', 'CONFIRMADA'].includes(item.estado_cita));

    const matchesSearch =
      !searchTerm.trim() ||
      (item.paciente?.nombre_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.paciente?.ci || '').includes(searchTerm) ||
      (item.codigo_cita || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEstado && matchesSearch;
  });

  return {
    fecha,
    medico,
    agenda: agendaFiltrada,
    agendaTotal: agenda,
    kpis,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    selectedExpediente,
    modalExpedienteOpen,
    loadingExpediente,
    securityViolation,
    cargarAgenda,
    abrirExpediente,
    cerrarExpediente,
    cambiarFecha,
    avanzarDia,
    retrocederDia,
    irAHoy,
    recargar: () => cargarAgenda(fecha, medicoId),
    limpiarError: () => setError(null),
  };
};

export default useCU15AgendaMedicoController;
