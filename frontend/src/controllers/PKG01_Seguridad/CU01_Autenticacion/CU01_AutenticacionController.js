import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_ENDPOINTS.auth;

/**
 * Controller Hook para CU01 - Autenticación y Recuperación de Contraseña
 */
export const useCU01AutenticacionController = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('clinica_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  // 1. Estado del bloqueo de 2 minutos para LOGIN
  const [loginCooldown, setLoginCooldown] = useState(() => {
    const saved = localStorage.getItem('login_cooldown_end');
    if (saved) {
      const remaining = Math.max(0, Math.ceil((parseInt(saved, 10) - Date.now()) / 1000));
      return remaining;
    }
    return 0;
  });

  // 2. Estado del bloqueo de 2 minutos para RECUPERACIÓN DE CONTRASEÑA
  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem('recovery_cooldown_end');
    if (saved) {
      const remaining = Math.max(0, Math.ceil((parseInt(saved, 10) - Date.now()) / 1000));
      return remaining;
    }
    return 0;
  });

  // Temporizador para Bloqueo de Login (2 minutos)
  useEffect(() => {
    if (loginCooldown <= 0) return;

    const timer = setInterval(() => {
      setLoginCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem('login_cooldown_end');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loginCooldown]);

  // Temporizador para Bloqueo de Recuperación (2 minutos)
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem('recovery_cooldown_end');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const iniciarContadorLogin = (seconds = 120) => {
    setLoginCooldown(seconds);
    localStorage.setItem('login_cooldown_end', String(Date.now() + seconds * 1000));
  };

  const iniciarContadorRecuperacion = (seconds = 120) => {
    setCooldown(seconds);
    localStorage.setItem('recovery_cooldown_end', String(Date.now() + seconds * 1000));
  };

  /**
   * 1. Iniciar Sesión con Bloqueo de 2 minutos si falla
   */
  const iniciarSesion = async (loginId, password) => {
    if (loginCooldown > 0) {
      setError(`Acceso bloqueado por seguridad. Inténtalo en ${loginCooldown} segundos.`);
      return { success: false, locked: true, loginCooldown };
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ login: loginId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.locked) {
          iniciarContadorLogin(data.cooldown_seconds || 120);
        }
        if (data.attempts_left !== undefined) {
          setAttemptsLeft(data.attempts_left);
        }
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      const userData = { ...data.user, token: data.token };
      setCurrentUser(userData);
      localStorage.setItem('clinica_user', JSON.stringify(userData));
      setSuccessMsg(data.message || 'Inicio de sesión exitoso.');
      setAttemptsLeft(null);
      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. Solicitar Código por Correo (Gmail / Google SMTP) con bloqueo de 2 min
   */
  const solicitarCodigoRecuperacion = async (email) => {
    if (cooldown > 0) {
      setError(`Debes esperar ${cooldown} segundos antes de solicitar otro código.`);
      return { success: false, locked: true, cooldown };
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.locked) {
          iniciarContadorRecuperacion(data.cooldown_seconds || 120);
        }
        throw new Error(data.message || 'No se pudo enviar el código.');
      }

      iniciarContadorRecuperacion(data.cooldown_seconds || 120);
      setSuccessMsg(data.message);
      return { success: true, dev_otp: data.dev_otp };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 3. Verificar Código OTP
   */
  const verificarCodigo = async (email, otp) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Código incorrecto o expirado.');
      }

      setSuccessMsg(data.message);
      return { success: true, resetTicket: data.reset_ticket };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 4. Restablecer Contraseña con Validación Estricta
   */
  const restablecerContrasena = async (email, resetTicket, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email,
          reset_ticket: resetTicket,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorList = data.errors ? Object.values(data.errors).flat().join(' ') : data.message;
        throw new Error(errorList || 'Error al actualizar la contraseña.');
      }

      setSuccessMsg(data.message);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 5. Cerrar Sesión
   */
  const cerrarSesion = async () => {
    try {
      if (currentUser?.token) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`,
          },
        });
      }
    } catch (e) {
      console.warn('Logout:', e);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('clinica_user');
      setSuccessMsg('Has cerrado sesión de forma segura.');
    }
  };

  const limpiarMensajes = () => {
    setError(null);
    setSuccessMsg(null);
  };

  return {
    currentUser,
    loading,
    error,
    successMsg,
    attemptsLeft,
    loginCooldown,
    cooldown,
    // Funciones en Español
    iniciarSesion,
    solicitarCodigoRecuperacion,
    verificarCodigo,
    restablecerContrasena,
    cerrarSesion,
    limpiarMensajes,
    // Alias en inglés para compatibilidad
    login: iniciarSesion,
    requestResetCode: solicitarCodigoRecuperacion,
    verifyCode: verificarCodigo,
    submitNewPassword: restablecerContrasena,
    logout: cerrarSesion,
    clearMessages: limpiarMensajes,
  };
};

export const useCU01AuthController = useCU01AutenticacionController;
export default useCU01AutenticacionController;
