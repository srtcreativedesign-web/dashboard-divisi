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
        if (! Schema::hasTable('project_invoices')) {
            Schema::create('project_invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->foreignId('project_milestone_id')->nullable()->constrained('project_milestones')->nullOnDelete();
                $table->string('invoice_number')->unique();
                $table->string('term_name'); // e.g., "Termin 1 (DP 20%)", "Termin 2 (Progres 50%)"
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('status')->default('draft'); // draft, sent, paid, overdue, cancelled
                $table->date('due_date')->nullable();
                $table->date('paid_date')->nullable();
                $table->string('payment_reference')->nullable();
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
        Schema::dropIfExists('project_invoices');
    }
};
