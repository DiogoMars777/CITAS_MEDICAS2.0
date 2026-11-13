<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;

class CancelarCitasImpagasCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'citas:cancelar-impagas';

    /**
     * The console command description.
     */
    protected $description = 'Cancela automáticamente citas médicas no pagadas con 24 horas de antelación para liberar el cupo del médico.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando verificación de citas impagas con vencimiento de 24 horas...');
        $total = Cita::cancelarCitasImpagasVencidas();
        $this->info("Proceso completado: {$total} cita(s) impaga(s) cancelada(s) y cupos liberados.");
    }
}
