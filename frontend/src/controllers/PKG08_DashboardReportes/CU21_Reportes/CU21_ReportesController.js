import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.reportes;

/**
 * Controller Hook para CU21 - Generar Reportes Clínicos y Estadísticos
 */
export const useCU21ReportesController = () => {
  // Pestaña activa
  const [reporteActivo, setReporteActivo] = useState('PRODUCTIVIDAD'); // 'PRODUCTIVIDAD' | 'MORBILIDAD' | 'LABORATORIOS' | 'CANCELACIONES'

  // Estados de carga y error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ medicos: [], especialidades: [], periodos: [] });

  // Filtros globales
  const [periodo, setPeriodo] = useState('este_mes');
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [idMedico, setIdMedico] = useState('todos');
  const [idEspecialidad, setIdEspecialidad] = useState('todas');

  // Datos de los 4 reportes
  const [datosProductividad, setDatosProductividad] = useState(null);
  const [datosMorbilidad, setDatosMorbilidad] = useState(null);
  const [datosLaboratorios, setDatosLaboratorios] = useState(null);
  const [datosCancelaciones, setDatosCancelaciones] = useState(null);

  // Modal de vista previa / impresión PDF formal
  const [modalImpresionAbierto, setModalImpresionAbierto] = useState(false);

  /**
   * Cargar metadatos para filtros
   */
  const cargarMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (json.status === 'success') {
        setMeta(json.data);
      }
    } catch (err) {
      console.warn('No se pudieron cargar metadatos de reportes:', err);
    }
  }, []);

  useEffect(() => {
    cargarMeta();
  }, [cargarMeta]);

  /**
   * Cargar datos del reporte activo
   */
  const cargarReporte = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        periodo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        id_medico: idMedico,
        id_especialidad: idEspecialidad,
      });

      let endpoint = '';
      if (reporteActivo === 'PRODUCTIVIDAD') endpoint = 'productividad-medica';
      else if (reporteActivo === 'MORBILIDAD') endpoint = 'morbilidad-cie10';
      else if (reporteActivo === 'LABORATORIOS') endpoint = 'laboratorios-estudios';
      else if (reporteActivo === 'CANCELACIONES') endpoint = 'cancelaciones-inasistencias';

      const res = await fetch(`${API_BASE}/${endpoint}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Error al procesar el reporte solicitado.');
      }

      if (reporteActivo === 'PRODUCTIVIDAD') setDatosProductividad(json.data);
      else if (reporteActivo === 'MORBILIDAD') setDatosMorbilidad(json.data);
      else if (reporteActivo === 'LABORATORIOS') setDatosLaboratorios(json.data);
      else if (reporteActivo === 'CANCELACIONES') setDatosCancelaciones(json.data);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servicio de reportes.');
    } finally {
      setLoading(false);
    }
  }, [reporteActivo, periodo, fechaInicio, fechaFin, idMedico, idEspecialidad]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  /**
   * Registrar auditoría de exportación
   */
  const auditarExportacion = async (formato) => {
    try {
      await fetch(`${API_BASE}/auditar-exportacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          tipo_reporte: reporteActivo,
          formato,
          filtros: { periodo, fechaInicio, fechaFin, idMedico, idEspecialidad },
        }),
      });
    } catch (e) {
      console.warn('Auditoría de exportación no registrada:', e);
    }
  };

  /**
   * Exportar datos actuales a CSV (formato compatible con Excel con BOM UTF-8)
   */
  const exportarCSV = () => {
    try {
      let csvContent = '\uFEFF'; // BOM para soportar tildes en Excel
      let nombreArchivo = `Reporte_${reporteActivo}_${new Date().toISOString().split('T')[0]}.csv`;

      if (reporteActivo === 'PRODUCTIVIDAD' && datosProductividad?.filas) {
        csvContent += 'Médico;Especialidad;Total Citas;Atendidas;Pendientes;Canceladas;Inasistencias;Tasa Efectividad (%);Tasa Inasistencia (%)\n';
        datosProductividad.filas.forEach((f) => {
          csvContent += `"${f.medico}";"${f.especialidad}";${f.total_citas};${f.atendidas};${f.pendientes};${f.canceladas};${f.inasistencias};${f.tasa_efectividad}%;${f.tasa_inasistencia}%\n`;
        });
      } else if (reporteActivo === 'MORBILIDAD' && datosMorbilidad?.top_diagnosticos) {
        csvContent += 'Código CIE-10;Diagnóstico Clínico;Total Casos;Porcentaje (%);Casos Masculinos;Casos Femeninos\n';
        datosMorbilidad.top_diagnosticos.forEach((d) => {
          csvContent += `"${d.codigo_cie10}";"${d.diagnostico}";${d.total_casos};${d.porcentaje}%;${d.casos_masculinos};${d.casos_femeninos}\n`;
        });
      } else if (reporteActivo === 'LABORATORIOS' && datosLaboratorios?.estudios) {
        csvContent += 'Código;Estudio;Tipo;Paciente;CI Paciente;Médico Solicitante;Fecha Solicitud;Estado;Resultado\n';
        datosLaboratorios.estudios.forEach((e) => {
          csvContent += `"${e.codigo_estudio}";"${e.nombre_estudio}";"${e.tipo_estudio}";"${e.paciente}";"${e.paciente_ci}";"${e.medico_solicitante}";"${e.fecha_solicitud}";"${e.estado}";"${(e.resultado_diagnostico || '').replace(/"/g, '""')}"\n`;
        });
      } else if (reporteActivo === 'CANCELACIONES' && datosCancelaciones?.citas_afectadas) {
        csvContent += 'Código Cita;Fecha Cita;Hora;Paciente;Teléfono;Médico;Estado;Motivo de Pérdida/Cancelación\n';
        datosCancelaciones.citas_afectadas.forEach((c) => {
          csvContent += `"${c.codigo_cita}";"${c.fecha_cita}";"${c.hora_inicio}";"${c.paciente}";"${c.paciente_telefono}";"${c.medico}";"${c.estado_cita}";"${(c.motivo_cancelacion || '').replace(/"/g, '""')}"\n`;
        });
      } else {
        alert('No hay datos disponibles para exportar en este momento.');
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Auditar exportación en bitácora
      auditarExportacion('EXCEL_CSV');
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      alert('Ocurrió un error al generar el archivo CSV.');
    }
  };

  /**
   * Abrir modal de vista formal e imprimir en PDF
   */
  const abrirVistaImpresion = () => {
    setModalImpresionAbierto(true);
    auditarExportacion('PDF_IMPRESION');
  };

  return {
    reporteActivo,
    setReporteActivo,
    loading,
    error,
    meta,
    periodo,
    setPeriodo,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    idMedico,
    setIdMedico,
    idEspecialidad,
    setIdEspecialidad,
    datosProductividad,
    datosMorbilidad,
    datosLaboratorios,
    datosCancelaciones,
    recargar: cargarReporte,
    exportarCSV,
    modalImpresionAbierto,
    setModalImpresionAbierto,
    abrirVistaImpresion,
  };
};

export default useCU21ReportesController;
