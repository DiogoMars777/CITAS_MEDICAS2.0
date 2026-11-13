import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.recordatorios;

/**
 * Controller Hook para CU19 - Gestionar recordatorios y notificaciones
 */
export const useCU19RecordatorioController = () => {
  const [recordatorios, setRecordatorios] = useState([]);
  const [estadisticas, setEstadisticas] = useState({ total: 0, enviados: 0, pendientes: 0, fallidos: 0 });
  const [loading, setLoading] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [reenviandoId, setReenviandoId] = useState(null);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroCanal, setFiltroCanal] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal nueva notificación personalizada
  const [modalNuevoAviso, setModalNuevoAviso] = useState(false);
  const [formAviso, setFormAviso] = useState({
    id_cita: '',
    tipo_canal: 'WHATSAPP',
    mensaje: '',
  });

  /**
   * Cargar listado de recordatorios y avisos
   */
  const cargarRecordatorios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}?`;
      if (filtroEstado !== 'TODOS') url += `estado=${filtroEstado}&`;
      if (filtroCanal !== 'TODOS') url += `canal=${filtroCanal}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al obtener los recordatorios.');
      }

      setRecordatorios(data.data.recordatorios || []);
      setEstadisticas(data.data.estadisticas || { total: 0, enviados: 0, pendientes: 0, fallidos: 0 });
    } catch (err) {
      setError(err.message || 'Error de conexión con el módulo de notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroCanal, searchTerm]);

  useEffect(() => {
    cargarRecordatorios();
  }, [cargarRecordatorios]);

  /**
   * Escanear citas programadas para las próximas 24 horas y enviar recordatorios automáticos
   */
  const escanearProximas24Horas = async () => {
    setEscaneando(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${API_BASE}/escanear-24h`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error durante el escaneo de citas próximas.');
      }

      setMensajeExito(data.message);
      cargarRecordatorios();
    } catch (err) {
      setError(err.message || 'No se pudo completar el escaneo de 24 horas.');
    } finally {
      setEscaneando(false);
    }
  };

  /**
   * Reenviar recordatorio manualmente
   */
  const reenviarRecordatorio = async (idRecordatorio) => {
    setReenviandoId(idRecordatorio);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idRecordatorio}/reenviar`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al reenviar.');
      }

      setMensajeExito(data.message);
      cargarRecordatorios();
    } catch (err) {
      setError(err.message || 'No se pudo reenviar la notificación.');
    } finally {
      setReenviandoId(null);
    }
  };

  /**
   * Enviar aviso personalizado inmediato
   */
  const enviarAvisoManual = async () => {
    if (!formAviso.id_cita || !formAviso.mensaje.trim()) {
      setError('Seleccione una cita e ingrese el contenido del mensaje.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formAviso),
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al enviar aviso.');
      }

      setMensajeExito(data.message);
      setModalNuevoAviso(false);
      setFormAviso({ id_cita: '', tipo_canal: 'WHATSAPP', mensaje: '' });
      cargarRecordatorios();
    } catch (err) {
      setError(err.message || 'Error al registrar aviso manual.');
    } finally {
      setLoading(false);
    }
  };

  return {
    recordatorios,
    estadisticas,
    loading,
    escaneando,
    reenviandoId,
    error,
    mensajeExito,
    filtroEstado,
    setFiltroEstado,
    filtroCanal,
    setFiltroCanal,
    searchTerm,
    setSearchTerm,
    modalNuevoAviso,
    setModalNuevoAviso,
    formAviso,
    setFormAviso,
    escanearProximas24Horas,
    reenviarRecordatorio,
    enviarAvisoManual,
    cargarRecordatorios,
    limpiarMensajes: () => {
      setError(null);
      setMensajeExito(null);
    },
  };
};

export default useCU19RecordatorioController;
