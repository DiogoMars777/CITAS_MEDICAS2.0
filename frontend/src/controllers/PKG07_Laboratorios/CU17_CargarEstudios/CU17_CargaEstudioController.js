import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.laboratoriosCarga;

/**
 * Controller Hook para CU17 - Cargar estudios y resultados de laboratorio
 */
export const useCU17CargaEstudioController = () => {
  const [estudios, setEstudios] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, pendientes: 0, completados: 0 });
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Paciente buscado y referencia
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);

  // Estudio seleccionado para carga de resultado
  const [estudioSeleccionado, setEstudioSeleccionado] = useState(null);
  const [modalCargaAbierto, setModalCargaAbierto] = useState(false);

  // Formulario de carga de resultados
  const [formResultado, setFormResultado] = useState({
    resultado_diagnostico: '',
    observaciones: '',
    archivo_resultado_url: '',
    archivo_nombre: '',
    archivo_file: null,
    archivo_preview: null,
    estado: 'COMPLETADO',
  });

  // Modal para nueva orden de laboratorio
  const [modalNuevaOrden, setModalNuevaOrden] = useState(false);
  const [formNuevaOrden, setFormNuevaOrden] = useState({
    id_paciente: '',
    nombre_estudio: '',
    tipo_estudio: 'Laboratorio Clínico',
    descripcion: '',
  });

  /**
   * Cargar listado de estudios
   */
  const cargarEstudios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}?`;
      if (filtroEstado !== 'TODOS') url += `estado=${filtroEstado}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al obtener los estudios de laboratorio.');
      }

      setEstudios(data.data.estudios || []);
      setKpis(data.data.kpis || { total: 0, pendientes: 0, completados: 0 });
    } catch (err) {
      setError(err.message || 'Error de conexión con el servicio de laboratorio.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, searchTerm]);

  useEffect(() => {
    cargarEstudios();
  }, [cargarEstudios]);

  /**
   * Buscar paciente por CI o nombre y obtener sus parámetros etarios
   */
  const buscarPaciente = async (identificador) => {
    if (!identificador.trim()) return;
    setBuscandoPaciente(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/buscar-paciente/${encodeURIComponent(identificador.trim())}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Paciente no encontrado.');
      }

      setPacienteSeleccionado(data.paciente);
      return data.paciente;
    } catch (err) {
      setError(err.message || 'Error al buscar datos del paciente.');
      setPacienteSeleccionado(null);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  /**
   * Abrir modal para cargar resultado de un estudio existente
   */
  const abrirModalCarga = (estudio) => {
    setEstudioSeleccionado(estudio);
    setFormResultado({
      resultado_diagnostico: estudio.resultado_diagnostico || '',
      observaciones: '',
      archivo_resultado_url: estudio.archivo_resultado_url || '',
      archivo_nombre: estudio.archivo_resultado_url ? 'informe_digital.pdf' : '',
      archivo_file: null,
      archivo_preview: null,
      estado: 'COMPLETADO',
    });
    setModalCargaAbierto(true);
  };

  const cerrarModalCarga = () => {
    setModalCargaAbierto(false);
    setEstudioSeleccionado(null);
  };

  /**
   * Guardar y publicar el resultado del estudio
   */
  const guardarResultado = async () => {
    if (!estudioSeleccionado) return;
    const tieneTexto = formResultado.resultado_diagnostico && formResultado.resultado_diagnostico.trim().length > 0;
    const tieneArchivo = !!formResultado.archivo_file || !!formResultado.archivo_resultado_url;

    if (!tieneTexto && !tieneArchivo) {
      setError('Debe ingresar los resultados analíticos o adjuntar un archivo digital (PDF o imagen).');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const token = localStorage.getItem('token');
      let res;

      if (formResultado.archivo_file) {
        // Enviar vía FormData multipart para subir el archivo físico
        const formData = new FormData();
        formData.append('resultado_diagnostico', formResultado.resultado_diagnostico || '');
        formData.append('observaciones', formResultado.observaciones || '');
        formData.append('archivo_nombre', formResultado.archivo_nombre || formResultado.archivo_file.name);
        formData.append('estado', formResultado.estado || 'COMPLETADO');
        formData.append('archivo', formResultado.archivo_file);

        const formHeaders = { Accept: 'application/json' };
        if (token) formHeaders['Authorization'] = `Bearer ${token}`;

        res = await fetch(`${API_BASE}/${estudioSeleccionado.id_estudio}/resultado`, {
          method: 'POST',
          headers: formHeaders,
          body: formData,
        });
      } else {
        const headers = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        res = await fetch(`${API_BASE}/${estudioSeleccionado.id_estudio}/resultado`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formResultado),
        });
      }

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al guardar los resultados.');
      }

      setMensajeExito(data.message || 'Resultado digitalizado y publicado correctamente.');
      cerrarModalCarga();
      cargarEstudios();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el resultado del laboratorio.');
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Crear nueva orden de laboratorio
   */
  const crearOrden = async () => {
    if (!formNuevaOrden.id_paciente || !formNuevaOrden.nombre_estudio) {
      setError('Seleccione un paciente e ingrese el nombre del estudio.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(formNuevaOrden),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al crear la orden.');
      }

      setMensajeExito(data.message || 'Orden de laboratorio creada.');
      setModalNuevaOrden(false);
      setFormNuevaOrden({
        id_paciente: '',
        nombre_estudio: '',
        tipo_estudio: 'Laboratorio Clínico',
        descripcion: '',
      });
      cargarEstudios();
    } catch (err) {
      setError(err.message || 'Error al generar la orden.');
    } finally {
      setGuardando(false);
    }
  };

  return {
    estudios,
    kpis,
    loading,
    guardando,
    error,
    mensajeExito,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    pacienteSeleccionado,
    buscandoPaciente,
    buscarPaciente,
    estudioSeleccionado,
    modalCargaAbierto,
    formResultado,
    setFormResultado,
    abrirModalCarga,
    cerrarModalCarga,
    guardarResultado,
    modalNuevaOrden,
    setModalNuevaOrden,
    formNuevaOrden,
    setFormNuevaOrden,
    crearOrden,
    cargarEstudios,
    limpiarMensajes: () => {
      setError(null);
      setMensajeExito(null);
    },
  };
};

export default useCU17CargaEstudioController;
