<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FiveThingsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now('America/La_Paz');
        $hash = password_hash('Password123#', PASSWORD_BCRYPT);

        // =========================================================================
        // 1. USUARIOS (Roles: 1 Admin, 2 Recepción, 3 Médico, 4 Paciente)
        // =========================================================================
        $usersData = [
            ['id' => 1, 'rol' => 1, 'user' => 'admin', 'email' => 'admin@clinicavidasalud.com'],
            ['id' => 2, 'rol' => 2, 'user' => 'recepcion', 'email' => 'recepcion@clinicavidasalud.com'],
            ['id' => 3, 'rol' => 3, 'user' => 'dr_rodriguez', 'email' => 'rodriguez@clinicavidasalud.com'],
            ['id' => 4, 'rol' => 3, 'user' => 'dra_mendoza', 'email' => 'mendoza@clinicavidasalud.com'],
            ['id' => 5, 'rol' => 3, 'user' => 'dr_torrico', 'email' => 'torrico@clinicavidasalud.com'],
            ['id' => 6, 'rol' => 3, 'user' => 'dra_vargas', 'email' => 'vargas@clinicavidasalud.com'],
            ['id' => 7, 'rol' => 3, 'user' => 'dr_morales', 'email' => 'morales@clinicavidasalud.com'],
            ['id' => 8, 'rol' => 4, 'user' => 'paciente', 'email' => 'paciente@clinicavidasalud.com'],
        ];

        foreach ($usersData as $u) {
            DB::table('usuarios')->updateOrInsert(
                ['username' => $u['user']],
                [
                    'id_rol' => $u['rol'],
                    'email' => $u['email'],
                    'password_hash' => $hash,
                    'estado' => 'ACTIVO',
                    'fecha_creacion' => $now,
                    'fecha_actualizacion' => $now,
                ]
            );
        }

        $userIds = DB::table('usuarios')->pluck('id_usuario', 'username');

        // =========================================================================
        // 2. 5 MÉDICOS CON ESPECIALIDADES Y CONSULTORIOS
        // =========================================================================
        $medicosData = [
            ['user' => 'dr_rodriguez', 'reg' => 'MP-10234', 'nom' => 'Carlos Alberto', 'ape' => 'Rodríguez Paredes', 'esp' => 5, 'tel' => '71234567'],
            ['user' => 'dra_mendoza',  'reg' => 'MP-10455', 'nom' => 'Elena Sofía',     'ape' => 'Mendoza Gutiérrez',  'esp' => 2, 'tel' => '72345678'],
            ['user' => 'dr_torrico',  'reg' => 'MP-10788', 'nom' => 'Mario Fernando',  'ape' => 'Torrico Camacho',    'esp' => 1, 'tel' => '73456789'],
            ['user' => 'dra_vargas',   'reg' => 'MP-10912', 'nom' => 'Andrea Marcela',  'ape' => 'Vargas Arancibia',   'esp' => 4, 'tel' => '74567890'],
            ['user' => 'dr_morales',  'reg' => 'MP-11044', 'nom' => 'Jorge Luis',      'ape' => 'Morales Céspedes',   'esp' => 7, 'tel' => '75678901'],
        ];

        $medicoIds = [];
        foreach ($medicosData as $m) {
            $uId = $userIds[$m['user']] ?? null;
            if ($uId) {
                DB::table('medicos')->updateOrInsert(
                    ['numero_registro_profesional' => $m['reg']],
                    [
                        'id_usuario' => $uId,
                        'nombres' => $m['nom'],
                        'apellidos' => $m['ape'],
                        'telefono' => $m['tel'],
                        'email' => "{$m['user']}@clinicavidasalud.com",
                        'estado' => 'ACTIVO',
                        'fecha_ingreso' => '2024-01-15',
                    ]
                );
                $med = DB::table('medicos')->where('numero_registro_profesional', $m['reg'])->first();
                $medicoIds[] = $med->id_medico;

                // Asignar especialidad primaria
                DB::table('medico_especialidades')->updateOrInsert(
                    ['id_medico' => $med->id_medico, 'id_especialidad' => $m['esp']],
                    ['es_principal' => true]
                );
            }
        }

        // =========================================================================
        // 3. 5 PACIENTES CON EXPEDIENTE E HISTORIA CLÍNICA
        // =========================================================================
        $pacientesData = [
            ['doc' => '4892101', 'nom' => 'Juan Carlos',    'ape' => 'Mamani Flores',     'sex' => 'MASCULINO', 'fec' => '1985-04-12', 'sangre' => 'O_POSITIVO', 'tel' => '76543210'],
            ['doc' => '5934122', 'nom' => 'María René',      'ape' => 'Quiroga Salvatierra', 'sex' => 'FEMENINO',  'fec' => '1992-08-23', 'sangre' => 'A_POSITIVO', 'tel' => '77654321'],
            ['doc' => '6201944', 'nom' => 'Roberto Carlos',  'ape' => 'Fernández Daza',    'sex' => 'MASCULINO', 'fec' => '1978-11-05', 'sangre' => 'B_POSITIVO', 'tel' => '78765432'],
            ['doc' => '7112045', 'nom' => 'Lucía Patricia',  'ape' => 'Salinas Morales',   'sex' => 'FEMENINO',  'fec' => '2001-02-18', 'sangre' => 'O_POSITIVO', 'tel' => '79876543'],
            ['doc' => '8345129', 'nom' => 'Gonzalo Javier',  'ape' => 'Chávez Terrazas',   'sex' => 'MASCULINO', 'fec' => '1965-06-30', 'sangre' => 'AB_POSITIVO', 'tel' => '70987654'],
        ];

        $pacienteIds = [];
        foreach ($pacientesData as $p) {
            DB::table('pacientes')->updateOrInsert(
                ['numero_documento' => $p['doc']],
                [
                    'tipo_documento' => 'CI',
                    'nombres' => $p['nom'],
                    'apellidos' => $p['ape'],
                    'fecha_nacimiento' => $p['fec'],
                    'sexo' => $p['sex'],
                    'telefono' => $p['tel'],
                    'email' => strtolower(str_replace(' ', '', $p['nom'])) . '@gmail.com',
                    'direccion' => 'Av. Principal #123, Cochabamba',
                    'estado' => 'ACTIVO',
                    'fecha_creacion' => $now,
                ]
            );
            $pac = DB::table('pacientes')->where('numero_documento', $p['doc'])->first();
            $pacienteIds[] = $pac->id_paciente;

            // Historia clínica base
            DB::table('historias_clinicas')->updateOrInsert(
                ['id_paciente' => $pac->id_paciente],
                [
                    'numero_expediente' => 'EXP-' . str_pad($pac->id_paciente, 6, '0', STR_PAD_LEFT),
                    'tipo_sangre' => $p['sangre'],
                    'alergias' => 'Ninguna alergia conocida reportada',
                    'antecedentes_patologicos' => 'Sin antecedentes crónicos de relevancia',
                    'antecedentes_quirurgicos' => 'Sin cirugías previas',
                    'fecha_apertura' => $now,
                ]
            );

            // Contacto emergencia
            DB::table('contactos_emergencia')->updateOrInsert(
                ['id_paciente' => $pac->id_paciente],
                [
                    'nombre_contacto' => 'Familiar Responsable',
                    'relacion' => 'Hermano/a',
                    'telefono' => '7000000' . $pac->id_paciente,
                ]
            );
        }

        // =========================================================================
        // 4. 5 TURNOS MÉDICOS ACTIVOS (15 MIN)
        // =========================================================================
        $diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
        $turnoIds = [];
        foreach ($medicoIds as $idx => $mId) {
            $dia = $diasSemana[$idx % 5];
            DB::table('turnos_medicos')->updateOrInsert(
                ['id_medico' => $mId, 'dia_semana' => $dia, 'hora_inicio' => '08:00:00'],
                [
                    'hora_fin' => '12:00:00',
                    'duracion_slot_minutos' => 15,
                    'capacidad_maxima' => 16,
                    'consultorio' => 'Cons-' . (101 + $idx),
                    'activo' => true,
                    'fecha_creacion' => $now,
                ]
            );
            $turno = DB::table('turnos_medicos')->where('id_medico', $mId)->where('dia_semana', $dia)->first();
            if ($turno) $turnoIds[] = $turno->id_turno;
        }

        // =========================================================================
        // 5. 5 CITAS MÉDICAS EN DIFERENTES ESTADOS
        // =========================================================================
        $citasEstados = [
            ['idx' => 0, 'estado' => 'ATENDIDA',    'hora' => '08:00:00', 'motivo' => 'Control de arritmia y presión alta'],
            ['idx' => 1, 'estado' => 'CONFIRMADA',  'hora' => '08:30:00', 'motivo' => 'Control de niño sano y esquema vacunas'],
            ['idx' => 2, 'estado' => 'PROGRAMADA',  'hora' => '09:00:00', 'motivo' => 'Evaluación de dolor abdominal intermitente'],
            ['idx' => 3, 'estado' => 'REPROGRAMADA','hora' => '09:30:00', 'motivo' => 'Control prenatal primer trimestre'],
            ['idx' => 4, 'estado' => 'CANCELADA',   'hora' => '10:00:00', 'motivo' => 'Dolor articular en rodilla derecha'],
        ];

        $citaIds = [];
        $fechaHoy = $now->toDateString();

        foreach ($citasEstados as $c) {
            $pId = $pacienteIds[$c['idx']] ?? $pacienteIds[0];
            $mId = $medicoIds[$c['idx']] ?? $medicoIds[0];

            $horaFin = Carbon::parse($c['hora'])->addMinutes(15)->toTimeString();

            $idCita = DB::table('citas')->insertGetId([
                'id_paciente' => $pId,
                'id_medico' => $mId,
                'fecha_cita' => $fechaHoy,
                'hora_inicio' => $c['hora'],
                'hora_fin' => $horaFin,
                'estado_cita' => $c['estado'],
                'motivo_consulta' => $c['motivo'],
                'fecha_creacion' => $now,
            ], 'id_cita');

            $citaIds[] = $idCita;

            // Registrar en reservas
            DB::table('reservas')->insert([
                'id_cita' => $idCita,
                'codigo_reserva' => 'RES-' . strtoupper(substr(md5(uniqid()), 0, 8)),
                'estado_reserva' => ($c['estado'] === 'CANCELADA') ? 'EXPIRADA' : 'CONFIRMADA',
                'fecha_reserva' => $now,
            ]);
        }

        // =========================================================================
        // 6. 5 ATENCIONES MÉDICAS CON SIGNOS VITALES Y DIAGNÓSTICO
        // =========================================================================
        $atencionesData = [
            [
                'cie10' => 'I10', 'desc' => 'Hipertensión esencial (primaria)',
                'trat' => 'Enalapril 10mg cada 12 horas. Dieta hiposódica y ejercicio regular.',
                'receta' => '1. Enalapril 10mg tab #30, tomar 1 cada 12h.\n2. Ácido Acetilsalicílico 100mg #30, 1 al día.',
                'signos' => ['pa' => '135/85', 'fc' => 74, 'temp' => 36.5, 'spo2' => 97, 'peso' => 78.5, 'talla' => 172],
            ],
            [
                'cie10' => 'J00', 'desc' => 'Rinofaringitis aguda (resfriado común)',
                'trat' => 'Paracetamol 500mg c/8h si hay fiebre. Abundante hidratación oral.',
                'receta' => '1. Paracetamol 500mg #20.\n2. Solución salina nasal gotas.',
                'signos' => ['pa' => '115/75', 'fc' => 82, 'temp' => 37.8, 'spo2' => 98, 'peso' => 64.0, 'talla' => 160],
            ],
            [
                'cie10' => 'K29.7', 'desc' => 'Gastritis, no especificada',
                'trat' => 'Omeprazol 20mg en ayunas por 28 días. Evitar irritantes y picantes.',
                'receta' => '1. Omeprazol 20mg cap #30, tomar 1 en ayunas.',
                'signos' => ['pa' => '120/80', 'fc' => 70, 'temp' => 36.6, 'spo2' => 96, 'peso' => 72.0, 'talla' => 168],
            ],
            [
                'cie10' => 'O26.8', 'desc' => 'Atención materna por otras complicaciones especificadas del embarazo',
                'trat' => 'Suplemento de Ácido Fólico 5mg + Sulfato Ferroso. Control en 4 semanas.',
                'receta' => '1. Ácido fólico 5mg #60.\n2. Calcio + Vitamina D3 #30.',
                'signos' => ['pa' => '110/70', 'fc' => 76, 'temp' => 36.4, 'spo2' => 99, 'peso' => 58.0, 'talla' => 158],
            ],
            [
                'cie10' => 'M54.5', 'desc' => 'Lumbago no especificado',
                'trat' => 'Ibuprofeno 400mg cada 8 horas por 5 días. Reposo y calor local.',
                'receta' => '1. Ibuprofeno 400mg tab #15.\n2. Complejo B inyectable #3.',
                'signos' => ['pa' => '125/82', 'fc' => 68, 'temp' => 36.5, 'spo2' => 97, 'peso' => 84.0, 'talla' => 175],
            ],
        ];

        foreach ($atencionesData as $idx => $at) {
            $cId = $citaIds[$idx] ?? $citaIds[0];
            $pId = $pacienteIds[$idx] ?? $pacienteIds[0];
            $mId = $medicoIds[$idx] ?? $medicoIds[0];

            $hist = DB::table('historias_clinicas')->where('id_paciente', $pId)->first();

            DB::table('atenciones_medicas')->insert([
                'id_cita' => $cId,
                'id_historia_clinica' => $hist->id_historia_clinica ?? 1,
                'id_medico' => $mId,
                'motivo_consulta' => 'Consulta clínica de evaluación integral',
                'sintomas' => 'Cuadro clínico compatible con antecedentes del paciente',
                'diagnostico_cie10' => $at['cie10'],
                'diagnostico_descripcion' => $at['desc'],
                'tratamiento' => $at['trat'],
                'receta_medica' => $at['receta'],
                'signos_vitales' => json_encode($at['signos']),
                'fecha_atencion' => $fechaHoy,
                'fecha_creacion' => $now,
            ]);
        }

        // =========================================================================
        // 7. 5 ESTUDIOS DE LABORATORIO
        // =========================================================================
        $labsData = [
            ['cod' => 'LAB-1001', 'nom' => 'Hemograma Completo Automatizado', 'tipo' => 'HEMATOLOGIA', 'est' => 'COMPLETADO', 'diag' => 'Leucocitos y eritrocitos dentro de rangos normales de referencia.'],
            ['cod' => 'LAB-1002', 'nom' => 'Perfil Lipídico y Glucemia Basal', 'tipo' => 'BIOQUIMICA',   'est' => 'COMPLETADO', 'diag' => 'Colesterol total levemente elevado (210 mg/dL). Glucosa 88 mg/dL.'],
            ['cod' => 'LAB-1003', 'nom' => 'Electrocardiograma Estándar 12D',  'tipo' => 'CARDIOLOGIA',  'est' => 'COMPLETADO', 'diag' => 'Ritmo sinusal regular sin signos agudos de isquemia.'],
            ['cod' => 'LAB-1004', 'nom' => 'Ecografía Abdominal Completa',     'tipo' => 'IMAGENOLOGIA', 'est' => 'PENDIENTE',  'diag' => 'Estudio en proceso de informe médico.'],
            ['cod' => 'LAB-1005', 'nom' => 'Radiografía de Tórax PA',         'tipo' => 'IMAGENOLOGIA', 'est' => 'COMPLETADO', 'diag' => 'Campos pulmonares libres de infiltrados activos.'],
        ];

        foreach ($labsData as $idx => $lab) {
            $pId = $pacienteIds[$idx] ?? $pacienteIds[0];
            $mId = $medicoIds[$idx] ?? $medicoIds[0];
            $cId = $citaIds[$idx] ?? $citaIds[0];

            DB::table('laboratorios_estudios')->updateOrInsert(
                ['codigo_estudio' => $lab['cod']],
                [
                    'id_paciente' => $pId,
                    'id_medico_solicitante' => $mId,
                    'id_cita' => $cId,
                    'nombre_estudio' => $lab['nom'],
                    'tipo_estudio' => $lab['tipo'],
                    'descripcion' => 'Indicado para seguimiento clínico y descarte diagnósticos.',
                    'fecha_solicitud' => $now,
                    'estado' => $lab['est'],
                    'resultado_diagnostico' => $lab['diag'],
                    'publicado_en' => ($lab['est'] === 'COMPLETADO') ? $now : null,
                ]
            );
        }

        // =========================================================================
        // 8. 5 PAGOS REGISTRADOS
        // =========================================================================
        $pagosData = [
            ['monto' => 150.00, 'metodo' => 'EFECTIVO', 'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000101'],
            ['monto' => 120.00, 'metodo' => 'QR',       'canal' => 'PORTAL_PACIENTE', 'comp' => 'BOL-000102'],
            ['monto' => 100.00, 'metodo' => 'TARJETA',  'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000103'],
            ['monto' => 80.00,  'metodo' => 'QR',       'canal' => 'TRANSFERENCIA',   'comp' => 'BOL-000104'],
            ['monto' => 50.00,  'metodo' => 'EFECTIVO', 'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000105'],
        ];

        foreach ($pagosData as $idx => $pago) {
            $cId = $citaIds[$idx] ?? $citaIds[0];
            $pId = $pacienteIds[$idx] ?? $pacienteIds[0];
            $codPago = 'PAG-2026-' . str_pad($idx + 1, 4, '0', STR_PAD_LEFT);

            DB::table('pagos')->updateOrInsert(
                ['codigo_pago' => $codPago],
                [
                    'id_cita' => $cId,
                    'id_paciente' => $pId,
                    'monto' => $pago['monto'],
                    'moneda' => 'BOB',
                    'metodo_pago' => $pago['metodo'],
                    'estado_pago' => 'PAGADO',
                    'canal_pago' => $pago['canal'],
                    'numero_comprobante' => $pago['comp'],
                    'referencia_transaccion' => 'TXN-' . md5(uniqid()),
                    'id_usuario_cajero' => 2, // recepcionista
                    'fecha_pago' => $now,
                    'fecha_creacion' => $now,
                    'fecha_actualizacion' => $now,
                ]
            );
        }

        // =========================================================================
        // 9. 5 REGISTROS EN BITÁCORA DE AUDITORÍA
        // =========================================================================
        $auditData = [
            ['acc' => 'LOGIN', 'tab' => 'usuarios', 'desc' => 'Inicio de sesión exitoso del administrador'],
            ['acc' => 'INSERT', 'tab' => 'citas', 'desc' => 'Registro de nueva cita con fraccionamiento de 15 min'],
            ['acc' => 'UPDATE', 'tab' => 'citas', 'desc' => 'Confirmación de asistencia en recepción'],
            ['acc' => 'INSERT', 'tab' => 'atenciones_medicas', 'desc' => 'Registro de evolución médica y signos vitales'],
            ['acc' => 'INSERT', 'tab' => 'pagos', 'desc' => 'Cobranza y emisión de comprobante en ventanilla'],
        ];

        foreach ($auditData as $idx => $aud) {
            DB::table('bitacora_auditoria')->insert([
                'id_usuario' => 1,
                'accion' => $aud['acc'],
                'modulo' => 'CLINICA',
                'tabla_afectada' => $aud['tab'],
                'id_registro_afectado' => $idx + 1,
                'descripcion' => $aud['desc'],
                'direccion_ip' => '127.0.0.1',
                'fecha_creacion' => $now,
            ]);
        }
    }
}
