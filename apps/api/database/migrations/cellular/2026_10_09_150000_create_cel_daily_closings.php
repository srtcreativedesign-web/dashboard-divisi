<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cel_daily_closings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('outlet_id');
            $table->date('business_date');
            $table->string('shift_code', 20);
            $table->bigInteger('system_sales_cents');
            $table->bigInteger('cash_cents')->default(0);
            $table->bigInteger('qris_cents')->default(0);
            $table->bigInteger('edc_cents')->default(0);
            $table->bigInteger('transfer_cents')->default(0);
            $table->bigInteger('difference_cents')->default(0);
            $table->string('source_reference');
            $table->string('status', 20)->default('draft');
            $table->text('review_note')->nullable();
            $table->uuid('created_by');
            $table->uuid('reviewed_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->unique(['outlet_id', 'business_date', 'shift_code']);
            $table->index(['business_date', 'status']);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE cel_daily_closings ADD CONSTRAINT cel_daily_closing_status CHECK (status IN ('draft','submitted','validated','approved','correction'))");
            DB::statement('ALTER TABLE cel_daily_closings ADD CONSTRAINT cel_daily_closing_amounts CHECK (system_sales_cents >= 0 AND cash_cents >= 0 AND qris_cents >= 0 AND edc_cents >= 0 AND transfer_cents >= 0 AND version >= 1)');
        }
    }

    public function down(): void { Schema::dropIfExists('cel_daily_closings'); }
};
