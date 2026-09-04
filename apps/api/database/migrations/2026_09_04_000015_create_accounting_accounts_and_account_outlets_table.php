<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_accounts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code');
            $table->string('display_name');
            $table->string('type');          // ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->string('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('accounting_categories')->onDelete('set null');
            $table->string('description')->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->string('version')->default('1.0');
            $table->string('created_by_id')->nullable();
            $table->string('updated_by_id')->nullable();
            $table->timestamps();

            $table->unique(['division_id', 'code']);
            $table->index('division_id');
            $table->index('type');
            $table->index('display_order');
        });

        Schema::create('accounting_account_outlets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('account_id');
            $table->foreign('account_id')->references('id')->on('accounting_accounts')->onDelete('cascade');
            $table->string('outlet_id');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');
            $table->string('division_id');
            $table->foreign('division_id')->references('id')->on('divisions')->onDelete('restrict');
            $table->boolean('is_active')->default(true);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'outlet_id']);
            $table->index('outlet_id');
            $table->index('division_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_account_outlets');
        Schema::dropIfExists('accounting_accounts');
    }
};
