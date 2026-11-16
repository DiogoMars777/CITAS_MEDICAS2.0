import React from 'react';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  Filter,
  Users,
  UserCheck,
  UserX,
  Clock,
  Activity,
  BarChart2,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Stethoscope,
  TrendingUp,
  Percent,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Lightbulb,
  Send,
  ChevronDown,
  ChevronUp,
  Square,
} from 'lucide-react';
import useCU21ReportesController from '../../../controllers/PKG08_DashboardReportes/CU21_Reportes/CU21_ReportesController';

export const CU21_ReportesView = () => {
  const {
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
    recargar,
    exportarCSV,
    modalImpresionAbierto,
    setModalImpresionAbierto,
    abrirVistaImpresion,
    // Comandos de Voz y Sugerencias
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
    sugerenciasVoz,
    iniciarEscuchaVoz,
    detenerEscuchaVoz,
    procesarComandoVoz,
    detenerAudio,
  } = useCU21ReportesController();

  const [textoComando, setTextoComando] = React.useState('');

  React.useEffect(() => {
    if (voiceTranscript) {
      setTextoComando(voiceTranscript);
    }
  }, [voiceTranscript]);

  return (
    <div style={{ padding: '0.5rem 1rem 3rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* =========================================================================
          1. CABECERA PRINCIPAL DEL REPORTE
      ========================================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem',
        background: '#ffffff',
        padding: '1.15rem 1.35rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
            flexShrink: 0,
          }}>
            <FileText size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}>
                CU21
              </span>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Reportes Clínicos y Estadísticos
              </h1>
              <span style={{
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}>
                Nivel Senior Enterprise
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Inteligencia clínica, consolidación de productividad médica, epidemiología CIE-10 y auditoría asistencial.
            </p>
          </div>
        </div>

        {/* ACCIONES DE EXPORTACIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={recargar}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
            title="Actualizar datos"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>

          <button
            type="button"
            onClick={exportarCSV}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
            title="Exportar archivo CSV con codificación UTF-8 para Excel"
          >
            <Download size={15} />
            <span>Exportar Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={abrirVistaImpresion}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            }}
            title="Vista formal lista para imprimir o guardar como PDF"
          >
            <Printer size={15} />
            <span>Imprimir / PDF Formal</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE CONTROL POR VOZ Y ASISTENTE IA DE REPORTES (CU21)
      ========================================================================= */}
      <style>{`
        @keyframes pulseMic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes soundWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>
      
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        borderRadius: '14px',
        padding: '1.15rem 1.35rem',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 15px rgba(15, 23, 42, 0.12)',
        border: '1px solid #334155',
      }}>
        {/* Encabezado del Asistente */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <Sparkles size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.03em', color: '#ffffff' }}>
                  Comandos de Voz & Asistente Clínico Inteligente
                </span>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontFamily: 'monospace',
                }}>
                  NLP v2.0
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                Dicta o escribe qué reporte consultar, filtros de médicos, exportaciones o solicita un resumen ejecutivo narrado por voz.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Indicador de habla / detención de síntesis */}
            {isSpeaking && (
              <button
                type="button"
                onClick={detenerAudio}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Detener voz que está hablando"
              >
                <Square size={12} fill="#f87171" />
                <span>Detener Audio</span>
              </button>
            )}

            {/* Toggle Mute Síntesis */}
            <button
              type="button"
              onClick={() => setVoiceMuted(!voiceMuted)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: voiceMuted ? 'rgba(100, 116, 139, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                color: voiceMuted ? '#94a3b8' : '#38bdf8',
                border: '1px solid',
                borderColor: voiceMuted ? '#475569' : 'rgba(56, 189, 248, 0.3)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title={voiceMuted ? 'Activar respuesta por voz' : 'Silenciar respuesta por voz'}
            >
              {voiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{voiceMuted ? 'Voz Desactivada' : 'Voz Activada'}</span>
            </button>

            {/* Botón Sugerencias */}
            <button
              type="button"
              onClick={() => setSugerenciasAbiertas(!sugerenciasAbiertas)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: sugerenciasAbiertas ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
                color: sugerenciasAbiertas ? '#0f172a' : '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              <Lightbulb size={14} />
              <span>Sugerencias de qué pedir</span>
              {sugerenciasAbiertas ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Input & Botón de Micrófono Principal */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textoComando.trim()) {
              procesarComandoVoz(textoComando.trim());
              setTextoComando('');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#0b1120',
            padding: '0.45rem 0.65rem',
            borderRadius: '10px',
            border: isListening ? '1px solid #ef4444' : '1px solid #334155',
          }}
        >
          {/* Botón Micrófono */}
          <button
            type="button"
            onClick={isListening ? detenerEscuchaVoz : iniciarEscuchaVoz}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              border: 'none',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              flexShrink: 0,
              animation: isListening ? 'pulseMic 1.4s infinite' : 'none',
              boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 2px 6px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s ease',
            }}
            title={isListening ? 'Detener escucha' : 'Hablar con comando de voz'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Animación de ondas si está escuchando */}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0 4px' }}>
              {[0, 0.15, 0.3, 0.45, 0.6].map((delay, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3px',
                    height: '14px',
                    backgroundColor: '#ef4444',
                    borderRadius: '2px',
                    animation: `soundWave 0.8s ease-in-out infinite alternate ${delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Campo de texto / Transcripción en vivo */}
          <input
            type="text"
            value={textoComando}
            onChange={(e) => setTextoComando(e.target.value)}
            placeholder={
              isListening
                ? 'Escuchando tu voz... habla con claridad (ej: "Muestra cancelaciones de este mes")'
                : 'Ej: "Muestra cancelaciones de este mes", "Filtrar por Pediatría", "Dame un resumen", "Exportar a Excel"...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: isListening ? '#fca5a5' : '#f8fafc',
              fontSize: '0.82rem',
              fontWeight: 500,
              padding: '0.4rem 0.2rem',
            }}
          />

          {/* Botón de Enviar Comando */}
          <button
            type="submit"
            disabled={!textoComando.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: !textoComando.trim() ? '#1e293b' : '#0284c7',
              color: !textoComando.trim() ? '#64748b' : '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: !textoComando.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <span>Ejecutar</span>
            <Send size={13} />
          </button>
        </form>

        {/* Notificación de Feedback / Resultado del comando */}
        {voiceFeedback && (
          <div style={{
            marginTop: '0.65rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: (voiceFeedback.type === 'error' || voiceFeedback.type === 'warning' || voiceFeedback.tipo === 'error')
              ? 'rgba(239, 68, 68, 0.15)'
              : (voiceFeedback.type === 'info' || voiceFeedback.tipo === 'info')
              ? 'rgba(56, 189, 248, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              (voiceFeedback.type === 'error' || voiceFeedback.type === 'warning' || voiceFeedback.tipo === 'error')
                ? 'rgba(239, 68, 68, 0.35)'
                : (voiceFeedback.type === 'info' || voiceFeedback.tipo === 'info')
                ? 'rgba(56, 189, 248, 0.35)'
                : 'rgba(16, 185, 129, 0.35)'
            }`,
            color: (voiceFeedback.type === 'error' || voiceFeedback.type === 'warning' || voiceFeedback.tipo === 'error')
              ? '#fca5a5'
              : (voiceFeedback.type === 'info' || voiceFeedback.tipo === 'info')
              ? '#7dd3fc'
              : '#6ee7b7',
          }}>
            <span>{voiceFeedback.text || voiceFeedback.mensaje}</span>
            <button
              type="button"
              onClick={() => setVoiceFeedback(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Panel Desplegable de Sugerencias de qué pedir */}
        {sugerenciasAbiertas && (
          <div style={{
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #334155',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.6rem',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                💡 Sugerencias Rápidas: Haz clic en cualquiera o dictalo con tu voz
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Clic directo para ejecutar
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}>
              {(sugerenciasVoz || []).map((cat, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid #1e293b',
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: cat.color || '#38bdf8',
                    marginBottom: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {cat.categoria}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {(cat.items || []).map((it, iIdx) => (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => procesarComandoVoz(it.comando)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '0.35rem 0.55rem',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                          e.currentTarget.style.borderColor = '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                          e.currentTarget.style.borderColor = '#334155';
                        }}
                        title={`Comando de voz: "${it.comando}"`}
                      >
                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#f8fafc' }}>
                          {it.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {it.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. BARRA DE FILTROS PARAMÉTRICOS
      ========================================================================= */}
      <div style={{
        background: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* BOTONES DE PERÍODO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              Período:
            </span>
            {(meta.periodos || []).map((p) => {
              const active = periodo === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodo(p.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '7px',
                    border: active ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    background: active ? '#0284c7' : '#f8fafc',
                    color: active ? '#ffffff' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 4px rgba(2,132,199,0.2)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.nombre}
                </button>
              );
            })}
          </div>

          {/* FILTROS DE CATÁLOGO: ESPECIALIDAD Y MÉDICO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Especialidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Especialidad:</span>
              <select
                value={idEspecialidad}
                onChange={(e) => setIdEspecialidad(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="todas">Todas las Especialidades</option>
                {(meta.especialidades || []).map((esp) => (
                  <option key={esp.id_especialidad} value={esp.id_especialidad}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Médico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Médico:</span>
              <select
                value={idMedico}
                onChange={(e) => setIdMedico(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="todos">Todos los Médicos</option>
                {(meta.medicos || []).map((m) => (
                  <option key={m.id_medico} value={m.id_medico}>
                    {m.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* INPUTS SI EL PERÍODO ES PERSONALIZADO */}
        {periodo === 'personalizado' && (
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.75rem',
            background: '#f8fafc',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
          }}>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>Rango personalizado:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ color: '#475569' }}>Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ color: '#475569' }}>Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. PESTAÑAS DE NAVEGACIÓN TEMÁTICA
      ========================================================================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '1.25rem',
        overflowX: 'auto',
      }}>
        {[
          { id: 'PRODUCTIVIDAD', label: '1. Productividad Médica', icon: Stethoscope },
          { id: 'MORBILIDAD', label: '2. Morbilidad y CIE-10', icon: BarChart2 },
          { id: 'LABORATORIOS', label: '3. Laboratorios y Gabinetes', icon: FlaskConical },
          { id: 'CANCELACIONES', label: '4. Inasistencias y Pérdidas', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reporteActivo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReporteActivo(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.7rem 1.15rem',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                marginBottom: '-2px',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          fontSize: '0.78rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={16} color="#dc2626" />
            <span>{error}</span>
          </div>
          <button
            onClick={recargar}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #f87171',
              background: '#ffffff',
              color: '#b91c1c',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* SPINNER DE CARGA */}
      {loading ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '3.5rem 1rem',
          textAlign: 'center',
          color: '#64748b',
        }}>
          <RefreshCw size={28} color="#0284c7" className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
            Consolidando datos clínicos y calculando agregaciones...
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Procesamiento analítico en tiempo real sobre la base de datos PostgreSQL.
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================================
              TAB 1: PRODUCTIVIDAD MÉDICA
          ========================================================================= */}
          {reporteActivo === 'PRODUCTIVIDAD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* TARJETAS KPI DE RESUMEN */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.85rem',
              }}>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Citas</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.total_citas || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Agendadas en período</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Atendidas</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.total_atendidas || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669' }}>Evolución clínica cerrada</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Tasa Efectividad</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.tasa_global_efectividad || 0}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706' }}>Cumplimiento global</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>Inasistencias</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.total_inasistencias || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>Paciente ausente</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Canceladas</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#475569', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.total_canceladas || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Anuladas formalmente</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Médicos Activos</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0284c7', margin: '0.35rem 0 0.15rem' }}>
                    {datosProductividad?.resumen_kpi?.total_medicos_activos || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>Con agenda asignada</div>
                </div>
              </div>

              {/* TABLA DE PRODUCTIVIDAD */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Stethoscope size={16} color="#0284c7" />
                    <span>Desempeño y Efectividad por Profesional de Salud</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Rango: {datosProductividad?.rango_fechas?.inicio} al {datosProductividad?.rango_fechas?.fin}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Médico</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Especialidad</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Citas</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#059669' }}>Atendidas</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#d97706' }}>Pendientes</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#dc2626' }}>Inasistencias</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Canceladas</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Efectividad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosProductividad?.filas || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            No se registran citas en el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        datosProductividad.filas.map((f) => (
                          <tr key={f.id_medico} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{f.medico}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}>
                                {f.especialidad}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800 }}>{f.total_citas}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#059669', background: '#ecfdf5' }}>
                              {f.atendidas}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#d97706' }}>
                              {f.pendientes}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                              {f.inasistencias}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>
                              {f.canceladas}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, f.tasa_efectividad)}%`,
                                    background: f.tasa_efectividad >= 70 ? '#10b981' : '#f59e0b',
                                    borderRadius: '4px',
                                  }} />
                                </div>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem' }}>{f.tasa_efectividad}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: MORBILIDAD Y CIE-10
          ========================================================================= */}
          {reporteActivo === 'MORBILIDAD' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* TOP DIAGNÓSTICOS */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                gridColumn: 'span 2',
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} color="#0284c7" />
                    <span>Patologías y Diagnósticos Clínicos más Frecuentes (CIE-10)</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Total consultas evaluadas: <strong>{datosMorbilidad?.total_atenciones || 0}</strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>CIE-10</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Diagnóstico Clínico</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Casos</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Masc / Fem</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>% Relativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosMorbilidad?.top_diagnosticos || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            No hay diagnósticos registrados en este rango de fechas.
                          </td>
                        </tr>
                      ) : (
                        datosMorbilidad.top_diagnosticos.map((d, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                              {d.codigo_cie10}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{d.diagnostico}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800 }}>{d.total_casos}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>
                              <span style={{ color: '#0284c7', fontWeight: 700 }}>{d.casos_masculinos}M</span> /{' '}
                              <span style={{ color: '#db2777', fontWeight: 700 }}>{d.casos_femeninos}F</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, d.porcentaje)}%`, background: '#0284c7', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem' }}>{d.porcentaje}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRUPOS ETARIOS */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
                  <Users size={16} color="#0284c7" />
                  <span>Distribución por Grupos de Edad</span>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', color: '#64748b' }}>
                  Pacientes atendidos por grupo etario asistencial.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(datosMorbilidad?.distribucion_edad || []).map((e, idx) => {
                    const totalAt = datosMorbilidad?.total_atenciones || 1;
                    const pct = totalAt > 0 ? Math.round((e.total / totalAt) * 100) : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{e.grupo}</span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{e.total} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#0369a1', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: LABORATORIOS Y GABINETES
          ========================================================================= */}
          {reporteActivo === 'LABORATORIOS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.85rem',
              }}>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Estudios</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0.35rem 0 0.15rem' }}>
                    {datosLaboratorios?.kpis?.total || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Órdenes solicitadas</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Publicados</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', margin: '0.35rem 0 0.15rem' }}>
                    {datosLaboratorios?.kpis?.publicados || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669' }}>Resultados listos</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Pendientes</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706', margin: '0.35rem 0 0.15rem' }}>
                    {datosLaboratorios?.kpis?.pendientes || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706' }}>Por procesar</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Cumplimiento</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0284c7', margin: '0.35rem 0 0.15rem' }}>
                    {datosLaboratorios?.kpis?.tasa_cumplimiento || 0}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>Tasa de entrega técnica</div>
                </div>
              </div>

              {/* LISTADO DE ESTUDIOS */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FlaskConical size={16} color="#0284c7" />
                    <span>Órdenes Paraclínicas y Pruebas Complementarias</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Estudio</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Paciente</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Médico Solicitante</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosLaboratorios?.estudios || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            No hay estudios solicitados en este rango.
                          </td>
                        </tr>
                      ) : (
                        datosLaboratorios.estudios.map((est) => (
                          <tr key={est.id_estudio} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{est.codigo_estudio}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>{est.nombre_estudio}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{est.tipo_estudio}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{est.paciente}</div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>CI: {est.paciente_ci}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{est.medico_solicitante}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: est.estado === 'PUBLICADO' ? '#ecfdf5' : '#fef3c7',
                                color: est.estado === 'PUBLICADO' ? '#059669' : '#d97706',
                                border: est.estado === 'PUBLICADO' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                              }}>
                                {est.estado}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: CANCELACIONES E INASISTENCIAS
          ========================================================================= */}
          {reporteActivo === 'CANCELACIONES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem',
              }}>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>Citas Perdidas</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626', margin: '0.35rem 0 0.15rem' }}>
                    {datosCancelaciones?.total_perdidas || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>Canceladas + Inasistencias</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Cancelaciones Formales</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#d97706', margin: '0.35rem 0 0.15rem' }}>
                    {datosCancelaciones?.total_canceladas || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706' }}>Aviso con antelación</div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Inasistencias Sin Aviso</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0.35rem 0 0.15rem' }}>
                    {datosCancelaciones?.total_inasistencias || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ausencia en sala de espera</div>
                </div>
              </div>

              {/* LISTADO DE CITAS PERDIDAS */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} color="#dc2626" />
                    <span>Bitácora de Citas Perdidas y Justificaciones</span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Fecha y Hora</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Paciente</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Médico</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Estado</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Motivo Registrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosCancelaciones?.citas_afectadas || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#059669', fontStyle: 'italic', fontWeight: 700 }}>
                            ✓ Excelente desempeño: 0 cancelaciones ni inasistencias en este intervalo.
                          </td>
                        </tr>
                      ) : (
                        datosCancelaciones.citas_afectadas.map((c) => (
                          <tr key={c.id_cita} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>{c.codigo_cita}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{c.fecha_cita} ({c.hora_inicio})</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{c.paciente}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{c.medico}</td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: c.estado_cita === 'CANCELADA' ? '#fef3c7' : '#fee2e2',
                                color: c.estado_cita === 'CANCELADA' ? '#d97706' : '#dc2626',
                              }}>
                                {c.estado_cita}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontStyle: 'italic', color: '#64748b' }}>
                              {c.motivo_cancelacion}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          5. MODAL FORMAL DE IMPRESIÓN Y EXPORTACIÓN A PDF CON MEMBRETE
      ========================================================================= */}
      {modalImpresionAbierto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#ffffff',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* BARRA SUPERIOR DEL MODAL (NO SE IMPRIME) */}
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800 }}>
                <Printer size={18} color="#38bdf8" />
                <span>Vista Previa de Informe Formal (Listo para Imprimir / PDF)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '7px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalImpresionAbierto(false)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '7px',
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#cbd5e1',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* HOJA IMPRIMIBLE */}
            <div style={{ padding: '2rem', overflowY: 'auto', color: '#0f172a', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {/* MEMBRETE OFICIAL */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Clínica Vida Salud S.R.L.
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                    Departamento de Auditoría Médica, Calidad Asistencial y Estadística
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    NIT: 1028472024 • Av. Las Américas #450 • Santa Cruz de la Sierra, Bolivia
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.72rem' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>INFORME ESTADÍSTICO OFICIAL</div>
                  <div style={{ color: '#64748b' }}>Módulo: CU21 - {reporteActivo}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Emisión: {new Date().toLocaleString('es-BO')}</div>
                </div>
              </div>

              {/* METADATOS DEL REPORTE */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                fontSize: '0.72rem',
                marginBottom: '1.25rem',
              }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Reporte:</span>
                  <strong style={{ color: '#0f172a' }}>{reporteActivo}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Intervalo:</span>
                  <strong style={{ color: '#0f172a' }}>{fechaInicio} al {fechaFin}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Especialidad:</span>
                  <strong style={{ color: '#0f172a' }}>{idEspecialidad === 'todas' ? 'Todas' : 'Filtrada'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Emisor:</span>
                  <strong style={{ color: '#0f172a' }}>Auditoría Médica</strong>
                </div>
              </div>

              {/* TABLA FORMAL SEGÚN EL REPORTE */}
              {reporteActivo === 'PRODUCTIVIDAD' && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
                    Cuadro de Productividad Médica por Profesional
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 800 }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Médico</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Especialidad</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Total Citas</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Atendidas</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Inasistencias</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Canceladas</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Efectividad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosProductividad?.filas || []).map((f) => (
                        <tr key={f.id_medico} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 700 }}>{f.medico}</td>
                          <td style={{ padding: '6px 8px' }}>{f.especialidad}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{f.total_citas}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{f.atendidas}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{f.inasistencias}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{f.canceladas}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{f.tasa_efectividad}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reporteActivo === 'MORBILIDAD' && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155' }}>
                    Cuadro Epidemiológico de Morbilidad Frecuente (CIE-10)
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 800 }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>CIE-10</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Diagnóstico Clínico</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>Casos</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center' }}>M / F</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(datosMorbilidad?.top_diagnosticos || []).map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 800 }}>{d.codigo_cie10}</td>
                          <td style={{ padding: '6px 8px' }}>{d.diagnostico}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{d.total_casos}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{d.casos_masculinos}M / {d.casos_femeninos}F</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{d.porcentaje}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PIE DE FIRMA INSTITUCIONAL */}
              <div style={{ marginTop: '3.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', textAlign: 'center', fontSize: '0.72rem' }}>
                <div>
                  <div style={{ borderTop: '1px solid #64748b', width: '200px', margin: '0 auto 0.35rem' }}></div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Dra. Claudia Gutiérrez</strong>
                  <span style={{ color: '#64748b' }}>Jefa de Auditoría y Calidad Médica</span>
                </div>
                <div>
                  <div style={{ borderTop: '1px solid #64748b', width: '200px', margin: '0 auto 0.35rem' }}></div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Dr. Roberto Fernández V.</strong>
                  <span style={{ color: '#64748b' }}>Director Médico Asistencial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CU21_ReportesView;
