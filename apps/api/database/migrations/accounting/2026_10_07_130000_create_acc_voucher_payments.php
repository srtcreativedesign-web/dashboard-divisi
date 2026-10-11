<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_voucher_payments', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('voucher_id')->constrained('acc_vouchers')->restrictOnDelete();
            $t->date('paid_date');
            $t->bigInteger('amount_cents');
            $t->string('method', 10);
            $t->string('reference', 150);
            $t->string('source_key', 64);
            $t->text('notes');
            $t->string('status', 20)->default('recorded');
            $t->uuid('created_by');
            $t->string('original_name', 240);
            $t->string('file_path');
            $t->string('mime_type', 100);
            $t->unsignedBigInteger('size_bytes');
            $t->string('sha256', 64);
            $t->uuid('voided_by')->nullable();
            $t->text('void_reason')->nullable();
            $t->timestamp('voided_at')->nullable();
            $t->timestamps();
            $t->unique(['voucher_id', 'source_key']);
            $t->index(['voucher_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_voucher_payments');
    }
};
