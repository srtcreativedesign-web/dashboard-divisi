<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_bank_reconciliations', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->string('period_id');
            $table->foreign('period_id')->references('id')->on('accounting_periods')->onDelete('restrict');
            $table->string('account_id');
            $table->foreign('account_id')->references('id')->on('accounting_accounts')->onDelete('restrict');
            $table->string('outlet_id')->nullable();
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');

            $table->decimal('jul_balance', 18, 2)->default(0);
            $table->decimal('aug_balance', 18, 2)->default(0);
            $table->decimal('mutation', 18, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->string('verified_by_id')->nullable();
            $table->timestamps();

            $table->unique(['period_id', 'account_id']);
            $table->index(['division_id', 'period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_bank_reconciliations');
    }
};
