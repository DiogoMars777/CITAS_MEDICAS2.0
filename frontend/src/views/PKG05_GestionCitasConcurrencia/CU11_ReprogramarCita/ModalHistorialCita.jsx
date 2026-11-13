import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import {
  History,
  X,
  RefreshCw,
  Calendar,
  Clock,
  User,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const ModalHistorialCita = ({ isOpen, onClose, cita }) => {
  const [loading, setLoading] = useState(false);
  const [historialData, setHistorialData] = useState({ reprogramaciones: [], cancelacion: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!isOpen || !cita?.id_cita) return;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_ENDPOINTS.citas}/${cita.id_cita}/historial`);
        if (!res.ok) throw new Error('No se pudo cargar el historial de la cita.');
        const json = await res.json();
        setHistorialData({
          reprogramaciones: json.reprogramaciones || [],
          cancelacion: json.cancelacion || null,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [isOpen, cita]);

  if (!isOpen || !cita) return null;

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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bae6fd',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Historial de Cambios • {cita.codigo_cita}
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0' }}>
                Trazabilidad de reprogramaciones y cancelaciones registradas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1 }}>
          {/* PACIENTE Y ESTADO ACTUAL */}
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Paciente: </span>
              <strong style={{ color: '#0f172a' }}>{cita.paciente_nombre}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Estado: </span>
              <strong style={{ color: '#0284c7' }}>{cita.estado_cita}</strong>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem', color: '#0284c7' }} />
              <p style={{ margin: 0, fontSize: '0.82rem' }}>Cargando trazabilidad de la cita...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '1rem', color: '#b91c1c', fontSize: '0.82rem', textAlign: 'center', background: '#fef2f2', borderRadius: '8px' }}>
              {error}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* EVENTO DE CANCELACIÓN SI EXISTE */}
              {historialData.cancelacion && (
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontWeight: 700, fontSize: '0.84rem' }}>
                    <AlertTriangle size={15} />
                    <span>Cita Cancelada</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 'auto' }}>
                      {historialData.cancelacion.fecha_cancelacion}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                    <strong>Motivo:</strong> {historialData.cancelacion.motivo_cancelacion}
                  </div>
                  <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: '#64748b' }}>
                    Responsable: {historialData.cancelacion.responsable}
                  </div>
                </div>
              )}

              {/* TIMELINE DE REPROGRAMACIONES */}
              {historialData.reprogramaciones.length === 0 && !historialData.cancelacion ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                  <CheckCircle2 size={24} style={{ color: '#16a34a', margin: '0 auto 0.5rem', opacity: 0.8 }} />
                  Esta cita se mantiene en su horario original programado sin reprogramaciones previas.
                </div>
              ) : (
                historialData.reprogramaciones.map((r, idx) => (
                  <div
                    key={r.id_reprogramacion || idx}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>
                        Reprogramación #{historialData.reprogramaciones.length - idx}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {String(r.fecha_operacion || '').replace('T', ' ').substring(0, 19)}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center', fontSize: '0.78rem' }}>
                      <div style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <div style={{ color: '#b91c1c', fontWeight: 700 }}>{String(r.fecha_anterior || '').split('T')[0]}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{r.horario_anterior}</div>
                      </div>

                      <ArrowRight size={14} color="#0284c7" />

                      <div style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div style={{ color: '#15803d', fontWeight: 700 }}>{String(r.fecha_nueva || '').split('T')[0]}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{r.horario_nuevo}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.55rem', fontSize: '0.78rem', color: '#334155' }}>
                      <strong>Motivo:</strong> {r.motivo_reprogramacion}
                    </div>

                    <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748b' }}>
                      Registrado por: {r.responsable}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalHistorialCita;
