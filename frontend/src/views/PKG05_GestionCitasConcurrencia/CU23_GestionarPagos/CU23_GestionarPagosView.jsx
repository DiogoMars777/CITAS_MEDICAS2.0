import React from 'react';
import {
  CreditCard,
  DollarSign,
  QrCode,
  Building,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  RefreshCw,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useGestionarPagos } from '../../../controllers/PKG05_GestionCitasConcurrencia/CU23_GestionarPagos/CU23_GestionarPagosController';
import ModalGestionPago from './ModalGestionPago';
import ModalComprobantePago from './ModalComprobantePago';

export const CU23_GestionarPagosView = ({ currentUser }) => {
  const {
    tabActivo,
    setTabActivo,
    pagosList,
    pendientesList,
    resumenCaja,
    loading,
    actionLoading,
    error,
    successMsg,
    setSuccessMsg,
    filtroBuscar,
    setFiltroBuscar,
    filtroMetodo,
    setFiltroMetodo,
    filtroEstado,
    setFiltroEstado,
    filtroFecha,
    setFiltroFecha,
    modalPagoOpen,
    citaParaCobro,
    abrirCobro,
    cerrarCobro,
    procesarPago,
    modalComprobanteOpen,
    comprobanteActual,
    verComprobante,
    cerrarComprobante,
    cargarDatos,
  } = useGestionarPagos(currentUser);

  const isPaciente = ['PACIENTE', 'CLIENTE'].includes(currentUser?.rol?.toUpperCase?.());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#0f172a' }}>
      {/* 1. ENCABEZADO EJECUTIVO CU23 */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}
          >
            <CreditCard size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#d97706',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                PKG05 • Gestión de Citas y Concurrencia
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  color: '#b45309',
                  fontWeight: 800,
                }}
              >
                CU23 Oficial
              </span>
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {isPaciente ? 'Mis Pagos y Comprobantes de Consulta' : 'Gestión de Pagos y Caja de Citas Médicas'}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Cobro de citas médicas (Efectivo, QR Simple, Transferencia, PayPal) • Política institucional de no devoluciones
            </p>
          </div>
        </div>

        {/* BOTÓN RECARGAR */}
        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#334155',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Actualizar Caja</span>
        </button>
      </div>

      {/* MENSAJES DE ALERTA O ÉXITO */}
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'transparent', border: 'none', color: '#15803d', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. TARJETAS DE RESUMEN FINANCIERO (KPIs CAJA) */}
      {!isPaciente && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {/* Card 1: Total Recaudado */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TOTAL RECAUDADO HOY</span>
              <TrendingUp size={16} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284c7' }}>
              Bs. {resumenCaja.total_recaudado.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
              {resumenCaja.cantidad_transacciones} cobros realizados
            </div>
          </div>

          {/* Card 2: Efectivo */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>EN EFECTIVO (CAJA)</span>
              <DollarSign size={16} color="#16a34a" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>
              Bs. {resumenCaja.total_efectivo.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>Cobro directo en ventanilla</div>
          </div>

          {/* Card 3: QR Simple */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PAGOS POR QR SIMPLE</span>
              <QrCode size={16} color="#0369a1" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0369a1' }}>
              Bs. {resumenCaja.total_qr.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>Red Enlace / Banco Unión / BCP</div>
          </div>

          {/* Card 4: Transferencia / PayPal */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TRANSF. / PAYPAL</span>
              <Building size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#8b5cf6' }}>
              Bs. {(resumenCaja.total_transferencia + resumenCaja.total_paypal).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>Depósito bancario y PayPal</div>
          </div>

          {/* Card 5: Citas Pendientes */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #fde68a',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309' }}>PENDIENTES DE COBRO</span>
              <Clock size={16} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>
              {resumenCaja.citas_pendientes_cobro} citas
            </div>
            <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>Por cobrar en sala / recepción</div>
          </div>
        </div>
      )}

      {/* 3. TABS Y VISTA DE TABLAS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        {/* ENCABEZADO DE TABS */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setTabActivo('PENDIENTES')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: tabActivo === 'PENDIENTES' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: tabActivo === 'PENDIENTES' ? '#f0f9ff' : '#ffffff',
                color: tabActivo === 'PENDIENTES' ? '#0369a1' : '#64748b',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Clock size={15} />
              <span>Citas Pendientes de Pago ({pendientesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActivo('HISTORIAL')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: tabActivo === 'HISTORIAL' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: tabActivo === 'HISTORIAL' ? '#f0f9ff' : '#ffffff',
                color: tabActivo === 'HISTORIAL' ? '#0369a1' : '#64748b',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <FileText size={15} />
              <span>Historial de Pagos y Recibos</span>
            </button>
          </div>

          {/* BARRA DE BÚSQUEDA RÁPIDA */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color="#94a3b8"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
                placeholder="Buscar por paciente, CI, código..."
                style={{
                  padding: '0.4rem 0.6rem 0.4rem 2rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.76rem',
                  width: '210px',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>
        </div>

        {/* CONTENIDO TAB 1: CITAS PENDIENTES DE PAGO */}
        {tabActivo === 'PENDIENTES' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>CÓDIGO CITA</th>
                  <th style={{ padding: '0.75rem 1rem' }}>PACIENTE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ESPECIALIDAD / MÉDICO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FECHA / HORA</th>
                  <th style={{ padding: '0.75rem 1rem' }}>TARIFA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {pendientesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 700 }}>No hay citas pendientes de cobro para el criterio seleccionado</div>
                      <div style={{ fontSize: '0.72rem' }}>Todas las citas programadas cuentan con pago o no hay registros</div>
                    </td>
                  </tr>
                ) : (
                  pendientesList.map((cita) => (
                    <tr
                      key={cita.id_cita}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7' }}>
                        {cita.codigo_cita}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{cita.paciente_nombre}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>CI: {cita.paciente_ci || 'S/N'}</div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{cita.especialidad}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{cita.medico_nombre}</div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{cita.fecha_cita}</div>
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700 }}>
                          {cita.hora_inicio} - {cita.hora_fin}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#fef3c7',
                            color: '#b45309',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                          }}
                        >
                          Bs. {cita.tarifa_sugerida.toFixed(2)}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => abrirCobro(cita)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                          }}
                        >
                          <CreditCard size={14} />
                          <span>Cobrar Cita</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CONTENIDO TAB 2: HISTORIAL DE PAGOS */}
        {tabActivo === 'HISTORIAL' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>COMPROBANTE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>FECHA PAGO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>PACIENTE</th>
                  <th style={{ padding: '0.75rem 1rem' }}>CITA ASOCIADA</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MÉTODO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MONTO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ESTADO</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {pagosList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <FileText size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 700 }}>No hay pagos registrados en este período</div>
                    </td>
                  </tr>
                ) : (
                  pagosList.map((p) => (
                    <tr
                      key={p.id_pago}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>
                          {p.numero_comprobante}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{p.codigo_pago}</div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 600 }}>
                        {p.fecha_pago ? new Date(p.fecha_pago).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : 'S/N'}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {p.paciente ? `${p.paciente.nombres} ${p.paciente.apellidos}` : 'Paciente'}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b' }}>CI: {p.paciente?.ci}</div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>
                          {p.cita?.codigo_cita}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                          {p.cita?.especialidad?.nombre}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background:
                              p.metodo_pago === 'EFECTIVO'
                                ? '#dcfce7'
                                : p.metodo_pago === 'QR'
                                ? '#e0f2fe'
                                : p.metodo_pago === 'PAYPAL'
                                ? '#f0f7ff'
                                : '#ede9fe',
                            color:
                              p.metodo_pago === 'EFECTIVO'
                                ? '#15803d'
                                : p.metodo_pago === 'QR'
                                ? '#0369a1'
                                : p.metodo_pago === 'PAYPAL'
                                ? '#003087'
                                : '#6d28d9',
                            fontWeight: 800,
                            fontSize: '0.7rem',
                          }}
                        >
                          {p.metodo_pago}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#0f172a' }}>
                        Bs. {parseFloat(p.monto).toFixed(2)}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: p.estado_pago === 'COMPLETADO' ? '#dcfce7' : '#fee2e2',
                            color: p.estado_pago === 'COMPLETADO' ? '#15803d' : '#b91c1c',
                            fontWeight: 800,
                            fontSize: '0.68rem',
                          }}
                        >
                          {p.estado_pago === 'COMPLETADO' ? 'PAGADO' : p.estado_pago}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => verComprobante(p.id_pago)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0284c7',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Printer size={13} />
                          <span>Ver Recibo</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL GESTIÓN DE COBRO */}
      <ModalGestionPago
        isOpen={modalPagoOpen}
        onClose={cerrarCobro}
        cita={citaParaCobro}
        currentUser={currentUser}
        onConfirmarPago={procesarPago}
        loading={actionLoading}
      />

      {/* MODAL COMPROBANTE OFICIAL DE PAGO */}
      <ModalComprobantePago
        isOpen={modalComprobanteOpen}
        onClose={cerrarComprobante}
        comprobante={comprobanteActual}
      />
    </div>
  );
};

export default CU23_GestionarPagosView;

