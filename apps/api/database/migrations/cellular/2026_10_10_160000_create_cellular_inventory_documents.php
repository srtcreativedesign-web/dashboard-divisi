<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cel_inventory_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('document_number', 64)->unique();
            $table->string('kind', 20);
            $table->uuid('source_outlet_id')->nullable();
            $table->uuid('destination_outlet_id')->nullable();
            $table->date('business_date');
            $table->string('reference');
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->uuid('created_by');
            $table->uuid('reviewed_by')->nullable();
            $table->text('review_note')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->index(['business_date', 'status']);
            $table->index(['source_outlet_id', 'destination_outlet_id']);
        });
        Schema::create('cel_inventory_document_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_id')->constrained('cel_inventory_documents')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('cel_products')->restrictOnDelete();
            $table->unsignedBigInteger('quantity')->nullable();
            $table->unsignedBigInteger('counted_quantity')->nullable();
            $table->unique(['document_id', 'product_id']);
        });
        Schema::table('cel_stock_movements', function (Blueprint $table) {
            $table->foreignUuid('inventory_document_id')->nullable()->constrained('cel_inventory_documents')->restrictOnDelete();
            $table->foreignUuid('inventory_line_id')->nullable()->constrained('cel_inventory_document_lines')->restrictOnDelete();
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE cel_inventory_documents ADD CONSTRAINT cel_inventory_document_values CHECK (kind IN ('RECEIPT','ISSUE','TRANSFER','STOCK_COUNT') AND status IN ('draft','submitted','approved','correction') AND version >= 1)");
            DB::statement('ALTER TABLE cel_inventory_document_lines ADD CONSTRAINT cel_inventory_line_values CHECK ((quantity IS NULL OR quantity > 0) AND (counted_quantity IS NULL OR counted_quantity >= 0))');
        }
    }

    public function down(): void
    {
        Schema::table('cel_stock_movements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_line_id');
            $table->dropConstrainedForeignId('inventory_document_id');
        });
        Schema::dropIfExists('cel_inventory_document_lines');
        Schema::dropIfExists('cel_inventory_documents');
    }
};
