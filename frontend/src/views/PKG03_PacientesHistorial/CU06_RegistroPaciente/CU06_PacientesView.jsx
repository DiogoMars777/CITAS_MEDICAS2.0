import React from 'react';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Power,
  Eye,
  CreditCard,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Heart,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

import { useCU06PacienteController } from '../../../controllers/PKG03_PacientesHistorial/CU06_RegistroPaciente/CU06_PacienteController';
import { ESTADOS_PACIENTE } from '../../../models/PKG03_PacientesHistorial/CU06_RegistroPaciente/PacienteModel';
import { ModalPacienteForm } from './ModalPacienteForm';
import { ModalConfirmarEstadoPac } from './ModalConfirmarEstadoPac';
import { ModalDetallePaciente } from './ModalDetallePaciente';

export const CU06_PacientesView = ({ currentUser = null }) => {
  const isPaciente = ['PACIENTE', 'CLIENTE'].includes(currentUser?.rol?.toUpperCase?.());

  const {
    pacientes,
    pagination,
    stats,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterPrimeraVisita,
    setFilterPrimeraVisita,
    filterSexo,
    setFilterSexo,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    pacienteToEdit,
    modalStatusOpen,
    pacienteForStatus,
    nextStatusTarget,
    modalDetailOpen,
    pacienteDetail,
    fetchPacientes,
    handleSavePaciente,
    handleConfirmChangeStatus,
    openCreateModal,
    openEditModal,
    openStatusModal,
    openDetailModal,
    closeModals,
    clearMessages,
  } = useCU06PacienteController();

  if (isPaciente) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShieldAlert size={36} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Acceso Exclusivo de Recepción</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
          El registro y apertura de historias clínicas de pacientes es una función exclusiva del personal de Recepción y Administración de la Clínica Vida Salud.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* CABECERA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0284c7',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            PKG03 Pacientes e Historial • CU06
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0 0' }}>
            Registro de Pacientes y Primera Visita
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Filiación de pacientes, control de CI único, apertura de expediente clínico y credenciales web.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.15rem',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Plus size={16} />
          Nuevo Paciente
        </button>
      </div>

      {/* MENSAJES DE NOTIFICACIÓN */}
      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} style={{ color: '#059669' }} />
            <span style={{ fontWeight: 500 }}>{successMsg}</span>
          </div>
          <button onClick={clearMessages} style={{ background: 'transparent', border: 'none', color: '#065f46', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={clearMessages} style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* MÉTRICAS SOBRIAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Pacientes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>{stats.total}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pacientes Activos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '0.35rem' }}>{stats.activos}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primera Visita (Nuevos)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginTop: '0.35rem' }}>{stats.primera_visita}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expedientes Clínicos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7', marginTop: '0.35rem' }}>{stats.expedientes_aperturados}</div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: FILTROS + TABLA */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}>
        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', flex: 1, minWidth: '320px' }}>
            {/* INPUT BÚSQUEDA */}
            <div style={{ position: 'relative', flex: 2, minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Buscar por CI, nombre, teléfono, correo o expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* FILTRO PRIMERA VISITA */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select
                value={filterPrimeraVisita}
                onChange={(e) => setFilterPrimeraVisita(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              >
                <option value="">Todas las Visitas</option>
                <option value="true">Primera Visita</option>
                <option value="false">Visitas Subsecuentes</option>
              </select>
            </div>

            {/* FILTRO ESTADO */}
            <div style={{ minWidth: '130px' }}>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              >
                <option value="">Todos los Estados</option>
                <option value="ACTIVO">Solo Activos</option>
                <option value="INACTIVO">Solo Inactivos</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => fetchPacientes(pagination.currentPage)}
            disabled={loading}
            title="Recargar padrón de pacientes"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0.55rem 0.85rem',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* TABLA DE PACIENTES */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PACIENTE</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CI (BOLIVIA)</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EXPEDIENTE / SANGRE</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CONTACTO</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>VISITA</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ESTADO</th>
                <th style={{ padding: '0.8rem 1rem', fontWeight: 600, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading && pacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#0284c7' }} />
                    Cargando pacientes desde PostgreSQL...
                  </td>
                </tr>
              ) : pacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron pacientes que coincidan con los criterios.
                  </td>
                </tr>
              ) : (
                pacientes.map((paciente) => {
                  const isActivo = paciente.estado === 'ACTIVO';

                  return (
                    <tr
                      key={paciente.id_paciente}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* PACIENTE */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#ecfdf5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid #a7f3d0',
                            flexShrink: 0,
                          }}>
                            {(paciente.nombres || 'P')[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.86rem' }}>
                              {paciente.nombre_completo}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
                              {paciente.edad !== null ? `${paciente.edad} años` : ''} • {paciente.sexo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CI */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          color: '#334155',
                          background: '#f8fafc',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}>
                          <CreditCard size={13} color="#0284c7" />
                          {paciente.ci}
                        </span>
                      </td>

                      {/* EXPEDIENTE Y TIPO DE SANGRE */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                            {paciente.numero_expediente}
                          </div>
                          {paciente.tipo_sangre && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '0.7rem',
                              color: '#0369a1',
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              marginTop: '0.2rem',
                              fontWeight: 600,
                            }}>
                              Sangre: {paciente.tipo_sangre}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CONTACTO */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.76rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155', fontWeight: 500 }}>
                            <Phone size={12} color="#64748b" /> {paciente.telefono}
                          </span>
                          {paciente.contacto_emergencia && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
                              <Heart size={12} color="#d97706" /> {paciente.contacto_emergencia.nombre} ({paciente.contacto_emergencia.parentesco})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PRIMERA VISITA */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {paciente.primera_visita ? (
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}>
                            Primera Visita
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}>
                            Subsecuente
                          </span>
                        )}
                      </td>

                      {/* ESTADO */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: isActivo ? '#ecfdf5' : '#f8fafc',
                          color: isActivo ? '#059669' : '#64748b',
                          border: `1px solid ${isActivo ? '#a7f3d0' : '#e2e8f0'}`,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActivo ? '#059669' : '#94a3b8' }} />
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openDetailModal(paciente)}
                            title="Ver ficha clínica completa"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '0.35rem 0.55rem',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <Eye size={13} style={{ color: '#0284c7' }} />
                            Ficha
                          </button>

                          <button
                            onClick={() => openEditModal(paciente)}
                            title="Editar paciente"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '0.35rem 0.55rem',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <Edit2 size={13} style={{ color: '#0284c7' }} />
                            Editar
                          </button>

                          <button
                            onClick={() => openStatusModal(paciente, isActivo ? 'INACTIVO' : 'ACTIVO')}
                            title={isActivo ? 'Pausar ficha' : 'Activar ficha'}
                            style={{
                              background: isActivo ? '#fef2f2' : '#ecfdf5',
                              border: `1px solid ${isActivo ? '#fecaca' : '#a7f3d0'}`,
                              borderRadius: '6px',
                              padding: '0.35rem 0.55rem',
                              color: isActivo ? '#dc2626' : '#059669',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            <Power size={13} />
                            {isActivo ? 'Pausar' : 'Activar'}
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
        {pagination.lastPage > 1 && (
          <div style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748b',
          }}>
            <div>
              Mostrando {pacientes.length} de {pagination.total} pacientes registrados
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => fetchPacientes(pagination.currentPage - 1)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.55rem',
                  color: '#334155',
                  cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '0 0.5rem', color: '#0f172a', fontWeight: 600 }}>
                {pagination.currentPage} / {pagination.lastPage}
              </span>

              <button
                disabled={pagination.currentPage >= pagination.lastPage || loading}
                onClick={() => fetchPacientes(pagination.currentPage + 1)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.35rem 0.55rem',
                  color: '#334155',
                  cursor: pagination.currentPage >= pagination.lastPage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      <ModalPacienteForm
        isOpen={modalFormOpen}
        onClose={closeModals}
        onSave={handleSavePaciente}
        pacienteToEdit={pacienteToEdit}
        loading={actionLoading}
      />

      {/* MODAL CONFIRMAR ESTADO */}
      <ModalConfirmarEstadoPac
        isOpen={modalStatusOpen}
        onClose={closeModals}
        onConfirm={handleConfirmChangeStatus}
        paciente={pacienteForStatus}
        nextStatus={nextStatusTarget}
        loading={actionLoading}
      />

      {/* MODAL FICHA DETALLE */}
      <ModalDetallePaciente
        isOpen={modalDetailOpen}
        onClose={closeModals}
        paciente={pacienteDetail}
      />
    </div>
  );
};

export default CU06_PacientesView;
