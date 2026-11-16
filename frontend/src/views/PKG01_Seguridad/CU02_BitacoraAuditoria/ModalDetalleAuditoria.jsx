import React from 'react';
import { X, Shield, Globe, Clock, User, Database, ArrowRight, Layers } from 'lucide-react';
import { getOperacionBadgeStyle } from '../../../models/PKG01_Seguridad/CU02_BitacoraAuditoria/BitacoraModel';

export const ModalDetalleAuditoria = ({ log, onClose }) => {
  if (!log) return null;

  const badge = getOperacionBadgeStyle(log.operacion);

  const formatJson = (data) => {
    if (!data) return 'Sin datos registrados';
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      zIndex: 9999,
      animation: 'fadeInSlideUp 0.2s ease-out forwards',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Encabezado del Modal */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                  Inspección de Registro #{log.id_bitacora}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: badge.bg,
                  color: badge.color || badge.text,
                  border: badge.border,
                }}>
                  {log.operacion}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '3px 0 0' }}>
                Módulo: <strong style={{ color: '#0284c7' }}>{log.modulo}</strong> • Tabla: <strong style={{ color: '#0f172a' }}>{log.tabla_afectada}</strong> (ID: {log.id_registro_afectado})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadatos de Trazabilidad y Hora Bolivia */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Fecha y Hora (Bolivia)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontWeight: 600, fontSize: '0.88rem', marginTop: '3px', fontFamily: 'monospace' }}>
              <Clock size={15} />
              <span>{log.fecha_bolivia || log.fecha_creacion}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Usuario Responsable
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontWeight: 600, fontSize: '0.88rem', marginTop: '3px' }}>
              <User size={15} color="#0284c7" />
              <span>{log.usuario_responsable?.nombre || log.usuario_nombre || log.usuario || 'Sistema'}</span>
              <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                {log.usuario_responsable?.rol || log.rol || 'AUTOR'}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                (@{log.usuario_responsable?.username || log.usuario})
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Dirección IP / Origen
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155', fontWeight: 600, fontSize: '0.88rem', marginTop: '3px', fontFamily: 'monospace' }}>
              <Globe size={15} color="#6366f1" />
              <span>{log.direccion_ip}</span>
            </div>
          </div>
        </div>

        {/* Comparativa JSON (Valores Anteriores vs Valores Nuevos) */}
        <div style={{
          padding: '1.5rem 1.75rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          <h4 style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1rem', fontWeight: 700 }}>
            Auditoría de Datos Modificados (JSON)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Panel de Valores Anteriores */}
            <div style={{
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #fecaca',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                borderBottom: '1px solid #fee2e2',
                color: '#b91c1c',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}>
                <span style={{ color: '#ef4444' }}>●</span> Valores Anteriores (Estado Previo)
              </div>
              <pre style={{
                padding: '1rem',
                margin: 0,
                fontSize: '0.82rem',
                color: '#991b1b',
                background: '#fffafb',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                lineHeight: 1.5,
                maxHeight: '260px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {formatJson(log.valores_anteriores)}
              </pre>
            </div>

            {/* Panel de Valores Nuevos */}
            <div style={{
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid #a7f3d0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: '#ecfdf5',
                borderBottom: '1px solid #d1fae5',
                color: '#047857',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}>
                <span style={{ color: '#10b981' }}>●</span> Valores Nuevos (Estado Actualizado)
              </div>
              <pre style={{
                padding: '1rem',
                margin: 0,
                fontSize: '0.82rem',
                color: '#065f46',
                background: '#f6fbf8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                lineHeight: 1.5,
                maxHeight: '260px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {formatJson(log.valores_nuevos)}
              </pre>
            </div>
          </div>

          {/* User Agent */}
          {log.user_agent && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#64748b',
              wordBreak: 'break-all',
            }}>
              <strong style={{ color: '#334155' }}>User Agent del Cliente:</strong> {log.user_agent}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
