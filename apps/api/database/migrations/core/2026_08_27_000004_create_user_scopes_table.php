<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_scopes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('cascade');
            $table->string('outlet_id')->nullable();
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'division_id']);
            $table->index('division_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_scopes');
    }
};
