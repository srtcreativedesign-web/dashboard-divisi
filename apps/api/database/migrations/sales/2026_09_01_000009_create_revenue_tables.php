<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Batch import omzet (Excel / POS) — lineage sumber data harian
        Schema::create('revenue_imports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_code');
            $table->string('import_type')->default('DAILY');   // DAILY | MONTHLY
            $table->string('source_type')->default('EXCEL');   // EXCEL | POS | MANUAL
            $table->string('file_name')->nullable();
            $table->string('checksum_sha256')->nullable();
            $table->date('period_month')->nullable();
            $table->string('status')->default('UPLOADED');     // UPLOADED | VALIDATED | POSTED | SUPERSEDED | FAILED
            $table->integer('total_rows')->default(0);
            $table->integer('valid_rows')->default(0);
            $table->integer('invalid_rows')->default(0);
            $table->string('uploaded_by_id')->nullable();
            $table->string('superseded_by_id')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->index(['division_code', 'period_month']);
            $table->index('checksum_sha256');
        });

        // Baris mentah hasil parsing — immutable, menyimpan error validasi per baris
        Schema::create('revenue_staging_rows', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('revenue_import_id');
            $table->foreign('revenue_import_id')->references('id')->on('revenue_imports')->onDelete('cascade');
            $table->integer('row_number');
            $table->json('raw_data');
            $table->string('outlet_code')->nullable();
            $table->date('business_date')->nullable();
            $table->decimal('gross_revenue', 18, 2)->nullable();
            $table->decimal('net_revenue', 18, 2)->nullable();
            $table->string('validation_status')->default('PENDING'); // PENDING | VALID | INVALID
            $table->json('errors')->nullable();
            $table->timestamps();

            $table->unique(['revenue_import_id', 'row_number']);
        });

        // Fakta omzet harian — append-only: koreksi membuat versi baru, versi lama superseded
        Schema::create('revenue_daily', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('outlet_id');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');
            $table->string('division_code');
            $table->date('business_date');
            $table->decimal('gross_revenue', 18, 2)->default(0);
            $table->decimal('net_revenue', 18, 2)->default(0);
            $table->decimal('discount_amount', 18, 2)->default(0);
            $table->decimal('return_amount', 18, 2)->default(0);
            $table->integer('transaction_count')->default(0);
            $table->integer('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('entry_type')->default('ENTRY'); // ENTRY | CORRECTION | REVERSAL
            $table->string('source_import_id')->nullable();
            $table->string('superseded_by_id')->nullable();
            $table->string('created_by_id')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['outlet_id', 'business_date', 'version']);
            $table->index(['division_code', 'business_date']);
        });

        // Rincian per metode bayar (Tunai/QRIS/EDC/Transfer) untuk laporan & rekonsiliasi
        Schema::create('revenue_payments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('revenue_daily_id');
            $table->foreign('revenue_daily_id')->references('id')->on('revenue_daily')->onDelete('cascade');
            $table->string('method'); // CASH | QRIS | EDC | TRANSFER
            $table->decimal('amount', 18, 2)->default(0);
            $table->integer('transaction_count')->default(0);
            $table->timestamps();

            $table->unique(['revenue_daily_id', 'method']);
        });

        // Rekonsiliasi kasir (turunan revenue_payments) vs mutasi rekening
        Schema::create('reconciliations', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('outlet_id');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('cascade');
            $table->string('division_code');
            $table->date('period_month');
            $table->decimal('bank_amount', 18, 2)->default(0);
            $table->string('status')->default('OPEN'); // OPEN | CONFIRMED | ADJUSTED
            $table->string('confirmed_by_id')->nullable();
            $table->string('confirmation_note')->nullable();
            $table->timestamps();

            $table->unique(['outlet_id', 'period_month']);
            $table->index(['division_code', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliations');
        Schema::dropIfExists('revenue_payments');
        Schema::dropIfExists('revenue_daily');
        Schema::dropIfExists('revenue_staging_rows');
        Schema::dropIfExists('revenue_imports');
    }
};
