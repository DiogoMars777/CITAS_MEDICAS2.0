import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getInitialReservaFormState } from '../../../models/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CitaModel';
import { API_ENDPOINTS } from '@/config/api';

export const ModalReservarCita = ({
  isOpen,
  onClose,
  onSave,
  pacientesMeta = [],
  especialidadesMeta = [],
  medicosMeta = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState(getInitialReservaFormState());
  const [localError, setLocalError] = useState(null);

  // Slots dinámicos disponibles para el médico y fecha seleccionados
  const [availableSlots, setAvailableSlots] = useState([]);
  const [proximosDias, setProximosDias] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reset del formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialReservaFormState());
      setLocalError(null);
      setAvailableSlots([]);
      setProximosDias([]);
    }
  }, [isOpen]);

  // Filtrar médicos según especialidad seleccionada
  const filteredMedicos = formData.id_especialidad
    ? medicosMeta.filter((m) =>
        (m.especialidades_ids || []).includes(Number(formData.id_especialidad))
      )
    : medicosMeta;

  // Auto-seleccionar médico si solo hay 1 disponible para la especialidad
  useEffect(() => {
    if (formData.id_especialidad && filteredMedicos.length === 1) {
      if (formData.id_medico !== String(filteredMedicos[0].id_medico)) {
        setFormData((prev) => ({ ...prev, id_medico: String(filteredMedicos[0].id_medico) }));
      }
    }
  }, [formData.id_especialidad, filteredMedicos, formData.id_medico]);

  // Cargar slots disponibles cuando cambie médico o fecha
  useEffect(() => {
    const fetchSlotsDisponibles = async () => {
      if (!formData.id_medico || !formData.fecha_cita) {
        setAvailableSlots([]);
        setProximosDias([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const res = await fetch(
          `${API_ENDPOINTS.disponibilidad}?fecha=${formData.fecha_cita}&id_medico=${formData.id_medico}`
        );
        if (res.ok) {
          const json = await res.json();
          const doc = json.medicos?.[0];
          const slots = doc?.slots || [];
          setAvailableSlots(slots);
          setProximosDias(json.proximos_dias || []);

          // Si el horario actual no está seleccionado o no está disponible, auto-seleccionar el primer cupo libre
          const primerLibre = slots.find((s) => s.estado === 'DISPONIBLE');
          if (primerLibre) {
            setFormData((prev) => {
              // Si ya tiene un slot libre seleccionado, mantenerlo
              const currentSlotLibre = slots.find(
                (s) => s.hora_inicio === prev.hora_inicio && s.estado === 'DISPONIBLE'
              );
              if (currentSlotLibre) return prev;

              return {
                ...prev,
                hora_inicio: primerLibre.hora_inicio,
                hora_fin: primerLibre.hora_fin,
              };
            });
          }
        }
      } catch (err) {
        console.error('Error cargando slots disponibles:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlotsDisponibles();
  }, [formData.id_medico, formData.fecha_cita]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.id_paciente) {
      setLocalError('Por favor seleccione un paciente.');
      return;
    }
    if (!formData.id_especialidad) {
      setLocalError('Por favor seleccione una especialidad médica.');
      return;
    }
    if (!formData.id_medico) {
      setLocalError('Por favor seleccione un médico.');
      return;
    }
    if (!formData.fecha_cita) {
      setLocalError('Por favor ingrese la fecha de la cita.');
      return;
    }
    if (!formData.hora_inicio || !formData.hora_fin) {
      setLocalError('Por favor seleccione un bloque horario de atención.');
      return;
    }
    if (!formData.motivo_consulta.trim()) {
      setLocalError('Por favor describa el motivo de la consulta médica.');
      return;
    }

    const res = await onSave(formData);
    if (!res.success) {
      setLocalError(res.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#f0f9ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bae6fd',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Reservar Cita Médica (Ficha)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Control de concurrencia en tiempo real y emisión de ticket oficial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, color: '#0f172a' }}>
            {localError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* PACIENTE */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Paciente Afiliado *
                </label>
                <select
                  value={formData.id_paciente}
                  onChange={(e) => setFormData({ ...formData, id_paciente: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="">Seleccione un paciente por nombre o CI...</option>
                  {pacientesMeta.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombre_completo} — CI: {p.ci} (Exp: {p.numero_expediente})
                    </option>
                  ))}
                </select>
              </div>

              {/* ESPECIALIDAD */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Especialidad Médica *
                </label>
                <select
                  value={formData.id_especialidad}
                  onChange={(e) => {
                    setFormData({ ...formData, id_especialidad: e.target.value, id_medico: '' });
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                >
                  <option value="">Seleccione especialidad...</option>
                  {especialidadesMeta.map((esp) => (
                    <option key={esp.id_especialidad} value={esp.id_especialidad}>
                      {esp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* MÉDICO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Médico Especialista *
                </label>
                <select
                  value={formData.id_medico}
                  onChange={(e) => setFormData({ ...formData, id_medico: e.target.value })}
                  required
                  disabled={formData.id_especialidad && filteredMedicos.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    opacity: formData.id_especialidad && filteredMedicos.length === 0 ? 0.6 : 1,
                  }}
                >
                  <option value="">
                    {formData.id_especialidad && filteredMedicos.length === 0
                      ? 'Sin médicos para esta especialidad'
                      : 'Seleccione médico...'}
                  </option>
                  {filteredMedicos.map((m) => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nombre_completo}
                    </option>
                  ))}
                </select>
                {formData.id_especialidad && filteredMedicos.length === 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '3px' }}>
                    ⚠️ No hay médicos asignados a esta especialidad. Elija otra área.
                  </div>
                )}
              </div>

              {/* FECHA DE LA CITA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Fecha de Atención *
                </label>
                <input
                  type="date"
                  value={formData.fecha_cita}
                  onChange={(e) => setFormData({ ...formData, fecha_cita: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              {/* HORARIO (HORA INICIO & FIN) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Horario de Consulta (Bloque 15 min) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => {
                      const ini = e.target.value;
                      setFormData({ ...formData, hora_inicio: ini });
                    }}
                    required
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.5rem',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                  <span style={{ color: '#64748b', fontWeight: 500 }}>a</span>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    required
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.5rem',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* SELECCIÓN RÁPIDA DE SLOTS DISPONIBLES */}
              {formData.id_medico && (
                <div style={{ gridColumn: 'span 2', marginTop: '0.25rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={15} style={{ color: '#0284c7' }} />
                    <span>Cupos disponibles en la agenda médica (click para seleccionar):</span>
                  </div>

                  {loadingSlots ? (
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Consultando agenda médica...</div>
                  ) : availableSlots.length === 0 ? (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        No se detectaron turnos configurados para este día o todos los cupos se encuentran ocupados.
                      </div>

                      {proximosDias.filter((d) => d.tiene_turnos).length > 0 && (
                        <div style={{ padding: '0.65rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginBottom: '0.45rem', fontWeight: 700 }}>
                            Próximos días con atención médica disponible (click para cambiar fecha):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {proximosDias
                              .filter((d) => d.tiene_turnos)
                              .slice(0, 6)
                              .map((d) => (
                                <button
                                  key={d.fecha}
                                  type="button"
                                  onClick={() => setFormData((prev) => ({ ...prev, fecha_cita: d.fecha }))}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.74rem',
                                    borderRadius: '6px',
                                    border: formData.fecha_cita === d.fecha ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                    background: formData.fecha_cita === d.fecha ? '#f0f9ff' : '#ffffff',
                                    color: formData.fecha_cita === d.fecha ? '#0284c7' : '#334155',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: formData.fecha_cita === d.fecha ? 700 : 500,
                                  }}
                                >
                                  <span>{d.dia_corto} {d.dia_numero} {d.mes_corto}</span>
                                  <span style={{ color: '#059669', fontWeight: 700 }}>({d.cupos_libres} cupos)</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', maxHeight: '120px', overflowY: 'auto' }}>
                      {availableSlots.map((s, idx) => {
                        const isLibre = s.estado === 'DISPONIBLE';
                        const isSelected = formData.hora_inicio === s.hora_inicio && formData.hora_fin === s.hora_fin;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!isLibre}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                hora_inicio: s.hora_inicio,
                                hora_fin: s.hora_fin,
                              });
                            }}
                            style={{
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              border: isSelected
                                ? '1px solid #0284c7'
                                : isLibre
                                ? '1px solid #a7f3d0'
                                : '1px solid #e2e8f0',
                              background: isSelected
                                ? '#0284c7'
                                : isLibre
                                ? '#ecfdf5'
                                : '#f1f5f9',
                              color: isSelected
                                ? '#ffffff'
                                : isLibre
                                ? '#059669'
                                : '#94a3b8',
                              cursor: isLibre ? 'pointer' : 'not-allowed',
                              fontWeight: isSelected ? 700 : 500,
                              boxShadow: isSelected ? '0 1px 3px rgba(2,132,199,0.3)' : 'none',
                            }}
                          >
                            {s.intervalo} {isLibre ? '✓' : `(${s.estado})`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MOTIVO DE CONSULTA */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Motivo de Consulta *
                </label>
                <textarea
                  rows={2}
                  placeholder="Describa el motivo de la consulta, síntomas principales o control de rutina..."
                  value={formData.motivo_consulta}
                  onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: '#f8fafc',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Procesando Reserva...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirmar y Emitir Ficha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReservarCita;
