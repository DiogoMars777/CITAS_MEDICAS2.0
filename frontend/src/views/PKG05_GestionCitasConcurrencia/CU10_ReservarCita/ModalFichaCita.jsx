import React, { useRef } from 'react';
import { X, Printer, CheckCircle2, Calendar, Clock, User, Stethoscope, MapPin, ShieldCheck, QrCode, CreditCard } from 'lucide-react';

export const ModalFichaCita = ({
  isOpen,
  onClose,
  cita,
  onPagar,
}) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !cita) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* CONTENIDO DE LA FICHA IMPRIMIBLE */}
        <div
          ref={printAreaRef}
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            flex: 1,
            color: '#0f172a',
          }}
          className="print-container"
        >
          {/* CABECERA INSTITUCIONAL */}
          <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CLÍNICA VIDA SALUD • GESTIÓN MÉDICA
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0', letterSpacing: '-0.02em' }}>
              Ficha de Cita Médica
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Comprobante oficial de reserva de atención clínica
            </p>
          </div>

          {/* TICKET / CÓDIGO DESTACADO */}
          <div
            style={{
              margin: '1.25rem 0',
              padding: '1rem',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', fontWeight: 600 }}>
              Código Único de Cita
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.05em', fontFamily: 'monospace', margin: '0.25rem 0' }}>
              {cita.codigo_cita}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>Estado: {cita.estado_cita || 'PROGRAMADA'}</span>
            </div>
          </div>

          {/* DATOS DEL PACIENTE */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              Información del Paciente
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.84rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Nombre Completo</span>
                <strong style={{ color: '#0f172a' }}>{cita.paciente_nombre}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Cédula de Identidad (CI)</span>
                <strong style={{ color: '#0f172a' }}>{cita.paciente_ci || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>N° Historia Clínica</span>
                <strong style={{ color: '#0284c7' }}>{cita.paciente_expediente || 'EXP-CLINICA'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Teléfono</span>
                <strong style={{ color: '#334155' }}>{cita.paciente_telefono || 'No registrado'}</strong>
              </div>
            </div>
          </div>

          {/* DATOS DE LA ATENCIÓN MÉDICA */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
              Detalle de Atención Médica
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.84rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Especialidad</span>
                <strong style={{ color: '#0f172a' }}>{cita.especialidad_nombre || cita.especialidad || 'Consulta Médica'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Médico Asignado</span>
                <strong style={{ color: '#0f172a' }}>{cita.medico_nombre}</strong>
                {cita.matricula_profesional && (
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Reg: {cita.matricula_profesional}</span>
                )}
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Fecha Programada</span>
                <strong style={{ color: '#0284c7' }}>{cita.fecha_cita}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Horario de Consulta</span>
                <strong style={{ color: '#059669' }}>{cita.horario_rango || `${cita.hora_inicio} - ${cita.hora_fin}`}</strong>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>Bloque de 15 min</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Motivo de Consulta</span>
                <div style={{ color: '#334155', fontSize: '0.82rem', fontStyle: 'italic', marginTop: '2px' }}>
                  "{cita.motivo_consulta || 'Consulta médica programada'}"
                </div>
              </div>
            </div>
          </div>

          {/* INSTRUCCIONES CLÍNICAS */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              fontSize: '0.76rem',
              color: '#92400e',
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '3px' }}>Indicaciones para el Paciente:</div>
            • Presentarse con 10 minutos de anticipación en ventanilla de recepción médica.<br />
            • Portar Cédula de Identidad original vigente.<br />
            • En caso de no poder asistir, solicitar cancelación o reprogramación con al menos 2 horas de anticipación.
          </div>
        </div>

        {/* ACCIONES DEL MODAL */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            Hora Boliviana • Clínica Vida Salud
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Printer size={15} />
              <span>Imprimir Ficha</span>
            </button>

            {onPagar && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPagar(cita);
                }}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                }}
              >
                <CreditCard size={15} />
                <span>Pagar / Cobrar Cita</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalFichaCita;
