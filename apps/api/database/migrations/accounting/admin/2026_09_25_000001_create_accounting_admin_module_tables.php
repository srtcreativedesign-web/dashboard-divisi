<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("acc_storan_harian", function (Blueprint $table) {
            $table->id();
            $table->date("tanggal");
            $table->tinyInteger("shift"); // 1 atau 2
            $table->decimal("pendapatan_tunai", 12, 2)->default(0);
            $table->string("no_kysoft_sales")->nullable();
            $table->string("division_code")->default("ACC");
            $table->timestamps();

            $table->unique(["tanggal", "shift", "division_code"]);
        });

        Schema::create("acc_detail_cashless", function (Blueprint $table) {
            $table->id();
            $table->date("tanggal");
            $table->tinyInteger("shift");
            $table->decimal("nominal_qris", 12, 2)->default(0);
            $table->decimal("nominal_edc", 12, 2)->default(0);
            $table->string("no_storan_finance")->nullable();
            $table->timestamps();

            $table->unique(["tanggal", "shift"]);
        });

        Schema::create("acc_laundry_logs", function (Blueprint $table) {
            $table->id();
            $table->date("tanggal");
            $table->decimal("berat_kg", 6, 2)->default(0);
            $table->decimal("harga_per_kg", 10, 2)->default(9000);
            $table->decimal("total_tagihan", 12, 2)->default(0);
            $table->string("status_pembayaran")->default("Draft"); // Draft | Verified | Paid
            $table->timestamps();
        });

        Schema::create("acc_stok_opname", function (Blueprint $table) {
            $table->id();
            $table->date("tanggal");
            $table->string("barang_nama"); // Minyak, Krim, Teh, Gelas, dll
            $table->integer("stok_awal")->default(0);
            $table->integer("barang_datang")->default(0);
            $table->integer("pemakaian")->default(0);
            $table->integer("stok_akhir")->default(0);
            $table->timestamps();
        });

        Schema::create("acc_utilisasi_kursi", function (Blueprint $table) {
            $table->id();
            $table->date("tanggal");
            $table->tinyInteger("no_kursi"); // 1 - 10
            $table->time("jam_mulai")->nullable();
            $table->time("jam_selesai")->nullable();
            $table->integer("durasi_menit")->default(0);
            $table->string("terapis_nama")->nullable();
            $table->boolean("utilisasi_cctv")->default(false);
            $table->timestamps();
        });

        Schema::create("acc_rekap_komisi", function (Blueprint $table) {
            $table->id();
            $table->date("periode_awal");
            $table->date("periode_akhir");
            $table->string("karyawan_nama");
            $table->integer("sesi_30m")->default(0);
            $table->integer("sesi_60m")->default(0);
            $table->integer("sesi_90m")->default(0);
            $table->decimal("total_bonus", 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("acc_rekap_komisi");
        Schema::dropIfExists("acc_utilisasi_kursi");
        Schema::dropIfExists("acc_stok_opname");
        Schema::dropIfExists("acc_laundry_logs");
        Schema::dropIfExists("acc_detail_cashless");
        Schema::dropIfExists("acc_storan_harian");
    }
};
