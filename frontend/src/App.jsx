import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import CU01_LoginView from './views/PKG01_Seguridad/CU01_Autenticacion/CU01_LoginView';
import MainLayout from './views/layouts/MainLayout';

function App() {
  // Estado del usuario autenticado: exige login inicial (CU01) salvo sesión real guardada
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('clinica_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exigir token real de sesión y descartar tokens mock antiguos
        if (parsed?.token && parsed.token !== 'demo_session_token_2026') {
          return parsed;
        }
      } catch (e) {
        // Error de parseo
      }
      localStorage.removeItem('clinica_user');
    }
    return null;
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
