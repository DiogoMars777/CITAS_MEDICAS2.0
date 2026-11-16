import React from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Grid,
  Trash2,
  Layers,
  CalendarCheck2,
} from 'lucide-react';

import { useCU07TurnoMedicoController } from '../../../controllers/PKG04_AgendasHorarios/CU07_ConfigurarTurnos/CU07_TurnoMedicoController';
import { ModalTurnoForm } from './ModalTurnoForm';
import { ModalConfirmarEstadoTurno } from './ModalConfirmarEstadoTurno';
import { ModalBloquesTurno } from './ModalBloquesTurno';
import { ModalAgendaSemanalMedico } from './ModalAgendaSemanalMedico';

export const CU07_TurnosView = () => {
  const {
    turnos,
    pagination,
    stats,
    medicosMeta,
    diasSemanaMeta,
    duracionesMeta,
    searchTerm,
    setSearchTerm,
    filterMedico,
    setFilterMedico,
    filterDia,
    setFilterDia,
    filterEstado,
    setFilterEstado,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    turnoToEdit,
    modalStatusOpen,
    turnoForStatus,
    nextStatusTarget,
    modalSlotsOpen,
    turnoForSlots,
    modalSemanalOpen,
    agendaSemanalData,
    loadingSemanal,
    fetchTurnos,
    handleSaveTurno,
    handleConfirmChangeStatus,
    handleDeleteTurno,
    fetchAgendaSemanal,
    openCreateModal,
    openEditModal,
    openStatusModal,
    openSlotsModal,
    closeModals,
    clearMessages,
  } = useCU07TurnoMedicoController();

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
              CU07
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Agendas y Horarios Médicos</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Configurar Turnos y Fraccionamiento de Agenda
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Administrador • Asignación y configuración exclusiva de turnos semanales y fraccionamiento de bloques de consulta de 15 minutos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
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
          <span>Configurar Turno</span>
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
          <button
            onClick={clearMessages}
            style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer' }}
          >
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
          <button
            onClick={clearMessages}
            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Turnos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {stats.total_turnos}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Turnos Activos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
            {stats.turnos_activos}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Médicos con Agenda</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
            {stats.medicos_con_agenda}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0d9488', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cupos Semanales (15m)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d9488', marginTop: '0.25rem' }}>
            {stats.cupos_semanales_totales}
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: FILTROS + TABLA */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', flex: 1 }}>
            {/* Input Buscador */}
            <div
              style={{
                position: 'relative',
                minWidth: '220px',
                maxWidth: '320px',
                flex: 1,
              }}
            >
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                placeholder="Buscar médico o registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                  fontSize: '0.84rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Select Médico */}
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

            {/* Select Día de la Semana */}
            <select
              value={filterDia}
              onChange={(e) => setFilterDia(e.target.value)}
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
              <option value="">Todos los Días</option>
              {diasSemanaMeta.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>

            {/* Select Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
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
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={() => fetchTurnos(pagination.currentPage)}
            disabled={loading}
            title="Recargar datos"
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

        {/* TABLA DE TURNOS */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Médico Asignado</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Día</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Horario de Atención</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bloques (15 min)</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} style={{ color: '#0284c7', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>Cargando agenda de turnos...</p>
                  </td>
                </tr>
              ) : turnos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <Calendar size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>No se encontraron turnos configurados con los filtros aplicados.</p>
                  </td>
                </tr>
              ) : (
                turnos.map((turno) => {
                  const isActivo = turno.estado === 'ACTIVO';

                  return (
                    <tr
                      key={turno.id_turno}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* MÉDICO */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              border: '1px solid #bae6fd',
                              flexShrink: 0,
                            }}
                          >
                            {turno.medico_nombre ? turno.medico_nombre.replace('Dr(a). ', '').substring(0, 2).toUpperCase() : 'MD'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{turno.medico_nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              <span style={{ color: '#0284c7', fontWeight: 500 }}>{turno.especialidad_principal}</span>
                              {turno.matricula_profesional && (
                                <span style={{ marginLeft: '6px', color: '#94a3b8' }}>• Reg: {turno.matricula_profesional}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DÍA */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            color: '#334155',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                          }}
                        >
                          {turno.dia_nombre}
                        </span>
                      </td>

                      {/* HORARIO */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
                          <Clock size={14} style={{ color: '#0284c7' }} />
                          <span>{turno.horario_rango}</span>
                        </div>
                      </td>

                      {/* CUPOS / BLOQUES DE 15 MIN */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <button
                          type="button"
                          onClick={() => openSlotsModal(turno)}
                          style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            padding: '3px 9px',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Click para ver desglose de bloques"
                        >
                          <Layers size={13} />
                          <span>{turno.cupos_totales} cupos</span>
                        </button>
                      </td>

                      {/* ESTADO */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isActivo ? '#ecfdf5' : '#fffbeb',
                            color: isActivo ? '#059669' : '#d97706',
                            border: `1px solid ${isActivo ? '#a7f3d0' : '#fde68a'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isActivo ? '#059669' : '#d97706',
                            }}
                          />
                          {turno.estado}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          {/* Ver agenda semanal del médico */}
                          <button
                            onClick={() => fetchAgendaSemanal(turno.id_medico)}
                            title="Ver agenda semanal completa del médico"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              color: '#0284c7',
                              padding: '0.4rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                          >
                            <CalendarCheck2 size={14} />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => openEditModal(turno)}
                            title="Editar horario del turno"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              padding: '0.4rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Pausar / Activar */}
                          <button
                            onClick={() => openStatusModal(turno, isActivo ? 'INACTIVO' : 'ACTIVO')}
                            title={isActivo ? 'Pausar disponibilidad' : 'Reactivar turno'}
                            style={{
                              background: isActivo ? '#fffbeb' : '#ecfdf5',
                              border: `1px solid ${isActivo ? '#fde68a' : '#a7f3d0'}`,
                              color: isActivo ? '#d97706' : '#059669',
                              padding: '0.4rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Power size={14} />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDeleteTurno(turno)}
                            title="Eliminar turno"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '0.4rem 0.55rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
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

        {/* PAGINACIÓN */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b',
            background: '#ffffff',
          }}
        >
          <div>
            Mostrando <strong style={{ color: '#0f172a' }}>{turnos.length}</strong> de{' '}
            <strong style={{ color: '#0f172a' }}>{pagination.total}</strong> turnos registrados
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => fetchTurnos(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: pagination.currentPage <= 1 ? '#cbd5e1' : '#334155',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{ padding: '0 0.5rem', color: '#475569', fontWeight: 500 }}>
              Página {pagination.currentPage} de {pagination.lastPage}
            </span>

            <button
              onClick={() => fetchTurnos(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.lastPage || loading}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: pagination.currentPage >= pagination.lastPage ? '#cbd5e1' : '#334155',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                cursor: pagination.currentPage >= pagination.lastPage ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CONFIGURACIÓN / EDICIÓN DE TURNO */}
      <ModalTurnoForm
        isOpen={modalFormOpen}
        onClose={closeModals}
        onSave={handleSaveTurno}
        turnoToEdit={turnoToEdit}
        medicosMeta={medicosMeta}
        diasSemanaMeta={diasSemanaMeta}
        duracionesMeta={duracionesMeta}
        loading={actionLoading}
      />

      {/* MODAL CONFIRMAR ESTADO */}
      <ModalConfirmarEstadoTurno
        isOpen={modalStatusOpen}
        onClose={closeModals}
        onConfirm={handleConfirmChangeStatus}
        turno={turnoForStatus}
        nextStatus={nextStatusTarget}
        loading={actionLoading}
      />

      {/* MODAL DESGLOSE DE BLOQUES (15 MIN) */}
      <ModalBloquesTurno
        isOpen={modalSlotsOpen}
        onClose={closeModals}
        turno={turnoForSlots}
      />

      {/* MODAL AGENDA SEMANAL MÉDICO */}
      <ModalAgendaSemanalMedico
        isOpen={modalSemanalOpen}
        onClose={closeModals}
        agendaData={agendaSemanalData}
        loading={loadingSemanal}
      />
    </div>
  );
};

export default CU07_TurnosView;
