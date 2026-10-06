<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_omzet_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('division_code')->default('ACC');
            $table->uuid('outlet_id');
            $table->string('outlet_name');
            $table->string('source_division_code');
            $table->date('business_date');
            $table->string('shift', 30);
            foreach (['outlet_amount', 'cash_amount', 'qris_amount', 'edc_amount', 'transfer_amount', 'other_amount'] as $column) {
                $table->decimal($column, 16, 2)->default(0);
            }
            $table->boolean('requires_ap')->default(false);
            $table->decimal('ap_amount', 16, 2)->nullable();
            $table->string('source_reference');
            $table->text('notes')->nullable();
            $table->text('review_notes')->nullable();
            $table->text('decision_notes')->nullable();
            $table->string('status')->default('draft');
            $table->uuid('created_by');
            $table->uuid('reviewed_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('validated_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->unique(['outlet_id', 'business_date', 'shift'], 'acc_omzet_outlet_date_shift_unique');
            $table->index(['division_code', 'business_date', 'status']);
        });
        Schema::create('acc_omzet_unlock_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('record_id')->constrained('acc_omzet_records');
            $table->uuid('requested_by');
            $table->text('reason');
            $table->string('status')->default('pending');
            $table->uuid('decided_by')->nullable();
            $table->text('decision_notes')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('used_at')->nullable();
            $table->timestampsTz();
            $table->index(['record_id', 'status']);
        });
        Schema::create('acc_omzet_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('record_id')->constrained('acc_omzet_records');
            $table->uuid('actor_id');
            $table->string('actor_role');
            $table->string('action');
            $table->json('metadata');
            $table->timestampTz('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_omzet_events');
        Schema::dropIfExists('acc_omzet_unlock_requests');
        Schema::dropIfExists('acc_omzet_records');
    }
};
