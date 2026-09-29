<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('division_configs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('division_id')->unique();
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
            $table->json('enabled_modules');
            $table->json('enabled_kpis');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('division_configs');
    }
};
