<?php

namespace App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;
use App\Models\PKG01_Seguridad\CU01_Autenticacion\Usuario;

class Paciente extends Model
{
    protected $table = 'pacientes';
    protected $primaryKey = 'id_paciente';
    
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_usuario',
        'ci',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'telefono',
        'email',
        'direccion',
        'primera_visita',
        'estado',
    ];

    protected $casts = [
        'id_paciente'      => 'integer',
        'id_usuario'       => 'integer',
        'fecha_nacimiento' => 'date',
        'primera_visita'   => 'boolean',
    ];

    /**
     * Normalización de CI antes de persistir
     */
    public function setCiAttribute($value): void
    {
        $this->attributes['ci'] = strtoupper(trim(preg_replace('/\s+/', ' ', (string) $value)));
    }

    /**
     * Cuenta de usuario vinculada
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Contacto de emergencia
     */
    public function contactoEmergencia(): HasOne
    {
        return $this->hasOne(ContactoEmergencia::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Expediente / Historia Clínica base
     */
    public function historiaClinica(): HasOne
    {
        return $this->hasOne(HistoriaClinica::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Atenciones y evoluciones médicas previas
     */
    public function atencionesMedicas(): HasMany
    {
        return $this->hasMany(\App\Models\PKG06_AtencionMedica\CU16_AtenderConsulta\AtencionMedica::class, 'id_historia_clinica', 'id_paciente');
    }

    /**
     * Estudios clínicos de laboratorio
     */
    public function laboratorios(): HasMany
    {
        return $this->hasMany(\App\Models\PKG07_Laboratorios\CU18_VisualizarEstudios\LaboratorioEstudioConsulta::class, 'id_paciente', 'id_paciente');
    }

    /**
     * Nombre completo
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    /**
     * Cálculo de edad actual en años
     */
    public function getEdadAttribute(): ?int
    {
        if (!$this->fecha_nacimiento) return null;
        return Carbon::parse($this->fecha_nacimiento)->age;
    }
}
