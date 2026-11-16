import React from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Stethoscope,
  Layers,
  CalendarDays,
  Info,
} from 'lucide-react';

import { useCU09DisponibilidadController } from '../../../controllers/PKG04_AgendasHorarios/CU09_ConsultarDisponibilidad/CU09_DisponibilidadController';
import { ESTADOS_SLOT } from '../../../models/PKG04_AgendasHorarios/CU09_ConsultarDisponibilidad/DisponibilidadModel';
import { ModalDetalleSlot } from './ModalDetalleSlot';

export const CU09_DisponibilidadView = ({ currentUser = null, onReservarSlot = null }) => {
  const {
    fecha,
    setFecha,
    idEspecialidad,
    setIdEspecialidad,
    idMedico,
    setIdMedico,
    turnoFiltro,
    setTurnoFiltro,
    especialidades,
    medicosMeta,
    franjasHorarias,
    consultaInfo,
    kpis,
    proximosDias,
    medicosResult,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    consultarDisponibilidad,
    modalSlotOpen,
    slotSelected,
    medicoSelected,
    abrirDetalleSlot,
    cerrarDetalleSlot,
    seleccionarDiaCalendario,
  } = useCU09DisponibilidadController();

  const setFechaHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFecha(hoy);
  };

  const setFechaManana = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setFecha(d.toISOString().split('T')[0]);
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
              CU09
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Agendas y Horarios Médicos</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Consultar Disponibilidad de Horarios Médicos
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Paciente, Recepcionista, Médico • Matriz de cupos fraccionados a 15 minutos en tiempo real
          </p>
        </div>

        <button
          onClick={consultarDisponibilidad}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
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
          <span>Actualizar Matriz</span>
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {error && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <CheckCircle2 size={18} />
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* METRICAS KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Cupos Generados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{kpis.total_cupos}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cupos Disponibles</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{kpis.cupos_disponibles}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #dc2626', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citas Ocupadas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>{kpis.cupos_ocupados}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bloqueos Administrativos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>{kpis.cupos_bloqueados}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tasa de Ocupación</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>{kpis.porcentaje_ocupacion}%</div>
        </div>
      </div>

      {/* MATRIZ DE NAVEGACION RÁPIDA (CALENDARIO 14 DÍAS) */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
          <CalendarDays size={16} style={{ color: '#0284c7' }} />
          <span>Próximos días de agenda (Selección rápida de fecha)</span>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
          {proximosDias.map((d) => {
            const isSelected = d.fecha === fecha;
            return (
              <button
                key={d.fecha}
                onClick={() => seleccionarDiaCalendario(d.fecha)}
                style={{
                  minWidth: '82px',
                  padding: '0.7rem 0.5rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0f9ff' : '#ffffff',
                  color: isSelected ? '#0284c7' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 4px rgba(2,132,199,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>{d.dia_corto}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isSelected ? '#0284c7' : '#0f172a', margin: '2px 0' }}>{d.dia_numero}</div>
                <div style={{ fontSize: '0.7rem', color: isSelected ? '#0284c7' : '#059669', fontWeight: 600 }}>{d.cupos_libres} libres</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', fontWeight: 500 }}
          />
          <button onClick={setFechaHoy} style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Hoy</button>
          <button onClick={setFechaManana} style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Mañana</button>
        </div>

        <select
          value={idEspecialidad}
          onChange={(e) => setIdEspecialidad(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', minWidth: '190px', fontWeight: 500 }}
        >
          <option value="">Todas las Especialidades</option>
          {especialidades.map((esp) => (
            <option key={esp.id_especialidad} value={esp.id_especialidad}>{esp.nombre}</option>
          ))}
        </select>

        <select
          value={idMedico}
          onChange={(e) => setIdMedico(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', minWidth: '190px', fontWeight: 500 }}
        >
          <option value="">Todos los Médicos</option>
          {medicosMeta.map((m) => (
            <option key={m.id_medico} value={m.id_medico}>{m.nombre_completo}</option>
          ))}
        </select>

        <select
          value={turnoFiltro}
          onChange={(e) => setTurnoFiltro(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '0.85rem', fontWeight: 500 }}
        >
          {franjasHorarias.map((f) => (
            <option key={f.id} value={f.id}>{f.label} ({f.rango})</option>
          ))}
        </select>
      </div>

      {/* DISPONIBILIDAD POR MEDICO (MATRIZ DE CUPOS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {medicosResult.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '3.5rem', textAlign: 'center', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Calendar size={40} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
              {loading ? 'Calculando disponibilidad en tiempo real...' : 'No se encontraron turnos configurados para los filtros seleccionados.'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Seleccione otra fecha u otro médico/especialidad médica.
            </div>
          </div>
        ) : (
          medicosResult.map((med) => (
            <div
              key={med.id_medico}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.35rem',
                boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
              }}
            >
              {/* HEADER MEDICO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{med.nombre_completo}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>{med.especialidad_principal}</span> • Matrícula: {med.matricula}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                    {med.cupos_disponibles} Libres
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca' }}>
                    {med.cupos_ocupados} Citas
                  </span>
                  {med.cupos_bloqueados > 0 && (
                    <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', fontWeight: 700, border: '1px solid #fde68a' }}>
                      {med.cupos_bloqueados} Bloqueados
                    </span>
                  )}
                  <span style={{ color: '#64748b', fontWeight: 500 }}>({med.total_cupos} cupos totales)</span>
                </div>
              </div>

              {/* GRID DE CUPOS DE 15 MIN */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {med.slots.map((s, idx) => {
                  const est = ESTADOS_SLOT[s.estado] || ESTADOS_SLOT.DISPONIBLE;

                  return (
                    <button
                      key={idx}
                      onClick={() => abrirDetalleSlot(s, med)}
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        border: `1px solid ${est.border}`,
                        background: est.bg,
                        color: est.text,
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <Clock size={13} style={{ color: est.color }} />
                      <span>{s.intervalo}</span>
                      <span style={{ fontSize: '0.68rem', opacity: 0.85, textTransform: 'uppercase' }}>
                        ({est.label})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DETALLE DE SLOT */}
      <ModalDetalleSlot
        isOpen={modalSlotOpen}
        onClose={cerrarDetalleSlot}
        slot={slotSelected}
        medico={medicoSelected}
        fecha={fecha}
        onReservar={(slot, medico, fechaCita) => {
          const prefillData = {
            id_medico: String(medico.id_medico),
            id_especialidad: medico.id_especialidad ? String(medico.id_especialidad) : '',
            fecha_cita: fechaCita,
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin,
            medico_nombre: medico.nombre_completo,
            especialidad_nombre: medico.especialidad_principal,
          };
          try {
            sessionStorage.setItem('prefill_reserva_cu10', JSON.stringify(prefillData));
          } catch (e) {
            console.warn('Could not save prefill to sessionStorage:', e);
          }
          cerrarDetalleSlot();
          if (onReservarSlot) {
            onReservarSlot(slot, medico, fechaCita, prefillData);
          }
        }}
      />
    </div>
  );
};

export default CU09_DisponibilidadView;
