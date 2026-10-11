<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_inventory_items', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('sku', 64)->unique(); $t->string('name');
            $t->string('unit', 30); $t->decimal('minimum_stock', 16, 3)->default(0); $t->boolean('active')->default(true);
            $t->unsignedInteger('version')->default(1); $t->timestampsTz();
        });
        Schema::create('acc_inventory_locations', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('code', 64)->unique(); $t->string('name');
            $t->string('kind', 20); $t->boolean('active')->default(true); $t->unsignedInteger('version')->default(1); $t->timestampsTz();
        });
        Schema::create('acc_inventory_balances', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->foreignUuid('item_id')->constrained('acc_inventory_items');
            $t->foreignUuid('location_id')->constrained('acc_inventory_locations'); $t->decimal('quantity', 16, 3)->default(0);
            $t->unsignedInteger('version')->default(1); $t->timestampsTz(); $t->unique(['item_id', 'location_id']);
        });
        Schema::create('acc_inventory_documents', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->string('document_number', 40)->unique(); $t->string('kind', 20);
            $t->foreignUuid('source_location_id')->nullable()->constrained('acc_inventory_locations');
            $t->foreignUuid('destination_location_id')->nullable()->constrained('acc_inventory_locations');
            $t->date('business_date'); $t->string('reference'); $t->text('notes')->nullable(); $t->string('status', 20)->default('draft');
            $t->uuid('created_by'); $t->uuid('reviewed_by')->nullable(); $t->text('review_note')->nullable();
            $t->unsignedInteger('version')->default(1); $t->timestampsTz(); $t->index(['business_date', 'status']);
        });
        Schema::create('acc_inventory_document_lines', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->foreignUuid('document_id')->constrained('acc_inventory_documents')->cascadeOnDelete();
            $t->foreignUuid('item_id')->constrained('acc_inventory_items'); $t->decimal('quantity', 16, 3)->nullable();
            $t->decimal('counted_quantity', 16, 3)->nullable(); $t->unique(['document_id', 'item_id']);
        });
        Schema::create('acc_inventory_movements', function (Blueprint $t) {
            $t->uuid('id')->primary(); $t->foreignUuid('document_id')->constrained('acc_inventory_documents');
            $t->foreignUuid('line_id')->constrained('acc_inventory_document_lines'); $t->foreignUuid('item_id')->constrained('acc_inventory_items');
            $t->foreignUuid('location_id')->constrained('acc_inventory_locations'); $t->string('kind', 20);
            $t->decimal('quantity_delta', 16, 3); $t->decimal('quantity_after', 16, 3); $t->uuid('actor_id'); $t->timestampTz('created_at');
            $t->unique(['document_id', 'line_id', 'location_id', 'kind'], 'acc_inventory_movement_unique');
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE acc_inventory_items ADD CONSTRAINT acc_inventory_item_values CHECK (minimum_stock >= 0 AND version >= 1)");
            DB::statement("ALTER TABLE acc_inventory_locations ADD CONSTRAINT acc_inventory_location_values CHECK (kind IN ('WAREHOUSE','OUTLET') AND version >= 1)");
            DB::statement("ALTER TABLE acc_inventory_balances ADD CONSTRAINT acc_inventory_balance_values CHECK (quantity >= 0 AND version >= 1)");
            DB::statement("ALTER TABLE acc_inventory_documents ADD CONSTRAINT acc_inventory_document_values CHECK (kind IN ('RECEIPT','ISSUE','TRANSFER','STOCK_COUNT') AND status IN ('draft','submitted','approved','correction') AND version >= 1)");
            DB::statement("ALTER TABLE acc_inventory_document_lines ADD CONSTRAINT acc_inventory_line_values CHECK ((quantity IS NULL OR quantity > 0) AND (counted_quantity IS NULL OR counted_quantity >= 0))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_inventory_movements'); Schema::dropIfExists('acc_inventory_document_lines');
        Schema::dropIfExists('acc_inventory_documents'); Schema::dropIfExists('acc_inventory_balances');
        Schema::dropIfExists('acc_inventory_locations'); Schema::dropIfExists('acc_inventory_items');
    }
};
