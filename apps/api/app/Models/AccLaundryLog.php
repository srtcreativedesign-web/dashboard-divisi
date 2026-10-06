<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccLaundryLog extends Model
{
    protected $table = 'acc_laundry_logs';

    protected $fillable = [
        'tanggal',
        'berat_kg',
        'harga_per_kg',
        'total_tagihan',
        'status_pembayaran',
        'division_code',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'berat_kg' => 'decimal:2',
        'harga_per_kg' => 'decimal:2',
        'total_tagihan' => 'decimal:2',
    ];
}
