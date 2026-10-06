<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('division_code')->default('ACC');
            $table->string('voucher_no', 50)->unique();
            $table->string('type', 20);
            $table->uuid('outlet_id');
            $table->string('outlet_name');
            $table->string('source_division_code');
            $table->date('voucher_date');
            $table->date('due_date');
            $table->string('entity_name', 150);
            $table->string('source_reference');
            $table->string('source_key', 64)->unique();
            $table->decimal('amount', 16, 2);
            $table->text('description');
            $table->string('status', 30)->default('draft');
            $table->uuid('created_by');
            $table->uuid('reviewed_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->text('review_notes')->nullable();
            $table->text('decision_notes')->nullable();
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('reviewed_at')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->index(['division_code', 'voucher_date', 'status']);
        });
        Schema::create('acc_voucher_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('voucher_id')->constrained('acc_vouchers');
            $table->uuid('actor_id');
            $table->string('actor_role');
            $table->string('action');
            $table->json('metadata');
            $table->timestampTz('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_voucher_events');
        Schema::dropIfExists('acc_vouchers');
    }
};
