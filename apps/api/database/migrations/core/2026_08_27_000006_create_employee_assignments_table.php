<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_assignments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions');
            $table->string('outlet_id')->nullable();
            $table->foreign('outlet_id')->references('id')->on('outlets');
            $table->timestamp('effective_from');
            $table->timestamp('effective_to')->nullable();
            $table->timestamps();

            $table->index('employee_id');
            $table->index('division_id');
            $table->index('effective_from');
            $table->index('effective_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_assignments');
    }
};
