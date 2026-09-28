<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Satu tabel untuk dua laporan budgeting: CASHFLOW dan PNL.
        // line_type menentukan posisi baris pada formula (lihat BudgetingService).
        Schema::create('budget_entries', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_code');
            $table->string('outlet_id')->nullable();
            $table->date('period_month');
            $table->string('statement');  // CASHFLOW | PNL
            $table->string('line_type');  // OPENING | INFLOW | OUTFLOW | COGS | OPEX | DEPRECIATION | INTEREST | TAX | OTHER_INCOME
            $table->string('line_code');
            $table->string('label');
            $table->decimal('amount', 18, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['division_code', 'period_month', 'statement', 'line_code']);
            $table->index(['division_code', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_entries');
    }
};
