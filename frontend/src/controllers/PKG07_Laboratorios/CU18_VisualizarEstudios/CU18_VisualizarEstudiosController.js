import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.laboratoriosVisor;

/**
 * Controller Hook para CU18 - Visualizar y descargar resultados de laboratorio
 */
export const useCU18VisualizarEstudiosController = (currentUser = null) => {
  const isMedico = ['MEDICO', 'DOCTOR'].includes((currentUser?.rol || '').toUpperCase().trim());
  const isPaciente = ['PACIENTE', 'CLIENTE'].includes((currentUser?.rol || '').toUpperCase().trim());
  const defaultRol = isPaciente ? 'PACIENTE' : 'MEDICO';

  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'HABILITADO' | 'PENDIENTE'
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState(defaultRol); // 'MEDICO' | 'PACIENTE'

  useEffect(() => {
    if (isMedico) setFiltroRol('MEDICO');
    else if (isPaciente) setFiltroRol('PACIENTE');
  }, [isMedico, isPaciente]);

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
      const headers = { Accept: 'application/json' };
      const token = currentUser?.token || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API_BASE}?`;
      if (filtroEstado !== 'TODOS') url += `estado=${filtroEstado}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
      if (isMedico && currentUser?.id_medico) url += `id_medico=${currentUser.id_medico}&`;
      if (isPaciente && currentUser?.id_paciente) url += `id_paciente=${currentUser.id_paciente}&`;

      const res = await fetch(url, { headers });
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
  }, [filtroEstado, searchTerm, isMedico, isPaciente, currentUser?.id_medico, currentUser?.id_paciente, currentUser?.token]);

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
