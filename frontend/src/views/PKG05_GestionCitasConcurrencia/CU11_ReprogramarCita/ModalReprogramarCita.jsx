import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';
import { getNextWorkingDate } from '../../../models/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CitaModel';
import { API_ENDPOINTS } from '@/config/api';

export const ModalReprogramarCita = ({
  isOpen,
  onClose,
  onReprogramar,
  cita,
  medicosMeta = [],
  loading = false,
}) => {
  const [fechaNueva, setFechaNueva] = useState('');
  const [horaInicioNueva, setHoraInicioNueva] = useState('');
  const [horaFinNueva, setHoraFinNueva] = useState('');
  const [idMedicoNuevo, setIdMedicoNuevo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [localError, setLocalError] = useState(null);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [proximosDias, setProximosDias] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Inicializar estado cuando se abre para una cita
  useEffect(() => {
    if (isOpen && cita) {
      setFechaNueva(getNextWorkingDate());
      setIdMedicoNuevo(String(cita.medico_id || cita.id_medico || ''));
      setHoraInicioNueva('');
      setHoraFinNueva('');
      setMotivo('');
      setLocalError(null);
      setAvailableSlots([]);
      setProximosDias([]);
    }
  }, [isOpen, cita]);

  // Cargar slots disponibles cuando cambie médico o fecha
  useEffect(() => {
    const fetchSlotsDisponibles = async () => {
      if (!idMedicoNuevo || !fechaNueva) {
        setAvailableSlots([]);
        setProximosDias([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const res = await fetch(
          `${API_ENDPOINTS.disponibilidad}?fecha=${fechaNueva}&id_medico=${idMedicoNuevo}`
        );
        if (res.ok) {
          const json = await res.json();
          const doc = json.medicos?.[0];
          const slots = doc?.slots || [];
          setAvailableSlots(slots);
          setProximosDias(json.proximos_dias || []);

          // Auto-seleccionar primer cupo disponible
          const primerLibre = slots.find((s) => s.estado === 'DISPONIBLE');
          if (primerLibre) {
            setHoraInicioNueva(primerLibre.hora_inicio);
            setHoraFinNueva(primerLibre.hora_fin);
          }
        }
      } catch (err) {
        console.error('Error cargando disponibilidad para reprogramar:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlotsDisponibles();
  }, [idMedicoNuevo, fechaNueva]);

  if (!isOpen || !cita) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!fechaNueva) {
      setLocalError('Por favor seleccione la nueva fecha de atención.');
      return;
    }
    if (!horaInicioNueva || !horaFinNueva) {
      setLocalError('Por favor seleccione un horario disponible en la agenda.');
      return;
    }
    if (!motivo.trim() || motivo.trim().length < 4) {
      setLocalError('Por favor ingrese el motivo de la reprogramación (mínimo 4 caracteres).');
      return;
    }

    const payload = {
      fecha_nueva: fechaNueva,
      hora_inicio_nueva: horaInicioNueva,
      hora_fin_nueva: horaFinNueva,
      id_medico_nuevo: idMedicoNuevo ? Number(idMedicoNuevo) : (cita.medico_id || cita.id_medico),
      motivo_reprogramacion: motivo.trim(),
    };

    const res = await onReprogramar(cita.id_cita, payload);
    if (!res.success) {
      setLocalError(res.message);
    } else {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
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
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bae6fd',
              }}
            >
              <RefreshCw size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Reprogramar Cita Médica
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Liberación del cupo anterior y asignación concurrente de nueva fecha
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.4rem', overflowY: 'auto', flex: 1 }}>
            {localError && (
              <div
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            {/* INDICADOR DE PAGO TRANSFERIBLE */}
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '0.74rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
              <span>
                <strong>Pago Válido y Transferible:</strong> Al contar con pago registrado, este se mantiene automáticamente activo y transferido para la nueva fecha y horario que elijas sin cobro adicional.
              </span>
            </div>

            {/* RESUMEN ACTUAL VS NUEVO */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Horario Actual Programado
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#dc2626', marginTop: '3px' }}>
                  {cita.fecha_cita}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  {cita.horario_rango || `${cita.hora_inicio} - ${cita.hora_fin}`}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  {cita.medico_nombre}
                </div>
              </div>

              <div style={{ color: '#0284c7', display: 'flex', justifyContent: 'center' }}>
                <ArrowRight size={22} strokeWidth={2.4} />
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Nuevo Horario Propuesto
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a', marginTop: '3px' }}>
                  {fechaNueva || 'Seleccione fecha...'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>
                  {horaInicioNueva && horaFinNueva ? `${horaInicioNueva} - ${horaFinNueva}` : 'Sin horario'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  {medicosMeta.find((m) => m.id_medico === Number(idMedicoNuevo))?.nombre_completo || cita.medico_nombre}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* MÉDICO ASIGNADO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginBottom: '5px' }}>
                  Médico Especialista *
                </label>
                <select
                  value={idMedicoNuevo}
                  onChange={(e) => setIdMedicoNuevo(e.target.value)}
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
                  {medicosMeta.map((m) => (
                    <option key={m.id_medico} value={m.id_medico}>
                      {m.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              {/* NUEVA FECHA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginBottom: '5px' }}>
                  Nueva Fecha de Consulta *
                </label>
                <input
                  type="date"
                  value={fechaNueva}
                  onChange={(e) => setFechaNueva(e.target.value)}
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

              {/* SLOTS DISPONIBLES */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={14} style={{ color: '#0284c7' }} />
                  <span>Seleccione un nuevo cupo libre en la agenda médica:</span>
                </div>

                {loadingSlots ? (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Consultando agenda médica...</div>
                ) : availableSlots.length === 0 ? (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      No se detectaron turnos configurados para este día o todos los cupos se encuentran ocupados.
                    </div>

                    {proximosDias.filter((d) => d.tiene_turnos).length > 0 && (
                      <div style={{ padding: '0.65rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', marginBottom: '0.4rem', fontWeight: 700 }}>
                          Próximos días con atención médica disponible (click para seleccionar):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {proximosDias
                            .filter((d) => d.tiene_turnos)
                            .slice(0, 6)
                            .map((d) => (
                              <button
                                key={d.fecha}
                                type="button"
                                onClick={() => setFechaNueva(d.fecha)}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.72rem',
                                  borderRadius: '6px',
                                  border: fechaNueva === d.fecha ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                  background: fechaNueva === d.fecha ? '#e0f2fe' : '#ffffff',
                                  color: fechaNueva === d.fecha ? '#0284c7' : '#334155',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                <span>{d.dia_corto} {d.dia_numero} {d.mes_corto}</span>
                                <span style={{ color: '#16a34a' }}>({d.cupos_libres} cupos)</span>
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
                      const isSelected = horaInicioNueva === s.hora_inicio && horaFinNueva === s.hora_fin;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!isLibre}
                          onClick={() => {
                            setHoraInicioNueva(s.hora_inicio);
                            setHoraFinNueva(s.hora_fin);
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: isSelected
                              ? '1px solid #0284c7'
                              : isLibre
                              ? '1px solid #bbf7d0'
                              : '1px solid #e2e8f0',
                            background: isSelected
                              ? '#0284c7'
                              : isLibre
                              ? '#f0fdf4'
                              : '#f1f5f9',
                            color: isSelected
                              ? '#ffffff'
                              : isLibre
                              ? '#15803d'
                              : '#94a3b8',
                            cursor: isLibre ? 'pointer' : 'not-allowed',
                            fontWeight: isSelected ? 700 : 600,
                            boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {s.intervalo} {isLibre ? '✓' : `(${s.estado})`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MOTIVO DE REPROGRAMACIÓN */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginBottom: '5px' }}>
                  Motivo de Reprogramación (Auditable) *
                </label>
                <textarea
                  rows={2}
                  placeholder="Explique el motivo: solicitud de cambio de horario del paciente, incompatibilidad de turno..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
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
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !horaInicioNueva}
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: loading || !horaInicioNueva ? 'not-allowed' : 'pointer',
                opacity: loading || !horaInicioNueva ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Reprogramando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirmar Reprogramación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalReprogramarCita;
