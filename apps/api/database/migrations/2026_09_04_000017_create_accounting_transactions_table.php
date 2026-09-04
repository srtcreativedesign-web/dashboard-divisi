<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_transactions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->string('period_id');
            $table->foreign('period_id')->references('id')->on('accounting_periods')->onDelete('restrict');
            $table->string('account_id');
            $table->foreign('account_id')->references('id')->on('accounting_accounts')->onDelete('restrict');
            $table->string('category_id');
            $table->foreign('category_id')->references('id')->on('accounting_categories')->onDelete('restrict');
            $table->string('outlet_id')->nullable();
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');
            $table->date('transaction_date');
            $table->text('description');
            $table->string('reference_no', 100)->nullable();
            $table->unsignedBigInteger('debit_amount')->default(0);
            $table->unsignedBigInteger('credit_amount')->default(0);
            $table->boolean('is_draft')->default(true);
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_by_id')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->integer('version')->default(1);
            $table->string('created_by_id')->nullable();
            $table->string('updated_by_id')->nullable();
            $table->string('idempotency_key', 100)->nullable();
            $table->char('request_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['division_id', 'period_id', 'transaction_date']);
            $table->index(['account_id', 'transaction_date']);
            $table->index(['category_id']);
            $table->index(['cancelled_at']);
            $table->unique(['division_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_transactions');
    }
};
