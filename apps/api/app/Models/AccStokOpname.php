<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccStokOpname extends Model
{
    protected $table = "acc_stok_opname";

    protected $fillable = [
        "tanggal",
        "barang_nama",
        "stok_awal",
        "barang_datang",
        "pemakaian",
        "stok_akhir",
        "division_code",
    ];

    protected $casts = [
        "tanggal" => "date",
        "stok_awal" => "integer",
        "barang_datang" => "integer",
        "pemakaian" => "integer",
        "stok_akhir" => "integer",
    ];
}
