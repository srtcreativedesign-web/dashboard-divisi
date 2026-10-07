<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_deposits', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('omzet_id')->constrained('acc_omzet_records');
            $t->string('channel', 20);
            $t->date('deposit_date');
            $t->bigInteger('amount_cents');
            $t->string('destination');
            $t->string('source_reference');
            $t->string('source_key', 64)->unique();
            $t->string('evidence_reference');
            $t->string('status', 20)->default('recorded');
            $t->unsignedInteger('version')->default(1);
            $t->uuid('created_by');
            $t->timestampsTz();
            $t->index(['omzet_id', 'channel', 'status']);
            $t->index('deposit_date');
        });
        Schema::create('acc_deposit_receipts', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('deposit_id')->constrained('acc_deposits');
            $t->date('received_date');
            $t->bigInteger('amount_cents');
            $t->string('evidence_reference');
            $t->string('source_key', 64)->unique();
            $t->string('status', 20)->default('recorded');
            $t->uuid('created_by');
            $t->timestampTz('created_at');
        });
        Schema::create('acc_deposit_events', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('deposit_id')->constrained('acc_deposits');
            $t->uuid('actor_id');
            $t->string('actor_role', 30);
            $t->string('action', 30);
            $t->unsignedInteger('version');
            $t->unique(['deposit_id', 'version']);
            $t->text('reason')->nullable();
            $t->json('snapshot');
            $t->timestampTz('created_at');
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE acc_deposits ADD CONSTRAINT acc_deposit_values_valid CHECK (amount_cents BETWEEN 1 AND 99999999999999 AND version >= 1 AND status IN ('recorded','voided') AND channel IN ('cash','qris','edc','transfer','other'))");
            DB::statement("ALTER TABLE acc_deposit_receipts ADD CONSTRAINT acc_deposit_receipt_values_valid CHECK (amount_cents BETWEEN 1 AND 99999999999999 AND status IN ('recorded','voided'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_deposit_events');
        Schema::dropIfExists('acc_deposit_receipts');
        Schema::dropIfExists('acc_deposits');
    }
};
