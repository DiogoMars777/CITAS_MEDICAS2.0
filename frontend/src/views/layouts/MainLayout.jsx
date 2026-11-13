import React, { useState, useMemo } from 'react';
import {
  Shield,
  Stethoscope,
  Users,
  Calendar,
  ClipboardList,
  Activity,
  FlaskConical,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
  Clock,
  HeartPulse,
} from 'lucide-react';
import { PACKAGES_CONFIG, SISTEMA_INFO } from '../../models/navigation/navigationConfig';
import { useHoraBoliviana } from '../../controllers/PKG01_Seguridad/CU02_BitacoraAuditoria/CU02_BitacoraAuditoriaController';
import CU02_BitacoraView from '../PKG01_Seguridad/CU02_BitacoraAuditoria/CU02_BitacoraView';
import CU01_SessionView from '../PKG01_Seguridad/CU01_Autenticacion/CU01_SessionView';
import CU03_GestionUsuariosView from '../PKG01_Seguridad/CU03_GestionUsuarios/CU03_GestionUsuariosView';
import CU04_EspecialidadesView from '../PKG02_MedicosEspecialidades/CU04_GestionEspecialidades/CU04_EspecialidadesView';
import CU05_MedicosView from '../PKG02_MedicosEspecialidades/CU05_GestionMedicos/CU05_MedicosView';
import CU06_PacientesView from '../PKG03_PacientesHistorial/CU06_RegistroPaciente/CU06_PacientesView';
import CU07_TurnosView from '../PKG04_AgendasHorarios/CU07_ConfigurarTurnos/CU07_TurnosView';
import CU08_BloqueosView from '../PKG04_AgendasHorarios/CU08_BloqueosAgenda/CU08_BloqueosView';
import CU09_DisponibilidadView from '../PKG04_AgendasHorarios/CU09_ConsultarDisponibilidad/CU09_DisponibilidadView';
import CU10_ReservarCitaView from '../PKG05_GestionCitasConcurrencia/CU10_ReservarCita/CU10_ReservarCitaView';
import CU11_ReprogramarCitaView from '../PKG05_GestionCitasConcurrencia/CU11_ReprogramarCita/CU11_ReprogramarCitaView';
import CU12_CancelarCitaView from '../PKG05_GestionCitasConcurrencia/CU12_CancelarCita/CU12_CancelarCitaView';
import CU13_AsistenciaView from '../PKG05_GestionCitasConcurrencia/CU13_ControlAsistencia/CU13_AsistenciaView';
import CU23_GestionarPagosView from '../PKG05_GestionCitasConcurrencia/CU23_GestionarPagos/CU23_GestionarPagosView';
import CU14_AntecedentesView from '../PKG03_PacientesHistorial/CU14_AntecedentesClinicos/CU14_AntecedentesView';
import CU15_AgendaMedicoView from '../PKG06_AtencionMedica/CU15_AgendaDiariaMedico/CU15_AgendaMedicoView';
import CU16_ConsultaMedicaView from '../PKG06_AtencionMedica/CU16_AtenderConsulta/CU16_ConsultaMedicaView';
import CU17_CargarEstudiosView from '../PKG07_Laboratorios/CU17_CargarEstudios/CU17_CargarEstudiosView';
import CU18_VisualizarEstudiosView from '../PKG07_Laboratorios/CU18_VisualizarEstudios/CU18_VisualizarEstudiosView';
import CU19_RecordatoriosView from '../PKG08_DashboardReportes/CU19_Recordatorios/CU19_RecordatoriosView';
import CU20_DashboardView from '../PKG08_DashboardReportes/CU20_Dashboard/CU20_DashboardView';
import CU21_ReportesView from '../PKG08_DashboardReportes/CU21_Reportes/CU21_ReportesView';
import CU24_AsistenteVozView from '../PKG08_DashboardReportes/CU24_AsistenteVozIA/CU24_AsistenteVozView';
import CU22_BackupView from '../PKG01_Seguridad/CU22_BackupRestore/CU22_BackupView';
import SeniorCUPlaceholder from '../common/SeniorCUPlaceholder';

// Iconos por paquete
const PACKAGE_ICONS = {
  PKG01: Shield,
  PKG02: Stethoscope,
  PKG03: Users,
  PKG04: Calendar,
  PKG05: ClipboardList,
  PKG06: Activity,
  PKG07: FlaskConical,
  PKG08: BarChart3,
};

export const MainLayout = ({ currentUser, onLogout }) => {
  // Caso de uso activo por defecto: CU03 (o CU02)
  const [activeCUId, setActiveCUId] = useState('CU03');
  const [selectedCitaForCU16, setSelectedCitaForCU16] = useState(2);

  // Control de apertura en móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Paquetes expandidos en el acordeón
  const [expandedPackages, setExpandedPackages] = useState({
    PKG01: true,
    PKG04: true,
    PKG05: true,
    PKG06: true,
    PKG07: true,
    PKG08: true,
  });

  // Reloj hora boliviana discreto
  const horaBolivia = useHoraBoliviana();

  // Alternar acordeón de un paquete
  const togglePackage = (pkgId) => {
    setExpandedPackages((prev) => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  const filteredPackages = PACKAGES_CONFIG;

  // Obtener metadata del CU y Paquete activos
  const activeCUInfo = useMemo(() => {
    for (const pkg of PACKAGES_CONFIG) {
      const found = pkg.casosDeUso.find((c) => c.id === activeCUId);
      if (found) {
        return { cu: found, pkg };
      }
    }
    return { cu: PACKAGES_CONFIG[0].casosDeUso[2], pkg: PACKAGES_CONFIG[0] };
  }, [activeCUId]);

  // Manejar selección de Caso de Uso
  const handleSelectCU = (cuId, pkgId) => {
    setActiveCUId(cuId);
    setExpandedPackages((prev) => ({ ...prev, [pkgId]: true }));
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f8fafc',
      color: '#0f172a',
    }}>
      {/* ======================================================== */}
      {/* 1. BACKDROP PARA MÓVIL */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 2. BARRA LATERAL (SIDEBAR) */}
      {/* ======================================================== */}
      <aside
        className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: '315px',
          minWidth: '315px',
          height: '100vh',
          maxHeight: '100vh',
          background: 'linear-gradient(150deg, #0284c7 0%, #0369a1 45%, #075985 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 100,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* FORMAS ORGÁNICAS DECORATIVAS DEL FONDO */}
        <div style={{
          position: 'absolute',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
          top: '-60px',
          right: '-70px',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, transparent 65%)',
          bottom: '8%',
          left: '-100px',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* CABECERA DEL SIDEBAR (SIN 3 RAYITAS) */}
        <div style={{
          padding: '1.2rem 1.1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '10px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          }}>
            <HeartPulse size={22} strokeWidth={2.5} />
          </div>

          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
              {SISTEMA_INFO.nombre}
            </h1>
            <span style={{ fontSize: '0.72rem', color: '#e0f2fe', fontWeight: 600 }}>
              Panel Administrativo
            </span>
          </div>
        </div>

        {/* LISTADO DE PAQUETES Y CASOS DE USO */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.4rem 0.65rem 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}>
          {filteredPackages.map((pkg) => {
            const PkgIcon = PACKAGE_ICONS[pkg.id] || Shield;
            const hasActiveCU = pkg.casosDeUso.some((c) => c.id === activeCUId);
            const isExpanded = expandedPackages[pkg.id] || hasActiveCU;

            return (
              <div key={pkg.id} style={{ marginBottom: '0.35rem' }}>
                {/* ENCABEZADO DE PAQUETE */}
                <button
                  type="button"
                  onClick={() => togglePackage(pkg.id)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: hasActiveCU ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                    color: hasActiveCU ? '#ffffff' : '#e0f2fe',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!hasActiveCU) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!hasActiveCU) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                    <PkgIcon size={15} color={hasActiveCU ? '#ffffff' : '#bae6fd'} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, color: '#ffffff' }}>
                      {pkg.id}: {pkg.nombre}
                    </span>
                  </div>

                  {isExpanded ? <ChevronDown size={14} color="#ffffff" style={{ flexShrink: 0, marginTop: '2px', marginLeft: '0.35rem' }} /> : <ChevronRight size={14} color="#bae6fd" style={{ flexShrink: 0, marginTop: '2px', marginLeft: '0.35rem' }} />}
                </button>

                {/* CASOS DE USO */}
                {isExpanded && (
                  <div style={{ padding: '0.2rem 0.25rem 0.35rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {pkg.casosDeUso.map((cu) => {
                      const isActive = cu.id === activeCUId;

                      return (
                        <button
                          key={cu.id}
                          type="button"
                          onClick={() => handleSelectCU(cu.id, pkg.id)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '8px',
                            border: isActive
                              ? '1px solid #ffffff'
                              : '1px solid transparent',
                            background: isActive
                              ? '#ffffff'
                              : 'transparent',
                            color: isActive ? '#0369a1' : '#ffffff',
                            boxShadow: isActive ? '0 4px 14px rgba(7, 89, 133, 0.35)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.45rem',
                            textAlign: 'left',
                            fontSize: '0.78rem',
                            fontWeight: isActive ? 700 : 500,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontSize: '0.72rem',
                              color: isActive ? '#0284c7' : '#bae6fd',
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: '2px',
                            }}>
                              {cu.numero}
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              lineHeight: 1.35,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              color: isActive ? '#0f172a' : '#ffffff',
                              flex: 1,
                            }}>
                              {cu.titulo}
                            </span>
                          </div>

                          {['CU01', 'CU02', 'CU03', 'CU04', 'CU05', 'CU06', 'CU07', 'CU08', 'CU09', 'CU10', 'CU11', 'CU12', 'CU13', 'CU14', 'CU15', 'CU16', 'CU17', 'CU18', 'CU19', 'CU20', 'CU21', 'CU22'].includes(cu.id) && (
                            <span style={{
                              padding: '0.12rem 0.4rem',
                              borderRadius: '4px',
                              background: isActive ? '#e0f2fe' : 'rgba(255, 255, 255, 0.18)',
                              border: isActive ? '1px solid #bae6fd' : '1px solid rgba(255, 255, 255, 0.3)',
                              color: isActive ? '#0284c7' : '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              alignSelf: 'flex-start',
                              marginTop: '2px',
                            }}>
                              Listo
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      </aside>

      {/* ======================================================== */}
      {/* 3. CONTENEDOR PRINCIPAL: TOPBAR + CONTENIDO DEL CU */}
      {/* ======================================================== */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      }}>
        {/* HEADER SUPERIOR (TOPBAR) — ESTILO EJECUTIVO PROFESIONAL */}
        <header style={{
          height: '60px',
          minHeight: '60px',
          flexShrink: 0,
          padding: '0 1.5rem',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
        }}>
          {/* LADO IZQUIERDO: BREADCRUMBS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-on-mobile-only"
              style={{
                display: 'none',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
                padding: '0.4rem',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
              title="Menú"
            >
              <Menu size={18} />
            </button>

            {/* BREADCRUMB PROFESIONAL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', overflow: 'hidden' }}>
              <span className="hide-on-mobile" style={{ color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{SISTEMA_INFO.nombre}</span>
              <span className="hide-on-mobile" style={{ color: '#cbd5e1' }}>/</span>
              <span style={{
                padding: '2px 8px',
                background: '#e0f2fe',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {activeCUInfo.pkg.codigo}
              </span>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <span className="breadcrumb-cu-title" style={{
                color: '#0f172a',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
              }}>
                {activeCUInfo.cu.numero}: {activeCUInfo.cu.titulo}
              </span>
            </div>
          </div>

          {/* LADO DERECHO: HORA BOLIVIANA Y USUARIO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
            {/* HORA BOLIVIA PILL */}
            <div className="hide-on-mobile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#0f172a',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}>
              <Clock size={14} color="#0284c7" />
              <span>{horaBolivia.time}</span>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>(BOT)</span>
            </div>

            {/* USUARIO PILL */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                {(currentUser?.username || 'A')[0].toUpperCase()}
              </div>
              <span className="hide-on-mobile" style={{ fontWeight: 600, color: '#0f172a' }}>{currentUser?.username || 'Admin'}</span>
              <span className="hide-on-mobile" style={{
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: '#e0f2fe',
                color: '#0284c7',
                fontWeight: 800,
              }}>
                {currentUser?.rol || 'ADMINISTRADOR'}
              </span>
            </div>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#fecaca';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO — CANVAS EJECUTIVO CLARO */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '1.5rem' }}>
          {activeCUId === 'CU24' && <CU24_AsistenteVozView currentUser={currentUser} />}

          {activeCUId === 'CU21' && <CU21_ReportesView />}

              {activeCUId === 'CU20' && (
                <CU20_DashboardView
                  onNavigateToAgenda={() => {
                    setActiveCUId('CU15');
                    setExpandedPackages((prev) => ({ ...prev, PKG06: true }));
                  }}
                  onNavigateToLaboratorios={() => {
                    setActiveCUId('CU18');
                    setExpandedPackages((prev) => ({ ...prev, PKG07: true }));
                  }}
                />
              )}

              {activeCUId === 'CU19' && <CU19_RecordatoriosView />}

              {activeCUId === 'CU18' && <CU18_VisualizarEstudiosView />}

              {activeCUId === 'CU17' && (
                <CU17_CargarEstudiosView
                  onNavigateToCU18={() => {
                    setActiveCUId('CU18');
                    setExpandedPackages((prev) => ({ ...prev, PKG07: true }));
                  }}
                />
              )}

              {activeCUId === 'CU16' && (
                <CU16_ConsultaMedicaView
                  initialCitaId={selectedCitaForCU16}
                  onBackToAgenda={() => {
                    setActiveCUId('CU15');
                    setExpandedPackages((prev) => ({ ...prev, PKG06: true }));
                  }}
                />
              )}

              {activeCUId === 'CU15' && (
                <CU15_AgendaMedicoView
                  onNavigateToCU16={(idCita) => {
                    setSelectedCitaForCU16(idCita);
                    setActiveCUId('CU16');
                    setExpandedPackages((prev) => ({ ...prev, PKG06: true }));
                  }}
                />
              )}

              {activeCUId === 'CU14' && <CU14_AntecedentesView />}

              {activeCUId === 'CU13' && <CU13_AsistenciaView />}

              {activeCUId === 'CU23' && <CU23_GestionarPagosView currentUser={currentUser} />}

              {activeCUId === 'CU12' && <CU12_CancelarCitaView />}

              {activeCUId === 'CU11' && <CU11_ReprogramarCitaView />}

              {activeCUId === 'CU10' && <CU10_ReservarCitaView />}

              {activeCUId === 'CU09' && <CU09_DisponibilidadView />}

              {activeCUId === 'CU08' && <CU08_BloqueosView />}

              {activeCUId === 'CU07' && <CU07_TurnosView />}

              {activeCUId === 'CU06' && <CU06_PacientesView />}

              {activeCUId === 'CU05' && <CU05_MedicosView />}

              {activeCUId === 'CU04' && <CU04_EspecialidadesView />}

              {activeCUId === 'CU22' && <CU22_BackupView />}

              {activeCUId === 'CU03' && <CU03_GestionUsuariosView />}

              {activeCUId === 'CU02' && <CU02_BitacoraView />}

              {activeCUId === 'CU01' && (
                <CU01_SessionView
                  currentUser={currentUser}
                  onLogout={onLogout}
                  onSwitchToLoginDemo={onLogout}
                />
              )}

          {!['CU01', 'CU02', 'CU03', 'CU04', 'CU05', 'CU06', 'CU07', 'CU08', 'CU09', 'CU10', 'CU11', 'CU12', 'CU13', 'CU14', 'CU15', 'CU16', 'CU17', 'CU18', 'CU19', 'CU20', 'CU21', 'CU22', 'CU23', 'CU24'].includes(activeCUId) && (
            <SeniorCUPlaceholder
              cu={activeCUInfo.cu}
              pkg={activeCUInfo.pkg}
              onNavigateToCU02={() => handleSelectCU('CU02', 'PKG01')}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
