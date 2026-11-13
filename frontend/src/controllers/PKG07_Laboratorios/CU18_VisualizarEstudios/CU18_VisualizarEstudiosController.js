import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.laboratoriosVisor;

/**
 * Controller Hook para CU18 - Visualizar y descargar resultados de laboratorio
 */
export const useCU18VisualizarEstudiosController = () => {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'HABILITADO' | 'PENDIENTE'
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('MEDICO'); // 'MEDICO' | 'PACIENTE'

  // Modal de visualización y detalle
  const [estudioDetalle, setEstudioDetalle] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

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
        throw new Error(data.message || 'Error al obtener los estudios.');
      }

      setEstudios(data.data.estudios || []);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, searchTerm]);

  useEffect(() => {
    cargarEstudios();
  }, [cargarEstudios]);

  /**
   * Abrir visor del detalle con parámetros y documento
   */
  const verDetalleEstudio = async (idEstudio) => {
    setLoadingDetalle(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idEstudio}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'No se pudo obtener el detalle del estudio.');
      }

      setEstudioDetalle(data.data);
      setModalDetalleAbierto(true);
    } catch (err) {
      setError(err.message || 'Error al abrir el visor del estudio.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarModalDetalle = () => {
    setModalDetalleAbierto(false);
    setEstudioDetalle(null);
  };

  /**
   * Descargar / Imprimir informe médico de laboratorio en PDF
   */
  const descargarPdf = () => {
    window.print();
  };

  return {
    estudios,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    filtroRol,
    setFiltroRol,
    estudioDetalle,
    modalDetalleAbierto,
    loadingDetalle,
    verDetalleEstudio,
    cerrarModalDetalle,
    descargarPdf,
    cargarEstudios,
    limpiarError: () => setError(null),
  };
};

export default useCU18VisualizarEstudiosController;
