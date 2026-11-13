<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PoblarSupabaseCompletoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now('America/La_Paz');
        $hoy = $now->toDateString();
        $manana = $now->copy()->addDay()->toDateString();
        $pasado = $now->copy()->addDays(2)->toDateString();
        $hash = password_hash('Password123#', PASSWORD_BCRYPT);

        echo "Iniciando poblacion completa en Supabase...\n";

        // =========================================================================
        // 0. Sincronizar secuencias seriales de PostgreSQL al inicio
        // =========================================================================
        $tablasSecuencias = [
            'usuarios'              => 'id_usuario',
            'roles'                 => 'id_rol',
            'especialidades'        => 'id_especialidad',
            'medicos'               => 'id_medico',
            'pacientes'             => 'id_paciente',
            'turnos_medicos'        => 'id_turno',
            'citas'                 => 'id_cita',
            'reservas'              => 'id_reserva',
            'atenciones_medicas'    => 'id_atencion',
            'historias_clinicas'    => 'id_historia_clinica',
            'contactos_emergencia'  => 'id_contacto',
            'laboratorios_estudios' => 'id_estudio',
            'pagos'                 => 'id_pago',
            'bitacora_auditoria'    => 'id_bitacora',
            'permisos'              => 'id_permiso',
        ];

        foreach ($tablasSecuencias as $tabla => $columna) {
            try {
                $maxVal = DB::table($tabla)->max($columna);
                if ($maxVal) {
                    DB::statement("SELECT setval(pg_get_serial_sequence('{$tabla}', '{$columna}'), {$maxVal}, true)");
                }
            } catch (\Throwable $e) {
                // Continuar si no tiene secuencia
            }
        }

        // =========================================================================
        // 1. USUARIOS BASE Y DOCTORES
        // =========================================================================
        $usuariosDoc = [
            ['user' => 'admin',         'email' => 'admin@clinicavidasalud.com',         'rol' => 1],
            ['user' => 'recepcion',     'email' => 'recepcion@clinicavidasalud.com',     'rol' => 2],
            ['user' => 'medico',        'email' => 'medico@clinicavidasalud.com',        'rol' => 3],
            ['user' => 'dra_elena',     'email' => 'elena.pediatria@clinicavidasalud.com','rol' => 3],
            ['user' => 'dr_torrico',    'email' => 'torrico.cardio@clinicavidasalud.com', 'rol' => 3],
            ['user' => 'dra_vargas',    'email' => 'vargas.gineco@clinicavidasalud.com',  'rol' => 3],
            ['user' => 'dr_morales',    'email' => 'morales.trauma@clinicavidasalud.com', 'rol' => 3],
            ['user' => 'dra_valeria',   'email' => 'valeria.dental@clinicavidasalud.com', 'rol' => 3],
            ['user' => 'paciente',      'email' => 'paciente@clinicavidasalud.com',      'rol' => 4],
        ];

        foreach ($usuariosDoc as $u) {
            $existing = DB::table('usuarios')->where('username', $u['user'])->first();
            if ($existing) {
                DB::table('usuarios')->where('id_usuario', $existing->id_usuario)->update([
                    'id_rol' => $u['rol'],
                    'email' => $u['email'],
                    'password_hash' => $hash,
                    'estado' => 'ACTIVO',
                ]);
            } else {
                DB::table('usuarios')->insert([
                    'id_rol' => $u['rol'],
                    'username' => $u['user'],
                    'email' => $u['email'],
                    'password_hash' => $hash,
                    'estado' => 'ACTIVO',
                    'fecha_creacion' => $now,
                    'fecha_actualizacion' => $now,
                ]);
            }
        }

        $userMap = DB::table('usuarios')->pluck('id_usuario', 'username');

        // =========================================================================
        // 2. 6 MÉDICOS CON SUS ESPECIALIDADES
        // =========================================================================
        $doctoresData = [
            [
                'user' => 'medico',
                'reg'  => 'MP-98432',
                'nom'  => 'Carlos Alberto',
                'ape'  => 'Mendoza Suárez',
                'tel'  => '70012345',
                'esp'  => 1, // Medicina General
            ],
            [
                'user' => 'dra_elena',
                'reg'  => 'MP-10455',
                'nom'  => 'Elena Sofía',
                'ape'  => 'Gutiérrez Rocha',
                'tel'  => '71234567',
                'esp'  => 2, // Pediatría
            ],
            [
                'user' => 'dr_torrico',
                'reg'  => 'MP-10788',
                'nom'  => 'Fernando Andrés',
                'ape'  => 'Torrico Camacho',
                'tel'  => '72345678',
                'esp'  => 5, // Cardiología
            ],
            [
                'user' => 'dra_vargas',
                'reg'  => 'MP-10912',
                'nom'  => 'Andrea Marcela',
                'ape'  => 'Vargas Arancibia',
                'tel'  => '73456789',
                'esp'  => 4, // Ginecología
            ],
            [
                'user' => 'dr_morales',
                'reg'  => 'MP-11044',
                'nom'  => 'Jorge Luis',
                'ape'  => 'Morales Céspedes',
                'tel'  => '74567890',
                'esp'  => 7, // Traumatología
            ],
            [
                'user' => 'dra_valeria',
                'reg'  => 'MP-11230',
                'nom'  => 'Valeria Isabel',
                'ape'  => 'Quiroga Daza',
                'tel'  => '75678901',
                'esp'  => 6, // Odontología
            ],
        ];

        $medicoIds = [];
        foreach ($doctoresData as $doc) {
            $uId = $userMap[$doc['user']];
            $med = DB::table('medicos')->where('numero_registro_profesional', $doc['reg'])->first();
            if (!$med) {
                $idMed = DB::table('medicos')->insertGetId([
                    'id_usuario'                  => $uId,
                    'numero_registro_profesional' => $doc['reg'],
                    'nombres'                     => $doc['nom'],
                    'apellidos'                   => $doc['ape'],
                    'telefono'                    => $doc['tel'],
                    'email'                       => "{$doc['user']}@clinicavidasalud.com",
                    'estado'                      => 'ACTIVO',
                    'fecha_ingreso'               => '2023-03-01',
                ], 'id_medico');
            } else {
                $idMed = $med->id_medico;
            }
            $medicoIds[$doc['user']] = $idMed;

            // Vincular especialidad
            DB::table('medico_especialidades')->updateOrInsert(
                ['id_medico' => $idMed, 'id_especialidad' => $doc['esp']],
                ['es_principal' => true]
            );

            // Turno de Lunes a Sábado (días 1 al 6), de 08:00 a 13:00 con slots de 15 min
            for ($d = 1; $d <= 6; $d++) {
                DB::table('turnos_medicos')->updateOrInsert(
                    ['id_medico' => $idMed, 'dia_semana' => $d, 'hora_inicio' => '08:00:00'],
                    [
                        'hora_fin'            => '13:00:00',
                        'duracion_bloque_min' => 15,
                        'estado'              => 'ACTIVO',
                    ]
                );
            }
        }

        echo "Medicos y turnos configurados con exito.\n";

        // =========================================================================
        // 3. 12 PACIENTES CON HISTORIA CLÍNICA Y CONTACTOS DE EMERGENCIA
        // =========================================================================
        $pacientesData = [
            ['ci' => '87654321', 'nom' => 'Juan Pablo',    'ape' => 'Pérez Gómez',        'sex' => 'MASCULINO', 'fec' => '1990-05-15', 'sangre' => 'O+',  'tel' => '75598765', 'dir' => 'Av. Las Américas #450', 'user' => 4],
            ['ci' => '65432109', 'nom' => 'Andrea Sofía',   'ape' => 'Morales Paz',        'sex' => 'FEMENINO',  'fec' => '1995-11-20', 'sangre' => 'A+',  'tel' => '76612345', 'dir' => 'Calle Beni #220', 'user' => null],
            ['ci' => '43210987', 'nom' => 'Roberto Carlos', 'ape' => 'Fernández Daza',     'sex' => 'MASCULINO', 'fec' => '1982-03-08', 'sangre' => 'B+',  'tel' => '77723456', 'dir' => 'Av. Heroínas #890', 'user' => null],
            ['ci' => '32109876', 'nom' => 'Lucía Patricia', 'ape' => 'Salinas Morales',    'sex' => 'FEMENINO',  'fec' => '2001-07-25', 'sangre' => 'O+',  'tel' => '78834567', 'dir' => 'Calle Sucre #105', 'user' => null],
            ['ci' => '21098765', 'nom' => 'Gonzalo Javier', 'ape' => 'Chávez Terrazas',    'sex' => 'MASCULINO', 'fec' => '1968-12-30', 'sangre' => 'AB+', 'tel' => '79945678', 'dir' => 'Av. Ayacucho #340', 'user' => null],
            ['ci' => '10987654', 'nom' => 'Mariana René',   'ape' => 'Torrico Salvatierra','sex' => 'FEMENINO',  'fec' => '1998-09-14', 'sangre' => 'O+',  'tel' => '70056789', 'dir' => 'Av. Salamanca #612', 'user' => null],
            ['ci' => '98765430', 'nom' => 'Mateo Nicolás',  'ape' => 'Rojas Claros',       'sex' => 'MASCULINO', 'fec' => '2016-04-10', 'sangre' => 'A+',  'tel' => '71167890', 'dir' => 'Calle Jordán #780', 'user' => null],
            ['ci' => '87654310', 'nom' => 'Camila Victoria','ape' => 'Flores Villarroel',  'sex' => 'FEMENINO',  'fec' => '2018-08-22', 'sangre' => 'O+',  'tel' => '72278901', 'dir' => 'Calle Calama #445', 'user' => null],
            ['ci' => '76543201', 'nom' => 'Hugo Marcelo',   'ape' => 'Montaño Balderrama', 'sex' => 'MASCULINO', 'fec' => '1975-01-18', 'sangre' => 'B+',  'tel' => '73389012', 'dir' => 'Av. Blanco Galindo km 3', 'user' => null],
            ['ci' => '65432190', 'nom' => 'Beatriz Elena',  'ape' => 'Vargas Zambrana',    'sex' => 'FEMENINO',  'fec' => '1959-06-05', 'sangre' => 'O-',  'tel' => '74490123', 'dir' => 'Calle España #512', 'user' => null],
            ['ci' => '54321089', 'nom' => 'Diego Armando',  'ape' => 'Soliz Arispe',       'sex' => 'MASCULINO', 'fec' => '1993-10-12', 'sangre' => 'A+',  'tel' => '75501234', 'dir' => 'Av. América Este #900', 'user' => null],
            ['ci' => '43210978', 'nom' => 'Silvia Carola',  'ape' => 'Camacho Mérida',     'sex' => 'FEMENINO',  'fec' => '1987-02-28', 'sangre' => 'AB+', 'tel' => '76612349', 'dir' => 'Calle Mayor Rocha #310', 'user' => null],
        ];

        $pacientesList = [];
        foreach ($pacientesData as $p) {
            $pac = DB::table('pacientes')->where('ci', $p['ci'])->first();
            if (!$pac) {
                $idPac = DB::table('pacientes')->insertGetId([
                    'id_usuario'       => $p['user'],
                    'ci'               => $p['ci'],
                    'nombres'          => $p['nom'],
                    'apellidos'        => $p['ape'],
                    'fecha_nacimiento' => $p['fec'],
                    'sexo'             => $p['sex'],
                    'telefono'         => $p['tel'],
                    'email'            => strtolower(str_replace(' ', '', $p['nom'])) . '@gmail.com',
                    'direccion'        => $p['dir'],
                    'primera_visita'   => false,
                    'estado'           => 'ACTIVO',
                    'fecha_creacion'   => $now,
                ], 'id_paciente');
            } else {
                $idPac = $pac->id_paciente;
            }
            $pacientesList[] = $idPac;

            // Historia Clínica
            DB::table('historias_clinicas')->updateOrInsert(
                ['id_paciente' => $idPac],
                [
                    'numero_expediente'        => 'EXP-' . str_pad($idPac, 6, '0', STR_PAD_LEFT),
                    'tipo_sangre'              => $p['sangre'],
                    'alergias_medicamentos'    => 'Penicilina, Sulfas (si aplica)',
                    'enfermedades_hereditarias'=> 'Hipertensión arterial familiar',
                    'antecedentes_patologicos' => 'Sin antecedentes crónicos descompensados',
                    'antecedentes_quirurgicos' => 'Apendicectomía previa (si aplica)',
                    'fecha_apertura'           => $now,
                ]
            );

            // Contacto de emergencia
            $contactoExiste = DB::table('contactos_emergencia')->where('id_paciente', $idPac)->first();
            if (!$contactoExiste) {
                DB::table('contactos_emergencia')->insert([
                    'id_paciente'     => $idPac,
                    'nombre_completo' => 'Familiar de ' . $p['nom'],
                    'parentesco'      => ($p['sex'] === 'MASCULINO') ? 'Esposa' : 'Esposo',
                    'telefono'        => '79' . rand(100000, 999999),
                    'direccion'       => $p['dir'],
                ]);
            }
        }

        echo "Pacientes e historias clinicas registradas.\n";

        // =========================================================================
        // 4. GENERAR 32 CITAS MÉDICAS CON HORARIOS EXACTOS PARA HOY Y MAÑANA
        // =========================================================================
        $citasConfig = [
            // --- CITAS DE HOY PARA DR. CARLOS MENDOZA (Medicina General - esp 1) ---
            ['med' => 'medico',     'esp' => 1, 'pac' => 0, 'fecha' => $hoy, 'hi' => '08:00:00', 'hf' => '08:15:00', 'est' => 'ATENDIDA',   'mot' => 'Control de presión arterial y fatiga matutina'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 1, 'fecha' => $hoy, 'hi' => '08:15:00', 'hf' => '08:30:00', 'est' => 'ATENDIDA',   'mot' => 'Dolor de garganta y fiebre de 38 grados'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 2, 'fecha' => $hoy, 'hi' => '08:30:00', 'hf' => '08:45:00', 'est' => 'CONFIRMADA', 'mot' => 'Revisión general y solicitud de perfil lipídico'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 3, 'fecha' => $hoy, 'hi' => '08:45:00', 'hf' => '09:00:00', 'est' => 'PROGRAMADA', 'mot' => 'Malestar estomacal recurrente y acidez'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 4, 'fecha' => $hoy, 'hi' => '09:00:00', 'hf' => '09:15:00', 'est' => 'PROGRAMADA', 'mot' => 'Certificado médico para trámite laboral'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 5, 'fecha' => $hoy, 'hi' => '09:15:00', 'hf' => '09:30:00', 'est' => 'CANCELADA',  'mot' => 'Paciente canceló por viaje imprevisto'],

            // --- CITAS DE HOY PARA DRA. ELENA GUTIÉRREZ (Pediatría - esp 2) ---
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 6, 'fecha' => $hoy, 'hi' => '08:00:00', 'hf' => '08:15:00', 'est' => 'ATENDIDA',   'mot' => 'Control de niño sano y vacunas de 8 años'],
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 7, 'fecha' => $hoy, 'hi' => '08:15:00', 'hf' => '08:30:00', 'est' => 'CONFIRMADA', 'mot' => 'Tos seca nocturna persistente'],
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 8, 'fecha' => $hoy, 'hi' => '08:30:00', 'hf' => '08:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Cuadro febril de 24 horas y decaimiento'],
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 9, 'fecha' => $hoy, 'hi' => '08:45:00', 'hf' => '09:00:00', 'est' => 'PROGRAMADA', 'mot' => 'Evaluación de peso y talla percentiles'],
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 10,'fecha' => $hoy, 'hi' => '09:00:00', 'hf' => '09:15:00', 'est' => 'CANCELADA',  'mot' => 'Reprogramada para la próxima semana'],

            // --- CITAS DE HOY PARA DR. TORRICO (Cardiología - esp 5) ---
            ['med' => 'dr_torrico', 'esp' => 5, 'pac' => 4, 'fecha' => $hoy, 'hi' => '09:30:00', 'hf' => '09:45:00', 'est' => 'ATENDIDA',   'mot' => 'Palpitaciones y dolor precordial al esfuerzo'],
            ['med' => 'dr_torrico', 'esp' => 5, 'pac' => 2, 'fecha' => $hoy, 'hi' => '09:45:00', 'hf' => '10:00:00', 'est' => 'CONFIRMADA', 'mot' => 'Evaluación preoperatoria cardiológica'],
            ['med' => 'dr_torrico', 'esp' => 5, 'pac' => 0, 'fecha' => $hoy, 'hi' => '10:00:00', 'hf' => '10:15:00', 'est' => 'PROGRAMADA', 'mot' => 'Control de tratamiento hipertensivo'],
            ['med' => 'dr_torrico', 'esp' => 5, 'pac' => 8, 'fecha' => $hoy, 'hi' => '10:15:00', 'hf' => '10:30:00', 'est' => 'PROGRAMADA', 'mot' => 'Chequeo cardíaco preventivo'],

            // --- CITAS DE HOY PARA DRA. VARGAS (Ginecología - esp 4) ---
            ['med' => 'dra_vargas', 'esp' => 4, 'pac' => 1, 'fecha' => $hoy, 'hi' => '10:00:00', 'hf' => '10:15:00', 'est' => 'ATENDIDA',   'mot' => 'Control prenatal primer trimestre eco obstétrica'],
            ['med' => 'dra_vargas', 'esp' => 4, 'pac' => 3, 'fecha' => $hoy, 'hi' => '10:15:00', 'hf' => '10:30:00', 'est' => 'CONFIRMADA', 'mot' => 'Papanicolaou y revisión ginecológica anual'],
            ['med' => 'dra_vargas', 'esp' => 4, 'pac' => 5, 'fecha' => $hoy, 'hi' => '10:30:00', 'hf' => '10:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Dolor pélvico intermenstrual'],
            ['med' => 'dra_vargas', 'esp' => 4, 'pac' => 11,'fecha' => $hoy, 'hi' => '10:45:00', 'hf' => '11:00:00', 'est' => 'PROGRAMADA', 'mot' => 'Asesoría anticonceptiva'],

            // --- CITAS DE HOY PARA DR. MORALES (Traumatología - esp 7) ---
            ['med' => 'dr_morales', 'esp' => 7, 'pac' => 2, 'fecha' => $hoy, 'hi' => '10:00:00', 'hf' => '10:15:00', 'est' => 'ATENDIDA',   'mot' => 'Esguince de tobillo derecho jugando fútbol'],
            ['med' => 'dr_morales', 'esp' => 7, 'pac' => 4, 'fecha' => $hoy, 'hi' => '10:15:00', 'hf' => '10:30:00', 'est' => 'CONFIRMADA', 'mot' => 'Lumbago agudo e irradiación ciática'],
            ['med' => 'dr_morales', 'esp' => 7, 'pac' => 8, 'fecha' => $hoy, 'hi' => '10:30:00', 'hf' => '10:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Dolor en hombro derecho manguito rotador'],
            ['med' => 'dr_morales', 'esp' => 7, 'pac' => 10,'fecha' => $hoy, 'hi' => '10:45:00', 'hf' => '11:00:00', 'est' => 'PROGRAMADA', 'mot' => 'Control posfractura de muñeca'],

            // --- CITAS DE HOY PARA DRA. VALERIA QUIROGA (Odontología - esp 6) ---
            ['med' => 'dra_valeria','esp' => 6, 'pac' => 3, 'fecha' => $hoy, 'hi' => '11:00:00', 'hf' => '11:15:00', 'est' => 'ATENDIDA',   'mot' => 'Limpieza dental y remoción de sarro'],
            ['med' => 'dra_valeria','esp' => 6, 'pac' => 5, 'fecha' => $hoy, 'hi' => '11:15:00', 'hf' => '11:30:00', 'est' => 'CONFIRMADA', 'mot' => 'Dolor agudo en molar inferior izquierdo'],
            ['med' => 'dra_valeria','esp' => 6, 'pac' => 7, 'fecha' => $hoy, 'hi' => '11:30:00', 'hf' => '11:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Evaluación de caries y obturación'],

            // --- CITAS PARA MAÑANA (SÁBADO) Y DÍAS CERCANOS ---
            ['med' => 'medico',     'esp' => 1, 'pac' => 7, 'fecha' => $manana, 'hi' => '08:30:00', 'hf' => '08:45:00', 'est' => 'CONFIRMADA', 'mot' => 'Control posoperatorio ambulatorio'],
            ['med' => 'medico',     'esp' => 1, 'pac' => 9, 'fecha' => $manana, 'hi' => '08:45:00', 'hf' => '09:00:00', 'est' => 'PROGRAMADA', 'mot' => 'Evaluación médica ocupacional'],
            ['med' => 'dra_elena',  'esp' => 2, 'pac' => 6, 'fecha' => $manana, 'hi' => '09:00:00', 'hf' => '09:15:00', 'est' => 'CONFIRMADA', 'mot' => 'Revisión de resultados de coproparasitológico'],
            ['med' => 'dr_torrico', 'esp' => 5, 'pac' => 0, 'fecha' => $manana, 'hi' => '09:30:00', 'hf' => '09:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Prueba de esfuerzo en banda ergométrica'],
            ['med' => 'dra_vargas', 'esp' => 4, 'pac' => 1, 'fecha' => $pasado, 'hi' => '10:00:00', 'hf' => '10:15:00', 'est' => 'PROGRAMADA', 'mot' => 'Monitoreo ecográfico fetal'],
            ['med' => 'dr_morales', 'esp' => 7, 'pac' => 2, 'fecha' => $pasado, 'hi' => '10:30:00', 'hf' => '10:45:00', 'est' => 'PROGRAMADA', 'mot' => 'Retiro de yeso y derivación a fisioterapia'],
        ];

        $citasCreadas = [];
        $contadorCita = 1;

        foreach ($citasConfig as $c) {
            $idMed = $medicoIds[$c['med']];
            $idPac = $pacientesList[$c['pac']];
            $codCita = 'CIT-2026-' . str_pad($contadorCita++, 4, '0', STR_PAD_LEFT);

            // Verificar si ya existe cita para ese médico, fecha y hora
            $citaExistente = DB::table('citas')
                ->where('id_medico', $idMed)
                ->where('fecha_cita', $c['fecha'])
                ->where('hora_inicio', $c['hi'])
                ->first();

            if (!$citaExistente) {
                $idCita = DB::table('citas')->insertGetId([
                    'codigo_cita'     => $codCita,
                    'id_paciente'     => $idPac,
                    'id_medico'       => $idMed,
                    'id_especialidad' => $c['esp'],
                    'fecha_cita'      => $c['fecha'],
                    'hora_inicio'     => $c['hi'],
                    'hora_fin'        => $c['hf'],
                    'motivo_consulta' => $c['mot'],
                    'estado_cita'     => $c['est'],
                    'creado_por'      => 2, // Recepcionista
                    'fecha_creacion'  => $now,
                ], 'id_cita');
            } else {
                $idCita = $citaExistente->id_cita;
            }

            $citasCreadas[] = [
                'id_cita'     => $idCita,
                'codigo_cita' => $codCita,
                'id_paciente' => $idPac,
                'id_medico'   => $idMed,
                'estado'      => $c['est'],
                'motivo'      => $c['mot'],
                'fecha'       => $c['fecha'],
            ];

            // 5. Vincular Reserva
            $reservaExiste = DB::table('reservas')->where('id_cita', $idCita)->first();
            if (!$reservaExiste) {
                DB::table('reservas')->insert([
                    'id_cita'          => $idCita,
                    'id_paciente'      => $idPac,
                    'token_reserva'    => 'RES-' . strtoupper(substr(md5($idCita . microtime()), 0, 8)),
                    'fecha_expiracion' => Carbon::parse($c['fecha'] . ' ' . $c['hi'])->subHours(2),
                    'estado_reserva'   => ($c['est'] === 'CANCELADA') ? 'CANCELADA' : 'CONFIRMADA',
                ]);
            }
        }

        echo "Citas y reservas generadas con exito (Total configuradas: " . count($citasCreadas) . ").\n";

        // =========================================================================
        // 5. PAGOS PARA CITAS CONFIRMADAS Y ATENDIDAS
        // =========================================================================
        $metodos = ['EFECTIVO', 'QR', 'TARJETA'];
        $canales = ['VENTANILLA_CAJA', 'PORTAL_PACIENTE', 'VENTANILLA_CAJA'];
        $montos = [120.00, 150.00, 180.00, 200.00];

        $pagoIdx = 1;
        foreach ($citasCreadas as $idx => $c) {
            if (in_array($c['estado'], ['CONFIRMADA', 'ATENDIDA'])) {
                $codPago = 'PAG-2026-' . str_pad($pagoIdx, 4, '0', STR_PAD_LEFT);
                $comp = 'BOL-00' . str_pad($pagoIdx, 4, '0', STR_PAD_LEFT);
                $monto = $montos[$idx % count($montos)];
                $metodo = $metodos[$idx % count($metodos)];
                $canal = $canales[$idx % count($canales)];

                DB::table('pagos')->updateOrInsert(
                    ['id_cita' => $c['id_cita']],
                    [
                        'codigo_pago'            => $codPago,
                        'id_paciente'            => $c['id_paciente'],
                        'monto'                  => $monto,
                        'moneda'                 => 'BOB',
                        'metodo_pago'            => $metodo,
                        'estado_pago'            => 'COMPLETADO',
                        'canal_pago'             => $canal,
                        'numero_comprobante'     => $comp,
                        'referencia_transaccion' => 'TXN-' . strtoupper(substr(md5(uniqid()), 0, 10)),
                        'detalles_pago'          => json_encode(['autorizacion' => 'AUT-' . rand(100000, 999999)]),
                        'politica_reembolso'     => 'ESTANDAR',
                        'id_usuario_cajero'      => 2,
                        'fecha_pago'             => $now,
                        'fecha_creacion'         => $now,
                        'fecha_actualizacion'    => $now,
                    ]
                );
                $pagoIdx++;
            }
        }

        echo "Pagos registrados para citas confirmadas y atendidas.\n";

        // =========================================================================
        // 6. ATENCIONES MÉDICAS REALES PARA CITAS ATENDIDAS
        // =========================================================================
        $diagnosticos = [
            ['cie' => 'I10',   'desc' => 'Hipertensión esencial (primaria)',                         'trat' => 'Enalapril 10mg cada 12h. Control de presión diario.', 'receta' => '1. Enalapril 10mg tab #30.\n2. Aspirina 100mg #30.', 'pa' => '135/85', 'fc' => 74, 'temp' => 36.5, 'spo2' => 97, 'peso' => 76.5, 'talla' => 170],
            ['cie' => 'J00',   'desc' => 'Rinofaringitis aguda (resfriado común)',                   'trat' => 'Paracetamol 500mg c/8h por 3 días. Hidratación.', 'receta' => '1. Paracetamol 500mg tab #15.\n2. Gotas salinas nasales.', 'pa' => '115/75', 'fc' => 82, 'temp' => 37.8, 'spo2' => 98, 'peso' => 62.0, 'talla' => 158],
            ['cie' => 'Z00.1', 'desc' => 'Control de salud de rutina del niño',                      'trat' => 'Alimentación balanceada. Suplementación vitamínica.', 'receta' => '1. Multivitamínico jarabe 1 frasco.', 'pa' => '100/65', 'fc' => 88, 'temp' => 36.6, 'spo2' => 99, 'peso' => 26.5, 'talla' => 125],
            ['cie' => 'I49.9', 'desc' => 'Arritmia cardíaca no especificada',                        'trat' => 'Amiodarona 200mg/día según indicación cardiológica.', 'receta' => '1. Amiodarona 200mg #30.\n2. Solicitud de Holter 24h.', 'pa' => '128/82', 'fc' => 94, 'temp' => 36.5, 'spo2' => 96, 'peso' => 81.0, 'talla' => 173],
            ['cie' => 'Z34.0', 'desc' => 'Supervisión de primer embarazo normal',                   'trat' => 'Ácido fólico 5mg + Sulfato ferroso diario.', 'receta' => '1. Ácido Fólico 5mg #60.\n2. Sulfato Ferroso #60.', 'pa' => '110/70', 'fc' => 76, 'temp' => 36.4, 'spo2' => 99, 'peso' => 58.5, 'talla' => 160],
            ['cie' => 'S93.4', 'desc' => 'Esguince y torcedura del tobillo',                        'trat' => 'Inmovilización con férula elástica y frío local.', 'receta' => '1. Ketorolaco 10mg sublingual #10.\n2. Gel analgésico.', 'pa' => '120/80', 'fc' => 70, 'temp' => 36.6, 'spo2' => 98, 'peso' => 74.0, 'talla' => 171],
            ['cie' => 'K02.1', 'desc' => 'Caries de la dentina',                                     'trat' => 'Apertura cavitaria, remoción de caries y obturación.', 'receta' => '1. Ibuprofeno 400mg #10 si hay dolor.', 'pa' => '118/76', 'fc' => 72, 'temp' => 36.5, 'spo2' => 98, 'peso' => 67.0, 'talla' => 165],
        ];

        $atencionIdx = 0;
        foreach ($citasCreadas as $c) {
            if ($c['estado'] === 'ATENDIDA') {
                $diag = $diagnosticos[$atencionIdx % count($diagnosticos)];
                $hist = DB::table('historias_clinicas')->where('id_paciente', $c['id_paciente'])->first();

                $atencionExiste = DB::table('atenciones_medicas')->where('id_cita', $c['id_cita'])->first();
                if (!$atencionExiste) {
                    DB::table('atenciones_medicas')->insert([
                        'id_cita'                 => $c['id_cita'],
                        'id_historia_clinica'     => $hist ? $hist->id_historia_clinica : 1,
                        'id_medico'               => $c['id_medico'],
                        'motivo_consulta'         => $c['motivo'],
                        'sintomas'                => 'Evolución clínica típica según reporte del paciente',
                        'diagnostico_cie10'       => $diag['cie'],
                        'diagnostico_descripcion' => $diag['desc'],
                        'tratamiento'             => $diag['trat'],
                        'receta_medica'           => $diag['receta'],
                        'signos_vitales'          => json_encode([
                            'presion_arterial'    => $diag['pa'],
                            'frecuencia_cardiaca' => $diag['fc'],
                            'temperatura'         => $diag['temp'],
                            'saturacion_oxigeno'  => $diag['spo2'],
                            'peso_kg'             => $diag['peso'],
                            'talla_cm'            => $diag['talla'],
                        ]),
                        'fecha_atencion'          => $c['fecha'] . ' 08:30:00',
                        'fecha_creacion'          => $now,
                    ]);
                }
                $atencionIdx++;
            }
        }

        echo "Atenciones medicas registradas con signos vitales y diagnosticos CIE-10.\n";

        // =========================================================================
        // 7. 6 ESTUDIOS DE LABORATORIO
        // =========================================================================
        $labs = [
            ['cod' => 'LAB-2026-001', 'nom' => 'Hemograma Completo Automatizado', 'tipo' => 'HEMATOLOGIA', 'est' => 'PUBLICADO',  'res' => 'Valores de hematocrito y leucocitos en parámetros normales.'],
            ['cod' => 'LAB-2026-002', 'nom' => 'Perfil Lipídico y Glucemia Basal', 'tipo' => 'BIOQUIMICA',   'est' => 'PUBLICADO',  'res' => 'Colesterol 195 mg/dL, Glucosa 85 mg/dL. Parámetros óptimos.'],
            ['cod' => 'LAB-2026-003', 'nom' => 'Electrocardiograma 12 Derivaciones', 'tipo' => 'CARDIOLOGIA',  'est' => 'PUBLICADO',  'res' => 'Ritmo sinusal regular a 72 lpm, sin signos de isquemia aguda.'],
            ['cod' => 'LAB-2026-004', 'nom' => 'Ecografía Obstétrica Primer Trimestre', 'tipo' => 'IMAGENOLOGIA', 'est' => 'PUBLICADO',  'res' => 'Gestación intrauterina única acorde a edad gestacional.'],
            ['cod' => 'LAB-2026-005', 'nom' => 'Radiografía de Tobillo AP y Lateral', 'tipo' => 'IMAGENOLOGIA', 'est' => 'PUBLICADO',  'res' => 'Sin evidencia de fractura ósea ni luxación articular.'],
            ['cod' => 'LAB-2026-006', 'nom' => 'Urocultivo con Antibiograma',       'tipo' => 'MICROBIOLOGIA','est' => 'PENDIENTE',  'res' => 'Muestra en incubación y lectura en 48 horas.'],
        ];

        foreach ($labs as $idx => $l) {
            $idPac = $pacientesList[$idx % count($pacientesList)];
            $idMed = array_values($medicoIds)[$idx % count($medicoIds)];

            DB::table('laboratorios_estudios')->updateOrInsert(
                ['codigo_estudio' => $l['cod']],
                [
                    'id_paciente'           => $idPac,
                    'id_medico_solicitante' => $idMed,
                    'nombre_estudio'        => $l['nom'],
                    'tipo_estudio'          => $l['tipo'],
                    'descripcion'           => 'Control clínico y seguimiento ambulatorio especializado',
                    'estado'                => $l['est'],
                    'resultado_diagnostico' => $l['res'],
                    'publicado_en'          => ($l['est'] === 'PUBLICADO') ? $now : null,
                    'fecha_solicitud'       => $now,
                ]
            );
        }

        echo "Estudios de laboratorio registrados.\n";

        // =========================================================================
        // 8. Sincronizar secuencias seriales al finalizar
        // =========================================================================
        foreach ($tablasSecuencias as $tabla => $columna) {
            try {
                $maxVal = DB::table($tabla)->max($columna);
                if ($maxVal) {
                    DB::statement("SELECT setval(pg_get_serial_sequence('{$tabla}', '{$columna}'), {$maxVal}, true)");
                }
            } catch (\Throwable $e) {
            }
        }

        echo "Sincronizacion de secuencias completada.\n";
        echo "¡Poblacion completada con exito en Supabase!\n";
    }
}
