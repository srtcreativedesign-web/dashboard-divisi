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
        if (! Schema::hasTable('project_progress_photos')) {
            Schema::create('project_progress_photos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->foreignId('milestone_id')->nullable()->constrained('project_milestones')->nullOnDelete();
                $table->enum('stage', ['before', 'in_progress', 'after'])->default('before');
                $table->string('area_name')->nullable();
                $table->string('caption')->nullable();
                $table->string('photo_path');
                $table->date('taken_at')->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_progress_photos');
    }
};
