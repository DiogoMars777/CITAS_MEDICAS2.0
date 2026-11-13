import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Stethoscope,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Timer,
  AlertCircle,
  FlaskConical,
  Phone,
  HeartPulse,
  UserCheck,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useCU15AgendaMedicoController } from '../../../controllers/PKG06_AtencionMedica/CU15_AgendaDiariaMedico/CU15_AgendaMedicoController';

export const CU15_AgendaMedicoView = ({ onNavigateToCU16 }) => {
  const {
    fecha,
    medico,
    agenda,
    agendaTotal,
    kpis,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    selectedExpediente,
    modalExpedienteOpen,
    loadingExpediente,
    securityViolation,
    abrirExpediente,
    cerrarExpediente,
    cambiarFecha,
    avanzarDia,
    retrocederDia,
    irAHoy,
    recargar,
    limpiarError,
  } = useCU15AgendaMedicoController();

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'ATENDIDA':
        return {
          bg: '#ecfdf5',
          color: '#059669',
          border: '#a7f3d0',
          text: 'Atendida',
          icon: CheckCircle2,
        };
      case 'EN_ESPERA':
        return {
          bg: '#e0f2fe',
          color: '#0284c7',
          border: '#bae6fd',
          text: 'En Sala de Espera',
          icon: Timer,
        };
      case 'CONFIRMADA':
        return {
          bg: '#f0fdf4',
          color: '#16a34a',
          border: '#bbf7d0',
          text: 'Confirmada',
          icon: UserCheck,
        };
      case 'PROGRAMADA':
        return {
          bg: '#f8fafc',
          color: '#64748b',
          border: '#e2e8f0',
          text: 'Programada',
          icon: Clock,
        };
      case 'CANCELADA':
      case 'INASISTENCIA':
        return {
          bg: '#fef2f2',
          color: '#dc2626',
          border: '#fecaca',
          text: estado === 'CANCELADA' ? 'Cancelada' : 'Inasistencia',
          icon: AlertCircle,
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          text: estado,
          icon: Clock,
        };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#0f172a' }}>
      {/* ======================================================== */}
      {/* 1. ENCABEZADO DEL CASO DE USO CU15 */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#e0f2fe',
              color: '#0284c7',
              border: '1px solid #bae6fd',
            }}>
              CU15
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
            }}>
              PKG06_AtencionMedica
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Lock size={12} /> Privacidad Estricta
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Visualizar Agenda Médica Diaria
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
            Listado exclusivo de pacientes en bloques exactos de 15 minutos asignados a su jornada de atención.
          </p>
        </div>

        {/* CONTROLES DE FECHA Y RECARGA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '3px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <button
              onClick={retrocederDia}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Día anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
              <Calendar size={15} color="#0284c7" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => cambiarFecha(e.target.value)}
                style={{
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
            </div>

            <button
              onClick={avanzarDia}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Día siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={irAHoy}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              background: '#e0f2fe',
              color: '#0284c7',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Hoy
          </button>

          <button
            onClick={recargar}
            disabled={loading}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TARJETA DEL MÉDICO EN TURNO CON PRIVACIDAD GARANTIZADA */}
      {/* ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 24px -6px rgba(2, 132, 199, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
            <Stethoscope size={28} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.18rem', fontWeight: 800 }}>
                {medico?.nombre_completo || 'Dr. Carlos Alberto Mendoza Suárez'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                Reg: {medico?.numero_registro_profesional || 'MP-98432'}
              </span>
            </div>

            <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: '#e0f2fe' }}>
              Especialidad: <strong>{medico?.especialidades?.join(', ') || 'Medicina General'}</strong> • Jornada Matutina (Turnos exactos de 15 min)
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          borderRadius: '10px',
          padding: '0.5rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }}>
          <Shield size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.76rem', color: '#f0f9ff' }}>
            Aislamiento estricto de privacidad activo: Solo visualiza pacientes asignados a este médico.
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. RESUMEN DE KPIS DE LA JORNADA */}
      {/* ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>TOTAL EN AGENDA</span>
            <Calendar size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {kpis.total_citas}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Cupos de 15 min agendados hoy</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669' }}>ATENDIDAS</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
            {kpis.atendidas}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Consultas completadas con éxito</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #bae6fd', background: '#f0f9ff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7' }}>EN ESPERA / CONFIRMADAS</span>
            <Timer size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '0.35rem' }}>
            {kpis.en_espera}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>Listas para entrar a consulta</span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>PROGRAMADAS</span>
            <Clock size={18} color="#64748b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {kpis.programadas}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pendientes de check-in</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BARRA DE BÚSQUEDA Y FILTRADO POR ESTADO */}
      {/* ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '0.85rem 1rem',
        border: '1px solid #e2e8f0',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
      }}>
        {/* BUSCADOR */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          maxWidth: '420px',
        }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por paciente, carnet CI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
        </div>

        {/* PESTAÑAS DE FILTRADO POR ESTADO */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'EN_ESPERA', label: 'En Espera / Confirmados' },
            { id: 'ATENDIDA', label: 'Atendidas' },
            { id: 'PROGRAMADA', label: 'Programadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: filtroEstado === tab.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: filtroEstado === tab.id ? '#0284c7' : '#ffffff',
                color: filtroEstado === tab.id ? '#ffffff' : '#64748b',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MENSAJES DE ERROR */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.84rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={limpiarError} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. LISTADO DE BLOQUES DE 15 MINUTOS (TIMELINE / AGENDA) */}
      {/* ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#fafafa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0f172a' }}>
              Cronograma de Atención por Bloques (15 Minutos)
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Mostrando <strong>{agenda.length}</strong> de {agendaTotal.length} turnos
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Cargando agenda médica diaria...</p>
          </div>
        ) : agenda.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={38} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#334155', fontSize: '1.05rem' }}>
              No hay citas programadas para esta fecha
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              No se registran pacientes asignados al turno del Dr. Carlos Mendoza para el {fecha}.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Horario (15 min)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Código</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Paciente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Alergias / Sangre</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Motivo de Consulta</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones Clínicas</th>
                </tr>
              </thead>
              <tbody>
                {agenda.map((item, idx) => {
                  const badge = getEstadoBadge(item.estado_cita);
                  const BadgeIcon = badge.icon;
                  const tieneAlergias = item.historia_clinica?.tiene_alergias;

                  return (
                    <tr
                      key={item.id_cita}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafcff',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafcff')}
                    >
                      {/* HORARIO BLOQUE 15 MIN */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#0f172a',
                            fontSize: '0.82rem',
                          }}>
                            {item.hora_inicio} - {item.hora_fin}
                          </span>
                        </div>
                      </td>

                      {/* CÓDIGO */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b' }}>
                          {item.codigo_cita}
                        </span>
                      </td>

                      {/* PACIENTE */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.paciente?.nombre_completo || 'Paciente sin nombre'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span>CI: {item.paciente?.ci}</span>
                          <span>•</span>
                          <span>{item.paciente?.edad !== null ? `${item.paciente?.edad} años` : 'Edad N/D'}</span>
                          <span>•</span>
                          <span>{item.paciente?.sexo}</span>
                        </div>
                      </td>

                      {/* ALERGIAS Y SANGRE */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {tieneAlergias ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}>
                              <AlertTriangle size={12} />
                              {item.historia_clinica?.alergias_medicamentos}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                              ✓ Sin alergias conocidas
                            </span>
                          )}

                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Tipo: <strong style={{ color: '#0284c7' }}>{item.historia_clinica?.tipo_sangre || 'N/D'}</strong>
                            {item.laboratorios_count > 0 && (
                              <span style={{ marginLeft: '6px', color: '#0891b2' }}>
                                • {item.laboratorios_count} lab(s)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* MOTIVO DE CONSULTA */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.35 }}>
                          {item.motivo_consulta}
                        </p>
                        {item.tiene_atencion && (
                          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                            Dx: {item.atencion_resumen?.diagnostico_cie10} - {item.atencion_resumen?.diagnostico}
                          </span>
                        )}
                      </td>

                      {/* ESTADO Y PAGO */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            width: 'fit-content',
                          }}>
                            <BadgeIcon size={13} />
                            {badge.text}
                          </span>
                          {/* Badge de Verificación de Pago 24h */}
                          {item.esta_pagada ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              width: 'fit-content',
                            }}>
                              ✓ Pagado (24h OK)
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              width: 'fit-content',
                            }}>
                              ⚠ Pago Pendiente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACCIONES CLÍNICAS */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* VER EXPEDIENTE CONFIDENCIAL */}
                          <button
                            onClick={() => {
                              if (!item.esta_pagada) {
                                alert('Acceso denegado: El paciente no ha realizado el pago de la consulta (Requisito mínimo 24h antes). No se puede exponer el expediente clínico.');
                                return;
                              }
                              abrirExpediente(item.id_cita);
                            }}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: item.esta_pagada ? '#ffffff' : '#f8fafc',
                              color: item.esta_pagada ? '#334155' : '#94a3b8',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: item.esta_pagada ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={item.esta_pagada ? "Ver expediente clínico seguro" : "Requiere pago previo de la cita"}
                          >
                            <FileText size={14} color={item.esta_pagada ? "#0284c7" : "#94a3b8"} />
                            <span>Expediente</span>
                          </button>

                          {/* ATENDER CONSULTA (CONDUCE A CU16) */}
                          <button
                            onClick={() => {
                              if (item.estado_cita === 'CANCELADA') {
                                alert('Esta cita ha sido cancelada.');
                                return;
                              }
                              if (!item.esta_pagada) {
                                alert('Atención bloqueada: El paciente debe cancelar el monto de la cita al menos 24 horas antes de su horario asignado.');
                                return;
                              }
                              if (onNavigateToCU16) {
                                onNavigateToCU16(item.id_cita);
                              }
                            }}
                            disabled={!item.esta_pagada || item.estado_cita === 'CANCELADA'}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '8px',
                              border: '1px solid',
                              background: (!item.esta_pagada || item.estado_cita === 'CANCELADA')
                                ? '#f1f5f9'
                                : item.estado_cita === 'ATENDIDA'
                                ? '#f0fdf4'
                                : '#0284c7',
                              color: (!item.esta_pagada || item.estado_cita === 'CANCELADA')
                                ? '#94a3b8'
                                : item.estado_cita === 'ATENDIDA'
                                ? '#16a34a'
                                : '#ffffff',
                              borderColor: (!item.esta_pagada || item.estado_cita === 'CANCELADA')
                                ? '#e2e8f0'
                                : item.estado_cita === 'ATENDIDA'
                                ? '#bbf7d0'
                                : '#0284c7',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: (!item.esta_pagada || item.estado_cita === 'CANCELADA') ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: (item.esta_pagada && item.estado_cita !== 'ATENDIDA' && item.estado_cita !== 'CANCELADA')
                                ? '0 2px 6px rgba(2, 132, 199, 0.3)'
                                : 'none',
                            }}
                            title={!item.esta_pagada ? "Cita impaga: atención bloqueada" : "Atender consulta según turno"}
                          >
                            <Stethoscope size={14} />
                            <span>{item.estado_cita === 'ATENDIDA' ? 'Ver Consulta' : 'Atender (CU16)'}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 6. MODAL: EXPEDIENTE CLÍNICO SEGURO (PROTECCIÓN DE PRIVACIDAD) */}
      {/* ======================================================== */}
      {modalExpedienteOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            {/* CABECERA DEL MODAL */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Shield size={22} color="#38bdf8" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                    Expediente Clínico & Antecedentes Médicos
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#e0f2fe' }}>
                    Acceso autorizado bajo control estricto de privacidad del turno médico
                  </span>
                </div>
              </div>

              <button
                onClick={cerrarExpediente}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENIDO DEL EXPEDIENTE */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingExpediente ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ margin: 0 }}>Validando credenciales y cargando expediente...</p>
                </div>
              ) : securityViolation ? (
                <div style={{
                  padding: '2rem',
                  borderRadius: '14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  textAlign: 'center',
                  color: '#991b1b',
                }}>
                  <ShieldAlert size={44} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}>Violación de Seguridad y Privacidad</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{securityViolation}</p>
                </div>
              ) : selectedExpediente ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* FICHA RESUMEN PACIENTE */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    border: '1px solid #e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PACIENTE</span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedExpediente.paciente?.nombre_completo}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DOCUMENTO CI</span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedExpediente.paciente?.ci}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>EDAD / SEXO</span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedExpediente.paciente?.edad} años • {selectedExpediente.paciente?.sexo}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>EXPEDIENTE N°</span>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0284c7' }}>
                        {selectedExpediente.historia_clinica?.numero_expediente}
                      </div>
                    </div>
                  </div>

                  {/* ALERTA CRÍTICA DE ALERGIAS */}
                  <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: selectedExpediente.historia_clinica?.tiene_alergias ? '#fef2f2' : '#f0fdf4',
                    border: selectedExpediente.historia_clinica?.tiene_alergias ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                  }}>
                    {selectedExpediente.historia_clinica?.tiene_alergias ? (
                      <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                    ) : (
                      <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: selectedExpediente.historia_clinica?.tiene_alergias ? '#991b1b' : '#166534',
                      }}>
                        {selectedExpediente.historia_clinica?.tiene_alergias ? 'ALERGIAS A MEDICAMENTOS REGISTRADAS' : 'SIN ALERGIAS A MEDICAMENTOS CONOCIDAS'}
                      </div>
                      <div style={{
                        fontSize: '0.84rem',
                        color: selectedExpediente.historia_clinica?.tiene_alergias ? '#b91c1c' : '#15803d',
                        fontWeight: selectedExpediente.historia_clinica?.tiene_alergias ? 700 : 500,
                        marginTop: '2px',
                      }}>
                        {selectedExpediente.historia_clinica?.alergias_medicamentos}
                      </div>
                    </div>
                  </div>

                  {/* ANTECEDENTES MÉDICOS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>TIPO DE SANGRE</span>
                      <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: '#0284c7', fontSize: '1rem' }}>
                        {selectedExpediente.historia_clinica?.tipo_sangre}
                      </p>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ANTECEDENTES PATOLÓGICOS</span>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#1e293b' }}>
                        {selectedExpediente.historia_clinica?.antecedentes_patologicos}
                      </p>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ENFERMEDADES HEREDITARIAS</span>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#1e293b' }}>
                        {selectedExpediente.historia_clinica?.enfermedades_hereditarias}
                      </p>
                    </div>
                  </div>

                  {/* LABORATORIOS Y ESTUDIOS DEL PACIENTE */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                      <FlaskConical size={16} color="#0891b2" />
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>Estudios Clínicos y Laboratorios</h4>
                    </div>

                    {selectedExpediente.laboratorios?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                        No registra exámenes ni estudios de laboratorio previos.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {selectedExpediente.laboratorios?.map((lab) => (
                          <div key={lab.id_estudio} style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.82rem',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#0f172a' }}>{lab.nombre_estudio}</strong>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: lab.estado === 'PUBLICADO' ? '#ecfdf5' : '#fffbeb',
                                color: lab.estado === 'PUBLICADO' ? '#059669' : '#b45309',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}>
                                {lab.estado}
                              </span>
                            </div>
                            {lab.resultado_diagnostico && (
                              <p style={{ margin: '0.35rem 0 0', color: '#334155', fontSize: '0.8rem' }}>
                                <strong>Resultado:</strong> {lab.resultado_diagnostico}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* PIE DEL MODAL */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#fafafa',
            }}>
              <button
                onClick={cerrarExpediente}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CU15_AgendaMedicoView;
