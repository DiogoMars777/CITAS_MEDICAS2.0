<?php

namespace App\Services\Citas;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\PKG04_AgendasHorarios\CU07_ConfigurarTurnos\TurnoMedico;
use App\Models\PKG04_AgendasHorarios\CU08_BloqueosAgenda\BloqueoAgenda;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;

class DisponibilidadService
{
    protected string $timezone = 'America/La_Paz';

    /**
     * Valida que el intervalo tenga la duración exacta del slot (15 min) y esté alineado.
     */
    public function validarIntervaloSlot(string $horaInicio, string $horaFin, int $slotEsperado = 15): array
    {
        $ini = substr($horaInicio, 0, 5);
        $fin = substr($horaFin, 0, 5);

        $partesIni = explode(':', $ini);
        $partesFin = explode(':', $fin);

        if (count($partesIni) !== 2 || count($partesFin) !== 2) {
            return ['valido' => false, 'error' => 'Formato de hora inválido. Se espera HH:mm.'];
        }

        $minIniTotal = ((int) $partesIni[0] * 60) + (int) $partesIni[1];
        $minFinTotal = ((int) $partesFin[0] * 60) + (int) $partesFin[1];

        // 1. Hora final posterior a inicial
        if ($minFinTotal <= $minIniTotal) {
            return ['valido' => false, 'error' => 'La hora final debe ser posterior a la hora inicial.'];
        }

        // 2. Duración igual al slot (15 min)
        $duracion = $minFinTotal - $minIniTotal;
        if ($duracion !== $slotEsperado) {
            return ['valido' => false, 'error' => "La duración de la cita debe ser exactamente de {$slotEsperado} minutos (duración recibida: {$duracion} min)."];
        }

        // 3. Intervalo alineado a bloques de 15 minutos (00, 15, 30, 45)
        if (((int) $partesIni[1] % $slotEsperado) !== 0 || ((int) $partesFin[1] % $slotEsperado) !== 0) {
            return ['valido' => false, 'error' => "El horario debe iniciar y finalizar en un múltiplo de {$slotEsperado} minutos (ej: 08:00, 08:15, 08:30)."];
        }

        return ['valido' => true];
    }

    /**
     * Verifica disponibilidad horaria completa: Turnos, Bloqueos, Citas superpuestas y Fecha.
     */
    public function verificarDisponibilidad(
        int $idMedico,
        string $fecha,
        string $horaInicio,
        string $horaFin,
        ?int $excluirIdCita = null
    ): array {
        $fechaCarbon = Carbon::parse($fecha, $this->timezone)->startOfDay();
        $hoyCarbon = Carbon::now($this->timezone)->startOfDay();

        // 1. Fecha no pasada
        if ($fechaCarbon->lt($hoyCarbon)) {
            return [
                'disponible' => false,
                'codigo'     => 'FECHA_PASADA',
                'error'      => 'No se pueden programar citas en fechas pasadas.',
            ];
        }

        // 2. Si es hoy, hora no pasada
        if ($fechaCarbon->equalTo($hoyCarbon)) {
            $horaActual = Carbon::now($this->timezone)->format('H:i');
            if (substr($horaInicio, 0, 5) <= $horaActual) {
                return [
                    'disponible' => false,
                    'codigo'     => 'HORA_PASADA',
                    'error'      => 'El horario seleccionado ya ha transcurrido en el día de hoy.',
                ];
            }
        }

        // 3. Turno activo para el médico en el día de la semana (1=Lunes .. 7=Domingo)
        $diaSemana = $fechaCarbon->dayOfWeekIso;
        $horaIniNorm = substr($horaInicio, 0, 5);
        $horaFinNorm = substr($horaFin, 0, 5);

        $turno = TurnoMedico::where('id_medico', $idMedico)
            ->where('dia_semana', $diaSemana)
            ->where('estado', 'ACTIVO')
            ->first();

        if (!$turno) {
            return [
                'disponible' => false,
                'codigo'     => 'SIN_TURNO',
                'error'      => 'El médico no tiene turno de atención configurado para el día de la semana solicitado.',
            ];
        }

        // 4. Horario completamente dentro del turno
        $turnoIni = substr($turno->hora_inicio, 0, 5);
        $turnoFin = substr($turno->hora_fin, 0, 5);

        if ($horaIniNorm < $turnoIni || $horaFinNorm > $turnoFin) {
            return [
                'disponible' => false,
                'codigo'     => 'FUERA_DE_TURNO',
                'error'      => "El horario seleccionado ({$horaIniNorm} - {$horaFinNorm}) se encuentra fuera del turno del médico ({$turnoIni} - {$turnoFin}).",
            ];
        }

        // 5. Ausencia de bloqueos de agenda
        $bloqueo = BloqueoAgenda::where('id_medico', $idMedico)
            ->where('fecha_inicio', '<=', $fecha)
            ->where('fecha_fin', '>=', $fecha)
            ->where(function ($q) use ($horaIniNorm, $horaFinNorm) {
                $q->where('todo_el_dia', true)
                  ->orWhere(function ($sub) use ($horaIniNorm, $horaFinNorm) {
                      $sub->where('hora_inicio', '<', $horaFinNorm . ':00')
                          ->where('hora_fin', '>', $horaIniNorm . ':00');
                  });
            })
            ->first();

        if ($bloqueo) {
            return [
                'disponible' => false,
                'codigo'     => 'AGENDA_BLOQUEADA',
                'error'      => "El horario se encuentra bloqueado en la agenda del médico (Motivo: {$bloqueo->motivo}).",
            ];
        }

        // 6. Ausencia de citas superpuestas activas
        $citasQuery = Cita::where('id_medico', $idMedico)
            ->where('fecha_cita', $fecha)
            ->whereNotIn('estado_cita', ['CANCELADA'])
            ->where('hora_inicio', '<', $horaFinNorm . ':00')
            ->where('hora_fin', '>', $horaIniNorm . ':00');

        if ($excluirIdCita) {
            $citasQuery->where('id_cita', '!=', $excluirIdCita);
        }

        $citaExistente = $citasQuery->first();

        if ($citaExistente) {
            return [
                'disponible' => false,
                'codigo'     => 'HORARIO_OCUPADO',
                'error'      => "El médico ya cuenta con una cita médica programada en el horario {$horaIniNorm} - {$horaFinNorm}.",
            ];
        }

        return [
            'disponible' => true,
            'turno'      => $turno,
        ];
    }
}

