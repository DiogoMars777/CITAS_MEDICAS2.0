import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  History,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Stethoscope,
} from 'lucide-react';

import { ESTADOS_CITA } from '../../../models/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CitaModel';
import { ModalReprogramarCita } from './ModalReprogramarCita';
import { ModalHistorialCita } from './ModalHistorialCita';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.citas;

export const CU11_ReprogramarCitaView = () => {
  const [citas, setCitas] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 15, total: 0 });
  const [kpis, setKpis] = useState({
    total_citas: 0,
    citas_programadas: 0,
    citas_confirmadas: 0,
    citas_atendidas: 0,
    citas_canceladas: 0,
  });

  const [medicosMeta, setMedicosMeta] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterFecha, setFilterFecha] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [selectedCitaForReprogram, setSelectedCitaForReprogram] = useState(null);
  const [selectedCitaForHistorial, setSelectedCitaForHistorial] = useState(null);

  const fetchCitas = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '15');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterMedico) params.append('id_medico', filterMedico);
      if (filterFecha) params.append('fecha', filterFecha);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCitas(data.data.data || []);
        setPagination({
          currentPage: data.data.current_page || 1,
          lastPage: data.data.last_page || 1,
          perPage: data.data.per_page || 15,
          total: data.data.total || 0,
        });
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      setError(err.message || 'Error al obtener citas médicas.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterMedico, filterFecha]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta`);
      const data = await res.json();
      if (data.success) {
        setMedicosMeta(data.medicos || []);
      }
    } catch (err) {
      console.error('Error al cargar metadatos:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchCitas(1);
  }, [fetchCitas]);

  const handleReprogramar = async (idCita, dataReprogramacion) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${idCita}/reprogramar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataReprogramacion),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al reprogramar la cita.');
      }

      setSuccessMsg(data.message);
      setSelectedCitaForReprogram(null);
      fetchCitas(pagination.currentPage);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>
              CU11
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Gestión de Citas y Concurrencia</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Reprogramar Cita Médica
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Paciente, Recepcionista • Control de concurrencia pesimista y trazabilidad de cambios
          </p>
        </div>

        <button
          onClick={() => fetchCitas(pagination.currentPage)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#475569',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0284c7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div style={{ padding: '0.9rem 1.25rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.9rem 1.25rem', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* BARRA DE FILTROS */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Buscar por paciente, CI, código de cita o médico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={filterMedico}
          onChange={(e) => setFilterMedico(e.target.value)}
          style={{ padding: '0.55rem 0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', minWidth: '180px' }}
        >
          <option value="">Todos los Médicos</option>
          {medicosMeta.map((m) => (
            <option key={m.id_medico} value={m.id_medico}>
              {m.nombre_completo}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterFecha}
          onChange={(e) => setFilterFecha(e.target.value)}
          style={{ padding: '0.55rem 0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem' }}
        />
      </div>

      {/* TABLA DE CITAS DISPONIBLES PARA REPROGRAMAR */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem' }}>Código / Fecha</th>
              <th style={{ padding: '1rem' }}>Horario</th>
              <th style={{ padding: '1rem' }}>Paciente</th>
              <th style={{ padding: '1rem' }}>Médico & Especialidad</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones CU11</th>
            </tr>
          </thead>
          <tbody>
            {citas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  {loading ? 'Cargando citas...' : 'No se encontraron citas médicas registradas.'}
                </td>
              </tr>
            ) : (
              citas.map((c) => {
                const st = ESTADOS_CITA[c.estado_cita] || ESTADOS_CITA.PROGRAMADA;
                const isPaid = Boolean(c.esta_pagada);
                const canReprogram = ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado_cita) && isPaid;

                return (
                  <tr key={c.id_cita} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.codigo_cita}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={12} color="#0284c7" />
                        <span>{c.fecha_cita}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '0.78rem', fontWeight: 700 }}>
                        <Clock size={12} />
                        <span>{c.horario_rango}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.paciente_nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>CI: {c.paciente_ci || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.medico_nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 500 }}>{c.especialidad_nombre}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: st.bg, color: st.text, border: `1px solid ${st.border}`, width: 'fit-content' }}>
                          {st.label}
                        </span>
                        {isPaid ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                            ✓ Pagada (Reprogramable)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '10px', width: 'fit-content' }}>
                            ⚠ Sin Pago (Bloqueada)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedCitaForHistorial(c)}
                          title="Ver historial de reprogramaciones"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <History size={13} />
                          <span>Historial</span>
                        </button>

                        <button
                          onClick={() => {
                            if (!isPaid) {
                              alert('No es posible reprogramar una cita no pagada. La política de la clínica exige registrar el pago previo para acceder a la reprogramación.');
                              return;
                            }
                            setSelectedCitaForReprogram(c);
                          }}
                          disabled={!canReprogram}
                          title={!isPaid ? 'Solo citas pagadas pueden reprogramarse' : canReprogram ? 'Reprogramar cita médica' : 'Solo citas activas pueden reprogramarse'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: canReprogram ? '#e0f2fe' : '#f1f5f9',
                            border: canReprogram ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                            color: canReprogram ? '#0284c7' : '#94a3b8',
                            cursor: canReprogram ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (canReprogram) {
                              e.currentTarget.style.background = '#0284c7';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canReprogram) {
                              e.currentTarget.style.background = '#e0f2fe';
                              e.currentTarget.style.color = '#0284c7';
                            }
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Reprogramar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL REPROGRAMAR CITA */}
      <ModalReprogramarCita
        isOpen={Boolean(selectedCitaForReprogram)}
        onClose={() => setSelectedCitaForReprogram(null)}
        onReprogramar={handleReprogramar}
        cita={selectedCitaForReprogram}
        medicosMeta={medicosMeta}
        loading={actionLoading}
      />

      {/* MODAL HISTORIAL DE REPROGRAMACIONES */}
      <ModalHistorialCita
        isOpen={Boolean(selectedCitaForHistorial)}
        onClose={() => setSelectedCitaForHistorial(null)}
        cita={selectedCitaForHistorial}
      />
    </div>
  );
};

export default CU11_ReprogramarCitaView;
