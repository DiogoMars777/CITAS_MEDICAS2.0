import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.atencionMedica;

/**
 * Controller Hook para CU16 - Atender consulta y registrar evolución clínica
 */
export const useCU16AtencionMedicaController = (onAtencionCompletada = null) => {
  const [idCitaActiva, setIdCitaActiva] = useState(null);
  const [consultaData, setConsultaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [alertaFarmaco, setAlertaFarmaco] = useState(null);

  // Formulario clínico estructurado
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    sintomas: '',
    signos_vitales: {
      presion_arterial: '',
      frecuencia_cardiaca: '',
      temperatura: '',
      saturacion_oxigeno: '',
      peso: '',
      talla: '',
      imc: '',
    },
    diagnostico_cie10: '',
    diagnostico_descripcion: '',
    tratamiento: '',
    receta_medica: '',
    derivacion_especialidad: '',
    ordenes_laboratorio: [],
    actualizar_alergias: '',
  });

  /**
   * Cargar datos clínicos para iniciar la consulta médica
   */
  const cargarConsulta = useCallback(async (idCita) => {
    setIdCitaActiva(idCita);
    setLoading(true);
    setError(null);
    setMensajeExito(null);
    setAlertaFarmaco(null);

    try {
      const res = await fetch(`${API_BASE}/cita/${idCita}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al iniciar la consulta médica.');
      }

      setConsultaData(data);

      // Si la cita ya tenía una atención guardada, precargar los valores
      if (data.atencion_existente) {
        const at = data.atencion_existente;
        const signos = at.signos_vitales || {};
        setFormData({
          motivo_consulta: at.motivo_consulta || data.cita.motivo_consulta || '',
          sintomas: at.sintomas || '',
          signos_vitales: {
            presion_arterial: signos.presion_arterial || '',
            frecuencia_cardiaca: signos.frecuencia_cardiaca || '',
            temperatura: signos.temperatura || '',
            saturacion_oxigeno: signos.saturacion_oxigeno || '',
            peso: signos.peso || '',
            talla: signos.talla || '',
            imc: signos.imc || '',
          },
          diagnostico_cie10: at.diagnostico_cie10 || '',
          diagnostico_descripcion: at.diagnostico_descripcion || '',
          tratamiento: at.tratamiento || '',
          receta_medica: at.receta_medica || '',
          derivacion_especialidad: at.derivacion_especialidad || '',
          ordenes_laboratorio: [],
          actualizar_alergias: data.historia_clinica?.alergias_medicamentos || '',
        });
      } else {
        // Inicializar con motivo de la cita
        setFormData({
          motivo_consulta: data.cita?.motivo_consulta || '',
          sintomas: '',
          signos_vitales: {
            presion_arterial: '120/80',
            frecuencia_cardiaca: '75',
            temperatura: '36.5',
            saturacion_oxigeno: '98',
            peso: '',
            talla: '',
            imc: '',
          },
          diagnostico_cie10: '',
          diagnostico_descripcion: '',
          tratamiento: '',
          receta_medica: '',
          derivacion_especialidad: '',
          ordenes_laboratorio: [],
          actualizar_alergias: data.historia_clinica?.alergias_medicamentos || '',
        });
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de la consulta.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar campo del formulario
   */
  const actualizarCampo = (campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  /**
   * Actualizar signo vital individual y calcular IMC automáticamente
   */
  const actualizarSignoVital = (campo, valor) => {
    setFormData((prev) => {
      const nextSignos = { ...prev.signos_vitales, [campo]: valor };

      // Cálculo reactivo de IMC si peso y talla están presentes
      const p = parseFloat(campo === 'peso' ? valor : nextSignos.peso);
      const t = parseFloat(campo === 'talla' ? valor : nextSignos.talla);
      if (p > 0 && t > 0) {
        // Si talla viene en cm (ej. 170) o en m (ej. 1.70)
        const tallaMetros = t > 3 ? t / 100 : t;
        const imcCalculado = (p / (tallaMetros * tallaMetros)).toFixed(1);
        nextSignos.imc = String(imcCalculado);
      }

      return {
        ...prev,
        signos_vitales: nextSignos,
      };
    });
  };

  /**
   * Alternar estudio de laboratorio en la orden
   */
  const alternarOrdenLaboratorio = (nombreEstudio) => {
    setFormData((prev) => {
      const actual = prev.ordenes_laboratorio || [];
      const existe = actual.includes(nombreEstudio);
      const nuevaLista = existe
        ? actual.filter((e) => e !== nombreEstudio)
        : [...actual, nombreEstudio];

      return { ...prev, ordenes_laboratorio: nuevaLista };
    });
  };

  /**
   * Seleccionar diagnóstico rápido de catálogo CIE-10
   */
  const seleccionarDiagnosticoCie10 = (item) => {
    setFormData((prev) => ({
      ...prev,
      diagnostico_cie10: item.codigo,
      diagnostico_descripcion: item.descripcion,
    }));
  };

  /**
   * Guardar evolución y finalizar consulta médica (CU16)
   */
  const guardarAtencion = async () => {
    if (!idCitaActiva) return;

    if (!formData.motivo_consulta.trim()) {
      setError('El motivo de la consulta es obligatorio.');
      return;
    }
    if (!formData.diagnostico_descripcion.trim()) {
      setError('La descripción del diagnóstico o evolución médica es obligatoria.');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensajeExito(null);
    setAlertaFarmaco(null);

    try {
      const res = await fetch(`${API_BASE}/cita/${idCitaActiva}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Error al guardar la consulta médica.');
      }

      setMensajeExito(data.message || '¡Consulta médica registrada con éxito! Cita marcada como ATENDIDA.');
      if (data.alerta_farmaco) {
        setAlertaFarmaco(data.alerta_farmaco);
      }

      if (onAtencionCompletada) {
        onAtencionCompletada(data.data);
      }

      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message || 'No se pudo guardar la atención médica.');
      return { success: false, message: err.message };
    } finally {
      setGuardando(false);
    }
  };

  const limpiar = () => {
    setIdCitaActiva(null);
    setConsultaData(null);
    setError(null);
    setMensajeExito(null);
    setAlertaFarmaco(null);
  };

  return {
    idCitaActiva,
    consultaData,
    loading,
    guardando,
    error,
    mensajeExito,
    alertaFarmaco,
    formData,
    cargarConsulta,
    actualizarCampo,
    actualizarSignoVital,
    alternarOrdenLaboratorio,
    seleccionarDiagnosticoCie10,
    guardarAtencion,
    limpiar,
    limpiarMensajes: () => {
      setError(null);
      setMensajeExito(null);
      setAlertaFarmaco(null);
    },
  };
};

export default useCU16AtencionMedicaController;
