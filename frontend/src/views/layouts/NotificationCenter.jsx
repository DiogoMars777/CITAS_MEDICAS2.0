import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  FlaskConical,
  X,
  Check,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

export const NotificationCenter = ({ currentUser, onNavigateToCU }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leidas, setLeidas] = useState(() => {
    try {
      const key = `notificaciones_leidas_${currentUser?.id_usuario || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const popoverRef = useRef(null);

  const token = currentUser?.token || localStorage.getItem('token');

  // Cargar notificaciones desde la API
  const fetchNotificaciones = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.notificaciones, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotificaciones(json.data);
        }
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  }, [token]);

  // Carga inicial y polling periódico cada 20 segundos
  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 20000);
    return () => clearInterval(interval);
  }, [fetchNotificaciones]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    const todosIds = notificaciones.map((n) => n.id_notificacion);
    setLeidas(todosIds);
    try {
      const key = `notificaciones_leidas_${currentUser?.id_usuario || 'guest'}`;
      localStorage.setItem(key, JSON.stringify(todosIds));
    } catch (e) {
      console.warn('Error saving read notifications:', e);
    }
  };

  // Marcar una como leída
  const marcarIndividualLeida = (idNotif) => {
    if (!leidas.includes(idNotif)) {
      const updated = [...leidas, idNotif];
      setLeidas(updated);
      try {
        const key = `notificaciones_leidas_${currentUser?.id_usuario || 'guest'}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving read notifications:', e);
      }
    }
  };

  const unreadCount = notificaciones.filter(
    (n) => !leidas.includes(n.id_notificacion)
  ).length;

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* BOTÓN CAMPANA EN LA CABECERA */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          background: isOpen ? '#e0f2fe' : '#ffffff',
          color: unreadCount > 0 ? '#0284c7' : '#475569',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
        title="Notificaciones y avisos clínicos"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* PANEL FLOTANTE DE NOTIFICACIONES */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* HEADER DEL PANEL */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} />
              <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Notificaciones Clínicas</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#ffffff',
                    color: '#0284c7',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  title="Marcar todas como leídas"
                >
                  Leídas
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* LISTA DE NOTIFICACIONES */}
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: '#f8fafc',
            }}
          >
            {notificaciones.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <CheckCircle2 size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>
                  Sin notificaciones pendientes
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  Tus reservas, citas y resultados de laboratorio están al día.
                </div>
              </div>
            ) : (
              notificaciones.map((notif) => {
                const isLeida = leidas.includes(notif.id_notificacion);
                const isEmergencia = notif.tipo === 'EMERGENCIA';
                const isReserva = notif.tipo === 'RESERVA';
                const isCancelacion = notif.tipo === 'CANCELACION';
                const isLab = notif.tipo === 'LABORATORIO';
                const isReprog = notif.tipo === 'REPROGRAMACION';

                let borderLeftColor = '#0284c7';
                let badgeText = 'AVISO CLÍNICO';
                let badgeBg = '#f0f9ff';
                let badgeColor = '#0369a1';
                let IconComponent = Bell;

                if (isEmergencia) {
                  borderLeftColor = '#ef4444';
                  badgeText = '🚨 BLOQUEO POR EMERGENCIA';
                  badgeBg = '#fef2f2';
                  badgeColor = '#b91c1c';
                  IconComponent = AlertTriangle;
                } else if (isReserva) {
                  borderLeftColor = '#10b981';
                  badgeText = '✅ RESERVA CONFIRMADA';
                  badgeBg = '#ecfdf5';
                  badgeColor = '#047857';
                  IconComponent = CheckCircle2;
                } else if (isCancelacion) {
                  borderLeftColor = '#f59e0b';
                  badgeText = '⚠️ RESERVA CANCELADA';
                  badgeBg = '#fffbeb';
                  badgeColor = '#b45309';
                  IconComponent = Ban;
                } else if (isLab) {
                  borderLeftColor = '#0d9488';
                  badgeText = '🔬 LABORATORIO LISTO';
                  badgeBg = '#f0fdfa';
                  badgeColor = '#0f766e';
                  IconComponent = FlaskConical;
                } else if (isReprog) {
                  borderLeftColor = '#6366f1';
                  badgeText = '🔄 CITA REPROGRAMADA';
                  badgeBg = '#eef2ff';
                  badgeColor = '#4338ca';
                  IconComponent = RotateCcw;
                }

                return (
                  <div
                    key={notif.id_notificacion}
                    onClick={() => marcarIndividualLeida(notif.id_notificacion)}
                    style={{
                      background: isLeida ? '#ffffff' : '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${borderLeftColor}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.75rem',
                      boxShadow: isLeida
                        ? 'none'
                        : '0 2px 4px rgba(0,0,0,0.04)',
                      opacity: isLeida ? 0.8 : 1,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor,
                        }}
                      >
                        {badgeText}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#64748b' }}>
                        <Clock size={11} />
                        <span>{notif.fecha || 'Reciente'}</span>
                        {!isLeida && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#ef4444',
                              marginLeft: '4px',
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#1e293b', lineHeight: 1.45, fontWeight: isLeida ? 500 : 600 }}>
                      {notif.mensaje}
                    </div>

                    {/* BOTONES DE ACCIÓN RÁPIDA SEGÚN EL TIPO DE AVISO */}
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      {isEmergencia && onNavigateToCU && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onNavigateToCU('CU11', 'PKG05');
                          }}
                          style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={12} />
                          Reprogramar Cita Ahora
                        </button>
                      )}

                      {isReserva && onNavigateToCU && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onNavigateToCU('CU10', 'PKG05');
                          }}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Ver Mis Citas / Pagar
                        </button>
                      )}

                      {isCancelacion && onNavigateToCU && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onNavigateToCU('CU09', 'PKG04');
                          }}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Buscar Nuevo Horario
                        </button>
                      )}

                      {isLab && onNavigateToCU && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onNavigateToCU('CU18', 'PKG07');
                          }}
                          style={{
                            background: '#0d9488',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Ver Resultado de Laboratorio
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER DEL PANEL */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f1f5f9',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Notificaciones emitidas por Clínica Vida Salud
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
