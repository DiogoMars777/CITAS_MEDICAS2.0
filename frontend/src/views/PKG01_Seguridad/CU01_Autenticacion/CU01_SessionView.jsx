import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Key,
  Clock,
  LogOut,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  Activity,
  Stethoscope,
  Building2,
  Briefcase,
  BadgeCheck,
  IdCard,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Shield,
  FileText,
} from 'lucide-react';
import { useHoraBoliviana } from '../../../controllers/PKG01_Seguridad/CU02_BitacoraAuditoria/CU02_BitacoraAuditoriaController';
import { apiClient } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../config/api';

export const CU01_SessionView = ({ currentUser, onLogout, onSwitchToLoginDemo }) => {
  const horaBolivia = useHoraBoliviana();
  const [profile, setProfile] = useState(() => currentUser || {});
  const [loading, setLoading] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Sincronizar datos detallados de la persona desde /api/auth/me
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.auth}/me`);
      if (res?.success && res.user) {
        setProfile((prev) => ({ ...prev, ...res.user }));
        try {
          const saved = localStorage.getItem('clinica_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            localStorage.setItem('clinica_user', JSON.stringify({ ...parsed, ...res.user }));
          }
        } catch {
          // Ignorar error de storage local
        }
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Aviso: no se pudo refrescar perfil en CU01:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const rol = (profile?.rol || currentUser?.rol || 'PACIENTE').toUpperCase();

  // Datos normalizados
  const ci = profile?.ci || profile?.perfil?.ci || (rol === 'PACIENTE' ? '87654321' : null);
  const matricula = profile?.matricula_profesional || profile?.numero_registro_profesional || profile?.perfil?.matricula_profesional || (rol === 'MEDICO' ? 'MP-98432' : null);
  const expediente = profile?.numero_expediente || profile?.perfil?.numero_expediente || (rol === 'PACIENTE' ? 'EXP-000001' : null);
  const tipoSangre = profile?.tipo_sangre || profile?.perfil?.tipo_sangre || 'O+';
  const direccion = profile?.direccion || profile?.perfil?.direccion || (rol === 'PACIENTE' ? 'Av. Las Américas #450' : 'Av. Busch #120 - Sede Central');
  const telefono = profile?.telefono || profile?.perfil?.telefono || (rol === 'PACIENTE' ? '75598765' : (rol === 'MEDICO' ? '70012345' : '+591 4 4567890 (Int. 104)'));
  const fechaNac = profile?.fecha_nacimiento || profile?.perfil?.fecha_nacimiento || (rol === 'PACIENTE' ? '1990-05-15' : null);
  const edad = profile?.edad || profile?.perfil?.edad || (rol === 'PACIENTE' ? 36 : null);
  const sexo = profile?.sexo || profile?.perfil?.sexo || (rol === 'PACIENTE' ? 'MASCULINO' : null);
  const especialidades = profile?.especialidades || profile?.perfil?.especialidades || (rol === 'MEDICO' ? ['Medicina General'] : []);
  const contactoEmergencia = profile?.contacto_emergencia || profile?.perfil?.contacto_emergencia || (rol === 'PACIENTE' ? {
    nombre: 'Familiar de Juan Pablo',
    parentesco: 'Esposa',
    telefono: '79743364',
  } : null);

  const nombreCompleto = profile?.nombre_completo ||
    (profile?.nombres && profile?.apellidos ? `${profile.nombres} ${profile.apellidos}` : null) ||
    (rol === 'PACIENTE' ? 'Juan Pablo Pérez Gómez' : (rol === 'MEDICO' ? 'Dr(a). Carlos Alberto Mendoza Suárez' : profile?.username || 'Usuario Sistema'));

  const cargo = profile?.cargo || profile?.perfil?.cargo || (rol === 'ADMINISTRADOR' ? 'Director de Sistemas & Auditoría Hospitalaria' : 'Recepcionista y Admisión General');
  const departamento = profile?.departamento || profile?.perfil?.departamento || (rol === 'ADMINISTRADOR' ? 'Dirección de Tecnologías y Seguridad Clínica' : 'Atención al Paciente y Facturación');
  const sede = profile?.sede || profile?.perfil?.sede || 'Sede Central - Clínica Vida Salud';

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1240px', margin: '0 auto', color: '#0f172a' }}>
      {/* HEADER PRINCIPAL */}
      <div style={{
        marginBottom: '1.5rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '999px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0284c7',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.4rem',
          }}>
            <Shield size={12} />
            <span>Seguridad • CU01</span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            Sesión de Usuario Activa & Ficha de Datos Personales
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            Gestión de sesión activa, credenciales de acceso y ficha completa de la persona en el sistema.
          </p>
        </div>

        {/* BOTÓN REFRESCAR DATOS */}
        <button
          onClick={fetchProfile}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.95rem',
            borderRadius: '8px',
            background: refreshSuccess ? '#ecfdf5' : '#ffffff',
            border: refreshSuccess ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
            color: refreshSuccess ? '#059669' : '#334155',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Actualizar datos desde el servidor"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Actualizando...' : refreshSuccess ? '¡Datos actualizados!' : 'Actualizar Ficha'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* ============================================================ */}
        {/* CARD 1: DETALLES DE SESIÓN & CREDENCIALES                    */}
        {/* ============================================================ */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '14px',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              flexShrink: 0,
            }}>
              {rol === 'MEDICO' ? (
                <Stethoscope size={28} />
              ) : rol === 'PACIENTE' ? (
                <UserCheck size={28} />
              ) : (
                <User size={28} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.username || currentUser?.username || 'Usuario'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.15rem 0.65rem',
                  borderRadius: '6px',
                  background: rol === 'ADMINISTRADOR' ? '#fef3c7' : rol === 'MEDICO' ? '#eff6ff' : rol === 'RECEPCIONISTA' ? '#f5f3ff' : '#ecfdf5',
                  border: rol === 'ADMINISTRADOR' ? '1px solid #fde68a' : rol === 'MEDICO' ? '1px solid #bfdbfe' : rol === 'RECEPCIONISTA' ? '1px solid #ddd6fe' : '1px solid #a7f3d0',
                  color: rol === 'ADMINISTRADOR' ? '#b45309' : rol === 'MEDICO' ? '#1d4ed8' : rol === 'RECEPCIONISTA' ? '#6d28d9' : '#059669',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                }}>
                  ROL: {rol}
                </span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  En línea
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
              <Mail size={16} color="#0284c7" />
              <span>Correo de Cuenta:</span>
              <strong style={{ color: '#0f172a', marginLeft: 'auto', fontWeight: 600, fontSize: '0.84rem' }}>
                {profile?.email || currentUser?.email || 'cuenta@clinicavidasalud.com'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
              <Clock size={16} color="#d97706" />
              <span>Hora Bolivia Actual:</span>
              <strong style={{ color: '#0f172a', marginLeft: 'auto', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem' }}>
                {horaBolivia.time}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
              <Key size={16} color="#7c3aed" />
              <span>Token Sanctum:</span>
              <span style={{ color: '#334155', marginLeft: 'auto', fontFamily: 'monospace', fontSize: '0.76rem', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {currentUser?.token ? `${currentUser.token.substring(0, 14)}...` : 'demo_bearer_active'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Estado de Cuenta:</span>
              <span style={{ color: '#059669', marginLeft: 'auto', fontWeight: 700, fontSize: '0.8rem', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                {profile?.estado_cuenta || profile?.estado || 'ACTIVO'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
            >
              <LogOut size={16} />
              Cerrar Sesión Activa
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: FICHA DE DATOS PERSONALES DE LA PERSONA (REEMPLAZO) */}
        {/* ============================================================ */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderTop: '3px solid #059669',
          borderRadius: '14px',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}>
          {/* HEADER DE LA FICHA DE LA PERSONA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}>
                <IdCard size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>
                  Ficha de Datos Personales
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {rol === 'PACIENTE' ? 'Identificación clínica y filiación del paciente' :
                   rol === 'MEDICO' ? 'Acreditación profesional y especialidades' :
                   'Datos institucionales y operacionales'}
                </span>
              </div>
            </div>

            {/* BADGE CLAVE SEGÚN ROL */}
            {rol === 'PACIENTE' && expediente && (
              <span style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '0.74rem',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}>
                {expediente}
              </span>
            )}

            {rol === 'MEDICO' && matricula && (
              <span style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '0.74rem',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}>
                REG: {matricula}
              </span>
            )}

            {['ADMINISTRADOR', 'RECEPCIONISTA'].includes(rol) && (
              <span style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: '#faf5ff',
                border: '1px solid #e9d5ff',
                color: '#7e22ce',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}>
                SEDE CENTRAL
              </span>
            )}
          </div>

          {/* CONTENIDO ESPECÍFICO SEGÚN ROL */}

          {/* ------------------- CASO 1: PACIENTE ------------------- */}
          {rol === 'PACIENTE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* FILA 1: NOMBRE COMPLETO */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <User size={18} color="#059669" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                    Nombres y Apellidos
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {nombreCompleto}
                  </div>
                </div>
              </div>

              {/* GRID DE DATOS BÁSICOS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                {/* CI */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cédula (CI)</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                    {ci || '87654321'}
                  </div>
                </div>

                {/* FECHA NACIMIENTO */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nacimiento / Edad</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {fechaNac || '1990-05-15'} {edad ? `(${edad} años)` : ''}
                  </div>
                </div>

                {/* SEXO */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sexo Biológico</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {sexo || 'MASCULINO'}
                  </div>
                </div>

                {/* TIPO DE SANGRE */}
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>Tipo de Sangre</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {tipoSangre || 'O+'}
                  </div>
                </div>
              </div>

              {/* CONTACTO & DIRECCIÓN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#334155' }}>
                  <Phone size={15} color="#0284c7" />
                  <span style={{ color: '#64748b', minWidth: '70px' }}>Teléfono:</span>
                  <strong style={{ color: '#0f172a' }}>{telefono}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#334155' }}>
                  <MapPin size={15} color="#d97706" />
                  <span style={{ color: '#64748b', minWidth: '70px' }}>Dirección:</span>
                  <strong style={{ color: '#0f172a' }}>{direccion}</strong>
                </div>
              </div>

              {/* CONTACTO DE EMERGENCIA */}
              {contactoEmergencia && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                }}>
                  <AlertCircle size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                      Contacto de Emergencia
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400e', marginTop: '2px' }}>
                      {contactoEmergencia.nombre} {contactoEmergencia.parentesco ? `(${contactoEmergencia.parentesco})` : ''}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px' }}>
                      Teléfono directo: <strong>{contactoEmergencia.telefono}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------- CASO 2: MÉDICO ------------------- */}
          {rol === 'MEDICO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <Stethoscope size={18} color="#0284c7" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                    Facultativo Especialista
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {nombreCompleto}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Matrícula Prof.</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                    {matricula || 'MP-98432'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Colegiatura</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                    Habilitado (CMB)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Teléfono Directo</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {telefono}
                  </div>
                </div>
              </div>

              {/* ESPECIALIDADES */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Especialidades Médicas Asignadas
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {especialidades.length > 0 ? (
                    especialidades.map((esp, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {esp}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Medicina General</span>
                  )}
                </div>
              </div>

              {/* SEDE & CONSULTORIO */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Building2 size={18} color="#15803d" />
                <div style={{ fontSize: '0.84rem', color: '#166534' }}>
                  <strong>Adscrito a Sede Central:</strong> Consultorios de Consulta Externa y Quirófanos Centrales.
                </div>
              </div>
            </div>
          )}

          {/* ------------------- CASO 3: ADMINISTRADOR / RECEPCIONISTA ------------------- */}
          {['ADMINISTRADOR', 'RECEPCIONISTA'].includes(rol) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <Briefcase size={18} color="#7c3aed" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                    Personal Institucional
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    {nombreCompleto}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cargo Funcional</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {cargo}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Departamento</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {departamento}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#334155' }}>
                  <Building2 size={15} color="#0284c7" />
                  <span style={{ color: '#64748b', minWidth: '70px' }}>Sede:</span>
                  <strong style={{ color: '#0f172a' }}>{sede}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#334155' }}>
                  <Phone size={15} color="#d97706" />
                  <span style={{ color: '#64748b', minWidth: '70px' }}>Interno:</span>
                  <strong style={{ color: '#0f172a' }}>{telefono}</strong>
                </div>
              </div>

              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <BadgeCheck size={18} color="#7e22ce" />
                <div style={{ fontSize: '0.84rem', color: '#581c87' }}>
                  <strong>Credenciales Institucionales Verificadas:</strong> Usuario autorizado con acceso a módulos de gestión clínica y concurrencia.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CU01_SessionView;
