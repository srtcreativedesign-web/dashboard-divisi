<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bod_division_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('bod_division_reports', 'reviewed_by')) {
                $table->string('reviewed_by')->nullable()->after('status');
                $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('bod_division_reports', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
            if (! Schema::hasColumn('bod_division_reports', 'notes')) {
                $table->text('notes')->nullable()->after('reviewed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bod_division_reports', function (Blueprint $table) {
            if (Schema::hasColumn('bod_division_reports', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn('reviewed_by');
            }
            if (Schema::hasColumn('bod_division_reports', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }
            if (Schema::hasColumn('bod_division_reports', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }
};
