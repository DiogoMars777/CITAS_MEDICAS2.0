import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import {
  Ban,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Calendar,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';

export const CU08_BloqueosView = () => {
  const [bloqueos, setBloqueos] = useState([]);
  const [kpis, setKpis] = useState({ total_bloqueos: 0, bloqueos_vigentes: 0 });
  const [medicosMeta, setMedicosMeta] = useState([]);
  const [tiposBloqueoMeta, setTiposBloqueoMeta] = useState([]);

  // Filtros
  const [filterMedico, setFilterMedico] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_medico: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    hora_fin: '12:00',
    tipo_bloqueo: 'PERMISO',
    motivo: '',
  });

  const fetchBloqueos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMedico) params.append('id_medico', filterMedico);
      if (filterTipo) params.append('tipo_bloqueo', filterTipo);

      const res = await fetch(`${API_ENDPOINTS.bloqueos}?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar bloqueos de agenda.');
      const json = await res.json();
      setBloqueos(json.data.data || []);
      if (json.kpis) setKpis(json.kpis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterMedico, filterTipo]);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.bloqueos}/meta`);
      if (res.ok) {
        const json = await res.json();
        setMedicosMeta(json.medicos || []);
        setTiposBloqueoMeta(json.tipos_bloqueo || []);
      }
    } catch (err) {
      console.error('Error fetching meta bloqueos:', err);
    }
  }, []);

  useEffect(() => {
    fetchBloqueos();
  }, [fetchBloqueos]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleCrearBloqueo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(API_ENDPOINTS.bloqueos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar bloqueo.');

      setSuccessMsg(data.message);
      setModalOpen(false);
      setFormData({
        id_medico: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date().toISOString().split('T')[0],
        hora_inicio: '08:00',
        hora_fin: '12:00',
        tipo_bloqueo: 'PERMISO',
        motivo: '',
      });
      await fetchBloqueos();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminarBloqueo = async (idBloqueo) => {
    if (!window.confirm('¿Desea liberar este bloqueo administrativo y habilitar nuevamente la agenda médica?')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.bloqueos}/${idBloqueo}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar bloqueo.');

      setSuccessMsg(data.message);
      await fetchBloqueos();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* CABECERA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
              }}
            >
              CU08
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Agendas y Horarios Médicos</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Registrar Bloqueos de Agenda Médica
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Administrador, Médico • Bloqueo administrativo de horarios por permisos, cirugías o capacitaciones
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.65rem 1.2rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
        >
          <Plus size={16} />
          <span>Nuevo Bloqueo de Agenda</span>
        </button>
      </div>

      {/* ALERTAS */}
      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#059669',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* KPIS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #dc2626', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bloqueos Vigentes Activos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
            {kpis.bloqueos_vigentes}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Bloqueos Registrados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {kpis.total_bloqueos}
          </div>
        </div>
      </div>

      {/* TABLA Y FILTROS */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            <select
              value={filterMedico}
              onChange={(e) => setFilterMedico(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.84rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              <option value="">Todos los Médicos</option>
              {medicosMeta.map((m) => (
                <option key={m.id_medico} value={m.id_medico}>
                  {m.nombre_completo}
                </option>
              ))}
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.84rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              <option value="">Todos los Tipos de Bloqueo</option>
              {tiposBloqueoMeta.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchBloqueos}
            disabled={loading}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              borderRadius: '8px',
              padding: '0.55rem 0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={14} style={{ color: '#0284c7', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Médico</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo Bloqueo</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Período & Horario</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motivo</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vigencia</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} style={{ color: '#0284c7', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>Cargando bloqueos de agenda...</p>
                  </td>
                </tr>
              ) : bloqueos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <Ban size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>No se encontraron bloqueos de agenda registrados.</p>
                  </td>
                </tr>
              ) : (
                bloqueos.map((b) => (
                  <tr
                    key={b.id_bloqueo}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.medico_nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 500 }}>{b.especialidad}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#fff1f2',
                          color: '#e11d48',
                          border: '1px solid #fecdd3',
                        }}
                      >
                        {b.tipo_bloqueo}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <div style={{ color: '#0f172a', fontWeight: 600 }}>
                        {b.fecha_inicio} al {b.fecha_fin}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 500 }}>
                        {b.horario_rango}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem', maxWidth: '300px' }}>
                      <div style={{ color: '#334155', fontWeight: 500 }}>{b.motivo}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Por: {b.creado_por}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: b.es_activo ? '#fef2f2' : '#f1f5f9',
                          color: b.es_activo ? '#dc2626' : '#64748b',
                          border: b.es_activo ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        }}
                      >
                        {b.es_activo ? 'Vigente' : 'Expirado'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleEliminarBloqueo(b.id_bloqueo)}
                        disabled={actionLoading}
                        title="Liberar bloqueo administrativo"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Liberar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR BLOQUEO */}
      {modalOpen && (
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
              maxWidth: '540px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
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
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca' }}>
                  <Ban size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Nuevo Bloqueo de Agenda Médica
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                    Inhabilita cupos para evitar colisiones de turnos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearBloqueo} style={{ padding: '1.5rem', color: '#0f172a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Médico Especialista *
                  </label>
                  <select
                    value={formData.id_medico}
                    onChange={(e) => setFormData({ ...formData, id_medico: e.target.value })}
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
                    <option value="">Seleccione médico...</option>
                    {medicosMeta.map((m) => (
                      <option key={m.id_medico} value={m.id_medico}>
                        {m.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
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

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Tipo de Bloqueo *
                  </label>
                  <select
                    value={formData.tipo_bloqueo}
                    onChange={(e) => setFormData({ ...formData, tipo_bloqueo: e.target.value })}
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
                    {tiposBloqueoMeta.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Motivo / Justificación *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describa el motivo del bloqueo administrativo..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  disabled={actionLoading}
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
                  {actionLoading ? 'Registrando...' : 'Confirmar Bloqueo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CU08_BloqueosView;
