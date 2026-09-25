<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccRekapKomisi extends Model
{
    protected $table = "acc_rekap_komisi";

    protected $fillable = [
        "periode_awal",
        "periode_akhir",
        "karyawan_nama",
        "sesi_30m",
        "sesi_60m",
        "sesi_90m",
        "total_bonus",
    ];

    protected $casts = [
        "periode_awal" => "date",
        "periode_akhir" => "date",
        "sesi_30m" => "integer",
        "sesi_60m" => "integer",
        "sesi_90m" => "integer",
        "total_bonus" => "decimal:2",
    ];
}
