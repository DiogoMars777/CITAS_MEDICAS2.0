<?php

namespace App\Services\Citas;

use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG05_GestionCitasConcurrencia\CU11_ReprogramarCita\HistorialReprogramacion;
use App\Models\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CancelacionCita;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Servicio Centralizado de Citas Médicas
 * Implementa las 15 validaciones estrictas de negocio, control de concurrencia y auditoría.
 */
class CitaService
{
    protected DisponibilidadService $disponibilidadService;
    protected TransicionEstadoCitaService $transicionService;
    protected string $timezone = 'America/La_Paz';

    public function __construct(
        DisponibilidadService $disponibilidadService,
        TransicionEstadoCitaService $transicionService
    ) {
        $this->disponibilidadService = $disponibilidadService;
        $this->transicionService = $transicionService;
    }

    /**
     * Reserva una nueva cita médica aplicando las 15 validaciones de negocio.
     */
    public function reservarCita(array $datos, ?Usuario $user = null): Cita
    {
        $idPaciente = (int) ($datos['id_paciente'] ?? 0);
        $idMedico = (int) ($datos['id_medico'] ?? 0);
        $idEspecialidad = (int) ($datos['id_especialidad'] ?? 0);
        $fechaCita = trim($datos['fecha_cita'] ?? '');
        $horaInicio = substr(trim($datos['hora_inicio'] ?? ''), 0, 5);
        $horaFin = !empty($datos['hora_fin'])
            ? substr(trim($datos['hora_fin']), 0, 5)
            : Carbon::parse($horaInicio)->addMinutes(15)->format('H:i');
        $motivoConsulta = isset($datos['motivo_consulta']) ? trim($datos['motivo_consulta']) : null;

        // Validación de longitud de motivo si se envía (opcional)
        if ($motivoConsulta !== null && mb_strlen($motivoConsulta) > 500) {
            throw new HttpException(422, 'El motivo de consulta no puede exceder los 500 caracteres.');
        }

        // 1. Paciente existente y activo
        $paciente = Paciente::where('id_paciente', $idPaciente)->first();
        if (!$paciente || strtoupper($paciente->estado) !== 'ACTIVO') {
            throw new HttpException(422, 'El paciente especificado no existe o se encuentra inactivo.');
        }

        // 2. Médico existente y activo
        $medico = Medico::where('id_medico', $idMedico)->first();
        if (!$medico || strtoupper($medico->estado) !== 'ACTIVO') {
            throw new HttpException(422, 'El médico seleccionado no existe o se encuentra inactivo.');
        }

        // 3. Especialidad activa
        $especialidad = Especialidad::where('id_especialidad', $idEspecialidad)->first();
        if (!$especialidad || strtoupper($especialidad->estado) !== 'ACTIVO') {
            throw new HttpException(422, 'La especialidad médica seleccionada no existe o se encuentra inactiva.');
        }

        // 4. El médico pertenece a la especialidad
        $pertenece = $medico->especialidades()
            ->where('especialidades.id_especialidad', $idEspecialidad)
            ->exists();
        if (!$pertenece) {
            throw new HttpException(422, 'El médico seleccionado no está asignado a la especialidad solicitada.');
        }

        // 6, 9, 10: Validación de formato y duración del slot (15 min) y alineación
        $checkSlot = $this->disponibilidadService->validarIntervaloSlot($horaInicio, $horaFin, 15);
        if (!$checkSlot['valido']) {
            throw new HttpException(422, $checkSlot['error']);
        }

        // 5, 7, 8, 11, 12: Disponibilidad horaria (Fecha no pasada, turno activo, dentro de turno, sin bloqueos ni citas)
        $checkDisp = $this->disponibilidadService->verificarDisponibilidad(
            $idMedico,
            $fechaCita,
            $horaInicio,
            $horaFin
        );
        if (!$checkDisp['disponible']) {
            if ($checkDisp['codigo'] === 'HORARIO_OCUPADO') {
                throw new HttpException(409, $checkDisp['error']);
            }
            throw new HttpException(422, $checkDisp['error']);
        }

        // 13. Propiedad del paciente autenticado
        if ($user && $user->esPaciente()) {
            $pacienteAuth = $user->paciente ?? Paciente::where('id_usuario', $user->id_usuario)->first();
            if (!$pacienteAuth || (int) $pacienteAuth->id_paciente !== $idPaciente) {
                throw new HttpException(403, 'Violación de seguridad: No tiene autorización para reservar citas para otro paciente.');
            }
        }

        // 14. Permiso del usuario
        if ($user && $user->esMedico() && !$user->esAdmin()) {
            throw new HttpException(403, 'Acceso denegado: el personal médico no puede reservar citas desde este módulo.');
        }

        // 15. Control de Concurrencia de Nivel Industrial (Advisory Locks + Lock Pesimista + Unique Constraint)
        try {
            return DB::transaction(function () use (
                $idPaciente, $idMedico, $idEspecialidad, $fechaCita,
                $horaInicio, $horaFin, $motivoConsulta, $user,
                $medico, $paciente
            ) {
                $horaIniFull = $horaInicio . ':00';
                $horaFinFull = $horaFin . ':00';

                // A) Candado consultivo de transacción a nivel de PostgreSQL por médico y fecha
                // Garantiza exclusión mutua atómica entre solicitudes simultáneas al mismo médico y día.
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement(
                        "SELECT pg_advisory_xact_lock(hashtext(?))",
                        ["reserva_agenda_medico_{$idMedico}_{$fechaCita}"]
                    );
                    DB::statement(
                        "SELECT pg_advisory_xact_lock(hashtext(?))",
                        ["reserva_agenda_paciente_{$idPaciente}_{$fechaCita}"]
                    );
                }

                // B) Verificación de conflicto de horario del médico (superposición de intervalos)
                $conflicto = Cita::where('id_medico', $idMedico)
                    ->whereDate('fecha_cita', $fechaCita)
                    ->whereNotIn('estado_cita', ['CANCELADA'])
                    ->where('hora_inicio', '<', $horaFinFull)
                    ->where('hora_fin', '>', $horaIniFull)
                    ->lockForUpdate()
                    ->first();

                if ($conflicto) {
                    throw new HttpException(409, "Conflicto de concurrencia: el horario {$horaInicio} - {$horaFin} acaba de ser reservado por otro usuario (Cita #{$conflicto->codigo_cita}). Por favor seleccione otro cupo libre.");
                }

                // C) Verificación de conflicto de horario del paciente (un paciente no puede tener dos citas superpuestas)
                $conflictoPaciente = Cita::where('id_paciente', $idPaciente)
                    ->whereDate('fecha_cita', $fechaCita)
                    ->whereNotIn('estado_cita', ['CANCELADA'])
                    ->where('hora_inicio', '<', $horaFinFull)
                    ->where('hora_fin', '>', $horaIniFull)
                    ->first();

                if ($conflictoPaciente) {
                    $medConf = $conflictoPaciente->medico ? "Dr(a). {$conflictoPaciente->medico->nombre_completo}" : 'otro profesional';
                    throw new HttpException(409, "Conflicto de horario: El paciente ya cuenta con una cita médica reservada en este mismo horario ({$horaInicio} - {$horaFin}) con {$medConf}.");
                }

                // Generar código único CIT-YYYYMMDD-XXXX
                $fechaNum = Carbon::parse($fechaCita)->format('Ymd');
                do {
                    $randomSuffix = strtoupper(Str::random(4));
                    $codigoCita = "CIT-{$fechaNum}-{$randomSuffix}";
                } while (Cita::where('codigo_cita', $codigoCita)->exists());

                $nowBolivia = Carbon::now($this->timezone);

                $cita = Cita::create([
                    'codigo_cita'     => $codigoCita,
                    'id_paciente'     => $idPaciente,
                    'id_medico'       => $idMedico,
                    'id_especialidad' => $idEspecialidad,
                    'fecha_cita'      => $fechaCita,
                    'hora_inicio'     => $horaIniFull,
                    'hora_fin'        => $horaFinFull,
                    'motivo_consulta' => $motivoConsulta ?? 'Consulta médica',
                    'estado_cita'     => 'PROGRAMADA',
                    'creado_por'      => $user?->id_usuario ?? 1,
                    'fecha_creacion'  => $nowBolivia,
                ]);

                // Crear registro de reserva temporal con vigencia de 1 hora (política clínica de pago)
                $fechaExpira = $nowBolivia->copy()->addMinutes(60);
                DB::table('reservas')->insert([
                    'id_cita'          => $cita->id_cita,
                    'id_paciente'      => $idPaciente,
                    'token_reserva'    => (string) Str::uuid(),
                    'fecha_expiracion' => $fechaExpira,
                    'estado_reserva'   => 'PENDIENTE',
                ]);

                // Notificación de Reserva Exitosa al Paciente (CU19)
                try {
                    $medicoNombre = $medico->nombre_completo;
                    $pacienteNombre = $paciente->nombres;
                    \App\Models\PKG08_DashboardReportes\CU19_Recordatorios\Recordatorio::create([
                        'id_cita'          => $cita->id_cita,
                        'tipo_canal'       => 'WHATSAPP',
                        'fecha_programada' => $nowBolivia,
                        'fecha_envio'      => $nowBolivia,
                        'estado_envio'     => 'ENVIADO',
                        'intentos'         => 1,
                        'mensaje'          => "¡Reserva Exitosa! Estimado(a) {$pacienteNombre}, su cita #{$codigoCita} fue agendada para el {$fechaCita} ({$horaInicio} - {$horaFin}) con el Dr(a). {$medicoNombre}. Dispone de 1 hora (60 min) para realizar el pago y confirmar su consulta.",
                    ]);
                } catch (\Throwable $ne) {
                    Log::warning('Error al generar notificación de reserva: ' . $ne->getMessage());
                }

                // Auditoría
                try {
                    BitacoraAuditoria::registrar(
                        'PKG05_GestionCitasConcurrencia',
                        'citas',
                        $cita->id_cita,
                        'RESERVA_CREADA',
                        null,
                        [
                            'codigo_cita'     => $codigoCita,
                            'id_paciente'     => $idPaciente,
                            'id_medico'       => $idMedico,
                            'id_especialidad' => $idEspecialidad,
                            'fecha_cita'      => $fechaCita,
                            'hora_inicio'     => $horaIniFull,
                            'hora_fin'        => $horaFinFull,
                        ],
                        $user?->id_usuario ?? 1,
                        request()->ip() ?? '127.0.0.1',
                        request()->userAgent() ?? 'Sistema'
                    );
                } catch (\Throwable $ex) {
                    Log::warning('No se pudo auditar creación de cita: ' . $ex->getMessage());
                }

                return $cita;
            });
        } catch (QueryException $e) {
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'uq_citas_medico_fecha_hora_activa')) {
                throw new HttpException(409, "Conflicto de concurrencia: el horario {$horaInicio} - {$horaFin} acaba de ser reservado por otro usuario.");
            }
            throw $e;
        }
    }

    /**
     * Reprograma una cita médica existente respetando las políticas de negocio y pago.
     */
    public function reprogramarCita(int $idCita, array $datos, ?Usuario $user = null): Cita
    {
        $cita = Cita::with(['paciente', 'medico', 'especialidad'])->findOrFail($idCita);

        // 1. Estados terminales: no se puede reprogramar si ya fue atendida o inasistencia
        $estadoActual = strtoupper(trim($cita->estado_cita));
        if (in_array($estadoActual, ['ATENDIDA', 'INASISTENCIA'], true)) {
            throw new HttpException(422, "No se puede reprogramar una cita que se encuentra en estado final '{$estadoActual}'.");
        }
        if ($estadoActual === 'CANCELADA' && !$cita->estaPagada()) {
            throw new HttpException(422, "No se puede reprogramar una cita cancelada que no cuenta con pago confirmado.");
        }

        // 2. Política de Pago: La cita debe estar pagada para permitir reprogramación
        if (!$cita->estaPagada()) {
            throw new HttpException(422, 'Política de la Clínica: Solo se pueden reprogramar citas con pago confirmado.');
        }

        // 3. Propiedad del paciente / permisos
        if ($user && $user->esPaciente()) {
            $pacienteAuth = $user->paciente ?? Paciente::where('id_usuario', $user->id_usuario)->first();
            if (!$pacienteAuth || (int) $cita->id_paciente !== (int) $pacienteAuth->id_paciente) {
                throw new HttpException(403, 'Violación de seguridad: No tiene autorización para reprogramar citas de otro paciente.');
            }
        } elseif ($user && $user->esMedico() && !$user->esAdmin()) {
            throw new HttpException(403, 'Acceso denegado: el personal médico no tiene autorización para reprogramar citas de secretaría.');
        }

        $fechaNueva = trim($datos['fecha_nueva'] ?? '');
        $horaIniNueva = substr(trim($datos['hora_inicio_nueva'] ?? ''), 0, 5);
        $horaFinNueva = !empty($datos['hora_fin_nueva'])
            ? substr(trim($datos['hora_fin_nueva']), 0, 5)
            : Carbon::parse($horaIniNueva)->addMinutes(15)->format('H:i');
        $idMedicoNuevo = !empty($datos['id_medico_nuevo'])
            ? (int) $datos['id_medico_nuevo']
            : (int) $cita->id_medico;
        $motivoReprogramacion = trim($datos['motivo_reprogramacion'] ?? 'Reprogramación solicitada por el usuario');

        // Validar médico nuevo si cambió
        $medicoNuevo = Medico::where('id_medico', $idMedicoNuevo)->where('estado', 'ACTIVO')->first();
        if (!$medicoNuevo) {
            throw new HttpException(422, 'El médico seleccionado no existe o se encuentra inactivo.');
        }

        $pertenece = $medicoNuevo->especialidades()
            ->where('especialidades.id_especialidad', $cita->id_especialidad)
            ->exists();
        if (!$pertenece) {
            throw new HttpException(422, 'El médico no cuenta con la especialidad requerida para esta cita.');
        }

        // Validar intervalo slot nuevo
        $checkSlot = $this->disponibilidadService->validarIntervaloSlot($horaIniNueva, $horaFinNueva, 15);
        if (!$checkSlot['valido']) {
            throw new HttpException(422, $checkSlot['error']);
        }

        // Validar disponibilidad horaria excluyendo la cita actual
        $checkDisp = $this->disponibilidadService->verificarDisponibilidad(
            $idMedicoNuevo,
            $fechaNueva,
            $horaIniNueva,
            $horaFinNueva,
            $cita->id_cita
        );
        if (!$checkDisp['disponible']) {
            if ($checkDisp['codigo'] === 'HORARIO_OCUPADO') {
                throw new HttpException(409, $checkDisp['error']);
            }
            throw new HttpException(422, $checkDisp['error']);
        }

        // Transacción atómica con control de concurrencia industrial
        try {
            return DB::transaction(function () use (
                $cita, $fechaNueva, $horaIniNueva, $horaFinNueva,
                $idMedicoNuevo, $motivoReprogramacion, $user,
                $estadoActual, $medicoNuevo
            ) {
                $horaIniFull = $horaIniNueva . ':00';
                $horaFinFull = $horaFinNueva . ':00';

                // Candados consultivos a nivel de PostgreSQL por médico/fecha y paciente/fecha
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement(
                        "SELECT pg_advisory_xact_lock(hashtext(?))",
                        ["reserva_agenda_medico_{$idMedicoNuevo}_{$fechaNueva}"]
                    );
                    DB::statement(
                        "SELECT pg_advisory_xact_lock(hashtext(?))",
                        ["reserva_agenda_paciente_{$cita->id_paciente}_{$fechaNueva}"]
                    );
                }

                // Verificación pesimista de agenda del médico
                $conflicto = Cita::where('id_medico', $idMedicoNuevo)
                    ->whereDate('fecha_cita', $fechaNueva)
                    ->where('id_cita', '!=', $cita->id_cita)
                    ->whereNotIn('estado_cita', ['CANCELADA'])
                    ->where('hora_inicio', '<', $horaFinFull)
                    ->where('hora_fin', '>', $horaIniFull)
                    ->lockForUpdate()
                    ->first();

                if ($conflicto) {
                    throw new HttpException(409, "Conflicto de concurrencia: El cupo {$horaIniNueva} - {$horaFinNueva} acaba de ser reservado por otro usuario. Por favor elija otro horario.");
                }

                // Verificación de conflicto de agenda del paciente
                $conflictoPaciente = Cita::where('id_paciente', $cita->id_paciente)
                    ->whereDate('fecha_cita', $fechaNueva)
                    ->where('id_cita', '!=', $cita->id_cita)
                    ->whereNotIn('estado_cita', ['CANCELADA'])
                    ->where('hora_inicio', '<', $horaFinFull)
                    ->where('hora_fin', '>', $horaIniFull)
                    ->first();

                if ($conflictoPaciente) {
                    throw new HttpException(409, "Conflicto de agenda: El paciente ya tiene otra cita médica en el horario {$horaIniNueva} - {$horaFinNueva}.");
                }

                // Guardar datos anteriores
                $fechaAnt = Carbon::parse($cita->fecha_cita)->format('Y-m-d');
                $horaIniAnt = $cita->hora_inicio;
                $horaFinAnt = $cita->hora_fin;
                $medicoAntId = $cita->id_medico;

                // Actualizar cita
                $citaActualizada = Cita::where('id_cita', $cita->id_cita)->lockForUpdate()->firstOrFail();
                $citaActualizada->fecha_cita = $fechaNueva;
                $citaActualizada->hora_inicio = $horaIniFull;
                $citaActualizada->hora_fin = $horaFinFull;
                $citaActualizada->id_medico = $idMedicoNuevo;
                // Si la cita estaba cancelada y pagada, se reactiva con su nuevo horario
                if ($estadoActual === 'CANCELADA') {
                    $citaActualizada->estado_cita = 'CONFIRMADA';
                }
                $citaActualizada->fecha_actualizacion = Carbon::now($this->timezone);
                $citaActualizada->save();

                // Registrar en historial_reprogramaciones
                HistorialReprogramacion::create([
                    'id_cita'                => $cita->id_cita,
                    'fecha_anterior'         => $fechaAnt,
                    'hora_inicio_anterior'   => $horaIniAnt,
                    'hora_fin_anterior'      => $horaFinAnt,
                    'id_medico_anterior'     => $medicoAntId,
                    'fecha_nueva'            => $fechaNueva,
                    'hora_inicio_nueva'      => $horaIniFull,
                    'hora_fin_nueva'         => $horaFinFull,
                    'id_medico_nuevo'        => $idMedicoNuevo,
                    'motivo_reprogramacion'  => $motivoReprogramacion,
                    'id_usuario_responsable' => $user?->id_usuario ?? 1,
                ]);

                // Notificación de Reprogramación al Paciente (CU19)
                try {
                    $citaActualizada->load(['paciente', 'medico']);
                    $pacienteNom = $citaActualizada->paciente?->nombres ?? 'Paciente';
                    $medicoNom = $medicoNuevo->nombre_completo;
                    \App\Models\PKG08_DashboardReportes\CU19_Recordatorios\Recordatorio::create([
                        'id_cita'          => $citaActualizada->id_cita,
                        'tipo_canal'       => 'WHATSAPP',
                        'fecha_programada' => Carbon::now($this->timezone),
                        'fecha_envio'      => Carbon::now($this->timezone),
                        'estado_envio'     => 'ENVIADO',
                        'intentos'         => 1,
                        'mensaje'          => "¡Reprogramación Confirmada! Estimado(a) {$pacienteNom}: Su cita #{$citaActualizada->codigo_cita} fue reprogramada con éxito para el {$fechaNueva} ({$horaIniNueva} - {$horaFinNueva}) con el Dr(a). {$medicoNom}.",
                    ]);
                } catch (\Throwable $ne) {
                    Log::warning('Error creando recordatorio de reprogramación: ' . $ne->getMessage());
                }

                // Auditoría
                try {
                    BitacoraAuditoria::registrar(
                        'PKG05_GestionCitasConcurrencia',
                        'citas',
                        $cita->id_cita,
                        'CITA_REPROGRAMADA',
                        [
                            'fecha_cita'  => $fechaAnt,
                            'hora_inicio' => $horaIniAnt,
                            'hora_fin'    => $horaFinAnt,
                            'id_medico'   => $medicoAntId,
                        ],
                        [
                            'fecha_cita'  => $fechaNueva,
                            'hora_inicio' => $horaIniFull,
                            'hora_fin'    => $horaFinFull,
                            'id_medico'   => $idMedicoNuevo,
                            'motivo'      => $motivoReprogramacion,
                        ],
                        $user?->id_usuario ?? 1,
                        request()->ip() ?? '127.0.0.1',
                        request()->userAgent() ?? 'Sistema'
                    );
                } catch (\Throwable $ex) {
                    Log::warning('No se pudo auditar reprogramación de cita: ' . $ex->getMessage());
                }

                return $citaActualizada;
            });
        } catch (QueryException $e) {
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'uq_citas_medico_fecha_hora_activa')) {
                throw new HttpException(409, "Conflicto de concurrencia: el horario {$horaIniNueva} - {$horaFinNueva} acaba de ser reservado por otro usuario.");
            }
            throw $e;
        }
    }

    /**
     * Cancela una cita médica registrando motivo y auditoría.
     */
    public function cancelarCita(int $idCita, string $motivo, ?Usuario $user = null): Cita
    {
        $cita = Cita::findOrFail($idCita);

        $this->transicionService->transicionar($cita, 'CANCELADA', $user, $motivo);

        CancelacionCita::updateOrCreate(
            ['id_cita' => $cita->id_cita],
            [
                'motivo_cancelacion'     => $motivo,
                'id_usuario_responsable' => $user?->id_usuario ?? 1,
                'fecha_cancelacion'      => Carbon::now($this->timezone),
            ]
        );

        return $cita->fresh();
    }
}

