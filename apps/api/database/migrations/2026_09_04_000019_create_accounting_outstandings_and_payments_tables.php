<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_outstandings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->string('period_id');
            $table->foreign('period_id')->references('id')->on('accounting_periods')->onDelete('restrict');
            $table->string('account_id')->nullable();
            $table->foreign('account_id')->references('id')->on('accounting_accounts')->onDelete('restrict');
            $table->string('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('accounting_categories')->onDelete('restrict');
            $table->string('outlet_id')->nullable();
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');

            $table->string('code', 50)->unique();
            $table->text('description');
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('paid_amount')->default(0);
            $table->unsignedBigInteger('remaining_amount');
            $table->date('due_date');
            $table->string('status', 20)->default('unpaid'); // unpaid, partial, paid, cancelled
            $table->string('category_name')->nullable();

            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_by_id')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('created_by_id')->nullable();
            $table->string('updated_by_id')->nullable();
            $table->timestamps();

            $table->index(['division_id', 'period_id', 'status']);
            $table->index(['due_date']);
        });

        Schema::create('accounting_outstanding_payments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('outstanding_id');
            $table->foreign('outstanding_id')->references('id')->on('accounting_outstandings')->onDelete('cascade');
            $table->string('transaction_id')->nullable();
            $table->foreign('transaction_id')->references('id')->on('accounting_transactions')->onDelete('set null');
            $table->string('account_id')->nullable();
            $table->foreign('account_id')->references('id')->on('accounting_accounts')->onDelete('restrict');

            $table->date('payment_date');
            $table->unsignedBigInteger('amount');
            $table->text('notes')->nullable();
            $table->string('created_by_id')->nullable();
            $table->timestamps();

            $table->index(['outstanding_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_outstanding_payments');
        Schema::dropIfExists('accounting_outstandings');
    }
};
