<?php

namespace App\Services\PKG05_GestionCitasConcurrencia;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\PKG05_GestionCitasConcurrencia\CU23_GestionarPagos\Pago;
use App\Models\PKG05_GestionCitasConcurrencia\CU10_ReservarCita\Cita;
use App\Models\PKG03_PacientesHistorial\CU06_RegistroPaciente\Paciente;
use App\Models\PKG01_Seguridad\CU02_BitacoraAuditoria\BitacoraAuditoria;

class CU23_GestionarPagosService
{
    private string $timezone = 'America/La_Paz';

    /**
     * Aranceles estándar de consulta médica por especialidad en Bolivianos (Bs.)
     */
    private array $tarifasPorEspecialidad = [
        'Medicina General'       => 100.00,
        'Pediatría'              => 120.00,
        'Pediatria'              => 120.00,
        'Geriatría'              => 130.00,
        'Geriatria'              => 130.00,
        'Ginecología'            => 160.00,
        'Ginecologia'            => 160.00,
        'Cardiología'            => 180.00,
        'Cardiologia'            => 180.00,
        'Odontología'            => 150.00,
        'Odontologia'            => 150.00,
        'Traumatología'          => 160.00,
        'Traumatologia'          => 160.00,
        'Oftalmología'           => 140.00,
        'Oftalmologia'           => 140.00,
        'Dermatología'           => 150.00,
        'Dermatologia'           => 150.00,
        'Neurologia Pediatrica'  => 200.00,
        'Neurología Pediátrica'  => 200.00,
    ];

    /**
     * Obtiene la tarifa estándar sugerida según la especialidad
     */
    public function obtenerTarifaEspecialidad(?string $nombreEspecialidad): float
    {
        if (!$nombreEspecialidad) return 120.00;
        foreach ($this->tarifasPorEspecialidad as $esp => $precio) {
            if (mb_stripos($nombreEspecialidad, $esp) !== false || mb_stripos($esp, $nombreEspecialidad) !== false) {
                return $precio;
            }
        }
        return 120.00;
    }

    /**
     * Listado de pagos registrados con filtros avanzados
     */
    public function listarPagos(array $filtros = []): array
    {
        $query = Pago::with(['cita.especialidad', 'cita.medico', 'paciente', 'cajero'])
            ->orderBy('fecha_pago', 'desc');

        if (!empty($filtros['metodo_pago'])) {
            $query->where('metodo_pago', strtoupper($filtros['metodo_pago']));
        }

        if (!empty($filtros['id_paciente'])) {
            $query->where('id_paciente', (int) $filtros['id_paciente']);
        }

        if (!empty($filtros['estado_pago'])) {
            $query->where('estado_pago', strtoupper($filtros['estado_pago']));
        }

        if (!empty($filtros['canal_pago'])) {
            $query->where('canal_pago', strtoupper($filtros['canal_pago']));
        }

        if (!empty($filtros['fecha_desde'])) {
            $query->whereDate('fecha_pago', '>=', $filtros['fecha_desde']);
        }

        if (!empty($filtros['fecha_hasta'])) {
            $query->whereDate('fecha_pago', '<=', $filtros['fecha_hasta']);
        }

        if (!empty($filtros['buscar'])) {
            $term = trim($filtros['buscar']);
            $query->where(function ($q) use ($term) {
                $q->where('codigo_pago', 'ILIKE', "%{$term}%")
                  ->orWhere('numero_comprobante', 'ILIKE', "%{$term}%")
                  ->orWhere('referencia_transaccion', 'ILIKE', "%{$term}%")
                  ->orWhereHas('paciente', function ($qp) use ($term) {
                      $qp->where('ci', 'ILIKE', "%{$term}%")
                         ->orWhere('nombres', 'ILIKE', "%{$term}%")
                         ->orWhere('apellidos', 'ILIKE', "%{$term}%");
                  })
                  ->orWhereHas('cita', function ($qc) use ($term) {
                      $qc->where('codigo_cita', 'ILIKE', "%{$term}%");
                  });
            });
        }

        $pagos = $query->paginate($filtros['per_page'] ?? 15);

        return [
            'data'         => $pagos->items(),
            'total'        => $pagos->total(),
            'current_page' => $pagos->currentPage(),
            'last_page'    => $pagos->lastPage(),
            'per_page'     => $pagos->perPage(),
        ];
    }

    /**
     * Lista citas médicas que aún no han sido cobradas (pendientes de pago)
     */
    public function listarCitasPendientesPago(array $filtros = []): array
    {
        $query = Cita::with(['paciente', 'medico', 'especialidad'])
            ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'EN_SALA'])
            ->whereDoesntHave('pagos', function ($q) {
                $q->where('estado_pago', 'COMPLETADO');
            })
            ->orderBy('fecha_cita', 'asc')
            ->orderBy('hora_inicio', 'asc');

        if (!empty($filtros['fecha'])) {
            $query->whereDate('fecha_cita', $filtros['fecha']);
        }

        if (!empty($filtros['id_paciente'])) {
            $query->where('id_paciente', (int) $filtros['id_paciente']);
        }

        if (!empty($filtros['buscar'])) {
            $term = trim($filtros['buscar']);
            $query->where(function ($q) use ($term) {
                $q->where('codigo_cita', 'ILIKE', "%{$term}%")
                  ->orWhereHas('paciente', function ($qp) use ($term) {
                      $qp->where('ci', 'ILIKE', "%{$term}%")
                         ->orWhere('nombres', 'ILIKE', "%{$term}%")
                         ->orWhere('apellidos', 'ILIKE', "%{$term}%");
                  });
            });
        }

        $citas = $query->take(50)->get()->map(function ($c) {
            $tarifa = $this->obtenerTarifaEspecialidad($c->especialidad?->nombre);
            return [
                'id_cita'          => $c->id_cita,
                'codigo_cita'      => $c->codigo_cita,
                'fecha_cita'       => $c->fecha_cita ? $c->fecha_cita->format('Y-m-d') : null,
                'hora_inicio'      => substr($c->hora_inicio, 0, 5),
                'hora_fin'         => substr($c->hora_fin, 0, 5),
                'estado_cita'      => $c->estado_cita,
                'id_paciente'      => $c->id_paciente,
                'paciente_nombre'  => $c->paciente ? "{$c->paciente->nombres} {$c->paciente->apellidos}" : 'Paciente',
                'paciente_ci'      => $c->paciente?->ci,
                'id_medico'        => $c->id_medico,
                'medico_nombre'    => $c->medico ? "Dr(a). {$c->medico->nombres} {$c->medico->apellidos}" : 'Médico',
                'id_especialidad'  => $c->id_especialidad,
                'especialidad'     => $c->especialidad?->nombre ?? 'Consulta Médica',
                'tarifa_sugerida'  => $tarifa,
                'moneda'           => 'BOB',
            ];
        });

        return $citas->toArray();
    }

    /**
     * Resumen financiero de caja del día para Recepción / Administración
     */
    public function obtenerResumenCaja(?string $fecha = null): array
    {
        $fechaConsulta = $fecha ?? Carbon::now($this->timezone)->format('Y-m-d');

        $pagosHoy = Pago::whereDate('fecha_pago', $fechaConsulta)
            ->where('estado_pago', 'COMPLETADO')
            ->get();

        $totalHoy = (float) $pagosHoy->sum('monto');
        $totalEfectivo = (float) $pagosHoy->where('metodo_pago', 'EFECTIVO')->sum('monto');
        $totalQR = (float) $pagosHoy->where('metodo_pago', 'QR')->sum('monto');
        $totalTransferencia = (float) $pagosHoy->where('metodo_pago', 'TRANSFERENCIA')->sum('monto');
        $totalPayPal = (float) $pagosHoy->where('metodo_pago', 'PAYPAL')->sum('monto');

        $pendientesCount = Cita::whereDate('fecha_cita', $fechaConsulta)
            ->whereIn('estado_cita', ['PROGRAMADA', 'CONFIRMADA', 'EN_SALA'])
            ->whereDoesntHave('pagos', function ($q) {
                $q->where('estado_pago', 'COMPLETADO');
            })->count();

        return [
            'fecha'                   => $fechaConsulta,
            'total_recaudado'         => $totalHoy,
            'total_efectivo'          => $totalEfectivo,
            'total_qr'                => $totalQR,
            'total_transferencia'     => $totalTransferencia,
            'total_paypal'            => $totalPayPal,
            'cantidad_transacciones'  => $pagosHoy->count(),
            'citas_pendientes_cobro'  => $pendientesCount,
            'citas_pagadas_hoy'       => $pagosHoy->count(),
        ];
    }

    /**
     * Consulta el estado de pago de una cita médica específica
     */
    public function obtenerEstadoPagoCita(int $idCita): array
    {
        $cita = Cita::with(['paciente', 'medico', 'especialidad'])->find($idCita);
        if (!$cita) {
            return ['pagada' => false, 'error' => 'Cita no encontrada'];
        }

        $pago = Pago::where('id_cita', $idCita)
            ->orderBy('id_pago', 'desc')
            ->first();

        $tarifa = $this->obtenerTarifaEspecialidad($cita->especialidad?->nombre);

        if (!$pago) {
            return [
                'pagada'            => false,
                'estado_pago'       => 'PENDIENTE',
                'id_cita'           => $cita->id_cita,
                'codigo_cita'       => $cita->codigo_cita,
                'monto_sugerido'    => $tarifa,
                'moneda'            => 'BOB',
                'puede_reprogramar' => true,
                'puede_pagar'       => true,
            ];
        }

        $esPagado = ($pago->estado_pago === 'COMPLETADO');

        return [
            'pagada'                => $esPagado,
            'estado_pago'           => $pago->estado_pago,
            'id_pago'               => $pago->id_pago,
            'codigo_pago'           => $pago->codigo_pago,
            'numero_comprobante'    => $pago->numero_comprobante,
            'monto'                 => (float) $pago->monto,
            'moneda'                => $pago->moneda,
            'metodo_pago'           => $pago->metodo_pago,
            'canal_pago'            => $pago->canal_pago,
            'referencia'            => $pago->referencia_transaccion,
            'fecha_pago'            => $pago->fecha_pago ? $pago->fecha_pago->format('Y-m-d H:i') : null,
            'politica_reembolso'    => $pago->politica_reembolso,
            'puede_reprogramar'     => true, // Con pago confirmado puede reprogramar libremente
            'admite_devolucion'     => false, // Por política clínica institucional
        ];
    }

    /**
     * Registra un pago de cita médica de forma atómica y auditable
     */
    public function registrarPago(array $datos, ?int $idUsuarioCajero = null): array
    {
        return DB::transaction(function () use ($datos, $idUsuarioCajero) {
            $idCita = $datos['id_cita'];
            $cita = Cita::with(['paciente', 'medico', 'especialidad'])->lockForUpdate()->findOrFail($idCita);

            // Validar que la cita no esté cancelada
            if ($cita->estado_cita === 'CANCELADA') {
                return [
                    'success' => false,
                    'error'   => 'No se puede procesar el pago de una cita que ya ha sido cancelada.',
                ];
            }

            // Validar que no exista ya un pago completado
            $pagoExistente = Pago::where('id_cita', $idCita)
                ->where('estado_pago', 'COMPLETADO')
                ->first();

            if ($pagoExistente) {
                return [
                    'success' => false,
                    'error'   => "Esta cita ya cuenta con un pago completado (Comprobante: {$pagoExistente->numero_comprobante}).",
                    'pago'    => $pagoExistente,
                ];
            }

            $monto = isset($datos['monto']) && (float) $datos['monto'] > 0
                ? (float) $datos['monto']
                : $this->obtenerTarifaEspecialidad($cita->especialidad?->nombre);

            $moneda = $datos['moneda'] ?? 'BOB';
            $metodoPago = strtoupper(trim($datos['metodo_pago'])); // EFECTIVO, QR, TRANSFERENCIA, TARJETA, PAYPAL
            $canalPago = strtoupper(trim($datos['canal_pago'] ?? 'RECEPCION')); // RECEPCION, EN_LINEA_PACIENTE, IA_ASISTENTE

            // Generar identificadores únicos
            $fechaHoy = Carbon::now($this->timezone);
            $fechaCompacta = $fechaHoy->format('Ymd');
            
            do {
                $codigoPago = 'PAG-' . $fechaCompacta . '-' . strtoupper(Str::random(4));
            } while (Pago::where('codigo_pago', $codigoPago)->exists());

            do {
                $numCorrelativo = str_pad((string) (Pago::count() + 1), 5, '0', STR_PAD_LEFT);
                $numeroComprobante = 'REC-' . $fechaHoy->format('Y') . '-' . $numCorrelativo;
            } while (Pago::where('numero_comprobante', $numeroComprobante)->exists());

            // Procesar detalles específicos por método de pago
            $referencia = $datos['referencia_transaccion'] ?? null;
            $detallesPago = $datos['detalles_pago'] ?? [];

            if ($metodoPago === 'EFECTIVO') {
                $montoRecibido = (float) ($datos['monto_recibido'] ?? $monto);
                $cambio = max(0, $montoRecibido - $monto);
                $referencia = 'COBRO-CAJA-EFECTIVO';
                $detallesPago['monto_recibido'] = $montoRecibido;
                $detallesPago['cambio_devuelto'] = $cambio;
            } elseif ($metodoPago === 'QR') {
                if (empty($referencia)) {
                    $referencia = 'QR-BNB-' . strtoupper(Str::random(8));
                }
                $detallesPago['tipo_qr'] = 'QR Simple Interbancario Bolivia';
                $detallesPago['banco_receptor'] = 'Banco Unión S.A. / BCP';
            } elseif ($metodoPago === 'PAYPAL') {
                if (empty($referencia)) {
                    $referencia = 'PAYID-' . strtoupper(Str::random(12));
                }
                $detallesPago['pasarela'] = 'PayPal Express Checkout Seguro';
                $detallesPago['moneda_cobro'] = 'USD';
                $detallesPago['equivalente_usd'] = round($monto / 6.96, 2);
                $detallesPago['email_paypal'] = $datos['email_paypal'] ?? ($cita->paciente?->email ?? 'paciente.paypal@demo.com');
            } elseif ($metodoPago === 'TARJETA') {
                if (empty($referencia)) {
                    $authCode = rand(100000, 999999);
                    $referencia = 'AUTH-RE-' . $authCode;
                }
                $detallesPago['marca_tarjeta'] = $datos['detalles_pago']['marca_tarjeta'] ?? ($datos['marca_tarjeta'] ?? 'Visa Débito / Red Enlace');
                $detallesPago['ultimos_digitos'] = $datos['detalles_pago']['ultimos4'] ?? ($datos['ultimos4'] ?? '8821');
                $detallesPago['titular_tarjeta'] = $datos['detalles_pago']['titular'] ?? ($cita->paciente?->nombre_completo ?? 'PACIENTE');
                $detallesPago['banco_emisor'] = $datos['detalles_pago']['banco'] ?? ($datos['banco_emisor'] ?? 'Banco Unión S.A.');
                $detallesPago['codigo_autorizacion'] = $datos['detalles_pago']['codigo_autorizacion'] ?? rand(100000, 999999);
                $detallesPago['tipo_terminal'] = 'POS Virtual Red Enlace Seguro';
            } elseif ($metodoPago === 'TRANSFERENCIA') {
                if (empty($referencia)) {
                    $referencia = 'TRF-' . strtoupper(Str::random(8));
                }
                $detallesPago['banco_origen'] = $datos['detalles_pago']['banco'] ?? 'Banco Unión S.A.';
                $detallesPago['numero_voucher'] = $datos['referencia_transaccion'] ?? $referencia;
                $detallesPago['cuenta_destino'] = 'Banco Unión Cta. Cte. 1-0000492817290 (Clínica Vida Salud S.R.L.)';
            }

            // Crear el registro de Pago
            $pago = Pago::create([
                'codigo_pago'            => $codigoPago,
                'id_cita'                => $idCita,
                'id_paciente'            => $cita->id_paciente,
                'monto'                  => $monto,
                'moneda'                 => $moneda,
                'metodo_pago'            => $metodoPago,
                'estado_pago'            => 'COMPLETADO',
                'canal_pago'             => $canalPago,
                'numero_comprobante'     => $numeroComprobante,
                'referencia_transaccion' => $referencia,
                'detalles_pago'          => $detallesPago,
                'politica_reembolso'     => 'No se aceptan devoluciones monetarias. Cita sujeta a reprogramación.',
                'id_usuario_cajero'      => $idUsuarioCajero,
                'fecha_pago'             => $fechaHoy,
            ]);

            // Actualizar la cita a CONFIRMADA si estaba en PROGRAMADA
            if ($cita->estado_cita === 'PROGRAMADA') {
                $cita->update(['estado_cita' => 'CONFIRMADA']);
            }

            // Si hay reserva temporal asociada, confirmarla
            DB::table('reservas')
                ->where('id_cita', $idCita)
                ->update(['estado_reserva' => 'CONFIRMADA']);

            // Registrar auditoría
            BitacoraAuditoria::registrar(
                'PAGOS',
                'pagos',
                $pago->id_pago,
                'REGISTRO_PAGO_CITA',
                null,
                [
                    'codigo_pago'        => $codigoPago,
                    'numero_comprobante' => $numeroComprobante,
                    'id_cita'            => $idCita,
                    'monto'              => $monto,
                    'metodo_pago'        => $metodoPago,
                    'canal'              => $canalPago,
                ],
                $idUsuarioCajero ?? 1
            );

            // Cargar relaciones para comprobante
            $pago->load(['cita.especialidad', 'cita.medico', 'paciente', 'cajero']);

            return [
                'success'            => true,
                'mensaje'            => "Pago registrado exitosamente con comprobante {$numeroComprobante}.",
                'pago'               => $pago,
                'comprobante'        => $this->formatearComprobante($pago),
            ];
        });
    }

    /**
     * Formatea el comprobante de pago oficial para impresión / exportación
     */
    public function formatearComprobante(Pago $pago): array
    {
        $pago->loadMissing(['cita.especialidad', 'cita.medico', 'paciente', 'cajero']);
        $cita = $pago->cita;
        $paciente = $pago->paciente;
        $medico = $cita?->medico;
        $cajero = $pago->cajero;

        return [
            'institucion' => [
                'nombre'           => 'CLÍNICA VIDA SALUD',
                'nit'              => '1028473029',
                'direccion'        => 'Av. San Martín #450, Equipetrol, Santa Cruz - Bolivia',
                'telefono'         => '+591 3 345-6789 / 700-12345',
                'ciudad'           => 'Santa Cruz de la Sierra - Bolivia',
            ],
            'comprobante' => [
                'id_pago'              => $pago->id_pago,
                'numero_comprobante'   => $pago->numero_comprobante,
                'codigo_pago'          => $pago->codigo_pago,
                'fecha_emision'        => $pago->fecha_pago ? $pago->fecha_pago->format('d/m/Y H:i:s') : Carbon::now($this->timezone)->format('d/m/Y H:i:s'),
                'canal'                => $pago->canal_pago,
                'estado'               => $pago->estado_pago,
            ],
            'paciente' => [
                'id_paciente'          => $paciente?->id_paciente,
                'nombre_completo'      => $paciente ? "{$paciente->nombres} {$paciente->apellidos}" : 'Paciente',
                'ci'                   => $paciente?->ci,
                'telefono'             => $paciente?->telefono ?? 'S/N',
                'email'                => $paciente?->email ?? 'S/N',
            ],
            'servicio' => [
                'id_cita'              => $cita?->id_cita,
                'codigo_cita'          => $cita?->codigo_cita,
                'especialidad'         => $cita?->especialidad?->nombre ?? 'Consulta Médica General',
                'medico'               => $medico ? "Dr(a). {$medico->nombres} {$medico->apellidos}" : 'Médico Especialista',
                'matricula'            => $medico?->numero_registro_profesional ?? 'COL-MED-SCZ',
                'fecha_cita'           => $cita?->fecha_cita ? (is_string($cita->fecha_cita) ? $cita->fecha_cita : $cita->fecha_cita->format('d/m/Y')) : null,
                'horario'              => $cita ? substr($cita->hora_inicio, 0, 5) . ' - ' . substr($cita->hora_fin, 0, 5) : null,
            ],
            'pago' => [
                'monto'                => (float) $pago->monto,
                'monto_literal'        => $this->montoALiteral((float) $pago->monto) . ' BOLIVIANOS',
                'moneda'               => $pago->moneda,
                'metodo_pago'          => $pago->metodo_pago,
                'referencia'           => $pago->referencia_transaccion,
                'detalles'             => $pago->detalles_pago,
                'cajero_responsable'   => $cajero ? $cajero->username : 'Cobro en Línea / Automático',
                'politica_reembolso'   => $pago->politica_reembolso,
            ],
        ];
    }

    /**
     * Convierte número a texto literal en Bolivianos
     */
    private function montoALiteral(float $monto): string
    {
        $enteros = (int) floor($monto);
        $centavos = (int) round(($monto - $enteros) * 100);
        $centavosStr = str_pad((string) $centavos, 2, '0', STR_PAD_LEFT) . '/100';

        $map = [
            100 => 'CIEN',
            120 => 'CIENTO VEINTE',
            130 => 'CIENTO TREINTA',
            140 => 'CIENTO CUARENTA',
            150 => 'CIENTO CINCUENTA',
            160 => 'CIENTO SESENTA',
            180 => 'CIENTO OCHENTA',
            200 => 'DOSCIENTOS',
        ];

        $texto = $map[$enteros] ?? (string) $enteros;
        return "{$texto} {$centavosStr}";
    }
}

