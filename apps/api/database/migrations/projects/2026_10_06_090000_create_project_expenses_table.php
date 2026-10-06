<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('project_expenses')) {
            Schema::create('project_expenses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->foreignId('project_rab_id')->nullable()->constrained('project_rabs')->nullOnDelete();
                $table->foreignId('project_vendor_id')->nullable()->constrained('project_vendors')->nullOnDelete();
                $table->string('item_name');
                $table->string('category')->default('material'); // material, labor, subcon, operational, etc.
                $table->decimal('amount', 15, 2)->default(0);
                $table->date('expense_date');
                $table->string('receipt_path')->nullable();
                $table->text('notes')->nullable();
                $table->string('created_by')->nullable();
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_expenses');
    }
};
