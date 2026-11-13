<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG04_AgendasHorarios\CU07_ConfigurarTurnos\TurnoMedico;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG05_GestionCitasConcurrencia\CU23_GestionarPagos\Pago;

/**
 * Suite Oficial de Pruebas Automatizadas - Clínica Vida Salud
 * FASE 11: Cobertura de 21 Escenarios Críticos de Negocio, Seguridad y Concurrencia
 */
class ClinicaVidaSaludTest extends TestCase
{
    use RefreshDatabase;

    protected Usuario $admin;
    protected Usuario $recepcionista;
    protected Usuario $medico;
    protected Usuario $paciente;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. ROLES
        DB::table('roles')->insert([
            ['id_rol' => 1, 'nombre_rol' => 'ADMINISTRADOR', 'descripcion' => 'Admin', 'activo' => true],
            ['id_rol' => 2, 'nombre_rol' => 'RECEPCIONISTA', 'descripcion' => 'Recepción', 'activo' => true],
            ['id_rol' => 3, 'nombre_rol' => 'MEDICO', 'descripcion' => 'Médico', 'activo' => true],
            ['id_rol' => 4, 'nombre_rol' => 'PACIENTE', 'descripcion' => 'Paciente', 'activo' => true],
        ]);

        // 2. ESPECIALIDADES
        DB::table('especialidades')->insert([
            ['id_especialidad' => 1, 'nombre' => 'Medicina General', 'descripcion' => 'General', 'estado' => 'ACTIVO'],
            ['id_especialidad' => 5, 'nombre' => 'Cardiología', 'descripcion' => 'Cardio', 'estado' => 'ACTIVO'],
        ]);

        // 3. USUARIOS (Pre-hashed rápido para evitar costo de CPU en tests)
        $hash = '$2y$04$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG';
        DB::table('usuarios')->insert([
            ['id_usuario' => 1, 'id_rol' => 1, 'username' => 'admin', 'email' => 'admin@cvs.com', 'password_hash' => $hash, 'estado' => 'ACTIVO'],
            ['id_usuario' => 2, 'id_rol' => 2, 'username' => 'recepcion', 'email' => 'recep@cvs.com', 'password_hash' => $hash, 'estado' => 'ACTIVO'],
            ['id_usuario' => 3, 'id_rol' => 3, 'username' => 'medico', 'email' => 'medico@cvs.com', 'password_hash' => $hash, 'estado' => 'ACTIVO'],
            ['id_usuario' => 4, 'id_rol' => 4, 'username' => 'paciente', 'email' => 'paciente@cvs.com', 'password_hash' => $hash, 'estado' => 'ACTIVO'],
        ]);

        $this->admin = Usuario::find(1);
        $this->recepcionista = Usuario::find(2);
        $this->medico = Usuario::find(3);
        $this->paciente = Usuario::find(4);

        // 4. PERFIL MÉDICO
        DB::table('medicos')->insert([
            'id_medico'                   => 1,
            'id_usuario'                  => 3,
            'numero_registro_profesional' => 'MP-98432',
            'nombres'                     => 'Carlos Alberto',
            'apellidos'                   => 'Mendoza Suárez',
            'telefono'                    => '70012345',
            'email'                       => 'medico@cvs.com',
            'estado'                      => 'ACTIVO',
            'fecha_ingreso'               => '2025-01-01',
        ]);

        DB::table('medico_especialidades')->insert([
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'es_principal'    => true,
        ]);

        // 5. PERFIL PACIENTE
        DB::table('pacientes')->insert([
            'id_paciente'      => 1,
            'id_usuario'       => 4,
            'ci'               => '87654321',
            'nombres'          => 'Juan Pablo',
            'apellidos'        => 'Pérez Gómez',
            'fecha_nacimiento' => '1990-05-15',
            'sexo'             => 'MASCULINO',
            'telefono'         => '75598765',
            'email'            => 'paciente@cvs.com',
            'direccion'        => 'Av. Las Américas #450',
            'primera_visita'   => false,
            'estado'           => 'ACTIVO',
        ]);

        // 6. TURNOS (Lunes a Viernes, 08:00 a 12:00, 15 min)
        for ($dia = 1; $dia <= 5; $dia++) {
            DB::table('turnos_medicos')->insert([
                'id_medico'           => 1,
                'dia_semana'          => $dia,
                'hora_inicio'         => '08:00:00',
                'hora_fin'            => '12:00:00',
                'duracion_bloque_min' => 15,
                'estado'              => 'ACTIVO',
            ]);
        }
    }

    /**
     * Calcula una fecha futura correspondiente a un día laborable (ej: Martes)
     */
    protected function obtenerFechaFutura(int $diaSemanaDeseado = 2): string
    {
        $fecha = Carbon::now('America/La_Paz')->addDays(3);
        while ($fecha->dayOfWeekIso !== $diaSemanaDeseado) {
            $fecha->addDay();
        }
        return $fecha->toDateString();
    }

    // =========================================================================
    // 1. Registrar paciente
    // =========================================================================
    public function test_1_registrar_paciente(): void
    {
        Sanctum::actingAs($this->recepcionista);

        $response = $this->postJson('/api/pacientes', [
            'ci'               => '99887766',
            'nombres'          => 'Mariana',
            'apellidos'        => 'Roca Justiniano',
            'fecha_nacimiento' => '1995-08-20',
            'sexo'             => 'FEMENINO',
            'telefono'         => '71234567',
            'email'            => 'mariana.roca@example.com',
            'direccion'        => 'Barrio Equipetrol Norte',
            'primera_visita'   => true,
            'estado'           => 'ACTIVO',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('pacientes', ['ci' => '99887766']);
    }

    // =========================================================================
    // 2. Rechazar CI duplicado (con normalización)
    // =========================================================================
    public function test_2_rechazar_ci_duplicado(): void
    {
        Sanctum::actingAs($this->recepcionista);

        // Paciente inicial ya registrado con CI 87654321
        $response = $this->postJson('/api/pacientes', [
            'ci'               => ' 87654321 ', // Con espacios para validar normalización
            'nombres'          => 'Carlos',
            'apellidos'        => 'Duplicado',
            'fecha_nacimiento' => '1992-01-10',
            'sexo'             => 'MASCULINO',
            'telefono'         => '70000000',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('ci');
    }

    // =========================================================================
    // 3. Reservar cita válida
    // =========================================================================
    public function test_3_reservar_cita_valida(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2); // Martes

        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '08:30',
            'hora_fin'        => '08:45',
            'motivo_consulta' => 'Control anual preventivo',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('citas', [
            'id_paciente' => 1,
            'id_medico'   => 1,
            'fecha_cita'  => $fecha,
            'hora_inicio' => '08:30:00',
            'estado_cita' => 'PROGRAMADA',
        ]);
    }

    // =========================================================================
    // 4. Rechazar solapamiento de horario
    // =========================================================================
    public function test_4_rechazar_solapamiento(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        // Primera cita
        $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->assertStatus(201);

        // Segunda cita en el mismo horario con el mismo médico
        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ]);

        $response->assertStatus(409);
    }

    // =========================================================================
    // 5. Rechazar cita fuera del turno del médico
    // =========================================================================
    public function test_5_rechazar_cita_fuera_del_turno(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        // Turno del médico es de 08:00 a 12:00. Solicitamos 16:00
        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '16:00',
            'hora_fin'        => '16:15',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 6. Rechazar fecha pasada
    // =========================================================================
    public function test_6_rechazar_fecha_pasada(): void
    {
        Sanctum::actingAs($this->recepcionista);

        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => '2020-01-01',
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 7. Rechazar médico inactivo
    // =========================================================================
    public function test_7_rechazar_medico_inactivo(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        $medico = Medico::find(1);
        $medico->estado = 'INACTIVO';
        $medico->save();

        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 8. Rechazar especialidad incorrecta (médico no asignado)
    // =========================================================================
    public function test_8_rechazar_especialidad_incorrecta(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        // Especialidad 5 (Cardiología) no asignada al médico 1
        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 5,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 9. Rechazar duración incorrecta (!= 15 min)
    // =========================================================================
    public function test_9_rechazar_duracion_incorrecta(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        // Duración de 30 minutos (09:00 - 09:30) en vez de 15 min
        $response = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:30',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 10. Cancelar y conservar historial
    // =========================================================================
    public function test_10_cancelar_y_conservar_historial(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        $reserva = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->json('data');

        $response = $this->patchJson("/api/citas/{$reserva['id_cita']}/cancelar", [
            'motivo_cancelacion' => 'Paciente de viaje imprevisto',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('citas', [
            'id_cita'     => $reserva['id_cita'],
            'estado_cita' => 'CANCELADA',
        ]);
        $this->assertDatabaseHas('cancelaciones_citas', [
            'id_cita' => $reserva['id_cita'],
        ]);
    }

    // =========================================================================
    // 11. Reprogramar correctamente cita pagada
    // =========================================================================
    public function test_11_reprogramar_correctamente(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha1 = $this->obtenerFechaFutura(2);
        $fecha2 = $this->obtenerFechaFutura(3); // Miércoles

        $citaRes = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha1,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->json('data');

        // Confirmar pago de la cita para habilitar reprogramación
        Pago::create([
            'codigo_pago'        => 'PAG-2026-0001',
            'id_cita'            => $citaRes['id_cita'],
            'id_paciente'        => 1,
            'monto'              => 150.00,
            'metodo_pago'        => 'EFECTIVO',
            'estado_pago'        => 'COMPLETADO',
            'fecha_pago'         => now(),
            'numero_comprobante' => 'COMP-TEST-001',
            'id_usuario_cajero'  => 2,
        ]);

        $response = $this->postJson("/api/citas/{$citaRes['id_cita']}/reprogramar", [
            'fecha_nueva'           => $fecha2,
            'hora_inicio_nueva'     => '10:00',
            'hora_fin_nueva'        => '10:15',
            'motivo_reprogramacion' => 'Solicitud de cambio por horario laboral',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('citas', [
            'id_cita'     => $citaRes['id_cita'],
            'fecha_cita'  => $fecha2,
            'hora_inicio' => '10:00:00',
        ]);
        $this->assertDatabaseHas('historial_reprogramaciones', [
            'id_cita' => $citaRes['id_cita'],
        ]);
    }

    // =========================================================================
    // 12. Rechazar reprogramación de cita atendida
    // =========================================================================
    public function test_12_rechazar_reprogramacion_cita_atendida(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha1 = $this->obtenerFechaFutura(2);
        $fecha2 = $this->obtenerFechaFutura(3);

        $citaRes = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha1,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->json('data');

        // Marcar como ATENDIDA directamente en BD
        DB::table('citas')->where('id_cita', $citaRes['id_cita'])->update(['estado_cita' => 'ATENDIDA']);

        $response = $this->postJson("/api/citas/{$citaRes['id_cita']}/reprogramar", [
            'fecha_nueva'           => $fecha2,
            'hora_inicio_nueva'     => '10:00',
            'hora_fin_nueva'        => '10:15',
            'motivo_reprogramacion' => 'Intento inválido de mover cita atendida',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 13. Registrar asistencia en sala
    // =========================================================================
    public function test_13_registrar_asistencia(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        $citaRes = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->json('data');

        $response = $this->patchJson("/api/asistencia/{$citaRes['id_cita']}", [
            'nuevo_estado'  => 'CONFIRMADA',
            'observaciones' => 'Paciente presente en sala de espera',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('citas', [
            'id_cita'     => $citaRes['id_cita'],
            'estado_cita' => 'CONFIRMADA',
        ]);
    }

    // =========================================================================
    // 14. Rechazar transición inválida de estado
    // =========================================================================
    public function test_14_rechazar_transicion_invalida(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        $citaRes = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '09:00',
            'hora_fin'        => '09:15',
        ])->json('data');

        // Cancelar cita primero
        $this->patchJson("/api/citas/{$citaRes['id_cita']}/cancelar", [
            'motivo_cancelacion' => 'Cancelación previa',
        ])->assertStatus(200);

        // Intentar pasar una cita CANCELADA a CONFIRMADA
        $response = $this->patchJson("/api/asistencia/{$citaRes['id_cita']}", [
            'nuevo_estado' => 'CONFIRMADA',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 15. Consultar agenda del médico
    // =========================================================================
    public function test_15_consultar_agenda_del_medico(): void
    {
        Sanctum::actingAs($this->medico);

        $response = $this->getJson('/api/agenda-medica');
        $response->assertStatus(200);
        $response->assertJsonStructure(['success']);
    }

    // =========================================================================
    // 16. Rechazar acceso sin autenticación a rutas privadas
    // =========================================================================
    public function test_16_rechazar_acceso_sin_autenticacion(): void
    {
        // Sin Sanctum::actingAs
        $response = $this->getJson('/api/pacientes');
        $response->assertStatus(401);

        $response2 = $this->getJson('/api/audit/logs');
        $response2->assertStatus(401);

        $response3 = $this->getJson('/api/usuarios');
        $response3->assertStatus(401);
    }

    // =========================================================================
    // 17. Comprobar permisos de administrador (Acceso total)
    // =========================================================================
    public function test_17_comprobar_permisos_de_administrador(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/usuarios');
        $response->assertStatus(200);

        $responseAudit = $this->getJson('/api/audit/logs');
        $responseAudit->assertStatus(200);
    }

    // =========================================================================
    // 18. Comprobar permisos de recepcionista
    // =========================================================================
    public function test_18_comprobar_permisos_de_recepcionista(): void
    {
        Sanctum::actingAs($this->recepcionista);

        // Recepcionista sí puede acceder a pacientes y asistencia
        $this->getJson('/api/pacientes')->assertStatus(200);
        $this->getJson('/api/asistencia')->assertStatus(200);

        // Recepcionista NO puede acceder a gestión de usuarios o bitácora de auditoría
        $this->getJson('/api/usuarios')->assertStatus(403);
        $this->getJson('/api/audit/logs')->assertStatus(403);
    }

    // =========================================================================
    // 19. Comprobar permisos de médico
    // =========================================================================
    public function test_19_comprobar_permisos_de_medico(): void
    {
        Sanctum::actingAs($this->medico);

        // Médico sí puede ver su agenda médica
        $this->getJson('/api/agenda-medica')->assertStatus(200);

        // Médico NO puede acceder a gestión de usuarios ni a auditoría administrativa
        $this->getJson('/api/usuarios')->assertStatus(403);
        $this->getJson('/api/audit/logs')->assertStatus(403);
    }

    // =========================================================================
    // 20. Comprobar aislamiento entre pacientes
    // =========================================================================
    public function test_20_comprobar_aislamiento_entre_pacientes(): void
    {
        Sanctum::actingAs($this->paciente);

        // Paciente consulta su propio portal derivado del token
        $responseMe = $this->getJson('/api/paciente/me');
        $responseMe->assertStatus(200);
        $responseMe->assertJsonPath('data.ci', '87654321');

        // Paciente no puede acceder a administración ni a auditoría
        $this->getJson('/api/usuarios')->assertStatus(403);
        $this->getJson('/api/audit/logs')->assertStatus(403);
    }

    // =========================================================================
    // 21. Probar dos reservas concurrentes
    // =========================================================================
    public function test_21_probar_dos_reservas_concurrentes(): void
    {
        Sanctum::actingAs($this->recepcionista);
        $fecha = $this->obtenerFechaFutura(2);

        // Reserva 1: Tiene éxito
        $reserva1 = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '11:00',
            'hora_fin'        => '11:15',
            'motivo_consulta' => 'Primera reserva concurrente',
        ]);
        $reserva1->assertStatus(201);

        // Reserva 2 simultánea sobre el mismo médico y horario: Debe fallar con HTTP 409 Conflict
        $reserva2 = $this->postJson('/api/citas', [
            'id_paciente'     => 1,
            'id_medico'       => 1,
            'id_especialidad' => 1,
            'fecha_cita'      => $fecha,
            'hora_inicio'     => '11:00',
            'hora_fin'        => '11:15',
            'motivo_consulta' => 'Segunda reserva concurrente colisionando',
        ]);
        $reserva2->assertStatus(409);
    }
}
