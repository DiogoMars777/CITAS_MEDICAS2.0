import React from 'react';
import {
  Shield,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database,
  Activity,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useCU02BitacoraAuditoriaController } from '../../../controllers/PKG01_Seguridad/CU02_BitacoraAuditoria/CU02_BitacoraAuditoriaController';
import {
  MODULOS_AUDITORIA,
  OPERACIONES_AUDITORIA,
  getOperacionBadgeStyle,
} from '../../../models/PKG01_Seguridad/CU02_BitacoraAuditoria/BitacoraModel';
import { ModalDetalleAuditoria } from './ModalDetalleAuditoria';

export const CU02_BitacoraView = () => {
  const {
    logs,
    pagination,
    stats,
    loading,
    error,
    filters,
    selectedLog,
    setSelectedLog,
    updateFilter,
    setPage,
    resetFilters,
    reload,
  } = useCU02BitacoraAuditoriaController();

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* 1. ENCABEZADO EJECUTIVO */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0284c7',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.4rem',
          }}>
            <span>Seguridad • CU02</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Bitácora de Auditoría
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
            Registro cronológico de operaciones y modificaciones en la base de datos con trazabilidad de IP y usuario.
          </p>
        </div>

        <button
          onClick={reload}
          disabled={loading}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = '#94a3b8';
              e.currentTarget.style.background = '#f8fafc';
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#ffffff';
            }
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Total Eventos
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {stats.total_registros}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Eventos de Hoy
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
            {stats.total_hoy}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #dc2626',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Modificaciones Críticas
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>
            {stats.operaciones_criticas}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #059669',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Accesos de Sesión
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
            {stats.total_logins || stats.total_accesos || 0}
          </div>
        </div>
      </div>

      {/* 3. FILTROS */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}>
        {/* BUSCADOR */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Buscar por tabla, usuario o IP..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* FILTRO MÓDULO */}
        <select
          value={filters.modulo}
          onChange={(e) => updateFilter('modulo', e.target.value)}
          style={{
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          {MODULOS_AUDITORIA.map((m) => (
            <option key={m.value || m.id} value={m.value || m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {/* FILTRO OPERACIÓN */}
        <select
          value={filters.operacion}
          onChange={(e) => updateFilter('operacion', e.target.value)}
          style={{
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          {OPERACIONES_AUDITORIA.map((op) => (
            <option key={op.value || op.id} value={op.value || op.id}>
              {op.label}
            </option>
          ))}
        </select>

        {/* RESET FILTROS */}
        {(filters.modulo !== 'TODOS' || filters.operacion !== 'TODOS' || filters.search) && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* 4. TABLA DE BITÁCORA */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
            <thead>
              <tr style={{
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                color: '#64748b',
                letterSpacing: '0.04em',
              }}>
                <th style={{ padding: '0.85rem 1.15rem' }}>ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Fecha y Hora</th>
                <th style={{ padding: '0.85rem 1rem' }}>Operación</th>
                <th style={{ padding: '0.85rem 1rem' }}>Módulo</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tabla</th>
                <th style={{ padding: '0.85rem 1rem' }}>Usuario y Rol</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP</th>
                <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Detalle</th>
              </tr>
            </thead>

            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 0.65rem', color: '#0284c7' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>Cargando registros de auditoría...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '0.92rem', color: '#475569', fontWeight: 600 }}>No hay registros de auditoría</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Prueba ajustando los filtros de búsqueda</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getOperacionBadgeStyle(log.operacion);

                  return (
                    <tr
                      key={log.id_bitacora}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.85rem 1.15rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        #{log.id_bitacora}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#334155' }}>
                        {log.fecha_bolivia || log.fecha_creacion}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: badge.bg,
                          border: badge.border,
                          color: badge.color || badge.text,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}>
                          {log.operacion}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                        {log.modulo}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                        {log.tabla_afectada}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {(() => {
                          const rol = (log.rol || log.usuario_responsable?.rol || '').toUpperCase();
                          let rolBadge = { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'SISTEMA' };
                          if (rol.includes('ADMIN')) {
                            rolBadge = { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe', label: 'ADMIN' };
                          } else if (rol.includes('MEDIC') || rol.includes('DOCTOR')) {
                            rolBadge = { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'MÉDICO' };
                          } else if (rol.includes('RECEP')) {
                            rolBadge = { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'RECEPCIÓN' };
                          } else if (rol.includes('PACIENT') || rol.includes('CLIENT')) {
                            rolBadge = { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'PACIENTE' };
                          }

                          const nombreMostrar = log.usuario_responsable?.nombre || log.usuario_nombre || log.usuario || 'Sistema';
                          const username = log.usuario_responsable?.username || log.usuario || 'sistema';

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: rolBadge.bg,
                                  color: rolBadge.color,
                                  border: `1px solid ${rolBadge.border}`,
                                  fontFamily: 'monospace',
                                }}>
                                  {rolBadge.label}
                                </span>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                                  @{username}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                                {nombreMostrar}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748b' }}>
                        {log.direccion_ip}
                      </td>

                      <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            color: '#0284c7',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#0284c7';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#0284c7';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#f0f9ff';
                            e.currentTarget.style.color = '#0284c7';
                            e.currentTarget.style.borderColor = '#bae6fd';
                          }}
                        >
                          <Eye size={13} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.lastPage}</strong> ({pagination.total} registros)
            </span>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => setPage(pagination.currentPage - 1)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: pagination.currentPage <= 1 ? '#94a3b8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ChevronLeft size={13} />
                Anterior
              </button>

              <button
                disabled={pagination.currentPage >= pagination.lastPage || loading}
                onClick={() => setPage(pagination.currentPage + 1)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: pagination.currentPage >= pagination.lastPage ? '#94a3b8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: pagination.currentPage >= pagination.lastPage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                Siguiente
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLE JSON */}
      <ModalDetalleAuditoria log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default CU02_BitacoraView;
