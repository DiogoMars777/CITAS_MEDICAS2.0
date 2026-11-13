import { useState, useEffect, useCallback } from 'react';
import CU23_GestionarPagosModel from '../../../models/PKG05_GestionCitasConcurrencia/CU23_GestionarPagos/CU23_GestionarPagosModel';

export function useGestionarPagos(currentUser) {
  const [tabActivo, setTabActivo] = useState('PENDIENTES'); // 'PENDIENTES' | 'HISTORIAL'
  const [pagosList, setPagosList] = useState([]);
  const [pendientesList, setPendientesList] = useState([]);
  const [resumenCaja, setResumenCaja] = useState({
    fecha: new Date().toISOString().split('T')[0],
    total_recaudado: 0,
    total_efectivo: 0,
    total_qr: 0,
    total_transferencia: 0,
    total_paypal: 0,
    cantidad_transacciones: 0,
    citas_pendientes_cobro: 0,
  });

  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1, per_page: 15 });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filtros
  const [filtroBuscar, setFiltroBuscar] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Modales
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [citaParaCobro, setCitaParaCobro] = useState(null);

  const [modalComprobanteOpen, setModalComprobanteOpen] = useState(false);
  const [comprobanteActual, setComprobanteActual] = useState(null);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isPac = ['PACIENTE', 'CLIENTE'].includes(currentUser?.rol?.toUpperCase?.());
      const idPaciente = isPac ? currentUser?.id_paciente : undefined;
      const token = currentUser?.token;

      const [resumen, pendientes, pagos] = await Promise.all([
        !isPac ? CU23_GestionarPagosModel.obtenerResumenCaja(null, token) : Promise.resolve(null),
        CU23_GestionarPagosModel.obtenerPendientes({
          buscar: filtroBuscar,
          fecha: filtroFecha,
          id_paciente: idPaciente,
        }, token),
        CU23_GestionarPagosModel.listarPagos({
          buscar: filtroBuscar,
          metodo_pago: filtroMetodo,
          estado_pago: filtroEstado,
          fecha_desde: filtroFecha,
          page: meta.current_page,
          id_paciente: idPaciente,
        }, token),
      ]);

      if (resumen) setResumenCaja(resumen);
      if (pendientes) setPendientesList(pendientes);
      if (pagos && pagos.data) {
        setPagosList(pagos.data);
        if (pagos.meta) setMeta(pagos.meta);
      }
    } catch (err) {
      console.error('Error al cargar datos de pagos y caja:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [filtroBuscar, filtroMetodo, filtroEstado, filtroFecha, meta.current_page, currentUser?.id_paciente, currentUser?.rol, currentUser?.token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Abrir modal de cobro para una cita
  const abrirCobro = (cita) => {
    setCitaParaCobro(cita);
    setModalPagoOpen(true);
    setError(null);
  };

  const cerrarCobro = () => {
    setModalPagoOpen(false);
    setCitaParaCobro(null);
  };

  // Procesar registro de pago
  const procesarPago = async (datosPago) => {
    setActionLoading(true);
    setError(null);
    try {
      const payload = {
        id_cita: citaParaCobro?.id_cita || datosPago.id_cita,
        monto: datosPago.monto,
        metodo_pago: datosPago.metodo_pago,
        canal_pago: datosPago.canal_pago || (currentUser?.rol === 'Paciente' ? 'EN_LINEA_PACIENTE' : 'RECEPCION'),
        monto_recibido: datosPago.monto_recibido,
        referencia_transaccion: datosPago.referencia_transaccion,
        email_paypal: datosPago.email_paypal,
        detalles_pago: datosPago.detalles_pago || {},
      };

      const res = await CU23_GestionarPagosModel.registrarPago(payload);

      setSuccessMsg(res.mensaje || '¡Pago registrado exitosamente!');
      cerrarCobro();

      // Abrir comprobante generado
      if (res.comprobante) {
        setComprobanteActual(res.comprobante);
        setModalComprobanteOpen(true);
      }

      // Recargar lista y resumen
      await cargarDatos();
      return { success: true, comprobante: res.comprobante };
    } catch (err) {
      setError(err.message || 'No se pudo procesar el pago.');
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  // Ver comprobante
  const verComprobante = async (idPago) => {
    setActionLoading(true);
    try {
      const data = await CU23_GestionarPagosModel.obtenerComprobante(idPago);
      setComprobanteActual(data);
      setModalComprobanteOpen(true);
    } catch (err) {
      setError('Error al cargar comprobante: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const cerrarComprobante = () => {
    setModalComprobanteOpen(false);
    setComprobanteActual(null);
  };

  return {
    tabActivo,
    setTabActivo,
    pagosList,
    pendientesList,
    resumenCaja,
    meta,
    loading,
    actionLoading,
    error,
    setError,
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
  };
}

export default useGestionarPagos;

