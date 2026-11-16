import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  User,
  FlaskConical,
  Shield,
  Stethoscope,
  Filter,
  Eye,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCU18VisualizarEstudiosController } from '../../../controllers/PKG07_Laboratorios/CU18_VisualizarEstudios/CU18_VisualizarEstudiosController';

export const CU18_VisualizarEstudiosView = ({ currentUser = null }) => {
  const isMedico = ['MEDICO', 'DOCTOR'].includes((currentUser?.rol || '').toUpperCase().trim());
  const isPaciente = ['PACIENTE', 'CLIENTE'].includes((currentUser?.rol || '').toUpperCase().trim());

  const {
    estudios,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    filtroRol,
    setFiltroRol,
    estudioDetalle,
    modalDetalleAbierto,
    loadingDetalle,
    verDetalleEstudio,
    cerrarModalDetalle,
    descargarPdf,
    cargarEstudios,
  } = useCU18VisualizarEstudiosController(currentUser);

  return (
    <div style={{ padding: '0.5rem 1rem 3rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 1. CABECERA DEL VISOR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem',
        background: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
          }}>
            <FileText size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}>
                CU18
              </span>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Visualizar y Descargar Resultados de Laboratorio
              </h1>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Portal seguro para consulta digital de informes clínicos, parámetros etarios y descarga de PDF.
            </p>
          </div>
        </div>

        {/* SELECTOR DE PERSPECTIVA O BADGE FIJO SEGÚN ROL */}
        {isMedico ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.78rem',
          }}>
            <Stethoscope size={15} />
            <span>Vista Médico Tratante</span>
          </div>
        ) : isPaciente ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.78rem',
          }}>
            <User size={15} />
            <span>Portal del Paciente</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setFiltroRol('MEDICO')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: filtroRol === 'MEDICO' ? '#ffffff' : 'transparent',
                color: filtroRol === 'MEDICO' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: filtroRol === 'MEDICO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Stethoscope size={14} />
              Vista Médico Tratante
            </button>
            <button
              type="button"
              onClick={() => setFiltroRol('PACIENTE')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                background: filtroRol === 'PACIENTE' ? '#ffffff' : 'transparent',
                color: filtroRol === 'PACIENTE' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: filtroRol === 'PACIENTE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <User size={14} />
              Portal del Paciente
            </button>
          </div>
        )}
      </div>

      {/* 2. FILTROS Y BÚSQUEDA */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Filtro de Estado:</span>
          {['TODOS', 'HABILITADO', 'PENDIENTE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroEstado(st)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: filtroEstado === st ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: filtroEstado === st ? '#e0f2fe' : '#f8fafc',
                color: filtroEstado === st ? '#0369a1' : '#475569',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st === 'TODOS' ? 'Todos los Estudios' : st === 'HABILITADO' ? 'Habilitados (Completados)' : 'En Proceso (Pendientes)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Buscar por código, estudio o paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              minWidth: '240px',
            }}
          />
        </div>
      </div>

      {/* 3. LISTADO DE ESTUDIOS DISPONIBLES */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.85rem' }}>
            Consultando resultados en el visor seguro...
          </div>
        ) : estudios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.85rem' }}>
            No se registran estudios que coincidan con la búsqueda.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
            {estudios.map((est) => {
              const estaHabilitado = est.estado === 'HABILITADO';
              return (
                <div
                  key={est.id_estudio}
                  style={{
                    borderRadius: '12px',
                    border: estaHabilitado ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                    background: estaHabilitado ? '#ffffff' : '#fafafa',
                    padding: '1.15rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* CABECERA DE LA TARJETA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: '#0284c7' }}>
                        {est.codigo_estudio}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: estaHabilitado ? '#dcfce7' : '#fef9c3',
                        color: estaHabilitado ? '#166534' : '#854d0e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        {estaHabilitado ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {estaHabilitado ? 'Habilitado / Listo' : 'En Proceso'}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {est.nombre_estudio}
                    </h3>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Tipo: <strong>{est.tipo_estudio}</strong> | Solicitado: {est.fecha_solicitud}
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', color: '#334155', marginBottom: '0.75rem' }}>
                      <div><strong>Paciente:</strong> {est.paciente_nombre} ({est.paciente_edad} años)</div>
                      <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>Grupo: {est.grupo_etario}</div>
                      <div><strong>Médico:</strong> {est.medico_solicitante}</div>
                    </div>

                    {estaHabilitado && est.resultado_diagnostico && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: '#166534',
                        marginBottom: '0.75rem',
                        maxHeight: '75px',
                        overflowY: 'auto',
                      }}>
                        <strong>Resultado preliminar:</strong> {est.resultado_diagnostico}
                      </div>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {estaHabilitado ? (
                      <button
                        type="button"
                        onClick={() => verDetalleEstudio(est.id_estudio)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#0284c7',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Eye size={15} />
                        Ver Análisis y Parámetros
                      </button>
                    ) : (
                      <div style={{ flex: 1, textAlign: 'center', padding: '0.45rem', fontSize: '0.75rem', color: '#854d0e', background: '#fef9c3', borderRadius: '6px', fontWeight: 600 }}>
                        Muestra en procesamiento técnico
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL DETALLE / VISOR DIGITAL IMPRIMIBLE OFICIAL */}
      {modalDetalleAbierto && estudioDetalle && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          }}>
            {/* MEMBRETE CLÍNICO OFICIAL */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0369a1' }}>
                  CLÍNICA VIDA SALUD
                </h2>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  {estudioDetalle.institucion?.sucursal}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {estudioDetalle.institucion?.direccion} | Tel: {estudioDetalle.institucion?.telefono}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}>
                  {estudioDetalle.codigo_estudio}
                </span>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Fecha Emisión: {estudioDetalle.publicado_en || estudioDetalle.fecha_solicitud}
                </div>
              </div>
            </div>

            {/* DATOS DEL PACIENTE Y MÉDICO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
            }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>DATOS DEL PACIENTE:</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {estudioDetalle.paciente?.nombre_completo}
                </div>
                <div>CI: <strong>{estudioDetalle.paciente?.ci}</strong> | Sexo: {estudioDetalle.paciente?.sexo}</div>
                <div>
                  Edad: <strong>{estudioDetalle.paciente?.edad} años</strong> (Grupo: {estudioDetalle.paciente?.grupo_etario})
                </div>
              </div>

              <div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>MÉDICO SOLICITANTE:</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {estudioDetalle.medico?.nombre_completo}
                </div>
                <div>Matrícula Profesional: {estudioDetalle.medico?.matricula}</div>
                <div>Estudio: <strong>{estudioDetalle.nombre_estudio}</strong></div>
              </div>
            </div>

            {/* RESULTADO DIAGNÓSTICO PRINCIPAL */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                INFORME ANALÍTICO Y RESULTADOS OBTENIDOS
              </h4>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: '#0f172a',
              }}>
                {estudioDetalle.resultado_diagnostico}
              </div>
              {estudioDetalle.descripcion && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic' }}>
                  Observaciones: {estudioDetalle.descripcion}
                </div>
              )}
            </div>

            {/* TABLA DE PARÁMETROS DE REFERENCIA SEGÚN EDAD */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  VALORES BIOLÓGICOS DE REFERENCIA ({estudioDetalle.paciente?.grupo_etario})
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                  Ajustado a la edad exacta del paciente
                </span>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead style={{ background: '#f1f5f9', color: '#475569' }}>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>PARÁMETRO ANALÍTICO</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>RANGO NORMAL ESPERADO</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>UNIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudioDetalle.parametros_referencia?.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}>{p.parametro}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#0f766e', fontWeight: 700 }}>{p.rango_normal}</td>
                        <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{p.unidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTONES DE CIERRE Y DESCARGA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={cerrarModalDetalle}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Cerrar Visor
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={descargarPdf}
                  style={{
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  <Printer size={16} />
                  Imprimir / Descargar PDF Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CU18_VisualizarEstudiosView;
