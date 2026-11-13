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
  Printer,
  FileText,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  CreditCard,
} from 'lucide-react';

import { useCU10ReservaCitaController } from '../../../controllers/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CU10_ReservaCitaController';
import { ESTADOS_CITA } from '../../../models/PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CitaModel';
import { ModalReservarCita } from './ModalReservarCita';
import { ModalFichaCita } from './ModalFichaCita';
import ModalGestionPago from '../CU23_GestionarPagos/ModalGestionPago';
import ModalComprobantePago from '../CU23_GestionarPagos/ModalComprobantePago';
import CU23_GestionarPagosModel from '../../../models/PKG05_GestionCitasConcurrencia/CU23_GestionarPagos/CU23_GestionarPagosModel';

export const CU10_ReservarCitaView = ({ currentUser = null }) => {
  const {
    citas,
    pagination,
    kpis,
    pacientesMeta,
    especialidadesMeta,
    medicosMeta,
    estadosMeta,
    searchTerm,
    setSearchTerm,
    filterMedico,
    setFilterMedico,
    filterEspecialidad,
    setFilterEspecialidad,
    filterEstado,
    setFilterEstado,
    filterFecha,
    setFilterFecha,
    loading,
    actionLoading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    modalReservaOpen,
    setModalReservaOpen,
    modalFichaOpen,
    setModalFichaOpen,
    citaForFicha,
    setCitaForFicha,
    fetchCitas,
    reservarCita,
    verFichaCita,
    cambiarEstadoCita,
  } = useCU10ReservaCitaController(currentUser);

  const [modalPagoOpen, setModalPagoOpen] = React.useState(false);
  const [citaParaPago, setCitaParaPago] = React.useState(null);
  const [modalComprobanteOpen, setModalComprobanteOpen] = React.useState(false);
  const [comprobanteGenerado, setComprobanteGenerado] = React.useState(null);
  const [pagoLoading, setPagoLoading] = React.useState(false);

  const handleAbrirCobro = (cita) => {
    setCitaParaPago({
      id_cita: cita.id_cita,
      codigo_cita: cita.codigo_cita,
      paciente_nombre: cita.paciente_nombre,
      especialidad: cita.especialidad_nombre,
      fecha_cita: cita.fecha_cita,
      hora_inicio: cita.horario_rango?.split(' - ')[0] || '08:00',
      tarifa_sugerida: 150.0,
    });
    setModalPagoOpen(true);
  };

  const handleConfirmarPagoDirecto = async (datosPago) => {
    setPagoLoading(true);
    try {
      const res = await CU23_GestionarPagosModel.registrarPago(datosPago);
      setModalPagoOpen(false);
      if (res.comprobante) {
        setComprobanteGenerado(res.comprobante);
        setModalComprobanteOpen(true);
      }
      setSuccessMsg('¡Pago de consulta médica registrado exitosamente!');
      fetchCitas();
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
    } finally {
      setPagoLoading(false);
    }
  };

  const handleReservarCita = reservarCita;
  const handleCambiarEstado = cambiarEstadoCita;
  const openReservaModal = () => setModalReservaOpen(true);
  const closeReservaModal = () => setModalReservaOpen(false);
  const openFichaModal = verFichaCita;
  const closeFichaModal = () => setModalFichaOpen(false);
  const clearMessages = () => { setError(null); setSuccessMsg(null); };

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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}>
              CU10
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Gestión de Citas y Concurrencia</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Reservar Cita Médica con Control de Concurrencia
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Actor(es): Paciente, Recepcionista • Bloqueo pesimista de cupos y emisión de ficha médica
          </p>
        </div>

        <button
          onClick={openReservaModal}
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
          <span>Nueva Cita Médica</span>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Citas Registradas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {kpis.total_citas}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0284c7', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citas Programadas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
            {kpis.citas_programadas}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #059669', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citas Confirmadas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
            {kpis.citas_confirmadas}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #0d9488', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citas Atendidas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d9488', marginTop: '0.25rem' }}>
            {kpis.citas_atendidas}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: '3px solid #d97706', borderRadius: '14px', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citas para Hoy</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
            {kpis.citas_hoy}
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
        {/* BARRA DE FILTROS */}
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
            {/* Buscador */}
            <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: 1 }}>
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
                placeholder="Buscar código, paciente o CI..."
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

            {/* Select Especialidad */}
            <select
              value={filterEspecialidad}
              onChange={(e) => setFilterEspecialidad(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                fontSize: '0.84rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              <option value="">Todas las Especialidades</option>
              {especialidadesMeta.map((esp) => (
                <option key={esp.id_especialidad} value={esp.id_especialidad}>
                  {esp.nombre}
                </option>
              ))}
            </select>

            {/* Select Médico */}
            <select
              value={filterMedico}
              onChange={(e) => setFilterMedico(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
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

            {/* Select Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
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
              {estadosMeta.map((est) => (
                <option key={est} value={est}>
                  {est}
                </option>
              ))}
            </select>

            {/* Filtro Fecha */}
            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              style={{
                padding: '0.55rem 0.75rem',
                fontSize: '0.84rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                fontWeight: 500,
              }}
            />
          </div>

          <button
            onClick={() => fetchCitas(pagination.currentPage)}
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

        {/* TABLA DE CITAS */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código Cita</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paciente</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Atención / Médico</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha & Horario</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado</th>
                <th style={{ padding: '0.9rem 1.1rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} style={{ color: '#0284c7', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>Cargando citas médicas...</p>
                  </td>
                </tr>
              ) : citas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <Calendar size={36} style={{ margin: '0 auto 0.5rem', color: '#cbd5e1' }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>No se encontraron citas médicas registradas.</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Ajuste los filtros o registre una nueva cita médica.</p>
                  </td>
                </tr>
              ) : (
                citas.map((cita) => {
                  const est = ESTADOS_CITA[cita.estado_cita] || ESTADOS_CITA.PROGRAMADA;

                  return (
                    <tr
                      key={cita.id_cita}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* CÓDIGO CITA */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <button
                          type="button"
                          onClick={() => openFichaModal(cita)}
                          style={{
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            padding: '0.25rem 0.6rem',
                            color: '#0284c7',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Click para ver/imprimir Ficha Médica"
                        >
                          <FileText size={13} />
                          <span>{cita.codigo_cita}</span>
                        </button>
                      </td>

                      {/* PACIENTE */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cita.paciente_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          CI: {cita.paciente_ci || 'N/A'} • Exp: {cita.paciente_expediente}
                        </div>
                      </td>

                      {/* ATENCIÓN / MÉDICO */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>{cita.medico_nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 500 }}>
                          <span>{cita.especialidad_nombre}</span>
                          {cita.matricula_profesional && (
                            <span style={{ marginLeft: '4px', color: '#94a3b8' }}>• Reg: {cita.matricula_profesional}</span>
                          )}
                        </div>
                      </td>

                      {/* FECHA & HORARIO */}
                      <td style={{ padding: '0.9rem 1.1rem' }}>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>{cita.fecha_cita}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                          <Clock size={12} />
                          <span>{cita.horario_rango} (15m)</span>
                        </div>
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
                            background: est.bg,
                            color: est.text,
                            border: `1px solid ${est.border}`,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: est.text }} />
                          {cita.estado_cita}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Ver Ficha / Ticket */}
                          <button
                            type="button"
                            onClick={() => openFichaModal(cita)}
                            title="Ver e Imprimir Ficha de Cita"
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
                            <Printer size={14} />
                          </button>

                          {/* Cobrar / Pagar Cita */}
                          <button
                            type="button"
                            onClick={() => handleAbrirCobro(cita)}
                            title="Cobrar / Registrar Pago de la Cita"
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#15803d',
                              padding: '0.4rem 0.65rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                            }}
                          >
                            <CreditCard size={13} />
                            <span>Cobrar</span>
                          </button>

                          {/* Confirmar Asistencia si está PROGRAMADA */}
                          {cita.estado_cita === 'PROGRAMADA' && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(cita.id_cita, 'CONFIRMADA')}
                              disabled={actionLoading}
                              title="Confirmar Cita Médica"
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#059669',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Check size={13} />
                              <span>Confirmar</span>
                            </button>
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
            Mostrando <strong style={{ color: '#0f172a' }}>{citas.length}</strong> de{' '}
            <strong style={{ color: '#0f172a' }}>{pagination.total}</strong> citas registradas
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => fetchCitas(pagination.currentPage - 1)}
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
              onClick={() => fetchCitas(pagination.currentPage + 1)}
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

      {/* MODAL RESERVAR CITA */}
      <ModalReservarCita
        isOpen={modalReservaOpen}
        onClose={closeReservaModal}
        onSave={handleReservarCita}
        pacientesMeta={pacientesMeta}
        especialidadesMeta={especialidadesMeta}
        medicosMeta={medicosMeta}
        loading={actionLoading}
        currentUser={currentUser}
      />

      {/* MODAL FICHA DE ATENCIÓN IMPRIMIBLE */}
      <ModalFichaCita
        isOpen={modalFichaOpen}
        onClose={closeFichaModal}
        cita={citaForFicha}
        onPagar={(c) => handleAbrirCobro(c)}
      />

      {/* MODAL GESTIÓN DE PAGO DIRECTO */}
      <ModalGestionPago
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        cita={citaParaPago}
        onConfirmarPago={handleConfirmarPagoDirecto}
        loading={pagoLoading}
      />

      {/* MODAL COMPROBANTE OFICIAL DE PAGO */}
      <ModalComprobantePago
        isOpen={modalComprobanteOpen}
        onClose={() => setModalComprobanteOpen(false)}
        comprobante={comprobanteGenerado}
      />
    </div>
  );
};

export default CU10_ReservarCitaView;
