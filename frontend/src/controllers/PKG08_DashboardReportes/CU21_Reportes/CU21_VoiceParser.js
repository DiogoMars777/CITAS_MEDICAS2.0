/**
 * Parser de lenguaje natural y comandos de voz para CU21 - Reportes Clínicos y Estadísticos
 * Clínica Vida Salud - Nivel Senior Enterprise
 */

/**
 * Normaliza texto eliminando tildes y caracteres especiales para comparación fonética
 */
export const normalizarTexto = (texto = '') => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Categorías y sugerencias de comandos de voz para guiar al usuario
 */
export const SUGERENCIAS_VOZ_REPORTES = [
  {
    categoria: '📊 Tipos de Reporte',
    color: '#0284c7',
    items: [
      { label: 'Productividad Médica', comando: 'Ver productividad médica', desc: 'Rendimiento de citas y efectividad por doctor' },
      { label: 'Morbilidad CIE-10', comando: 'Ver reporte de morbilidad CIE-10', desc: 'Patologías y diagnósticos más frecuentes' },
      { label: 'Estudios de Laboratorio', comando: 'Ver estudios de laboratorio', desc: 'Exámenes clínicos, ecografías y resultados' },
      { label: 'Cancelaciones e Inasistencias', comando: 'Ver cancelaciones e inasistencias', desc: 'Citas perdidas, ausencias y motivos' },
    ],
  },
  {
    categoria: '📅 Períodos de Tiempo',
    color: '#059669',
    items: [
      { label: 'Datos de Hoy', comando: 'Reporte del día de hoy', desc: 'Citas y movimientos registrados hoy' },
      { label: 'Esta Semana', comando: 'Reporte de esta semana', desc: 'Consolidado semanal de lunes a domingo' },
      { label: 'Este Mes', comando: 'Reporte de este mes', desc: 'Consolidado mensual completo' },
      { label: 'Año en Curso', comando: 'Reporte de todo el año', desc: 'Balance anual acumulado' },
    ],
  },
  {
    categoria: '🩺 Filtros Especialidad y Médicos',
    color: '#7c3aed',
    items: [
      { label: 'Filtrar Pediatría', comando: 'Filtrar por Pediatría', desc: 'Atenciones y consultas pediátricas' },
      { label: 'Filtrar Cardiología', comando: 'Filtrar por Cardiología', desc: 'Pacientes y citas cardiológicas' },
      { label: 'Filtrar Medicina General', comando: 'Filtrar por Medicina General', desc: 'Atención primaria' },
      { label: 'Dr. Carlos Mendoza', comando: 'Filtrar por Dr. Carlos Mendoza', desc: 'Agenda del médico' },
      { label: 'Ver Todos', comando: 'Todas las especialidades y todos los médicos', desc: 'Quitar filtros específicos' },
    ],
  },
  {
    categoria: '⚡ Acciones Rápidas',
    color: '#ea580c',
    items: [
      { label: '🎙️ Dame un Resumen por Voz', comando: 'Dame un resumen ejecutivo de este reporte', desc: 'Síntesis hablada con métricas clave' },
      { label: '📥 Exportar a Excel', comando: 'Exportar reporte a Excel', desc: 'Descarga inmediata en CSV compatible con Excel' },
      { label: '🖨️ Imprimir / PDF', comando: 'Imprimir reporte en PDF', desc: 'Apertura de vista formal con sellos' },
      { label: '🔄 Refrescar Datos', comando: 'Refrescar reporte', desc: 'Recarga los datos de la base de datos' },
    ],
  },
];

/**
 * Procesa una instrucción en lenguaje natural (hablada o escrita) y extrae la intención
 * @param {string} transcripcion Texto reconocido por voz o escrito
 * @param {object} meta Metadatos cargados (especialidades, médicos, períodos)
 * @returns {object} Acciones identificadas para aplicar en el controlador
 */
export const parsearComandoReporte = (transcripcion, meta = {}) => {
  const norm = normalizarTexto(transcripcion);

  const resultado = {
    tipoReporte: null,
    periodo: null,
    idMedico: null,
    idEspecialidad: null,
    accion: null,
    descripcionAccion: '',
    mensajeVoz: '',
  };

  if (!norm) return resultado;

  // 1. ACCIÓN: RESUMEN HABLADO
  if (norm.includes('resumen') || norm.includes('leer') || norm.includes('cuentame') || norm.includes('que dice') || norm.includes('resultados')) {
    resultado.accion = 'RESUMEN';
    resultado.descripcionAccion = 'Generando resumen ejecutivo por voz...';
    resultado.mensajeVoz = 'Generando el resumen ejecutivo de los datos actuales.';
    return resultado;
  }

  // 2. ACCIÓN: EXPORTAR A EXCEL / CSV
  if (norm.includes('exportar') || norm.includes('descargar') || norm.includes('excel') || norm.includes('csv')) {
    resultado.accion = 'EXPORTAR';
    resultado.descripcionAccion = 'Exportando archivo Excel / CSV...';
    resultado.mensajeVoz = 'Exportando el reporte actual a formato Excel.';
    return resultado;
  }

  // 3. ACCIÓN: IMPRIMIR / PDF
  if (norm.includes('imprimir') || norm.includes('pdf') || norm.includes('impresion') || norm.includes('vista previa')) {
    resultado.accion = 'IMPRIMIR';
    resultado.descripcionAccion = 'Abriendo vista formal para impresión o guardado PDF...';
    resultado.mensajeVoz = 'Abriendo la vista formal para impresión y PDF.';
    return resultado;
  }

  // 4. ACCIÓN: REFRESCAR / ACTUALIZAR
  if (norm.includes('refrescar') || norm.includes('actualizar') || norm.includes('recargar')) {
    resultado.accion = 'REFRESCAR';
    resultado.descripcionAccion = 'Actualizando datos del reporte...';
    resultado.mensajeVoz = 'Actualizando la información de los reportes.';
    return resultado;
  }

  const cambios = [];

  // 5. TIPO DE REPORTE
  if (norm.includes('productiv') || norm.includes('rendimiento') || norm.includes('ocupacion')) {
    resultado.tipoReporte = 'PRODUCTIVIDAD';
    cambios.push('Reporte de Productividad Médica');
  } else if (norm.includes('morbilidad') || norm.includes('cie') || norm.includes('enfermedad') || norm.includes('patolog') || norm.includes('diagnostico')) {
    resultado.tipoReporte = 'MORBILIDAD';
    cambios.push('Reporte de Morbilidad CIE-10');
  } else if (norm.includes('laboratorio') || norm.includes('estudio') || norm.includes('analisis') || norm.includes('ecograf') || norm.includes('radiograf') || norm.includes('hemograma')) {
    resultado.tipoReporte = 'LABORATORIOS';
    cambios.push('Reporte de Estudios de Laboratorio');
  } else if (norm.includes('cancel') || norm.includes('inasist') || norm.includes('perdida') || norm.includes('falta') || norm.includes('ausenc')) {
    resultado.tipoReporte = 'CANCELACIONES';
    cambios.push('Reporte de Cancelaciones e Inasistencias');
  }

  // 6. PERÍODO DE TIEMPO
  if (norm.includes('hoy') || norm.includes('dia de hoy')) {
    resultado.periodo = 'hoy';
    cambios.push('Período: Hoy');
  } else if (norm.includes('semana') || norm.includes('semanal')) {
    resultado.periodo = 'esta_semana';
    cambios.push('Período: Esta Semana');
  } else if (norm.includes('mes') || norm.includes('mensual')) {
    resultado.periodo = 'este_mes';
    cambios.push('Período: Este Mes');
  } else if (norm.includes('trimestre') || norm.includes('90 dias') || norm.includes('tres meses')) {
    resultado.periodo = 'trimestre';
    cambios.push('Período: Último Trimestre');
  } else if (norm.includes('ano') || norm.includes('anual')) {
    resultado.periodo = 'anio';
    cambios.push('Período: Año en Curso');
  }

  // 7. FILTRO POR ESPECIALIDAD
  if (norm.includes('todas las especialidades') || norm.includes('todas')) {
    resultado.idEspecialidad = 'todas';
    cambios.push('Especialidad: Todas');
  } else if (meta.especialidades && Array.isArray(meta.especialidades)) {
    for (const esp of meta.especialidades) {
      const nombreNorm = normalizarTexto(esp.nombre);
      // Chequear coincidencia directa o raíz
      if (nombreNorm && (norm.includes(nombreNorm) || (nombreNorm.length > 5 && norm.includes(nombreNorm.slice(0, -1))))) {
        resultado.idEspecialidad = String(esp.id_especialidad);
        cambios.push(`Especialidad: ${esp.nombre}`);
        break;
      }
    }
  }

  // Casos especiales de sinónimos de especialidades comunes
  if (!resultado.idEspecialidad) {
    if (norm.includes('pediatra') || norm.includes('pediatria')) {
      const found = meta.especialidades?.find((e) => normalizarTexto(e.nombre).includes('pediatr'));
      if (found) {
        resultado.idEspecialidad = String(found.id_especialidad);
        cambios.push(`Especialidad: ${found.nombre}`);
      }
    } else if (norm.includes('cardio') || norm.includes('cardiologo')) {
      const found = meta.especialidades?.find((e) => normalizarTexto(e.nombre).includes('cardio'));
      if (found) {
        resultado.idEspecialidad = String(found.id_especialidad);
        cambios.push(`Especialidad: ${found.nombre}`);
      }
    } else if (norm.includes('gineco') || norm.includes('ginecologa') || norm.includes('ginecologo')) {
      const found = meta.especialidades?.find((e) => normalizarTexto(e.nombre).includes('gineco'));
      if (found) {
        resultado.idEspecialidad = String(found.id_especialidad);
        cambios.push(`Especialidad: ${found.nombre}`);
      }
    } else if (norm.includes('trauma') || norm.includes('traumatologo')) {
      const found = meta.especialidades?.find((e) => normalizarTexto(e.nombre).includes('trauma'));
      if (found) {
        resultado.idEspecialidad = String(found.id_especialidad);
        cambios.push(`Especialidad: ${found.nombre}`);
      }
    } else if (norm.includes('dental') || norm.includes('dentista') || norm.includes('diente')) {
      const found = meta.especialidades?.find((e) => normalizarTexto(e.nombre).includes('odont'));
      if (found) {
        resultado.idEspecialidad = String(found.id_especialidad);
        cambios.push(`Especialidad: ${found.nombre}`);
      }
    }
  }

  // 8. FILTRO POR MÉDICO
  if (norm.includes('todos los medicos') || norm.includes('todos los doctores')) {
    resultado.idMedico = 'todos';
    cambios.push('Médico: Todos');
  } else if (meta.medicos && Array.isArray(meta.medicos)) {
    for (const med of meta.medicos) {
      const medNorm = normalizarTexto(med.nombre_completo);
      const partes = medNorm.split(' ').filter((p) => p.length > 3 && p !== 'dr(a).');
      const match = partes.some((p) => norm.includes(p));
      if (match) {
        resultado.idMedico = String(med.id_medico);
        cambios.push(`Médico: ${med.nombre_completo}`);
        break;
      }
    }
  }

  // Construir mensaje descriptivo
  if (cambios.length > 0) {
    resultado.descripcionAccion = `Filtros aplicados: ${cambios.join(' | ')}`;
    resultado.mensajeVoz = `Aplicando ${cambios.join(', ')}.`;
  } else {
    resultado.descripcionAccion = `No se detectó un comando específico para "${transcripcion}". Revisa las sugerencias.`;
    resultado.mensajeVoz = 'No pude identificar el comando. Intenta decir por ejemplo: ver morbilidad de hoy.';
  }

  return resultado;
};

/**
 * Genera el guion verbal del resumen ejecutivo basado en los datos del reporte activo
 */
export const generarGuionResumen = (reporteActivo, datos) => {
  if (!datos) {
    return 'Aún no hay datos cargados para generar un resumen. Intenta actualizar el reporte.';
  }

  if (reporteActivo === 'PRODUCTIVIDAD') {
    const res = datos.resumen || {};
    const total = res.total_citas_periodo ?? 0;
    const atendidas = res.total_atendidas ?? 0;
    const efectividad = res.tasa_efectividad_global ?? 0;
    const canceladas = res.total_canceladas ?? 0;
    return `Resumen de Productividad Médica: En este período se registraron ${total} citas en total, de las cuales ${atendidas} fueron atendidas con éxito, logrando una efectividad global del ${efectividad} por ciento. Se registraron ${canceladas} citas canceladas.`;
  }

  if (reporteActivo === 'MORBILIDAD') {
    const res = datos.resumen || {};
    const total = res.total_diagnosticos_registrados ?? 0;
    const top = datos.top_diagnosticos && datos.top_diagnosticos[0];
    const topTexto = top ? `La patología más frecuente es ${top.diagnostico}, con ${top.total_casos} casos reportados, representando el ${top.porcentaje} por ciento.` : '';
    return `Resumen Epidemiológico CIE-10: Se han registrado un total de ${total} diagnósticos médicos. ${topTexto}`;
  }

  if (reporteActivo === 'LABORATORIOS') {
    const res = datos.resumen || {};
    const total = res.total_estudios_solicitados ?? 0;
    const completados = res.completados ?? 0;
    const pendientes = res.pendientes ?? 0;
    return `Resumen de Laboratorios: Se solicitaron ${total} estudios clínicos en el período. De ellos, ${completados} ya cuentan con resultados publicados y ${pendientes} se encuentran en proceso.`;
  }

  if (reporteActivo === 'CANCELACIONES') {
    const res = datos.resumen || {};
    const total = res.total_citas_perdidas ?? 0;
    const canceladas = res.canceladas_voluntarias ?? 0;
    const inasistencias = res.inasistencias_no_show ?? 0;
    return `Resumen de Cancelaciones e Inasistencias: Se contabilizan ${total} citas no concretadas en total, con ${canceladas} cancelaciones anticipadas y ${inasistencias} inasistencias en sala.`;
  }

  return 'Resumen ejecutivo disponible en pantalla.';
};
