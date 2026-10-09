<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cel_settlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('daily_closing_id');
            $table->string('channel', 16);
            $table->date('settlement_date');
            $table->bigInteger('gross_cents');
            $table->bigInteger('fee_cents')->default(0);
            $table->bigInteger('net_cents');
            $table->string('destination', 120);
            $table->string('reference', 120);
            $table->string('source_key', 64)->unique();
            $table->string('status', 20)->default('draft');
            $table->text('review_note')->nullable();
            $table->uuid('created_by');
            $table->uuid('reviewed_by')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->foreign('daily_closing_id')->references('id')->on('cel_daily_closings')->restrictOnDelete();
            $table->index(['daily_closing_id', 'channel', 'status']);
            $table->index(['settlement_date', 'status']);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE cel_settlements ADD CONSTRAINT cel_settlement_channel CHECK (channel IN ('cash','qris','edc','transfer'))");
            DB::statement("ALTER TABLE cel_settlements ADD CONSTRAINT cel_settlement_status CHECK (status IN ('draft','submitted','reconciled','correction'))");
            DB::statement('ALTER TABLE cel_settlements ADD CONSTRAINT cel_settlement_amounts CHECK (gross_cents > 0 AND fee_cents >= 0 AND fee_cents <= gross_cents AND net_cents = gross_cents - fee_cents AND version >= 1)');
        }
    }

    public function down(): void { Schema::dropIfExists('cel_settlements'); }
};
