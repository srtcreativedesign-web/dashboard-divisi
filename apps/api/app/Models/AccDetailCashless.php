<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccDetailCashless extends Model
{
    protected $table = 'acc_detail_cashless';

    protected $fillable = [
        'tanggal',
        'shift',
        'nominal_qris',
        'nominal_edc',
        'no_storan_finance',
        'division_code',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'shift' => 'integer',
        'nominal_qris' => 'decimal:2',
        'nominal_edc' => 'decimal:2',
    ];
}
