/**
 * CU23: Gestionar Pagos y Cobranza de Citas Médicas
 * Modelo cliente API REST (Clínica Vida Salud - 2026)
 */

import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.pagos;

async function fetchSeguro(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const rawText = await res.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (err) {
    throw new Error(`Error de comunicación con el servidor (HTTP ${res.status}): ${rawText.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Error ${res.status} al procesar la solicitud`);
  }

  return data;
}

export const CU23_GestionarPagosModel = {
  /**
   * Obtiene la lista paginada de pagos registrados con filtros
   */
  async listarPagos(filtros = {}, token = null) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.metodo_pago) params.append('metodo_pago', filtros.metodo_pago);
    if (filtros.estado_pago) params.append('estado_pago', filtros.estado_pago);
    if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
    if (filtros.id_paciente) params.append('id_paciente', filtros.id_paciente);
    if (filtros.page) params.append('page', filtros.page);
    if (filtros.per_page) params.append('per_page', filtros.per_page);

    const query = params.toString() ? `?${params.toString()}` : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await fetchSeguro(`${API_BASE}${query}`, { headers });
    return data;
  },

  /**
   * Lista citas médicas pendientes de cobro
   */
  async obtenerPendientes(filtros = {}, token = null) {
    const params = new URLSearchParams();
    if (filtros.buscar) params.append('buscar', filtros.buscar);
    if (filtros.fecha) params.append('fecha', filtros.fecha);
    if (filtros.id_paciente) params.append('id_paciente', filtros.id_paciente);

    const query = params.toString() ? `?${params.toString()}` : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await fetchSeguro(`${API_BASE}/pendientes${query}`, { headers });
    return data.data || [];
  },

  /**
   * Obtiene resumen financiero de caja para el día
   */
  async obtenerResumenCaja(fecha = null, token = null) {
    const query = fecha ? `?fecha=${fecha}` : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const data = await fetchSeguro(`${API_BASE}/resumen-caja${query}`, { headers });
    return data.data || {};
  },

  /**
   * Consulta el estado de pago de una cita específica
   */
  async obtenerEstadoPagoCita(idCita) {
    const data = await fetchSeguro(`${API_BASE}/cita/${idCita}`);
    return data.data || {};
  },

  /**
   * Registra un pago de cita médica (Efectivo, QR, Transferencia, PayPal, Tarjeta)
   */
  async registrarPago(datos) {
    const data = await fetchSeguro(`${API_BASE}`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return data;
  },

  /**
   * Verificación en línea de pago con QR Simple (Bolivia)
   */
  async verificarQR(datos) {
    const data = await fetchSeguro(`${API_BASE}/verificar-qr`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return data;
  },

  // Alias de compatibilidad
  async simularVerificacionQR(datos) {
    return this.verificarQR(datos);
  },

  /**
   * Verificación y autorización con PayPal Express Checkout
   */
  async iniciarCheckoutPayPal(datos) {
    const data = await fetchSeguro(`${API_BASE}/verificar-paypal`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return data;
  },

  // Alias de compatibilidad
  async simularCheckoutPayPal(datos) {
    return this.iniciarCheckoutPayPal(datos);
  },

  /**
   * Obtiene comprobante/recibo oficial listo para imprimir
   */
  async obtenerComprobante(idPago) {
    const data = await fetchSeguro(`${API_BASE}/comprobante/${idPago}`);
    return data.data || {};
  },
};

export default CU23_GestionarPagosModel;

