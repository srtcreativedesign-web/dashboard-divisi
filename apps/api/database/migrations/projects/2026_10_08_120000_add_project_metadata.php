<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'project_code')) {
                $table->string('project_code', 100)->nullable()->index();
            }
            if (! Schema::hasColumn('projects', 'location')) {
                $table->string('location')->nullable();
            }
            if (! Schema::hasColumn('projects', 'description')) {
                $table->text('description')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['project_code', 'location', 'description']);
        });
    }
};
