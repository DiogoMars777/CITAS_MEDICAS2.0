/**
 * Interceptor global de peticiones HTTP (fetch) para Clínica Vida Salud
 * Inyecta automáticamente los encabezados de autenticación Sanctum
 * y gestiona respuestas 401 de sesión expirada.
 */
import { API_BASE_URL } from '@/config/api';

export const installFetchInterceptor = () => {
  if (typeof window === 'undefined') return;
  if (window.__clinicaFetchInterceptorInstalled) return;
  window.__clinicaFetchInterceptorInstalled = true;

  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input.url === 'string') {
      url = input.url;
    }

    // Identificar si la solicitud va a la API del backend
    const isApiCall = url.includes('/api') || url.startsWith(API_BASE_URL);

    if (isApiCall) {
      // 1. Obtener token de Sanctum desde localStorage
      let token = localStorage.getItem('token');
      if (!token) {
        try {
          const userStr = localStorage.getItem('clinica_user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            token = parsed?.token || null;
            if (token) {
              localStorage.setItem('token', token);
            }
          }
        } catch {
          // Ignorar JSON corrupto
        }
      }

      // 2. Preparar encabezados
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));

      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const modifiedInit = {
        ...init,
        headers,
      };

      const response = await originalFetch(input, modifiedInit);

      // 3. Manejo de 401 (Sesión inválida o expirada)
      if (
        response.status === 401 &&
        !url.includes('/api/auth/login') &&
        !url.includes('/api/auth/forgot-password') &&
        !url.includes('/api/auth/verify-code')
      ) {
        console.warn('Sesión no autorizada (401) en:', url);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      return response;
    }

    return originalFetch(input, init);
  };
};

export default installFetchInterceptor;
