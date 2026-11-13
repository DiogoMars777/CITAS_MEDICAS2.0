import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  Stethoscope,
  X,
  Users,
  Timer,
  Check,
} from 'lucide-react';

import { ESTADOS_CITA } from '../../../models/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CitaModel';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.asistencia;

export const CU13_AsistenciaView = () => {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoyStr);
  const [citas, setCitas] = useState([]);
  const [kpis, setKpis] = useState({
    total_hoy: 0,
    en_espera: 0,
    confirmados: 0,
    atendidos: 0,
    inasistencias: 0,
  });

  const [filterEstado, setFilterEstado] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchAsistencia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fecha) params.append('fecha', fecha);
      if (filterEstado) params.append('estado', filterEstado);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCitas(data.data || []);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      setError(err.message || 'Error al obtener sala de espera.');
    } finally {
      setLoading(false);
    }
  }, [fecha, filterEstado, searchTerm]);

  useEffect(() => {
    fetchAsistencia();
  }, [fetchAsistencia]);

  const registrarEstado = async (idCita, nuevoEstado) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idCita}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_estado: nuevoEstado, estado_asistencia: nuevoEstado }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar asistencia.');
      }

      setSuccessMsg(data.message);
      fetchAsistencia();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              CU13
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Gestión de Citas y Concurrencia</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Registrar Asistencia e Inasistencia
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Recepcionista • Control de llegada a sala de espera, confirmación y reporte de ausencias
          </p>
        </div>

        <button
          onClick={fetchAsistencia}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#1e293b',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ color: '#0284c7' }} />
          <span>Actualizar Sala</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* KPIS DE SALA DE ESPERA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Citas del Día</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{kpis.total_hoy}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Por Confirmar / Espera</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>{kpis.en_espera}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>En Sala / Confirmados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{kpis.confirmados}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0d9488', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Atendidos por Médico</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d9488', marginTop: '0.25rem' }}>{kpis.atendidos}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inasistencias</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>{kpis.inasistencias}</div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', fontWeight: 500 }}
        />

        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por paciente, CI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', fontWeight: 500 }}
        >
          <option value="">Todos los Estados</option>
          <option value="PROGRAMADA">Programada (Por llegar)</option>
          <option value="CONFIRMADA">Confirmada (En sala)</option>
          <option value="ATENDIDA">Atendida</option>
          <option value="INASISTENCIA">Inasistencia</option>
        </select>
      </div>

      {/* TABLA DE ATENCIÓN DE SALA */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Horario</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Código / Expediente</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Paciente</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Médico Asignado</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Estado</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700 }}>Control de Llegada (CU13)</th>
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={32} style={{ color: '#cbd5e1' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
                        {loading ? 'Cargando citas de la sala...' : 'No hay citas registradas para la fecha seleccionada.'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Seleccione otra fecha o verifique los filtros aplicados.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                citas.map((c) => {
                  const st = ESTADOS_CITA[c.estado_cita] || ESTADOS_CITA.PROGRAMADA;

                  return (
                    <tr key={c.id_cita} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: '#f0f9ff', color: '#0284c7', fontSize: '0.82rem', fontWeight: 700, border: '1px solid #bae6fd' }}>
                          <Clock size={13} />
                          <span>{c.horario_rango}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.codigo_cita}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Exp: {c.numero_expediente}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.paciente_nombre}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>CI: {c.paciente_ci || 'N/A'} • Tel: {c.paciente_telefono || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.medico_nombre}</div>
                        <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 500 }}>{c.especialidad_nombre}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {c.estado_cita === 'PROGRAMADA' && (
                            <button
                              onClick={() => registrarEstado(c.id_cita, 'CONFIRMADA')}
                              disabled={actionLoading}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#059669',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                boxShadow: '0 1px 2px rgba(5,150,105,0.2)',
                              }}
                            >
                              <UserCheck size={14} />
                              <span>Presente (En Sala)</span>
                            </button>
                          )}

                          {c.estado_cita === 'CONFIRMADA' && (
                            <button
                              onClick={() => registrarEstado(c.id_cita, 'ATENDIDA')}
                              disabled={actionLoading}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#0284c7',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                boxShadow: '0 1px 2px rgba(2,132,199,0.2)',
                              }}
                            >
                              <Check size={14} />
                              <span>Pasa a Consulta</span>
                            </button>
                          )}

                          {['PROGRAMADA', 'CONFIRMADA'].includes(c.estado_cita) && (
                            <button
                              onClick={() => registrarEstado(c.id_cita, 'INASISTENCIA')}
                              disabled={actionLoading}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#d97706',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              <UserX size={14} />
                              <span>Inasistencia</span>
                            </button>
                          )}

                          {['ATENDIDA', 'INASISTENCIA', 'CANCELADA'].includes(c.estado_cita) && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '6px' }}>
                              Registro completado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CU13_AsistenciaView;
