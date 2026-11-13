import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HeartPulse,
  KeyRound,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useCU01AuthController } from '../../../controllers/PKG01_Seguridad/CU01_Autenticacion/CU01_AuthController';
import {
  checkPasswordRequirements,
  formatCooldownTime,
  initialLoginFormState,
  initialRecoveryFormState,
} from '../../../models/PKG01_Seguridad/CU01_Autenticacion/AuthModel';
import { PasswordRequirementBulbs } from './PasswordRequirementBulbs';

export const CU01_LoginView = ({ onLoginSuccess }) => {
  const {
    currentUser,
    loading,
    error,
    successMsg,
    loginCooldown,
    cooldown,
    iniciarSesion,
    solicitarCodigoRecuperacion,
    verificarCodigo,
    restablecerContrasena,
    cerrarSesion,
    limpiarMensajes,
  } = useCU01AuthController();

  // Modos de vista: 'login' | 'recovery_email' | 'recovery_otp' | 'recovery_new_password' | 'recovery_success'
  const [viewMode, setViewMode] = useState('login');

  // Estados de formularios
  const [loginForm, setLoginForm] = useState(initialLoginFormState);
  const [recoveryForm, setRecoveryForm] = useState(initialRecoveryFormState);

  // Visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Evaluación reactiva de los foquitos
  const passwordRequirements = checkPasswordRequirements(
    recoveryForm.newPassword,
    recoveryForm.confirmPassword
  );

  // Cambiar de pantalla limpiando mensajes
  const changeView = (newView) => {
    limpiarMensajes();
    setViewMode(newView);
  };

  // Manejar Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.login || !loginForm.password || loginCooldown > 0) return;
    const res = await iniciarSesion(loginForm.login, loginForm.password);
    if (res?.success && onLoginSuccess) {
      onLoginSuccess(res.user);
    }
  };

  // Acceso Rápido Administrador para Demo / Pruebas
  const handleFastAdminLogin = async () => {
    setLoginForm({ login: 'admin', password: 'Password123#', rememberMe: true });
    const res = await iniciarSesion('admin', 'Password123#');
    if (res?.success && onLoginSuccess) {
      onLoginSuccess(res.user);
    }
  };

  // Selector rápido de credenciales de prueba
  const handleQuickFill = (roleName, identifier) => {
    setLoginForm({
      login: identifier,
      password: 'Password123#',
      rememberMe: true,
    });
  };

  // Manejar Solicitud de Código (Paso 1)
  const handleRequestCodeSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryForm.email) return;
    const res = await solicitarCodigoRecuperacion(recoveryForm.email);
    if (res.success) {
      if (res.dev_otp) {
        setRecoveryForm((prev) => ({ ...prev, otp: res.dev_otp }));
      }
      changeView('recovery_otp');
    }
  };

  // Manejar Verificación OTP (Paso 2)
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryForm.otp || recoveryForm.otp.length !== 6) return;
    const res = await verificarCodigo(recoveryForm.email, recoveryForm.otp);
    if (res.success) {
      setRecoveryForm((prev) => ({ ...prev, resetTicket: res.resetTicket }));
      changeView('recovery_new_password');
    }
  };

  // Manejar Cambio de Contraseña (Paso 3)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordRequirements.isAllValid) return;

    const res = await restablecerContrasena(
      recoveryForm.email,
      recoveryForm.resetTicket,
      recoveryForm.newPassword,
      recoveryForm.confirmPassword
    );

    if (res.success) {
      changeView('recovery_success');
      setRecoveryForm(initialRecoveryFormState);
    }
  };

  return (
    <div className="login-page-wrapper" style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      position: 'relative',
      fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
    }}>
      {/* TARJETA PRINCIPAL DIVIDIDA MODO SENIOR */}
      <div className="login-card-container" style={{
        width: '100%',
        maxWidth: '1080px',
        minHeight: '640px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 2px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 460px) 1fr',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.9)',
      }}>
        {/* ======================================================== */}
        {/* PANEL IZQUIERDO: COLOR AZUL PROFUNDO Y CURVAS ORGÁNICAS  */}
        {/* ======================================================== */}
        <div className="login-left-panel" style={{
          padding: '3.5rem 3rem',
          background: 'linear-gradient(150deg, #0284c7 0%, #0369a1 45%, #075985 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
        }}>
          {/* CURVAS Y FORMAS ORGÁNICAS DECORATIVAS DEL FONDO */}
          <div style={{
            position: 'absolute',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(2, 132, 199, 0.05) 70%)',
            top: '-90px',
            right: '-100px',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: '460px',
            height: '460px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 65%)',
            bottom: '-140px',
            right: '-120px',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)',
            top: '30%',
            left: '-120px',
            pointerEvents: 'none',
          }} />

          {/* CONTENIDO SUPERIOR */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Header y Logo con HeartPulse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              }}>
                <HeartPulse size={28} color="#ffffff" strokeWidth={2.4} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: 0 }}>
                  Clínica Vida Salud
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#bae6fd', fontWeight: 500, margin: '2px 0 0' }}>
                  Sistema Web de Citas Médicas
                </p>
              </div>
            </div>

            {/* Badge de Plataforma */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              marginBottom: '1.5rem',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
              <span style={{ fontSize: '0.78rem', color: '#f0f9ff', fontWeight: 600 }}>Plataforma Digital 2026</span>
            </div>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}>
              Atención médica de excelencia, segura y centralizada.
            </h2>
            <p style={{
              fontSize: '0.94rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}>
              Gestión automatizada de turnos de 15 minutos, control de concurrencia, historias clínicas y resultados digitales sin papel.
            </p>

            {/* Badges de Especialidades */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {['Medicina General', 'Pediatría', 'Geriatría', 'Cardiología', 'Ginecología', 'Odontología'].map((esp) => (
                <span
                  key={esp}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f0f9ff',
                    fontWeight: 500,
                  }}
                >
                  {esp}
                </span>
              ))}
            </div>
          </div>

          {/* BADGE INFERIOR: SELLO DE SEGURIDAD */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 2,
            marginTop: '2rem',
          }}>
            <ShieldCheck size={22} color="#ffffff" strokeWidth={2.2} />
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Autenticación Segura y Trazable</p>
              <p style={{ fontSize: '0.74rem', color: '#e0f2fe', margin: '2px 0 0' }}>Retención de 2 minutos por seguridad ante intentos fallidos</p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANEL DERECHO: FORMULARIO BLANCO MODO SENIOR             */}
        {/* ======================================================== */}
        <div className="login-right-panel" style={{
          padding: '3.5rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'relative',
        }}>
          {/* ALERTAS */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.86rem',
              marginBottom: '1.25rem',
            }}>
              <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.8rem 1rem',
              borderRadius: '8px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: '0.86rem',
              marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 1: SESIÓN ACTIVA                                   */}
          {/* ======================================================== */}
          {currentUser && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.3)',
              }}>
                <User size={36} color="#ffffff" />
              </div>

              <h3 style={{ fontSize: '1.65rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.25rem' }}>
                ¡Bienvenido(a), {currentUser.username}!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {currentUser.email}
              </p>

              <div style={{
                display: 'inline-block',
                padding: '0.4rem 1.25rem',
                borderRadius: '20px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '1.75rem',
              }}>
                ROL AUTORIZADO: {currentUser.rol}
              </div>

              <button
                type="button"
                onClick={logout}
                style={{
                  width: '100%',
                  padding: '0.82rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <LogOut size={18} />
                <span>Cerrar Sesión Segura</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 2: INICIAR SESIÓN CON FORMATO MODERNO Y LIMPIO     */}
          {/* ======================================================== */}
          {!currentUser && viewMode === 'login' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                  fontSize: '1.95rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 0.35rem',
                  letterSpacing: '-0.025em',
                }}>
                  Iniciar Sesión
                </h2>
                <p style={{
                  fontSize: '0.92rem',
                  color: '#64748b',
                  margin: 0,
                }}>
                  Ingresa tus credenciales autorizadas de la Clínica Vida Salud
                </p>
              </div>

              {/* Alerta de Retención de 2 Minutos */}
              {loginCooldown > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#be123c',
                  marginBottom: '1.5rem',
                }}>
                  <ShieldAlert size={22} color="#e11d48" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.86rem', fontWeight: 700, margin: 0 }}>
                      Acceso Retenido Temporalmente
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#be123c', margin: '2px 0 0' }}>
                      Tiempo de espera por seguridad: <strong>{formatCooldownTime(loginCooldown)}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de Cuentas Activas / Autocompletado Demo */}
              <div style={{ marginBottom: '1.35rem' }}>
                <p style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  Cuentas activas en la clínica:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {[
                    { label: 'Admin', user: 'admin@clinicavidasalud.com' },
                    { label: 'Médico', user: 'medico@clinicavidasalud.com' },
                    { label: 'Recepción', user: 'recepcion@clinicavidasalud.com' },
                    { label: 'Paciente', user: 'paciente@clinicavidasalud.com' },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleQuickFill(btn.label, btn.user)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#e0f2fe';
                        e.currentTarget.style.borderColor = '#0284c7';
                        e.currentTarget.style.color = '#0284c7';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLoginSubmit}>
                {/* CAMPO: CORREO ELECTRÓNICO O USUARIO */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.45rem',
                  }}>
                    Correo Electrónico o Usuario
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      display: 'flex',
                    }}>
                      <Mail size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      disabled={loginCooldown > 0}
                      placeholder="ejemplo@clinicavidasalud.com"
                      value={loginForm.login}
                      onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.78rem 1rem 0.78rem 2.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.background = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.background = '#f8fafc';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* CAMPO: CONTRASEÑA */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.45rem',
                  }}>
                    Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                      display: 'flex',
                    }}>
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loginCooldown > 0}
                      placeholder="••••••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.78rem 2.85rem 0.78rem 2.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0284c7';
                        e.target.style.background = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.background = '#f8fafc';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      disabled={loginCooldown > 0}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* RECORDARME & ¿OLVIDÓ SU CONTRASEÑA? */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.65rem',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.86rem',
                    color: '#475569',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={loginForm.rememberMe}
                      onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                      style={{
                        accentColor: '#0284c7',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <span>Recordarme</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => changeView('recovery_email')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>

                {/* BOTÓN PRINCIPAL: INICIAR SESIÓN */}
                <button
                  type="submit"
                  disabled={loading || loginCooldown > 0}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: loginCooldown > 0 ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    cursor: (loading || loginCooldown > 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: loginCooldown > 0 ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!loading && loginCooldown === 0) e.currentTarget.style.background = '#0369a1';
                  }}
                  onMouseOut={(e) => {
                    if (!loading && loginCooldown === 0) e.currentTarget.style.background = '#0284c7';
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Validando credenciales...</span>
                    </>
                  ) : loginCooldown > 0 ? (
                    <>
                      <Clock size={18} />
                      <span>Espera {formatCooldownTime(loginCooldown)}</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* BOTÓN DE ACCESO RÁPIDO ADMINISTRADOR (DEMO) */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleFastAdminLogin}
                    disabled={loading || loginCooldown > 0}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px dashed #0284c7',
                      background: '#f0f9ff',
                      color: '#0369a1',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: (loading || loginCooldown > 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#e0f2fe'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                  >
                    <Sparkles size={16} color="#0284c7" />
                    <span>Entrar como Administrador (Demo: admin / Password123#)</span>
                  </button>
                  <span style={{ display: 'block', marginTop: '0.45rem', fontSize: '0.75rem', color: '#64748b' }}>
                    Acceso directo para evaluación y revisión del CU02 Bitácora
                  </span>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 3: RECUPERACIÓN - PASO 1 (EMAIL GMAIL)             */}
          {/* ======================================================== */}
          {!currentUser && viewMode === 'recovery_email' && (
            <div>
              <button
                type="button"
                onClick={() => changeView('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} />
                <span>Volver al inicio de sesión</span>
              </button>

              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                  Recuperación de Contraseña
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Ingresa tu correo registrado. Te enviaremos un código de seguridad de 6 dígitos mediante Google Gmail.
                </p>
              </div>

              {cooldown > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}>
                  <Clock size={18} color="#d97706" />
                  <span>Reenvío disponible en: <strong>{formatCooldownTime(cooldown)}</strong></span>
                </div>
              )}

              <form onSubmit={handleRequestCodeSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                    Correo Electrónico (Gmail)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="tu_correo@gmail.com"
                      value={recoveryForm.email}
                      onChange={(e) => setRecoveryForm({ ...recoveryForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.78rem 1rem 0.78rem 2.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: cooldown > 0 ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                  }}
                >
                  {loading ? 'Enviando código...' : (
                    <>
                      <span>Enviar Código de Verificación</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 4: RECUPERACIÓN - PASO 2 (VALIDAR OTP)              */}
          {/* ======================================================== */}
          {!currentUser && viewMode === 'recovery_otp' && (
            <div>
              <button
                type="button"
                onClick={() => changeView('recovery_email')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  marginBottom: '1.5rem',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} />
                <span>Cambiar de correo</span>
              </button>

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                  Verificar Código OTP
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Ingresa el código de 6 dígitos enviado a: <strong style={{ color: '#0284c7' }}>{recoveryForm.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtpSubmit}>
                <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '0.65rem' }}>
                    Código de 6 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={recoveryForm.otp}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, otp: e.target.value.replace(/\D/g, '') })}
                    style={{
                      width: '240px',
                      padding: '0.75rem',
                      fontSize: '1.9rem',
                      fontWeight: 800,
                      letterSpacing: '0.4em',
                      textAlign: 'center',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '2px solid #0284c7',
                      color: '#0284c7',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || recoveryForm.otp.length !== 6}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    cursor: (loading || recoveryForm.otp.length !== 6) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    marginBottom: '1rem',
                  }}
                >
                  {loading ? 'Verificando...' : (
                    <>
                      <span>Verificar y Continuar</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => requestResetCode(recoveryForm.email)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? '#94a3b8' : '#0284c7',
                    fontSize: '0.84rem',
                    cursor: (cooldown > 0 || loading) ? 'not-allowed' : 'pointer',
                    padding: '0.5rem',
                  }}
                >
                  {cooldown > 0 ? `Espera ${formatCooldownTime(cooldown)} para solicitar reenvío` : '¿No recibiste el correo? Reenviar código'}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 5: RECUPERACIÓN - PASO 3 (NUEVA CLAVE + FOQUITOS)   */}
          {/* ======================================================== */}
          {!currentUser && viewMode === 'recovery_new_password' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                  Nueva Contraseña
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Cumple con los parámetros de seguridad requeridos por la clínica.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                    Nueva Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Crea tu contraseña segura"
                      value={recoveryForm.newPassword}
                      onChange={(e) => setRecoveryForm({ ...recoveryForm, newPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.78rem 2.85rem 0.78rem 2.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: '0.45rem' }}>
                    Repetir Contraseña para Confirmar
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Lock size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repite la misma contraseña"
                      value={recoveryForm.confirmPassword}
                      onChange={(e) => setRecoveryForm({ ...recoveryForm, confirmPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.78rem 2.85rem 0.78rem 2.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Foquitos */}
                <PasswordRequirementBulbs requirements={passwordRequirements} />

                <button
                  type="submit"
                  disabled={loading || !passwordRequirements.isAllValid}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: passwordRequirements.isAllValid ? '#10b981' : '#94a3b8',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    cursor: (!passwordRequirements.isAllValid || loading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                  }}
                >
                  {loading ? 'Guardando contraseña...' : (
                    <>
                      <span>Restablecer y Actualizar Contraseña</span>
                      <ShieldCheck size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 6: ÉXITO TOTAL DE RECUPERACIÓN                     */}
          {/* ======================================================== */}
          {!currentUser && viewMode === 'recovery_success' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '1px solid #bbf7d0',
              }}>
                <CheckCircle2 size={40} color="#16a34a" />
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                ¡Contraseña Actualizada!
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Tu contraseña ha sido restablecida exitosamente en la base de datos de la <strong>Clínica Vida Salud</strong>. Ya puedes ingresar con tu nueva clave.
              </p>

              <button
                type="button"
                onClick={() => changeView('login')}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                }}
              >
                <span>Ir a Iniciar Sesión Ahora</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CU01_LoginView;
