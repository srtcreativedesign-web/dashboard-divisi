<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_detail_cashless', function (Blueprint $table) {
            $table->string('division_code')->default('ACC')->after('no_storan_finance');
            $table->dropUnique(['tanggal', 'shift']);
            $table->unique(['tanggal', 'shift', 'division_code']);
        });

        Schema::table('acc_laundry_logs', function (Blueprint $table) {
            $table->string('division_code')->default('ACC')->after('status_pembayaran');
        });

        Schema::table('acc_stok_opname', function (Blueprint $table) {
            $table->string('division_code')->default('ACC')->after('stok_akhir');
        });

        Schema::table('acc_utilisasi_kursi', function (Blueprint $table) {
            $table->string('division_code')->default('ACC')->after('utilisasi_cctv');
        });

        Schema::table('acc_rekap_komisi', function (Blueprint $table) {
            $table->string('division_code')->default('ACC')->after('total_bonus');
        });
    }

    public function down(): void
    {
        Schema::table('acc_detail_cashless', function (Blueprint $table) {
            $table->dropUnique(['tanggal', 'shift', 'division_code']);
            $table->dropColumn('division_code');
            $table->unique(['tanggal', 'shift']);
        });

        Schema::table('acc_laundry_logs', function (Blueprint $table) {
            $table->dropColumn('division_code');
        });

        Schema::table('acc_stok_opname', function (Blueprint $table) {
            $table->dropColumn('division_code');
        });

        Schema::table('acc_utilisasi_kursi', function (Blueprint $table) {
            $table->dropColumn('division_code');
        });

        Schema::table('acc_rekap_komisi', function (Blueprint $table) {
            $table->dropColumn('division_code');
        });
    }
};