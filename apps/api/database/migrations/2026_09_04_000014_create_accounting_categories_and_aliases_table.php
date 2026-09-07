<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_categories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code');         // canonical_code e.g. C14, C25
            $table->string('name');
            $table->string('parent')->nullable();  // group B, C, or D; or parent category
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_outlet')->default(false);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->string('version')->default('1.0');
            $table->string('created_by_id')->nullable();
            $table->string('updated_by_id')->nullable();
            $table->timestamps();

            $table->unique('code');
            $table->index('parent');
            $table->index('display_order');
        });

        Schema::create('accounting_category_aliases', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('alias_code');        // e.g. '2a', '14c'
            $table->string('canonical_id');      // FK to accounting_categories.id
            $table->string('normalized_alias')->unique();  // trimmed, lowercased e.g. '2a'
            $table->timestamps();

            $table->foreign('canonical_id')->references('id')->on('accounting_categories')->onDelete('restrict');

            $table->index('canonical_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_category_aliases');
        Schema::dropIfExists('accounting_categories');
    }
};
