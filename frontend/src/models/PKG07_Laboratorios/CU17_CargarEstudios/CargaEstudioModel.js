/**
 * Modelo de datos y catálogo de plantillas clínicas para CU17 - Cargar estudios
 */
export const initialCargaEstudioModel = {
  id: null,
  estado: 'ACTIVO',
  fecha_creacion: new Date().toISOString()
};

export const PLANTILLAS_LABORATORIO = {
  HEMOGRAMA: {
    id: 'HEMOGRAMA',
    nombre: 'Hemograma Completo con Plaquetas',
    palabrasClave: ['hemograma', 'plaquetas', 'eritrocitos', 'hematocrito', 'globulos'],
    parametros: [
      { id: 'hemoglobina', nombre: 'Hemoglobina', unidad: 'g/dL', normal: '14.0', ref: '12.0 - 16.0 g/dL' },
      { id: 'hematocrito', nombre: 'Hematocrito', unidad: '%', normal: '42.0', ref: '36.0 - 48.0 %' },
      { id: 'eritrocitos', nombre: 'Glóbulos Rojos', unidad: 'M/mm³', normal: '4.8', ref: '4.2 - 5.4 M/mm³' },
      { id: 'leucocitos', nombre: 'Leucocitos Totales', unidad: '/mm³', normal: '7200', ref: '4,500 - 10,000 /mm³' },
      { id: 'neutrofilos', nombre: 'Neutrófilos Seg.', unidad: '%', normal: '60', ref: '55 - 70 %' },
      { id: 'linfocitos', nombre: 'Linfocitos', unidad: '%', normal: '30', ref: '20 - 40 %' },
      { id: 'plaquetas', nombre: 'Plaquetas', unidad: '/mm³', normal: '250000', ref: '150,000 - 450,000 /mm³' },
      { id: 'vsg', nombre: 'VSG', unidad: 'mm/h', normal: '8', ref: '0 - 15 mm/h' },
    ],
  },
  PERFIL_LIPIDICO: {
    id: 'PERFIL_LIPIDICO',
    nombre: 'Perfil Lipídico (Colesterol, Triglicéridos, HDL, LDL)',
    palabrasClave: ['perfil lipidico', 'colesterol', 'trigliceridos', 'lipidos', 'hdl', 'ldl'],
    parametros: [
      { id: 'colesterol_total', nombre: 'Colesterol Total', unidad: 'mg/dL', normal: '175', ref: '< 200 mg/dL' },
      { id: 'hdl', nombre: 'Colesterol HDL', unidad: 'mg/dL', normal: '52', ref: '> 40 mg/dL' },
      { id: 'ldl', nombre: 'Colesterol LDL', unidad: 'mg/dL', normal: '98', ref: '< 100 mg/dL' },
      { id: 'trigliceridos', nombre: 'Triglicéridos', unidad: 'mg/dL', normal: '125', ref: '< 150 mg/dL' },
      { id: 'vldl', nombre: 'Colesterol VLDL', unidad: 'mg/dL', normal: '25', ref: '< 30 mg/dL' },
    ],
  },
  GLUCEMIA: {
    id: 'GLUCEMIA',
    nombre: 'Glucemia en Ayunas / HbA1c',
    palabrasClave: ['glucemia', 'glucosa', 'azucar', 'glicosilada', 'hba1c'],
    parametros: [
      { id: 'glucosa', nombre: 'Glucemia Basal', unidad: 'mg/dL', normal: '85', ref: '70 - 100 mg/dL' },
      { id: 'hba1c', nombre: 'Hemoglobina Glicosilada (HbA1c)', unidad: '%', normal: '5.3', ref: '< 5.7 %' },
    ],
  },
  RENAL_HEPATICO: {
    id: 'RENAL_HEPATICO',
    nombre: 'Función Renal y Hepática (Creatinina, Urea, TGO, TGP)',
    palabrasClave: ['creatinina', 'urea', 'renal', 'hepatica', 'tgo', 'tgp', 'transaminasas', 'acido urico'],
    parametros: [
      { id: 'creatinina', nombre: 'Creatinina Sérica', unidad: 'mg/dL', normal: '0.9', ref: '0.7 - 1.2 mg/dL' },
      { id: 'urea', nombre: 'Urea', unidad: 'mg/dL', normal: '28', ref: '15 - 45 mg/dL' },
      { id: 'acido_urico', nombre: 'Ácido Úrico', unidad: 'mg/dL', normal: '4.8', ref: '3.5 - 7.2 mg/dL' },
      { id: 'tgo', nombre: 'TGO / AST', unidad: 'U/L', normal: '22', ref: '< 38 U/L' },
      { id: 'tgp', nombre: 'TGP / ALT', unidad: 'U/L', normal: '25', ref: '< 41 U/L' },
    ],
  },
  ORINA: {
    id: 'ORINA',
    nombre: 'Examen General de Orina (EGO)',
    palabrasClave: ['orina', 'ego', 'sedimento', 'urinario'],
    parametros: [
      { id: 'densidad', nombre: 'Densidad', unidad: '', normal: '1.020', ref: '1.010 - 1.030' },
      { id: 'ph', nombre: 'pH Urinario', unidad: '', normal: '6.0', ref: '5.0 - 7.5' },
      { id: 'proteinas', nombre: 'Proteínas', unidad: '', normal: 'Negativo', ref: 'Negativo' },
      { id: 'glucosa_orina', nombre: 'Glucosa', unidad: '', normal: 'Negativo', ref: 'Negativo' },
      { id: 'leucocitos_orina', nombre: 'Leucocitos', unidad: '/campo', normal: '1 - 2', ref: '0 - 3 por campo' },
      { id: 'hematies_orina', nombre: 'Hematíes', unidad: '/campo', normal: '0 - 1', ref: '0 - 2 por campo' },
      { id: 'bacterias', nombre: 'Bacterias', unidad: '', normal: 'Escasas', ref: 'Escasas o Ausentes' },
    ],
  },
};

export const detectarPlantillaEstudio = (nombreEstudio = '') => {
  const nom = (nombreEstudio || '').toLowerCase();
  for (const key of Object.keys(PLANTILLAS_LABORATORIO)) {
    const pl = PLANTILLAS_LABORATORIO[key];
    if (pl.palabrasClave.some((kw) => nom.includes(kw))) {
      return pl;
    }
  }
  return {
    id: 'GENERICA',
    nombre: nombreEstudio || 'Estudio de Laboratorio Clínico',
    parametros: [
      { id: 'param1', nombre: 'Parámetro Principal', unidad: '', normal: '', ref: 'Dentro de rango de referencia' },
      { id: 'param2', nombre: 'Parámetro Secundario', unidad: '', normal: '', ref: 'Referencia analítica' },
    ],
  };
};

export default {
  initialCargaEstudioModel,
  PLANTILLAS_LABORATORIO,
  detectarPlantillaEstudio,
};
