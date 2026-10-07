<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cel_products', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('sku', 50)->unique();
            $t->string('name');
            $t->string('kind', 20);
            $t->string('provider', 100)->nullable();
            $t->string('variant')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestampsTz();
        });
        Schema::create('cel_stock_balances', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('product_id')->constrained('cel_products');
            $t->uuid('outlet_id');
            $t->bigInteger('quantity')->default(0);
            $t->unsignedInteger('version')->default(1);
            $t->unique(['product_id', 'outlet_id']);
            $t->timestampsTz();
        });
        Schema::create('cel_manual_sales', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('product_id')->constrained('cel_products');
            $t->uuid('outlet_id');
            $t->string('product_name');
            $t->string('outlet_name');
            $t->date('business_date');
            $t->unsignedInteger('quantity');
            $t->bigInteger('unit_price_cents');
            $t->bigInteger('total_cents');
            $t->string('source_reference');
            $t->string('source_key', 64)->unique();
            $t->uuid('created_by');
            $t->string('status', 20)->default('posted');
            $t->unsignedInteger('version')->default(1);
            $t->uuid('voided_by')->nullable();
            $t->text('void_reason')->nullable();
            $t->timestampsTz();
            $t->index(['outlet_id', 'business_date', 'status']);
        });
        Schema::create('cel_stock_movements', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('product_id')->constrained('cel_products');
            $t->uuid('outlet_id');
            $t->integer('quantity_delta');
            $t->bigInteger('quantity_after');
            $t->string('kind', 20);
            $t->string('reference');
            $t->string('source_key', 64)->unique();
            $t->text('reason');
            $t->uuid('actor_id');
            $t->timestampTz('created_at');
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE cel_stock_balances ADD CONSTRAINT cel_stock_nonnegative CHECK (quantity >= 0 AND version >= 1)');
            DB::statement("ALTER TABLE cel_products ADD CONSTRAINT cel_product_kind CHECK (kind IN ('SIM_CARD','ACCESSORY'))");
            DB::statement("ALTER TABLE cel_manual_sales ADD CONSTRAINT cel_sale_valid CHECK (quantity > 0 AND unit_price_cents >= 0 AND total_cents = unit_price_cents * quantity AND version >= 1 AND status IN ('posted','voided'))");
            DB::statement('ALTER TABLE cel_stock_movements ADD CONSTRAINT cel_movement_valid CHECK (quantity_delta <> 0 AND quantity_after >= 0)');
        }
    }

    public function down(): void
    {
        foreach (['cel_stock_movements', 'cel_manual_sales', 'cel_stock_balances', 'cel_products'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
