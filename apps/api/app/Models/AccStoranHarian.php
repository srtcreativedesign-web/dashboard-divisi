<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccStoranHarian extends Model
{
    protected $table = 'acc_storan_harian';

    protected $fillable = [
        'tanggal',
        'shift',
        'pendapatan_tunai',
        'no_kysoft_sales',
        'division_code',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'shift' => 'integer',
        'pendapatan_tunai' => 'decimal:2',
    ];
}
