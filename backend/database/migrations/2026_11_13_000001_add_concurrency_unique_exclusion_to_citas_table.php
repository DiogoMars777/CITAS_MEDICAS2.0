<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * FASE 6: Protección de Concurrencia a nivel Base de Datos
     * Evita reservas simultáneas para un mismo médico, fecha y hora en citas activas.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("
                CREATE UNIQUE INDEX IF NOT EXISTS uq_citas_medico_fecha_hora_activa 
                ON citas (id_medico, fecha_cita, hora_inicio) 
                WHERE estado_cita NOT IN ('CANCELADA')
            ");
        } else {
            // Compatibilidad SQLite / MySQL en entornos de pruebas
            try {
                Schema::table('citas', function (Blueprint $table) {
                    $table->unique(['id_medico', 'fecha_cita', 'hora_inicio'], 'uq_citas_medico_fecha_hora_activa');
                });
            } catch (\Throwable $e) {
                // Si el índice ya existe, continuar
            }
        }
    }

    /**
     * Rollback limpio
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("DROP INDEX IF EXISTS uq_citas_medico_fecha_hora_activa");
        } else {
            try {
                Schema::table('citas', function (Blueprint $table) {
                    $table->dropUnique('uq_citas_medico_fecha_hora_activa');
                });
            } catch (\Throwable $e) {
                // Ignorar si no existe
            }
        }
    }
};

