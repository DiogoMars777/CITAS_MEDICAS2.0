<?php

namespace App\Services\Citas;

use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TransicionEstadoCitaService
{
    /**
     * Matriz oficial e inmutable de transiciones permitidas
     */
    protected const TRANSICIONES_PERMITIDAS = [
        'PROGRAMADA' => ['CONFIRMADA', 'CANCELADA', 'INASISTENCIA'],
        'CONFIRMADA' => ['ATENDIDA', 'CANCELADA', 'INASISTENCIA'],
    ];

    /**
     * Estados terminales del ciclo de vida de la cita
     */
    public const ESTADOS_TERMINALES = ['ATENDIDA', 'CANCELADA', 'INASISTENCIA'];

    /**
     * Aplica y audita la transición de estado de una cita médica de forma atómica.
     */
    public function transicionar(
        Cita $cita,
        string $nuevoEstado,
        ?Usuario $usuarioResponsable = null,
        ?string $motivo = null
    ): Cita {
        $estadoActual = strtoupper(trim($cita->estado_cita));
        $nuevoEstado = strtoupper(trim($nuevoEstado));

        // 1. Idempotencia: Si ya está en el estado solicitado, no hacer nada
        if ($estadoActual === $nuevoEstado) {
            return $cita;
        }

        // 2. Comprobar si el estado actual es terminal
        if (in_array($estadoActual, self::ESTADOS_TERMINALES, true)) {
            throw new HttpException(422, "Transición no permitida: la cita ya se encuentra en estado terminal '{$estadoActual}'. Una cita {$estadoActual} no puede modificarse.");
        }

        // 3. Comprobar si la transición está permitida en la máquina de estados
        $destinosValidos = self::TRANSICIONES_PERMITIDAS[$estadoActual] ?? [];
        if (!in_array($nuevoEstado, $destinosValidos, true)) {
            throw new HttpException(422, "Transición inválida: no se permite cambiar de '{$estadoActual}' a '{$nuevoEstado}'. Transiciones válidas: " . implode(', ', $destinosValidos));
        }

        // 4. Validación de roles autorizados para la transición
        $this->validarPermisoRol($cita, $nuevoEstado, $usuarioResponsable);

        // 5. Aplicar la transición en transacción atómica
        return DB::transaction(function () use ($cita, $estadoActual, $nuevoEstado, $usuarioResponsable, $motivo) {
            $nowBolivia = Carbon::now('America/La_Paz');

            $citaActual = Cita::where('id_cita', $cita->id_cita)->lockForUpdate()->firstOrFail();
            $citaActual->estado_cita = $nuevoEstado;
            $citaActual->fecha_actualizacion = $nowBolivia;
            $citaActual->save();

            // Si se cancela, actualizar estado en reservas
            if ($nuevoEstado === 'CANCELADA') {
                DB::table('reservas')
                    ->where('id_cita', $citaActual->id_cita)
                    ->update(['estado_reserva' => 'EXPIRADA']);
            }

            // Registrar traza en Bitácora de Auditoría
            try {
                BitacoraAuditoria::registrar(
                    'PKG05_GestionCitasConcurrencia',
                    'citas',
                    $citaActual->id_cita,
                    'TRANSICION_ESTADO',
                    ['estado_cita' => $estadoActual],
                    [
                        'estado_cita' => $nuevoEstado,
                        'motivo'      => $motivo,
                        'codigo_cita' => $citaActual->codigo_cita,
                    ],
                    $usuarioResponsable?->id_usuario ?? 1,
                    request()->ip() ?? '127.0.0.1',
                    request()->userAgent() ?? 'Sistema'
                );
            } catch (\Throwable $e) {
                // Registrar log silencioso sin quebrar la transacción de la cita
                \Illuminate\Support\Facades\Log::warning('No se pudo auditar transición de cita: ' . $e->getMessage());
            }

            return $citaActual;
        });
    }

    /**
     * Valida que el rol del usuario esté facultado para ejecutar la transición solicitada.
     */
    protected function validarPermisoRol(Cita $cita, string $nuevoEstado, ?Usuario $usuario): void
    {
        if (!$usuario) {
            return; // Permite llamadas de sistema/cron interno
        }

        if ($usuario->esAdmin()) {
            return; // Administrador tiene acceso total
        }

        $rol = strtoupper($usuario->rol?->nombre_rol ?? '');

        switch ($nuevoEstado) {
            case 'ATENDIDA':
                // Solo el médico asignado o administrador puede marcar como atendida
                if (!$usuario->esMedico()) {
                    throw new HttpException(403, 'Acceso denegado: solo el personal médico puede registrar consultas y marcar citas como atendidas.');
                }
                $medico = $usuario->medico;
                if (!$medico || (int) $cita->id_medico !== (int) $medico->id_medico) {
                    throw new HttpException(403, 'Acceso denegado: no puede atender citas asignadas a otro colega médico.');
                }
                break;

            case 'CONFIRMADA':
            case 'INASISTENCIA':
                // Exclusivo de Recepción o Administración
                if (!$usuario->esRecepcionista() && !$usuario->esAdmin()) {
                    throw new HttpException(403, "Acceso denegado: solo el personal de Recepción puede registrar estado '{$nuevoEstado}'.");
                }
                break;

            case 'CANCELADA':
                // Si es paciente, solo puede cancelar su propia cita
                if ($usuario->esPaciente()) {
                    $paciente = $usuario->paciente;
                    if (!$paciente || (int) $cita->id_paciente !== (int) $paciente->id_paciente) {
                        throw new HttpException(403, 'Acceso denegado: no tiene autorización para cancelar la cita de otro paciente.');
                    }
                } elseif (!$usuario->esRecepcionista() && !$usuario->esAdmin()) {
                    throw new HttpException(403, 'Acceso denegado: permisos insuficientes para cancelar citas médicas.');
                }
                break;
        }
    }
}

