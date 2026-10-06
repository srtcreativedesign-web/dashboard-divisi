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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('project_code')->nullable()->unique()->after('id');
            $table->string('location')->nullable()->after('client_name');
            $table->text('description')->nullable()->after('end_date');
        });

        Schema::table('project_milestones', function (Blueprint $table) {
            $table->decimal('actual_percentage', 5, 2)->default(0)->after('weight_percentage');
            $table->date('completion_date')->nullable()->after('due_date');
            $table->text('notes')->nullable()->after('completion_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_milestones', function (Blueprint $table) {
            $table->dropColumn(['actual_percentage', 'completion_date', 'notes']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['project_code', 'location', 'description']);
        });
    }
};
