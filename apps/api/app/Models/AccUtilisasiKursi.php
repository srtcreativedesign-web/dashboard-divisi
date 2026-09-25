<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccUtilisasiKursi extends Model
{
    protected $table = "acc_utilisasi_kursi";

    protected $fillable = [
        "tanggal",
        "no_kursi",
        "jam_mulai",
        "jam_selesai",
        "durasi_menit",
        "terapis_nama",
        "utilisasi_cctv",
    ];

    protected $casts = [
        "tanggal" => "date",
        "no_kursi" => "integer",
        "durasi_menit" => "integer",
        "utilisasi_cctv" => "boolean",
    ];
}
