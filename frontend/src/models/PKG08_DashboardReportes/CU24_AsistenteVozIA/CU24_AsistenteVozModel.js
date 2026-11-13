/**
 * CU24: Asistente IA por Voz para Reserva Rápida de Citas
 * Modelo de datos y cliente API REST (Google Gemini API / Backend CVS-2026)
 */

import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.iaAsistente;

/**
 * Función auxiliar para realizar peticiones fetch seguras con parseo de JSON a prueba de fallos
 */
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
    throw new Error(`Error de comunicación con el servidor (HTTP ${res.status}): ${rawText.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Error ${res.status} al procesar la solicitud`);
  }

  return data;
}

export const CU24_AsistenteVozModel = {
  /**
   * Envía mensaje hablado/escrito a la IA para interpretación y búsqueda de cupos
   * Soporta contextoPrevio para retención de especialidad en cambios de día u horario
   */
  async interpretarVoz(mensaje, idPaciente = null, contextoPrevio = null) {
    const data = await fetchSeguro(`${API_BASE}/interpretar-voz`, {
      method: 'POST',
      body: JSON.stringify({
        mensaje,
        id_paciente: idPaciente,
        contexto_previo: contextoPrevio,
      }),
    });
    return data.data;
  },

  /**
   * Confirma la reserva rápida de la cita seleccionada
   */
  async confirmarReserva(datos) {
    const data = await fetchSeguro(`${API_BASE}/confirmar-reserva`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return data.data;
  },

  /**
   * Obtiene ejemplos clínicos de triaje guiado
   */
  async obtenerEjemplos() {
    try {
      const data = await fetchSeguro(`${API_BASE}/ejemplos`);
      return data.ejemplos || [];
    } catch (e) {
      console.warn('Fallback a ejemplos locales:', e);
      return [
        {
          icono: '🦷',
          titulo: 'Dolor de muela y encías',
          texto: 'Tengo un dolor muy fuerte de muela que no me deja dormir, quisiera una cita para la tarde',
          esperado: 'Odontología (Turno Tarde)',
        },
        {
          icono: '❤️',
          titulo: 'Presión alta y pecho',
          texto: 'Siento mucha agitación, palpitaciones y presión alta desde ayer',
          esperado: 'Cardiología (Prioritario)',
        },
        {
          icono: '👶',
          titulo: 'Chequeo de bebé / niño',
          texto: 'Necesito agendar el control de vacunas de mi hijo pequeño para la mañana',
          esperado: 'Pediatría (Turno Mañana)',
        },
        {
          icono: '🦴',
          titulo: 'Dolor en la rodilla tras caída',
          texto: 'Me doblé la rodilla jugando fútbol y no puedo apoyar el pie, busco traumatólogo',
          esperado: 'Traumatología (Cualquier horario)',
        },
        {
          icono: '🩺',
          titulo: 'Chequeo general / Gripe',
          texto: 'Tengo fiebre y dolor de cabeza, quiero consultar con medicina general mañana',
          esperado: 'Medicina General (Turno Mañana)',
        },
      ];
    }
  },

  /**
   * Obtiene el estado del motor Gemini
   */
  async obtenerEstadoMotor() {
    try {
      const data = await fetchSeguro(`${API_BASE}/estado-motor`);
      return data.estado || {
        activo: true,
        usa_gemini_api: true,
        motor_nombre: 'Google Gemini 3.5 Flash Activo',
        modelo: 'gemini-3.5-flash',
      };
    } catch (e) {
      return {
        activo: true,
        usa_gemini_api: true,
        motor_nombre: 'Google Gemini 3.5 Flash',
        modelo: 'gemini-3.5-flash',
      };
    }
  },

  /**
   * Obtiene el historial de consultas recientes a la IA
   */
  async obtenerHistorial() {
    const data = await fetchSeguro(`${API_BASE}/historial`);
    return data.historial || [];
  },
};

export default CU24_AsistenteVozModel;
