<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cel_inventories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('item_code', 50)->unique();
            $table->string('name', 100);
            $table->integer('stock')->default(0);
            $table->string('division_code', 20)->default('CELLULAR');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cel_inventories');
    }
};
