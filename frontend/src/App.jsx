import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import CU01_LoginView from './views/PKG01_Seguridad/CU01_Autenticacion/CU01_LoginView';
import MainLayout from './views/layouts/MainLayout';

function App() {
  // Estado del usuario autenticado (se recupera de localStorage o inicia como admin para acceso inmediato)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('clinica_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Usuario administrador por defecto para acceder directamente al sistema y CU02
    return {
      id_usuario: 1,
      username: 'admin',
      email: 'admin@clinicavidasalud.com',
      rol: 'ADMINISTRADOR',
      token: 'demo_session_token_2026',
    };
  });

  // Manejador de Login Exitoso
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('clinica_user', JSON.stringify(userData));
  };

  // Manejador de Logout Seguro
  const handleLogout = async () => {
    try {
      if (currentUser?.token && currentUser.token !== 'demo_session_token_2026') {
        await fetch(`${API_ENDPOINTS.auth}/logout`, {
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
      localStorage.removeItem('clinica_user');
      setCurrentUser(null);
    }
  };

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
