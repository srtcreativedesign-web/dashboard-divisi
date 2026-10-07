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
        Schema::create('project_petty_cashes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('type', 10); // 'in' (top-up / drop dana), 'out' (pengeluaran kas kecil)
            $table->string('category', 100);
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('transaction_date');
            $table->text('description');
            $table->string('recipient_or_vendor', 255)->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'transaction_date']);
            $table->index(['project_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_petty_cashes');
    }
};
