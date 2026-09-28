<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Target omzet per outlet/periode/metrik — versi bertambah, tidak pernah ditimpa
        Schema::create('revenue_targets', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('outlet_id');
            $table->foreign('outlet_id')->references('id')->on('outlets')->onDelete('restrict');
            $table->string('division_code');
            $table->date('period_month');
            $table->string('metric_type')->default('NET'); // GROSS | NET
            $table->decimal('amount', 18, 2)->default(0);
            $table->integer('version')->default(1);
            $table->string('status')->default('DRAFT'); // DRAFT | SUBMITTED | APPROVED | RETURNED
            $table->string('proposed_by_id');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['outlet_id', 'period_month', 'metric_type', 'version']);
            $table->index(['division_code', 'period_month']);
        });

        // Jejak persetujuan BOD — append-only
        Schema::create('target_approvals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('revenue_target_id');
            $table->foreign('revenue_target_id')->references('id')->on('revenue_targets')->onDelete('cascade');
            $table->string('action'); // APPROVE | RETURN
            $table->string('actor_user_id');
            $table->string('note')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index('revenue_target_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('target_approvals');
        Schema::dropIfExists('revenue_targets');
    }
};
