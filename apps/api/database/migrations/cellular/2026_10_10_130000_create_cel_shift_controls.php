<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cel_shift_controls', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->uuid('outlet_id'); $table->date('business_date'); $table->string('shift_code', 20);
            $table->string('pic_name', 120); $table->timestampTz('due_at'); $table->string('priority', 12)->default('normal');
            $table->json('checklist'); $table->text('issue_summary')->nullable(); $table->string('status', 20)->default('draft'); $table->text('review_note')->nullable();
            $table->uuid('created_by'); $table->uuid('reviewed_by')->nullable(); $table->uuid('supervised_by')->nullable(); $table->uuid('resolved_by')->nullable();
            $table->unsignedInteger('version')->default(1); $table->timestampsTz();
            $table->unique(['outlet_id', 'business_date', 'shift_code']); $table->index(['business_date', 'status', 'due_at']);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE cel_shift_controls ADD CONSTRAINT cel_shift_priority CHECK (priority IN ('normal','high','critical'))");
            DB::statement("ALTER TABLE cel_shift_controls ADD CONSTRAINT cel_shift_status CHECK (status IN ('draft','submitted','reviewed','correction','escalated','resolved'))");
            DB::statement('ALTER TABLE cel_shift_controls ADD CONSTRAINT cel_shift_version CHECK (version >= 1)');
        }
    }
    public function down(): void { Schema::dropIfExists('cel_shift_controls'); }
};
