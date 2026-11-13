import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.antecedentes;

/**
 * Controller Hook para CU14 - Registrar y actualizar antecedentes clínicos base
 */
export const useCU14AntecedentesClinicosController = () => {
  const [pacientes, setPacientes] = useState([]);
  const [kpis, setKpis] = useState({ total_expedientes: 0, con_tipo_sangre: 0, con_alergias_alertas: 0 });
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipoSangre, setFiltroTipoSangre] = useState('');

  // Paciente seleccionado para edición
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

  // Formulario de antecedentes clínicos base
  const [formData, setFormData] = useState({
    tipo_sangre: '',
    alergias_medicamentos: '',
    enfermedades_hereditarias: '',
    antecedentes_patologicos: '',
    antecedentes_quirurgicos: '',
  });

  /**
   * Cargar listado de pacientes con sus antecedentes
   */
  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}?per_page=50&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
      if (filtroTipoSangre) url += `tipo_sangre=${encodeURIComponent(filtroTipoSangre)}&`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener expedientes clínicos.');
      }

      setPacientes(data.data?.data || []);
      setKpis(data.kpis || { total_expedientes: 0, con_tipo_sangre: 0, con_alergias_alertas: 0 });
    } catch (err) {
      setError(err.message || 'Error de conexión con el servicio de antecedentes clínicos.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filtroTipoSangre]);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  /**
   * Abrir modal para editar antecedentes de un paciente
   */
  const abrirEdicion = (paciente) => {
    setPacienteSeleccionado(paciente);
    setFormData({
      tipo_sangre: paciente.tipo_sangre !== 'No registrado' ? paciente.tipo_sangre : '',
      alergias_medicamentos: paciente.alergias_medicamentos !== 'Ninguna registrada' ? paciente.alergias_medicamentos : '',
      enfermedades_hereditarias: paciente.enfermedades_hereditarias !== 'Ninguna registrada' ? paciente.enfermedades_hereditarias : '',
      antecedentes_patologicos: paciente.antecedentes_patologicos !== 'Ninguno registrado' ? paciente.antecedentes_patologicos : '',
      antecedentes_quirurgicos: paciente.antecedentes_quirurgicos !== 'Ninguno registrado' ? paciente.antecedentes_quirurgicos : '',
    });
    setModalEdicionAbierto(true);
  };

  const cerrarEdicion = () => {
    setModalEdicionAbierto(false);
    setPacienteSeleccionado(null);
  };

  /**
   * Guardar cambios del expediente clínico base
   */
  const guardarAntecedentes = async () => {
    if (!pacienteSeleccionado) return;

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const res = await fetch(`${API_BASE}/paciente/${pacienteSeleccionado.id_paciente}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar los antecedentes clínicos.');
      }

      setMensajeExito(data.message || 'Antecedentes clínicos actualizados exitosamente.');
      cerrarEdicion();
      cargarPacientes();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la información clínica.');
    } finally {
      setGuardando(false);
    }
  };

  return {
    pacientes,
    kpis,
    loading,
    guardando,
    error,
    mensajeExito,
    searchTerm,
    setSearchTerm,
    filtroTipoSangre,
    setFiltroTipoSangre,
    pacienteSeleccionado,
    modalEdicionAbierto,
    formData,
    setFormData,
    abrirEdicion,
    cerrarEdicion,
    guardarAntecedentes,
    cargarPacientes,
    limpiarMensajes: () => {
      setError(null);
      setMensajeExito(null);
    },
  };
};

export default useCU14AntecedentesClinicosController;
