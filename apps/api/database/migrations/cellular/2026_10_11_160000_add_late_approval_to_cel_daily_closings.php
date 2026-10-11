<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cel_daily_closings', function (Blueprint $table) {
            $table->timestampTz('late_submission_requested_at')->nullable();
            $table->uuid('late_submission_requested_by')->nullable();
            $table->text('late_submission_reason')->nullable();
            $table->timestampTz('late_submission_approved_at')->nullable();
            $table->uuid('late_submission_approved_by')->nullable();
            $table->index('late_submission_requested_by');
            $table->index('late_submission_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('cel_daily_closings', function (Blueprint $table) {
            $table->dropIndex(['late_submission_requested_by']);
            $table->dropIndex(['late_submission_approved_by']);
            $table->dropColumn([
                'late_submission_requested_at',
                'late_submission_requested_by',
                'late_submission_reason',
                'late_submission_approved_at',
                'late_submission_approved_by',
            ]);
        });
    }
};
