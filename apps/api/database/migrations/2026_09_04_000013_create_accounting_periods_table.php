<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_periods', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->date('period_month');
            $table->string('status')->default('draft');
            $table->string('created_by_id')->nullable();
            $table->string('updated_by_id')->nullable();
            $table->string('approved_by_id')->nullable();
            $table->string('closed_by_id')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('notes')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->unique(['division_id', 'period_month']);
            $table->index('status');
            $table->index('period_month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_periods');
    }
};
