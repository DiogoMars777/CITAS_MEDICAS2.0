<?php

namespace App\Models\PKG01_Seguridad\CU01_Autenticacion;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\PKG01_Seguridad\CU03_GestionUsuarios\Rol;

class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';
    public $timestamps = false;

    protected $fillable = [
        'id_rol',
        'username',
        'email',
        'password_hash',
        'estado',
        'ultimo_login',
        'fecha_creacion',
        'fecha_actualizacion',
    ];

    protected $hidden = [
        'password_hash',
    ];

    /**
     * Get the password for authentication.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Relación con el Rol
     */
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    public function paciente()
    {
        return $this->hasOne(\App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente::class, 'id_usuario', 'id_usuario');
    }

    public function medico()
    {
        return $this->hasOne(\App\Models\PKG02_MedicosEspecialidades\CU05_GestionMedicos\Medico::class, 'id_usuario', 'id_usuario');
    }

    public function esAdmin(): bool
    {
        return strtoupper($this->rol?->nombre_rol ?? '') === 'ADMINISTRADOR';
    }

    public function esRecepcionista(): bool
    {
        return strtoupper($this->rol?->nombre_rol ?? '') === 'RECEPCIONISTA';
    }

    public function esMedico(): bool
    {
        return strtoupper($this->rol?->nombre_rol ?? '') === 'MEDICO';
    }

    public function esPaciente(): bool
    {
        return in_array(strtoupper($this->rol?->nombre_rol ?? ''), ['PACIENTE', 'CLIENTE']);
    }

    public function tieneRol(string ...$roles): bool
    {
        $rolActual = strtoupper($this->rol?->nombre_rol ?? '');
        if ($rolActual === 'ADMINISTRADOR') {
            return true;
        }
        foreach ($roles as $r) {
            if ($rolActual === strtoupper(trim($r))) {
                return true;
            }
        }
        return false;
    }
}
