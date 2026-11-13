import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/services/apiClient';
import CU01_LoginView from './views/PKG01_Seguridad/CU01_Autenticacion/CU01_LoginView';
import MainLayout from './views/layouts/MainLayout';

function App() {
  const [isValidatingSession, setIsValidatingSession] = useState(true);

  // Estado del usuario autenticado: exige login inicial (CU01) salvo sesión real guardada
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('clinica_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed.token !== 'demo_session_token_2026') {
          return parsed;
        }
      } catch {
        // Ignorar JSON corrupto
      }
      localStorage.removeItem('clinica_user');
    }
    return null;
  });

  // Manejador de Logout Seguro
  const handleLogout = useCallback(async () => {
    try {
      const saved = localStorage.getItem('clinica_user');
      const token = saved ? JSON.parse(saved)?.token : null;
      if (token && token !== 'demo_session_token_2026') {
        await fetch(`${API_ENDPOINTS.auth}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      localStorage.removeItem('clinica_user');
      setCurrentUser(null);
    }
  }, []);

  // FASE 3: Validar sesión con /api/auth/me al cargar la aplicación
  useEffect(() => {
    // Registrar el handler en el cliente HTTP centralizado
    apiClient.setLogoutHandler(handleLogout);

    const handleUnauthorizedEvent = () => {
      handleLogout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);

    const validateSession = async () => {
      const saved = localStorage.getItem('clinica_user');
      if (!saved) {
        setIsValidatingSession(false);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        if (!parsed?.token || parsed.token === 'demo_session_token_2026') {
          localStorage.removeItem('clinica_user');
          setCurrentUser(null);
          setIsValidatingSession(false);
          return;
        }

        const res = await fetch(`${API_ENDPOINTS.auth}/me`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${parsed.token}`,
          },
        });

        if (res.ok) {
          const body = await res.json();
          if (body.success && body.user) {
            // Actualizar datos del usuario autenticado desde el servidor
            const updatedUser = {
              ...parsed,
              ...body.user,
              token: parsed.token,
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('clinica_user', JSON.stringify(updatedUser));
          } else {
            handleLogout();
          }
        } else {
          // Token expirado o revocado (401 / 403)
          handleLogout();
        }
      } catch (e) {
        console.warn('Error al verificar sesión en backend:', e);
        // Si el backend no responde, conservar sesión local para evitar desconexión temporal por red
      } finally {
        setIsValidatingSession(false);
      }
    };

    validateSession();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [handleLogout]);

  // Manejador de Login Exitoso
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('clinica_user', JSON.stringify(userData));
  };

  if (isValidatingSession && currentUser?.token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-300">Validando sesión con Clínica Vida Salud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {currentUser ? (
        <MainLayout currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <main>
          <CU01_LoginView onLoginSuccess={handleLoginSuccess} />
        </main>
      )}
    </div>
  );
}

export default App;
