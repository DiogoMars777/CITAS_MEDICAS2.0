import { useState, useCallback, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import {
  parsearComandoReporte,
  generarGuionResumen,
  SUGERENCIAS_VOZ_REPORTES,
} from './CU21_VoiceParser';

const API_BASE = API_ENDPOINTS.reportes;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Controller Hook para CU21 - Generar Reportes Clínicos y Estadísticos
 * Con Asistente de Comandos de Voz y Sugerencias Inteligentes
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

  // =========================================================================
  // ESTADOS Y REFERENCIAS PARA COMANDOS DE VOZ Y ASISTENCIA ANALÍTICA
  // =========================================================================
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState(null); // { type: 'success' | 'info' | 'warning', text: string }
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  /**
   * Cargar metadatos para filtros
   */
  const cargarMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`, { headers: getAuthHeaders() });
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
        headers: getAuthHeaders(),
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
  const exportarCSV = useCallback(() => {
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
  }, [reporteActivo, datosProductividad, datosMorbilidad, datosLaboratorios, datosCancelaciones]);

  /**
   * Abrir modal de vista formal e imprimir en PDF
   */
  const abrirVistaImpresion = useCallback(() => {
    setModalImpresionAbierto(true);
    auditarExportacion('PDF_IMPRESION');
  }, []);

  // =========================================================================
  // SISTEMA DE COMANDOS DE VOZ Y SÍNTESIS DE AUDIO (TTS)
  // =========================================================================

  /**
   * Reproducir texto mediante síntesis de voz (Web Speech Synthesis)
   */
  const reproducirAudio = useCallback((texto) => {
    if (voiceMuted || !synthRef.current || typeof window === 'undefined') return;

    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-BO';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = synthRef.current.getVoices();
      const vozEs = voices.find((v) => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('BO'));
      if (vozEs) utterance.voice = vozEs;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('Error en síntesis de voz:', e);
      setIsSpeaking(false);
    }
  }, [voiceMuted]);

  /**
   * Detener síntesis de voz activa
   */
  const detenerAudio = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Obtener datos del reporte actual para generar el resumen
   */
  const getDatosReporteActual = useCallback(() => {
    if (reporteActivo === 'PRODUCTIVIDAD') return datosProductividad;
    if (reporteActivo === 'MORBILIDAD') return datosMorbilidad;
    if (reporteActivo === 'LABORATORIOS') return datosLaboratorios;
    if (reporteActivo === 'CANCELACIONES') return datosCancelaciones;
    return null;
  }, [reporteActivo, datosProductividad, datosMorbilidad, datosLaboratorios, datosCancelaciones]);

  /**
   * Procesa un comando de voz o texto escrito
   */
  const procesarComandoVoz = useCallback((comandoTexto) => {
    if (!comandoTexto || !comandoTexto.trim()) return;

    const parsed = parsearComandoReporte(comandoTexto, meta);

    // 1. Acciones inmediatas
    if (parsed.accion === 'RESUMEN') {
      const datosActuales = getDatosReporteActual();
      const guion = generarGuionResumen(reporteActivo, datosActuales);
      setVoiceFeedback({ type: 'success', text: `🎙️ Resumen: ${guion}` });
      reproducirAudio(guion);
      return;
    }

    if (parsed.accion === 'EXPORTAR') {
      setVoiceFeedback({ type: 'success', text: '📥 Exportando datos actuales a formato Excel (CSV)...' });
      exportarCSV();
      reproducirAudio('Exportando el reporte actual a Excel.');
      return;
    }

    if (parsed.accion === 'IMPRIMIR') {
      setVoiceFeedback({ type: 'success', text: '🖨️ Abriendo vista formal de impresión y guardado PDF...' });
      abrirVistaImpresion();
      reproducirAudio('Abriendo vista formal para impresión.');
      return;
    }

    if (parsed.accion === 'REFRESCAR') {
      setVoiceFeedback({ type: 'info', text: '🔄 Recargando datos de la base de datos...' });
      cargarReporte();
      reproducirAudio('Actualizando información de los reportes.');
      return;
    }

    // 2. Modificaciones de filtros y estado
    let hubieronCambios = false;

    if (parsed.tipoReporte && parsed.tipoReporte !== reporteActivo) {
      setReporteActivo(parsed.tipoReporte);
      hubieronCambios = true;
    }

    if (parsed.periodo && parsed.periodo !== periodo) {
      setPeriodo(parsed.periodo);
      hubieronCambios = true;
    }

    if (parsed.idEspecialidad && parsed.idEspecialidad !== idEspecialidad) {
      setIdEspecialidad(parsed.idEspecialidad);
      hubieronCambios = true;
    }

    if (parsed.idMedico && parsed.idMedico !== idMedico) {
      setIdMedico(parsed.idMedico);
      hubieronCambios = true;
    }

    if (hubieronCambios) {
      setVoiceFeedback({ type: 'success', text: parsed.descripcionAccion });
      if (parsed.mensajeVoz) {
        reproducirAudio(parsed.mensajeVoz);
      }
    } else {
      setVoiceFeedback({
        type: 'warning',
        text: parsed.descripcionAccion || `Comando recibido: "${comandoTexto}". Revisa las sugerencias de qué pedir.`,
      });
      if (parsed.mensajeVoz) {
        reproducirAudio(parsed.mensajeVoz);
      }
    }
  }, [meta, reporteActivo, periodo, idEspecialidad, idMedico, getDatosReporteActual, reproducirAudio, exportarCSV, abrirVistaImpresion, cargarReporte]);

  /**
   * Iniciar captura de voz con Web Speech API
   */
  const iniciarEscuchaVoz = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedback({
        type: 'warning',
        text: 'Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir tu instrucción en el campo de texto.',
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      detenerAudio();

      const reco = new SpeechRecognition();
      reco.continuous = false;
      reco.interimResults = true;
      reco.lang = 'es-BO';

      reco.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceFeedback({ type: 'info', text: '🎙️ Escuchando tu voz... Di tu instrucción o consulta.' });
      };

      reco.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        const textoActual = (finalTrans || interimTrans).trim();
        setVoiceTranscript(textoActual);

        if (finalTrans) {
          setIsListening(false);
          procesarComandoVoz(finalTrans);
        }
      };

      reco.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceFeedback({ type: 'warning', text: 'Acceso al micrófono denegado. Permite el permiso en tu navegador.' });
        } else if (event.error !== 'no-speech') {
          setVoiceFeedback({ type: 'warning', text: `Error de reconocimiento: ${event.error}` });
        }
      };

      reco.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = reco;
      reco.start();
    } catch (err) {
      console.warn('Error al iniciar micrófono:', err);
      setIsListening(false);
      setVoiceFeedback({ type: 'warning', text: 'No se pudo iniciar el micrófono. Revisa los permisos de audio.' });
    }
  }, [detenerAudio, procesarComandoVoz]);

  /**
   * Detener manualmente la escucha
   */
  const detenerEscuchaVoz = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

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
    // Voice API & Suggestions
    isListening,
    isSpeaking,
    voiceMuted,
    setVoiceMuted,
    voiceTranscript,
    setVoiceTranscript,
    voiceFeedback,
    setVoiceFeedback,
    sugerenciasAbiertas,
    setSugerenciasAbiertas,
    sugerenciasVoz: SUGERENCIAS_VOZ_REPORTES,
    iniciarEscuchaVoz,
    detenerEscuchaVoz,
    procesarComandoVoz,
    reproducirAudio,
    detenerAudio,
  };
};

export default useCU21ReportesController;
