import { useState, useCallback, useEffect } from 'react';
import { initialConfiguracionModel } from '../../../models/PKG01_Seguridad/CU22_BackupRestore/BackupModel';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.backups;

/**
 * Controller Hook para CU22 - Gestionar copias de seguridad (Backup / Restore) y Programación Automática
 */
export const useCU22BackupRestoreController = () => {
  const [backups, setBackups] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [estadoSistema, setEstadoSistema] = useState(null);
  const [configuracion, setConfiguracion] = useState(initialConfiguracionModel);

  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [ejecutandoProgramado, setEjecutandoProgramado] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [disparoFiltro, setDisparoFiltro] = useState('TODOS');
  const [pestañaActiva, setPestañaActiva] = useState('HISTORIAL'); // 'HISTORIAL' | 'PROGRAMACION'

  // Modales
  const [modalRestaurar, setModalRestaurar] = useState({ abierto: false, backup: null });
  const [modalDetalles, setModalDetalles] = useState({ abierto: false, backup: null });

  /**
   * Cargar listado de backups y KPIs ejecutivos
   */
  const cargarBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tipoFiltro !== 'TODOS') params.append('tipo', tipoFiltro);
      if (disparoFiltro !== 'TODOS') params.append('disparo', disparoFiltro);

      const qs = params.toString();
      const url = qs ? `${API_BASE}?${qs}` : API_BASE;

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Error al obtener registros de backups.');
      }

      setBackups(json.data.backups || []);
      setKpis(json.data.kpis || null);
    } catch (err) {
      setError(err.message || 'Error de conexión con el servicio de backups.');
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, disparoFiltro]);

  /**
   * Cargar configuración de programación automática
   */
  const cargarConfiguracion = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch(`${API_BASE}/configuracion`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setConfiguracion(json.data);
      }
    } catch (err) {
      console.warn('No se pudo cargar la configuración de respaldos programados:', err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  /**
   * Cargar estado técnico del motor de base de datos
   */
  const cargarEstadoSistema = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/estado-sistema`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (json.status === 'success') {
        setEstadoSistema(json.data);
      }
    } catch (err) {
      console.warn('No se pudo obtener el estado del motor de base de datos:', err);
    }
  }, []);

  useEffect(() => {
    cargarBackups();
    cargarConfiguracion();
    cargarEstadoSistema();
  }, [cargarBackups, cargarConfiguracion, cargarEstadoSistema]);

  /**
   * Generar nuevo backup manual
   */
  const generarBackup = async (tipo = 'COMPLETO') => {
    setGenerando(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${API_BASE}/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ tipo }),
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Error al generar la copia de seguridad.');
      }

      setMensajeExito(json.message);
      await cargarBackups();
    } catch (err) {
      setError(err.message || 'Error crítico al ejecutar el volcado de la base de datos.');
    } finally {
      setGenerando(false);
    }
  };

  /**
   * Guardar cambios en la programación automática
   */
  const guardarConfiguracion = async (formDatos) => {
    setGuardandoConfig(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${API_BASE}/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formDatos),
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Error al guardar la configuración de programación.');
      }

      setMensajeExito(json.message);
      await cargarConfiguracion();
      await cargarBackups();
    } catch (err) {
      setError(err.message || 'Error al actualizar la programación.');
    } finally {
      setGuardandoConfig(false);
    }
  };

  /**
   * Disparar tarea programada de inmediato (Simular Cron)
   */
  const ejecutarJobProgramado = async () => {
    setEjecutandoProgramado(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${API_BASE}/ejecutar-programado`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Fallo al ejecutar la tarea programada.');
      }

      setMensajeExito(json.message);
      await cargarConfiguracion();
      await cargarBackups();
    } catch (err) {
      setError(err.message || 'Error al ejecutar tarea programada.');
    } finally {
      setEjecutandoProgramado(false);
    }
  };

  /**
   * Descargar archivo SQL físico
   */
  const descargarBackup = (idBackup, nombreArchivo) => {
    try {
      const url = `${API_BASE}/${idBackup}/descargar`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Error al iniciar la descarga del archivo de copia de seguridad.');
    }
  };

  /**
   * Ejecutar restauración de base de datos
   */
  const ejecutarRestauracion = async (idBackup) => {
    setRestaurando(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch(`${API_BASE}/${idBackup}/restaurar`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Falla durante la restauración de la base de datos.');
      }

      setMensajeExito(json.message);
      setModalRestaurar({ abierto: false, backup: null });
      await cargarBackups();
    } catch (err) {
      setError(err.message || 'Error crítico durante la restauración.');
    } finally {
      setRestaurando(false);
    }
  };

  /**
   * Eliminar backup
   */
  const eliminarBackup = async (idBackup) => {
    if (!window.confirm('¿Está seguro de eliminar permanentemente esta copia de seguridad del servidor?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idBackup}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Error al eliminar el backup.');
      }

      setMensajeExito('Copia de seguridad eliminada con éxito.');
      await cargarBackups();
    } catch (err) {
      setError(err.message || 'Error al intentar eliminar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return {
    backups,
    kpis,
    estadoSistema,
    configuracion,
    loading,
    loadingConfig,
    generando,
    guardandoConfig,
    ejecutandoProgramado,
    restaurando,
    error,
    mensajeExito,
    limpiarMensajes: () => {
      setError(null);
      setMensajeExito(null);
    },
    tipoFiltro,
    setTipoFiltro,
    disparoFiltro,
    setDisparoFiltro,
    pestañaActiva,
    setPestañaActiva,
    modalRestaurar,
    setModalRestaurar,
    modalDetalles,
    setModalDetalles,
    recargar: () => {
      cargarBackups();
      cargarConfiguracion();
      cargarEstadoSistema();
    },
    generarBackup,
    guardarConfiguracion,
    ejecutarJobProgramado,
    descargarBackup,
    ejecutarRestauracion,
    eliminarBackup,
  };
};

export default useCU22BackupRestoreController;
