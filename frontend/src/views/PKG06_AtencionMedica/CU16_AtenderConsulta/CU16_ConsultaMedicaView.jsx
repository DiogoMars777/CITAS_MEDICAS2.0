import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import {
  Stethoscope,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Activity,
  HeartPulse,
  Thermometer,
  Wind,
  Weight,
  Ruler,
  FileText,
  Pill,
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  History,
  FileCheck,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCU16AtencionMedicaController } from '../../../controllers/PKG06_AtencionMedica/CU16_AtenderConsulta/CU16_AtencionMedicaController';

const CIE10_PREDEFINIDOS = [
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (Resfriado común)' },
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
  { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2' },
  { codigo: 'K29', descripcion: 'Gastritis y duodenitis' },
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado (Lumbalgia)' },
  { codigo: 'J20', descripcion: 'Bronquitis aguda' },
  { codigo: 'R51', descripcion: 'Cefalea (Dolor de cabeza)' },
  { codigo: 'A09', descripcion: 'Gastroenteritis y colitis de presunto origen infeccioso' },
  { codigo: 'K21.9', descripcion: 'Enfermedad por reflujo gastroesofágico sin esofagitis' },
  { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado' },
];

const ESTUDIOS_PREDEFINIDOS = [
  'Hemograma completo con plaquetas',
  'Perfil lipídico (Colesterol, Triglicéridos, HDL, LDL)',
  'Glucemia en ayunas',
  'Creatinina y Urea sérica',
  'Examen general de orina (EGO)',
  'Radiografía de tórax (PA)',
  'Ecografía abdominal completa',
  'Electrocardiograma basal (ECG)',
];

const ESPECIALIDADES_DERIVACION = [
  'Cardiología',
  'Traumatología y Ortopedia',
  'Reumatología',
  'Gastroenterología',
  'Endocrinología',
  'Neurología',
  'Neumología',
  'Dermatología',
  'Oftalmología',
  'Nefrología',
];

export const CU16_ConsultaMedicaView = ({ initialCitaId = 2, onBackToAgenda }) => {
  const {
    idCitaActiva,
    consultaData,
    loading,
    guardando,
    error,
    mensajeExito,
    alertaFarmaco,
    formData,
    cargarConsulta,
    actualizarCampo,
    actualizarSignoVital,
    alternarOrdenLaboratorio,
    seleccionarDiagnosticoCie10,
    guardarAtencion,
    limpiarMensajes,
  } = useCU16AtencionMedicaController();

  const [activeTab, setActiveTab] = useState('atencion'); // 'atencion' | 'historial' | 'laboratorios'
  const [listaCitasHoy, setListaCitasHoy] = useState([]);
  const [nuevoEstudioPersonalizado, setNuevoEstudioPersonalizado] = useState('');

  // Cargar lista de citas del día para permitir cambiar de paciente si se entra directo
  useEffect(() => {
    fetch(`${API_ENDPOINTS.agendaMedica}/hoy?id_medico=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.data?.bloques) {
          setListaCitasHoy(data.data.bloques);
        }
      })
      .catch((err) => console.warn('No se pudo cargar la lista rápida de citas', err));
  }, []);

  // Cargar consulta inicial
  useEffect(() => {
    if (initialCitaId) {
      cargarConsulta(initialCitaId);
    }
  }, [initialCitaId, cargarConsulta]);

  // Chequeo proactivo de alergias contra el texto de la receta
  const alergiasTexto = consultaData?.historia_clinica?.alergias_medicamentos || '';
  const tieneAlergias = alergiasTexto.trim().length > 0 && !alergiasTexto.toLowerCase().includes('ninguna');

  const advertenciaAlergiaLocal = React.useMemo(() => {
    if (!tieneAlergias || !formData.receta_medica) return null;
    const recetaLower = formData.receta_medica.toLowerCase();
    const alergiasLower = alergiasTexto.toLowerCase();

    const palabrasClave = ['penicilina', 'amoxicilina', 'aspirina', 'ibuprofeno', 'sulfas', 'paracetamol', 'dipirona', 'diclofenaco', 'eritromicina'];
    for (const palabra of palabrasClave) {
      if (alergiasLower.includes(palabra) && recetaLower.includes(palabra)) {
        return `¡ALERTA CRÍTICA DE INTERACCIÓN! El paciente presenta alergia a "${palabra.toUpperCase()}" y se ha redactado dicho fármaco en la prescripción.`;
      }
    }
    return null;
  }, [tieneAlergias, alergiasTexto, formData.receta_medica]);

  // Clasificación de IMC
  const imcValor = parseFloat(formData.signos_vitales.imc);
  let imcBadge = { texto: 'Sin calcular', color: '#64748b', bg: '#f1f5f9' };
  if (!isNaN(imcValor) && imcValor > 0) {
    if (imcValor < 18.5) {
      imcBadge = { texto: `IMC ${imcValor} - Bajo peso`, color: '#d97706', bg: '#fef3c7' };
    } else if (imcValor < 25) {
      imcBadge = { texto: `IMC ${imcValor} - Peso Normal`, color: '#16a34a', bg: '#dcfce7' };
    } else if (imcValor < 30) {
      imcBadge = { texto: `IMC ${imcValor} - Sobrepeso`, color: '#ea580c', bg: '#ffedd5' };
    } else {
      imcBadge = { texto: `IMC ${imcValor} - Obesidad`, color: '#dc2626', bg: '#fee2e2' };
    }
  }

  const handleAgregarEstudioPersonalizado = (e) => {
    e.preventDefault();
    if (!nuevoEstudioPersonalizado.trim()) return;
    alternarOrdenLaboratorio(nuevoEstudioPersonalizado.trim());
    setNuevoEstudioPersonalizado('');
  };

  return (
    <div style={{ padding: '0.5rem 1rem 3rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 1. BARRA SUPERIOR DE ACCIONES */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
        background: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToAgenda && (
            <button
              type="button"
              onClick={onBackToAgenda}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              Volver a la Agenda
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}>
                CU16
              </span>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Atender Consulta y Registrar Evolución Clínica
              </h1>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Documentación del acto médico, anamnesis, constantes vitales, prescripción y derivación.
            </p>
          </div>
        </div>

        {/* SELECTOR RÁPIDO DE PACIENTES DE HOY */}
        {listaCitasHoy.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
              Turno del Paciente:
            </label>
            <select
              value={idCitaActiva || ''}
              onChange={(e) => cargarConsulta(Number(e.target.value))}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              {listaCitasHoy.map((b) => (
                <option key={b.id_cita} value={b.id_cita}>
                  {b.hora_inicio} - {b.paciente_nombre} ({b.estado})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* NOTIFICACIONES Y ALERTAS */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          color: '#b91c1c',
          marginBottom: '1rem',
          fontSize: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={limpiarMensajes}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {mensajeExito && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          color: '#15803d',
          marginBottom: '1rem',
          fontSize: '0.88rem',
          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700 }}>¡Atención Registrada Inmutablemente!</div>
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>{mensajeExito}</div>
            </div>
          </div>
          <button
            onClick={limpiarMensajes}
            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {(alertaFarmaco || advertenciaAlergiaLocal) && (
        <div style={{
          background: '#fff1f2',
          border: '2px solid #e11d48',
          borderRadius: '10px',
          padding: '0.9rem 1.25rem',
          color: '#9f1239',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.15)',
        }}>
          <ShieldAlert size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#be123c' }}>
              ¡ADVERTENCIA DE SEGURIDAD FARMACOLÓGICA DEL PACIENTE!
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
              {advertenciaAlergiaLocal || alertaFarmaco}
            </p>
          </div>
        </div>
      )}

      {loading && !consultaData ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #e0f2fe', borderTop: '3px solid #0284c7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.88rem' }}>Cargando expediente e historia clínica del paciente...</p>
        </div>
      ) : consultaData ? (
        <>
          {/* 2. TARJETA CABECERA DEL PACIENTE Y EXPEDIENTE */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem 1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              {/* DATOS PACIENTE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                }}>
                  {consultaData.paciente?.nombre_completo?.[0] || 'P'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {consultaData.paciente?.nombre_completo}
                    </h2>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#475569',
                    }}>
                      CI: {consultaData.paciente?.ci || 'S/N'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#e0f2fe',
                      border: '1px solid #bae6fd',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#0369a1',
                    }}>
                      EXP: {consultaData.historia_clinica?.numero_expediente || 'EXP-BASE'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span><strong>Edad exacta:</strong> {consultaData.paciente?.edad_anos ?? 'N/D'} años</span>
                    <span>•</span>
                    <span><strong>Género:</strong> {consultaData.paciente?.genero || 'N/D'}</span>
                    <span>•</span>
                    <span>
                      <strong>Grupo Sanguíneo:</strong>{' '}
                      <span style={{
                        color: '#b91c1c',
                        fontWeight: 800,
                        background: '#fee2e2',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}>
                        {consultaData.paciente?.tipo_sangre || 'O+'}
                      </span>
                    </span>
                    <span>•</span>
                    <span><strong>Teléfono:</strong> {consultaData.paciente?.telefono || 'N/D'}</span>
                  </div>
                </div>
              </div>

              {/* DATOS CITA Y ESTADO */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '8px', background: consultaData.cita?.estado_cita === 'ATENDIDA' ? '#dcfce7' : '#fef9c3', color: consultaData.cita?.estado_cita === 'ATENDIDA' ? '#166534' : '#854d0e', fontWeight: 700, fontSize: '0.78rem' }}>
                  <Clock size={14} />
                  <span>Estado: {consultaData.cita?.estado_cita || 'CONFIRMADA'}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Turno: <strong>{consultaData.cita?.hora_cita} - {consultaData.cita?.hora_fin_cita}</strong> | {consultaData.cita?.fecha_cita}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0369a1', marginTop: '0.2rem' }}>
                  Médico: Dr. {consultaData.medico?.nombre_completo} ({consultaData.medico?.especialidad})
                </div>
              </div>
            </div>

            {/* BANNER PROMINENTE DE ALERGIAS */}
            <div style={{
              marginTop: '1rem',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              background: tieneAlergias ? '#fff1f2' : '#f0fdf4',
              border: tieneAlergias ? '1px solid #fecdd3' : '1px solid #bbf7d0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {tieneAlergias ? (
                  <AlertTriangle size={20} color="#e11d48" style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: tieneAlergias ? '#be123c' : '#15803d',
                  }}>
                    {tieneAlergias ? 'Alergias Medicamentosas Registradas' : 'Sin Alergias Conocidas Registradas'}
                  </span>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: tieneAlergias ? 700 : 500,
                    color: tieneAlergias ? '#9f1239' : '#166534',
                    marginTop: '2px',
                  }}>
                    {alergiasTexto || 'No reporta alergias medicamentosas hasta la fecha.'}
                  </div>
                </div>
              </div>

              {consultaData.historia_clinica?.antecedentes_familiares && (
                <div style={{ fontSize: '0.76rem', color: '#475569', textAlign: 'right', maxWidth: '350px' }}>
                  <strong>Antecedentes Familiares:</strong> {consultaData.historia_clinica.antecedentes_familiares}
                </div>
              )}
            </div>
          </div>

          {/* 3. PESTAÑAS DE NAVEGACIÓN DE LA CONSULTA */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '1.25rem',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('atencion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'atencion' ? '3px solid #0284c7' : '3px solid transparent',
                color: activeTab === 'atencion' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'atencion' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              <Stethoscope size={18} />
              Registro de Acto Médico y Evolución
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'historial' ? '3px solid #0284c7' : '3px solid transparent',
                color: activeTab === 'historial' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'historial' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              <History size={18} />
              Historial Clínico Cronológico ({consultaData.historial_atenciones?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('laboratorios')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'laboratorios' ? '3px solid #0284c7' : '3px solid transparent',
                color: activeTab === 'laboratorios' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'laboratorios' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginBottom: '-2px',
              }}
            >
              <FlaskConical size={18} />
              Resultados de Laboratorio ({consultaData.laboratorios_previos?.length || 0})
            </button>
          </div>

          {/* TAB 1: FORMULARIO DE EVOLUCIÓN CLÍNICA */}
          {activeTab === 'atencion' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.15fr)', gap: '1.25rem' }}>
              {/* COLUMNA IZQUIERDA: FORMULARIO PRINCIPAL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* SECCIÓN 1: MOTIVO Y SÍNTOMAS */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileText size={17} color="#0284c7" />
                    Motivo de Consulta y Síntomas
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Motivo Principal de la Consulta *
                      </label>
                      <input
                        type="text"
                        value={formData.motivo_consulta}
                        onChange={(e) => actualizarCampo('motivo_consulta', e.target.value)}
                        placeholder="Ej. Control de hipertensión arterial / Dolor faríngeo agudo"
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Anamnesis / Síntomas y Evolución del Cuadro Clínico
                      </label>
                      <textarea
                        rows={3}
                        value={formData.sintomas}
                        onChange={(e) => actualizarCampo('sintomas', e.target.value)}
                        placeholder="Paciente refiere cuadro de 3 días de evolución caracterizado por malestar general, odinofagia, sensación febril..."
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: SIGNOS VITALES Y CONSTANTES */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <HeartPulse size={17} color="#e11d48" />
                      Signos Vitales y Somatometría
                    </h3>

                    {/* BADGE IMC AUTOMÁTICO */}
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: imcBadge.bg,
                      color: imcBadge.color,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {imcBadge.texto}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        P. Arterial (mmHg)
                      </label>
                      <input
                        type="text"
                        value={formData.signos_vitales.presion_arterial}
                        onChange={(e) => actualizarSignoVital('presion_arterial', e.target.value)}
                        placeholder="120/80"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        Frec. Cardíaca (lpm)
                      </label>
                      <input
                        type="number"
                        value={formData.signos_vitales.frecuencia_cardiaca}
                        onChange={(e) => actualizarSignoVital('frecuencia_cardiaca', e.target.value)}
                        placeholder="75"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        Temperatura (°C)
                      </label>
                      <input
                        type="text"
                        value={formData.signos_vitales.temperatura}
                        onChange={(e) => actualizarSignoVital('temperatura', e.target.value)}
                        placeholder="36.5"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        Saturación O2 (%)
                      </label>
                      <input
                        type="number"
                        value={formData.signos_vitales.saturacion_oxigeno}
                        onChange={(e) => actualizarSignoVital('saturacion_oxigeno', e.target.value)}
                        placeholder="98"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.signos_vitales.peso}
                        onChange={(e) => actualizarSignoVital('peso', e.target.value)}
                        placeholder="70"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                        Talla (cm / m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.signos_vitales.talla}
                        onChange={(e) => actualizarSignoVital('talla', e.target.value)}
                        placeholder="170"
                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: DIAGNÓSTICO CLÍNICO Y CIE-10 */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Activity size={17} color="#16a34a" />
                    Diagnóstico Clínico (CIE-10) *
                  </h3>

                  {/* PILLS RÁPIDAS DE CIE-10 FRECUENTES */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Diagnósticos frecuentes (clic para autocompletar):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {CIE10_PREDEFINIDOS.map((item) => (
                        <button
                          key={item.codigo}
                          type="button"
                          onClick={() => seleccionarDiagnosticoCie10(item)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: formData.diagnostico_cie10 === item.codigo ? '1px solid #0284c7' : '1px solid #e2e8f0',
                            background: formData.diagnostico_cie10 === item.codigo ? '#e0f2fe' : '#f8fafc',
                            color: formData.diagnostico_cie10 === item.codigo ? '#0369a1' : '#334155',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <strong>{item.codigo}:</strong> {item.descripcion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Código CIE-10
                      </label>
                      <input
                        type="text"
                        value={formData.diagnostico_cie10}
                        onChange={(e) => actualizarCampo('diagnostico_cie10', e.target.value.toUpperCase())}
                        placeholder="Ej. J00"
                        style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Descripción del Diagnóstico / Juicio Clínico *
                      </label>
                      <input
                        type="text"
                        value={formData.diagnostico_descripcion}
                        onChange={(e) => actualizarCampo('diagnostico_descripcion', e.target.value)}
                        placeholder="Descripción médica detallada del diagnóstico principal..."
                        style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 4: TRATAMIENTO Y PRESCRIPCIÓN MÉDICA */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Pill size={17} color="#8b5cf6" />
                    Tratamiento y Prescripción Farmacológica (Receta)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Plan Terapéutico y Conducta Médica
                      </label>
                      <textarea
                        rows={2}
                        value={formData.tratamiento}
                        onChange={(e) => actualizarCampo('tratamiento', e.target.value)}
                        placeholder="Reposo relativo por 48 horas, hidratación abundante, dieta blanda normosódica..."
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                          Receta Médica y Posología (Verificada contra Alergias)
                        </label>
                        {tieneAlergias && (
                          <span style={{ fontSize: '0.72rem', color: '#e11d48', fontWeight: 700 }}>
                            ⚠️ Verificar: Paciente alérgico a {alergiasTexto}
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={formData.receta_medica}
                        onChange={(e) => actualizarCampo('receta_medica', e.target.value)}
                        placeholder="1. Paracetamol 500mg - 1 comp vía oral cada 8 horas por 3 días si hay fiebre o dolor&#10;2. Loratadina 10mg - 1 comp vía oral en la noche por 5 días"
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: advertenciaAlergiaLocal ? '2px solid #e11d48' : '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace',
                          resize: 'vertical',
                          background: advertenciaAlergiaLocal ? '#fff1f2' : '#ffffff',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: ÓRDENES DE ESTUDIOS, DERIVACIÓN Y BOTÓN FINALIZAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* BOTÓN DE ACCIÓN PRINCIPAL (GUARDAR Y FINALIZAR) */}
                <div style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  color: '#ffffff',
                  boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)',
                }}>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800 }}>
                    Finalizar Acto Médico (CU16)
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.76rem', color: '#e0f2fe', lineHeight: 1.4 }}>
                    Al guardar, la cita se marcará como <strong>ATENDIDA</strong>, se anexará el registro a la historia clínica inmutable y se emitirán las órdenes indicadas.
                  </p>

                  <button
                    type="button"
                    disabled={guardando}
                    onClick={guardarAtencion}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#ffffff',
                      color: '#0369a1',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: guardando ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.15s ease',
                      opacity: guardando ? 0.7 : 1,
                    }}
                  >
                    {guardando ? (
                      <span>Guardando evolución médica...</span>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar y Finalizar Consulta
                      </>
                    )}
                  </button>
                </div>

                {/* ÓRDENES DE LABORATORIOS / ESTUDIOS COMPLEMENTARIOS */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.15rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FlaskConical size={16} color="#0284c7" />
                      Órdenes de Exámenes / Rayos X
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                      {formData.ordenes_laboratorio.length} seleccionados
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
                    Marque los exámenes complementarios que se solicitarán a Laboratorio / Imagenología:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '230px', overflowY: 'auto' }}>
                    {ESTUDIOS_PREDEFINIDOS.map((estudio) => {
                      const isSelected = formData.ordenes_laboratorio.includes(estudio);
                      return (
                        <label
                          key={estudio}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            background: isSelected ? '#f0fdf4' : '#f8fafc',
                            border: isSelected ? '1px solid #86efac' : '1px solid #e2e8f0',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            color: isSelected ? '#166534' : '#334155',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => alternarOrdenLaboratorio(estudio)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{estudio}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* AGREGAR OTRO ESTUDIO PERSONALIZADO */}
                  <form onSubmit={handleAgregarEstudioPersonalizado} style={{ marginTop: '0.65rem', display: 'flex', gap: '0.35rem' }}>
                    <input
                      type="text"
                      placeholder="Otro estudio (ej. Ecografía Doppler)..."
                      value={nuevoEstudioPersonalizado}
                      onChange={(e) => setNuevoEstudioPersonalizado(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.75rem',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                </div>

                {/* DERIVACIÓN A OTRA ESPECIALIDAD */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.15rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Send size={16} color="#d97706" />
                    Derivación Médica / Interconsulta
                  </h3>
                  <p style={{ margin: '0 0 0.65rem', fontSize: '0.72rem', color: '#64748b' }}>
                    Indicar especialidad médica si el paciente requiere interconsulta:
                  </p>

                  <select
                    value={formData.derivacion_especialidad}
                    onChange={(e) => actualizarCampo('derivacion_especialidad', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      color: '#0f172a',
                      background: '#f8fafc',
                    }}
                  >
                    <option value="">-- Sin derivación médica (Alta en consulta) --</option>
                    {ESPECIALIDADES_DERIVACION.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ACTUALIZACIÓN PROACTIVA DE ALERGIAS */}
                <div style={{
                  background: '#fffbeb',
                  borderRadius: '12px',
                  border: '1px solid #fef3c7',
                  padding: '1rem',
                }}>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>
                    Actualizar Alergias en Historia Clínica Base
                  </h4>
                  <input
                    type="text"
                    value={formData.actualizar_alergias}
                    onChange={(e) => actualizarCampo('actualizar_alergias', e.target.value)}
                    placeholder="Ninguna o especificar..."
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #fde68a',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORIAL CLÍNICO PREVIO */}
          {activeTab === 'historial' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="#0284c7" />
                Historial Cronológico de Consultas y Atenciones
              </h3>

              {(!consultaData.historial_atenciones || consultaData.historial_atenciones.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No se registran atenciones clínicas previas para este paciente. Esta consulta constituirá su primera evolución.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {consultaData.historial_atenciones.map((item, idx) => (
                    <div
                      key={item.id_atencion || idx}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        padding: '1rem',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: '#ffffff' }}>
                            {item.fecha}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            Dr. {item.medico}
                          </span>
                        </div>
                        {item.diagnostico_cie10 && (
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                            CIE-10: {item.diagnostico_cie10}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.35rem' }}>
                        <strong>Motivo:</strong> {item.motivo_consulta}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.35rem' }}>
                        <strong>Diagnóstico:</strong> {item.diagnostico}
                      </div>
                      {item.tratamiento && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                          <strong>Tratamiento:</strong> {item.tratamiento}
                        </div>
                      )}
                      {item.receta && (
                        <div style={{ fontSize: '0.8rem', color: '#1e293b', background: '#f1f5f9', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                          <strong>Receta:</strong> {item.receta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESULTADOS DE LABORATORIO */}
          {activeTab === 'laboratorios' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
            }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={18} color="#0284c7" />
                Estudios de Laboratorio y Pruebas Diagnósticas
              </h3>

              {(!consultaData.laboratorios_previos || consultaData.laboratorios_previos.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No se encuentran resultados de laboratorio registrados para este paciente.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {consultaData.laboratorios_previos.map((lab, idx) => (
                    <div
                      key={lab.id_laboratorio || idx}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        padding: '1rem',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                          {lab.tipo_estudio}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: lab.estado === 'PUBLICADO' || lab.estado === 'COMPLETADO' ? '#dcfce7' : '#fef9c3',
                          color: lab.estado === 'PUBLICADO' || lab.estado === 'COMPLETADO' ? '#166534' : '#854d0e',
                        }}>
                          {lab.estado}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        Fecha: {lab.fecha_estudio}
                      </div>

                      {lab.resultado && (
                        <div style={{ fontSize: '0.82rem', color: '#334155', background: '#ffffff', padding: '0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <strong>Resultado:</strong> {lab.resultado}
                        </div>
                      )}

                      {lab.valores_referencia && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                          Ref: {lab.valores_referencia}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default CU16_ConsultaMedicaView;
