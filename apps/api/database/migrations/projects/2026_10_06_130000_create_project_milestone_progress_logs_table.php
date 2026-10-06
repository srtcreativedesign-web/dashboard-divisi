<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_milestone_progress_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('milestone_id')->constrained('project_milestones')->cascadeOnDelete();
            $table->date('log_date');
            $table->decimal('actual_percentage', 5, 2);
            $table->timestamps();
            $table->unique(['milestone_id', 'log_date']);
        });

        // Snapshot progres yang sudah ada supaya chart tidak mulai dari nol.
        $now = now();
        DB::table('project_milestones')->get()->each(fn ($m) => DB::table('project_milestone_progress_logs')->insert([
            'milestone_id' => $m->id,
            'log_date' => substr((string) ($m->updated_at ?? $now), 0, 10),
            'actual_percentage' => $m->actual_percentage ?? 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]));
    }

    public function down(): void
    {
        Schema::dropIfExists('project_milestone_progress_logs');
    }
};
