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
        Schema::table('project_milestones', function (Blueprint $table) {
            if (! Schema::hasColumn('project_milestones', 'actual_percentage')) {
                $table->decimal('actual_percentage', 5, 2)->default(0)->nullable();
            }
            if (! Schema::hasColumn('project_milestones', 'completion_date')) {
                $table->date('completion_date')->nullable();
            }
            if (! Schema::hasColumn('project_milestones', 'notes')) {
                $table->text('notes')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_milestones', function (Blueprint $table) {
            if (Schema::hasColumn('project_milestones', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('project_milestones', 'completion_date')) {
                $table->dropColumn('completion_date');
            }
            if (Schema::hasColumn('project_milestones', 'actual_percentage')) {
                $table->dropColumn('actual_percentage');
            }
        });
    }
};
