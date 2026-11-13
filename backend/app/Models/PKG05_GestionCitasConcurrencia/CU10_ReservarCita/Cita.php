<?php

namespace App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita;

use Illuminate\Database\Eloquent\Model;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico;
use App\Models\PKG02_MedicosEspecialidades\CU04_GestionEspecialidades\Especialidad;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;

class Cita extends Model
{
    protected $table = 'citas';
    protected $primaryKey = 'id_cita';

    public $timestamps = true;
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'codigo_cita',
        'id_paciente',
        'id_medico',
        'id_especialidad',
        'fecha_cita',
        'hora_inicio',
        'hora_fin',
        'motivo_consulta',
        'estado_cita',
        'creado_por',
    ];

    protected $casts = [
        'fecha_cita' => 'date:Y-m-d',
    ];

    /**
     * Paciente asociado
     */
    public function paciente()
    {
        return $this->belongsTo(Paciente::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Médico que atiende
     */
    public function medico()
    {
        return $this->belongsTo(Medico::class, 'id_medico', 'id_medico');
    }

    /**
     * Especialidad de la consulta
     */
    public function especialidad()
    {
        return $this->belongsTo(Especialidad::class, 'id_especialidad', 'id_especialidad');
    }

    /**
     * Usuario que registró la cita
     */
    public function creador()
    {
        return $this->belongsTo(Usuario::class, 'creado_por', 'id_usuario');
    }

    /**
     * Atención médica registrada
     */
    public function atencionMedica()
    {
        return $this->hasOne(\App\Models\PKG06_AtencionMedica\CU16_AtenderConsulta\AtencionMedica::class, 'id_cita', 'id_cita');
    }

    /**
     * Órdenes o estudios de laboratorio vinculados
     */
    public function laboratorios()
    {
        return $this->hasMany(\App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta::class, 'id_cita', 'id_cita');
    }

    /**
     * Historial de pagos de la cita
     */
    public function pagos()
    {
        return $this->hasMany(\App\Models\PKG05_GestionCitasConcurrencia\CU23_GestionarPagos\Pago::class, 'id_cita', 'id_cita');
    }

    /**
     * Último pago activo registrado
     */
    public function ultimoPago()
    {
        return $this->hasOne(\App\Models\PKG05_GestionCitasConcurrencia\CU23_GestionarPagos\Pago::class, 'id_cita', 'id_cita')->latest('fecha_pago');
    }

    /**
     * Verifica si la cita médica se encuentra pagada con comprobante confirmado
     */
    public function estaPagada(): bool
    {
        return $this->pagos()->where('estado_pago', 'COMPLETADO')->exists();
    }

    /**
     * Cancela automáticamente las citas médicas sin pago cuyo plazo de 24 horas previas venció.
     * Política Clínica: El paciente debe pagar al menos 1 día antes para asegurar su cupo.
     */
    public static function cancelarCitasImpagasVencidas(): int
    {
        $ahora = \Carbon\Carbon::now('America/La_Paz');
        $fechaLimite = $ahora->copy()->addDay()->toDateString();

        $citasVencidas = self::where('estado_cita', 'PROGRAMADA')
            ->whereDate('fecha_cita', '<=', $fechaLimite)
            ->whereDoesntHave('pagos', function ($q) {
                $q->where('estado_pago', 'COMPLETADO');
            })
            ->get();

        $canceladas = 0;

        foreach ($citasVencidas as $cita) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($cita, $ahora) {
                $cita->estado_cita = 'CANCELADA';
                $cita->save();

                \App\Models\PKG05_GestionCitasConcurrencia\CU12_CancelarCita\CancelacionCita::create([
                    'id_cita'                => $cita->id_cita,
                    'motivo_cancelacion'     => 'Cancelación automática por falta de pago anticipado (plazo límite: 24 horas antes de la cita).',
                    'id_usuario_responsable' => 1,
                    'fecha_cancelacion'      => $ahora,
                ]);
            });
            $canceladas++;
        }

        return $canceladas;
    }
}
