/**
 * Cliente HTTP Centralizado para Clínica Vida Salud
 * FASE 3: Seguridad Frontend & Manejo de Sesión
 *
 * Características:
 * - Adjunta token Bearer automáticamente si existe sesión
 * - Manejo automático de encabezados JSON
 * - Intercepta 401 (No autenticado / Token expirado): limpia localStorage y cierra sesión
 * - Intercepta 403 (Acceso denegado): informa al usuario sin crash
 * - Errores de red seguros y mensajes genéricos
 */

import { API_BASE_URL } from '../config/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.logoutCallback = null;
  }

  /**
   * Registra un callback global para forzar logout si se detecta 401
   */
  setLogoutHandler(callback) {
    this.logoutCallback = callback;
  }

  /**
   * Obtiene el token de sesión almacenado en localStorage
   */
  getToken() {
    try {
      const saved = localStorage.getItem('clinica_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.token || null;
      }
    } catch {
      // Ignorar error de JSON corrupto
    }
    return null;
  }

  /**
   * Manejador central de 401
   */
  handleUnauthorized() {
    try {
      localStorage.removeItem('clinica_user');
    } catch {}

    if (typeof this.logoutCallback === 'function') {
      this.logoutCallback();
    } else {
      // Si no hay callback registrado, recargar para enviar a login
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  /**
   * Ejecuta peticiones fetch con interceptores de seguridad
   */
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    const token = this.getToken();

    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    // Agregar Content-Type: application/json salvo si es FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // 401 No autenticado: expirar sesión de inmediato
      if (response.status === 401) {
        this.handleUnauthorized();
        const err = new Error('Sesión expirada o inválida. Por favor inicie sesión nuevamente.');
        err.status = 401;
        throw err;
      }

      // 403 Acceso Denegado
      if (response.status === 403) {
        const errData = await response.json().catch(() => ({}));
        const err = new Error(errData.message || 'Acceso denegado: permisos insuficientes.');
        err.status = 403;
        err.data = errData;
        throw err;
      }

      // Intentar parsear respuesta JSON
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const err = new Error(data?.message || `Error del servidor (${response.status})`);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const netErr = new Error('No se pudo conectar con el servidor de la clínica. Verifique su conexión de red.');
        netErr.status = 0;
        netErr.isNetworkError = true;
        throw netErr;
      }
      throw error;
    }
  }

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  post(url, body = {}, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(url, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put(url, body = {}, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch(url, body = {}, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

