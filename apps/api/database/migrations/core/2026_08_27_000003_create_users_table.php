<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('password_hash');
            $table->string('role'); // BOD, MANAGER, ADMIN
            $table->string('division_code')->nullable(); // null for BOD, strict 1:1 for Manager/Admin
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('role');
            $table->index('division_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
