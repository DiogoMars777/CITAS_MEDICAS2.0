<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EnsureFiveEverythingSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now('America/La_Paz');
        $hash = password_hash('Password123#', PASSWORD_BCRYPT);

        // 0. Sincronizar secuencias seriales de PostgreSQL
        $seqTables = [
            'usuarios' => 'id_usuario',
            'medicos' => 'id_medico',
            'pacientes' => 'id_paciente',
            'citas' => 'id_cita',
            'atenciones_medicas' => 'id_atencion',
            'laboratorios_estudios' => 'id_estudio',
            'pagos' => 'id_pago',
            'turnos_medicos' => 'id_turno',
            'especialidades' => 'id_especialidad',
            'roles' => 'id_rol',
        ];

        foreach ($seqTables as $t => $pk) {
            try {
                $maxVal = DB::table($t)->max($pk);
                if ($maxVal) {
                    DB::statement("SELECT setval(pg_get_serial_sequence('{$t}', '{$pk}'), {$maxVal}, true)");
                }
            } catch (\Exception $e) {
                // Siguiente tabla
            }
        }

        // 1. USUARIOS Y MÉDICOS ADICIONALES PARA TENER 5 MÉDICOS
        $doctores = [
            ['user' => 'dr_rodriguez', 'reg' => 'MP-10234', 'nom' => 'Carlos Alberto', 'ape' => 'Rodríguez Paredes', 'esp' => 5, 'tel' => '71234567'],
            ['user' => 'dra_mendoza',  'reg' => 'MP-10455', 'nom' => 'Elena Sofía',     'ape' => 'Mendoza Gutiérrez',  'esp' => 2, 'tel' => '72345678'],
            ['user' => 'dr_torrico',  'reg' => 'MP-10788', 'nom' => 'Mario Fernando',  'ape' => 'Torrico Camacho',    'esp' => 1, 'tel' => '73456789'],
            ['user' => 'dra_vargas',   'reg' => 'MP-10912', 'nom' => 'Andrea Marcela',  'ape' => 'Vargas Arancibia',   'esp' => 4, 'tel' => '74567890'],
        ];

        foreach ($doctores as $doc) {
            $uId = DB::table('usuarios')->where('username', $doc['user'])->value('id_usuario');
            if (!$uId) {
                $uId = DB::table('usuarios')->insertGetId([
                    'id_rol' => 3, // Médico
                    'username' => $doc['user'],
                    'email' => "{$doc['user']}@clinicavidasalud.com",
                    'password_hash' => $hash,
                    'estado' => 'ACTIVO',
                    'fecha_creacion' => $now,
                    'fecha_actualizacion' => $now,
                ], 'id_usuario');
            }

            $mId = DB::table('medicos')->where('numero_registro_profesional', $doc['reg'])->value('id_medico');
            if (!$mId) {
                $mId = DB::table('medicos')->insertGetId([
                    'id_usuario' => $uId,
                    'numero_registro_profesional' => $doc['reg'],
                    'nombres' => $doc['nom'],
                    'apellidos' => $doc['ape'],
                    'telefono' => $doc['tel'],
                    'email' => "{$doc['user']}@clinicavidasalud.com",
                    'estado' => 'ACTIVO',
                    'fecha_ingreso' => '2024-01-15',
                ], 'id_medico');

                DB::table('medico_especialidades')->updateOrInsert(
                    ['id_medico' => $mId, 'id_especialidad' => $doc['esp']],
                    ['es_principal' => true]
                );

                // Turno médico activo
                DB::table('turnos_medicos')->insert([
                    'id_medico' => $mId,
                    'dia_semana' => 'LUNES',
                    'hora_inicio' => '08:00:00',
                    'hora_fin' => '12:00:00',
                    'duracion_slot_minutos' => 15,
                    'capacidad_maxima' => 16,
                    'consultorio' => 'Cons-' . (100 + $mId),
                    'activo' => true,
                    'fecha_creacion' => $now,
                ]);
            }
        }

        // 2. COMPLETAR 5 ATENCIONES MÉDICAS
        $atencionesCount = DB::table('atenciones_medicas')->count();
        if ($atencionesCount < 5) {
            $citas = DB::table('citas')->take(5)->get();
            $atencionesData = [
                ['cie10' => 'J00', 'desc' => 'Rinofaringitis aguda (resfriado común)', 'trat' => 'Paracetamol 500mg c/8h por 3 días. Hidratación.', 'receta' => '1. Paracetamol 500mg #20 tab.', 'signos' => ['pa' => '115/75', 'fc' => 80, 'temp' => 37.5, 'spo2' => 98, 'peso' => 65.0, 'talla' => 162]],
                ['cie10' => 'K29.7', 'desc' => 'Gastritis no especificada', 'trat' => 'Omeprazol 20mg en ayunas por 28 días.', 'receta' => '1. Omeprazol 20mg #30 cap.', 'signos' => ['pa' => '120/80', 'fc' => 72, 'temp' => 36.6, 'spo2' => 97, 'peso' => 72.0, 'talla' => 170]],
                ['cie10' => 'M54.5', 'desc' => 'Lumbago no especificado', 'trat' => 'Ibuprofeno 400mg c/8h con comidas.', 'receta' => '1. Ibuprofeno 400mg #15 tab.', 'signos' => ['pa' => '125/82', 'fc' => 68, 'temp' => 36.5, 'spo2' => 96, 'peso' => 80.0, 'talla' => 174]],
                ['cie10' => 'E11.9', 'desc' => 'Diabetes mellitus tipo 2 sin mención de complicación', 'trat' => 'Metformina 850mg con almuerzo. Control glucémico.', 'receta' => '1. Metformina 850mg #60 tab.', 'signos' => ['pa' => '130/85', 'fc' => 76, 'temp' => 36.4, 'spo2' => 97, 'peso' => 84.5, 'talla' => 168]],
            ];

            $hist = DB::table('historias_clinicas')->first();
            $idHist = $hist ? $hist->id_historia_clinica : 1;

            foreach ($atencionesData as $idx => $at) {
                $cita = $citas[$idx + 1] ?? $citas[0];
                DB::table('atenciones_medicas')->insert([
                    'id_cita' => $cita->id_cita,
                    'id_historia_clinica' => $idHist,
                    'id_medico' => $cita->id_medico,
                    'motivo_consulta' => 'Consulta de control y seguimiento ambulatorio',
                    'sintomas' => 'Sintomatología clínica en evolución favorable',
                    'diagnostico_cie10' => $at['cie10'],
                    'diagnostico_descripcion' => $at['desc'],
                    'tratamiento' => $at['trat'],
                    'receta_medica' => $at['receta'],
                    'signos_vitales' => json_encode($at['signos']),
                    'fecha_atencion' => $cita->fecha_cita,
                    'fecha_creacion' => $now,
                ]);
            }
        }

        // 3. COMPLETAR 5 ESTUDIOS DE LABORATORIO
        $labsCount = DB::table('laboratorios_estudios')->count();
        if ($labsCount < 5) {
            $labsExtra = [
                ['cod' => 'LAB-2026-004', 'nom' => 'Ecografía Abdominal Completa', 'tipo' => 'IMAGENOLOGIA', 'est' => 'PENDIENTE', 'diag' => 'Estudio en proceso de informe médico por especialista.'],
                ['cod' => 'LAB-2026-005', 'nom' => 'Radiografía de Tórax PA', 'tipo' => 'IMAGENOLOGIA', 'est' => 'COMPLETADO', 'diag' => 'Campos pulmonares limpios sin consolidaciones ni derrames.'],
            ];

            foreach ($labsExtra as $lab) {
                DB::table('laboratorios_estudios')->updateOrInsert(
                    ['codigo_estudio' => $lab['cod']],
                    [
                        'id_paciente' => 1,
                        'id_medico_solicitante' => 1,
                        'id_cita' => 1,
                        'nombre_estudio' => $lab['nom'],
                        'tipo_estudio' => $lab['tipo'],
                        'descripcion' => 'Estudio complementario de rutina diagnóstica.',
                        'fecha_solicitud' => $now,
                        'estado' => $lab['est'],
                        'resultado_diagnostico' => $lab['diag'],
                        'publicado_en' => ($lab['est'] === 'COMPLETADO') ? $now : null,
                    ]
                );
            }
        }

        // 4. CREAR 5 REGISTROS DE PAGOS
        $pagosCount = DB::table('pagos')->count();
        if ($pagosCount < 5) {
            $pagosSeed = [
                ['monto' => 150.00, 'metodo' => 'EFECTIVO', 'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000101', 'cita' => 1, 'pac' => 1],
                ['monto' => 120.00, 'metodo' => 'QR',       'canal' => 'PORTAL_PACIENTE', 'comp' => 'BOL-000102', 'cita' => 2, 'pac' => 2],
                ['monto' => 100.00, 'metodo' => 'TARJETA',  'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000103', 'cita' => 3, 'pac' => 3],
                ['monto' => 80.00,  'metodo' => 'QR',       'canal' => 'TRANSFERENCIA',   'comp' => 'BOL-000104', 'cita' => 4, 'pac' => 4],
                ['monto' => 50.00,  'metodo' => 'EFECTIVO', 'canal' => 'VENTANILLA_CAJA', 'comp' => 'BOL-000105', 'cita' => 5, 'pac' => 5],
            ];

            foreach ($pagosSeed as $idx => $p) {
                $cod = 'PAG-2026-' . str_pad($idx + 1, 4, '0', STR_PAD_LEFT);
                DB::table('pagos')->updateOrInsert(
                    ['codigo_pago' => $cod],
                    [
                        'id_cita' => $p['cita'],
                        'id_paciente' => $p['pac'],
                        'monto' => $p['monto'],
                        'moneda' => 'BOB',
                        'metodo_pago' => $p['metodo'],
                        'estado_pago' => 'PAGADO',
                        'canal_pago' => $p['canal'],
                        'numero_comprobante' => $p['comp'],
                        'referencia_transaccion' => 'TXN-' . md5(uniqid()),
                        'id_usuario_cajero' => 2, // Recepcionista
                        'fecha_pago' => $now,
                        'fecha_creacion' => $now,
                        'fecha_actualizacion' => $now,
                    ]
                );
            }
        }
    }
}
