<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Agregar columna tipo_disparo a backup_logs si no existe
        if (Schema::hasTable('backup_logs')) {
            Schema::table('backup_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('backup_logs', 'tipo_disparo')) {
                    $table->string('tipo_disparo', 20)->default('MANUAL')->after('tipo_backup');
                }
            });
            // Modificar creado_por a nullable para permitir ejecuciones del sistema (cron/scheduler)
            try {
                DB::statement("ALTER TABLE backup_logs ALTER COLUMN creado_por DROP NOT NULL");
            } catch (\Throwable $e) {
                // Ignore if already nullable or sqlite
            }
        }

        // 2. Crear tabla backup_configuraciones
        if (!Schema::hasTable('backup_configuraciones')) {
            Schema::create('backup_configuraciones', function (Blueprint $table) {
                $table->bigIncrements('id_configuracion');
                $table->boolean('habilitado')->default(true);
                $table->string('frecuencia', 20)->default('DIARIO'); // DIARIO, SEMANAL, MENSUAL
                $table->smallInteger('dia_semana')->default(1); // 1 = Lunes, 7 = Domingo
                $table->smallInteger('dia_mes')->default(1); // 1 a 31
                $table->string('hora_ejecucion', 8)->default('02:00'); // 02:00 AM (UTC-4)
                $table->string('tipo_backup', 30)->default('COMPLETO'); // COMPLETO, SOLO_DATOS, SOLO_ESTRUCTURA
                $table->integer('retencion_dias')->default(30); // 0 = sin límite, 7, 15, 30, 60 días
                $table->integer('limite_archivos')->default(10); // Máximo de archivos en disco
                $table->string('email_notificacion', 150)->nullable()->default('admin@clinicavidasalud.com');
                $table->timestampTz('ultimo_respaldo_at')->nullable();
                $table->timestampTz('proximo_respaldo_at')->nullable();
                $table->string('estado_ultimo_respaldo', 30)->default('NINGUNO'); // NINGUNO, EXITOSO, FALLIDO
                $table->text('mensaje_ultimo_respaldo')->nullable();
                $table->unsignedBigInteger('actualizado_por')->nullable();
                $table->timestampTz('fecha_creacion')->useCurrent();
                $table->timestampTz('fecha_actualizacion')->useCurrent();

                $table->foreign('actualizado_por')
                      ->references('id_usuario')
                      ->on('usuarios')
                      ->onDelete('set null');
            });

            // Insertar configuración inicial por defecto
            $manana = Carbon::now('America/La_Paz')->addDay()->setTime(2, 0, 0);
            DB::table('backup_configuraciones')->insert([
                'habilitado'              => true,
                'frecuencia'              => 'DIARIO',
                'dia_semana'              => 1,
                'dia_mes'                 => 1,
                'hora_ejecucion'          => '02:00',
                'tipo_backup'             => 'COMPLETO',
                'retencion_dias'          => 30,
                'limite_archivos'         => 10,
                'email_notificacion'      => 'admin@clinicavidasalud.com',
                'proximo_respaldo_at'     => $manana,
                'estado_ultimo_respaldo'  => 'NINGUNO',
                'mensaje_ultimo_respaldo' => 'Programación diaria configurada automáticamente para las 02:00 AM.',
                'actualizado_por'         => DB::table('usuarios')->where('id_usuario', 1)->exists() ? 1 : null,
                'fecha_creacion'          => Carbon::now('America/La_Paz'),
                'fecha_actualizacion'     => Carbon::now('America/La_Paz'),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_configuraciones');
        if (Schema::hasTable('backup_logs') && Schema::hasColumn('backup_logs', 'tipo_disparo')) {
            Schema::table('backup_logs', function (Blueprint $table) {
                $table->dropColumn('tipo_disparo');
            });
        }
    }
};

