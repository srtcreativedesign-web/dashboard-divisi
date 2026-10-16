<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bod_division_reports')) {
            Schema::create('bod_division_reports', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('division_code', 10);
                $table->date('period_start');
                $table->date('period_end');
                $table->string('status', 20)->default('SUBMITTED');
                $table->string('submitted_by')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->string('acknowledged_by')->nullable();
                $table->timestamp('acknowledged_at')->nullable();
                $table->timestamps();

                $table->foreign('division_code')->references('code')->on('divisions')->cascadeOnDelete();
                $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
                $table->foreign('acknowledged_by')->references('id')->on('users')->nullOnDelete();
                $table->unique(['division_code', 'period_start', 'period_end'], 'uq_bod_report_period');
            });
        }

        if (! Schema::hasTable('bod_report_metrics')) {
            Schema::create('bod_report_metrics', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('report_id')->constrained('bod_division_reports')->cascadeOnDelete();
                $table->string('category', 30);
                $table->string('metric_key', 50);
                $table->string('metric_label', 100);
                $table->decimal('metric_value', 18, 2)->default(0);
                $table->string('unit', 20)->default('IDR');
                $table->integer('display_order')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('bod_report_breakdowns')) {
            Schema::create('bod_report_breakdowns', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('report_id')->constrained('bod_division_reports')->cascadeOnDelete();
                $table->string('entity_code', 50);
                $table->string('entity_name', 150);
                $table->json('figures');
                $table->integer('display_order')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bod_report_breakdowns');
        Schema::dropIfExists('bod_report_metrics');
        Schema::dropIfExists('bod_division_reports');
    }
};
