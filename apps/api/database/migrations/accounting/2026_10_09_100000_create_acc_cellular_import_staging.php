<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_cellular_import_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('division_code', 10)->default('ACC');
            $table->uuid('outlet_id');
            $table->string('outlet_name');
            $table->string('source_division_code', 20);
            $table->string('profile', 20);
            $table->unsignedSmallInteger('profile_version');
            $table->string('period', 7);
            $table->string('original_name', 200);
            $table->string('sha256', 64);
            $table->string('status', 20)->default('staged');
            $table->json('summary');
            $table->json('issues');
            $table->uuid('created_by');
            $table->uuid('committed_by')->nullable();
            $table->timestampTz('committed_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->unique(['outlet_id', 'period', 'profile', 'sha256'], 'acc_cellular_batch_source_unique');
            $table->index(['outlet_id', 'period', 'status']);
        });

        Schema::create('acc_cellular_import_rows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->constrained('acc_cellular_import_batches')->cascadeOnDelete();
            $table->date('business_date');
            $table->string('validation_status', 20);
            $table->json('payload');
            $table->json('lineage');
            $table->json('issues');
            $table->timestampsTz();
            $table->unique(['batch_id', 'business_date']);
            $table->index(['business_date', 'validation_status']);
        });

        Schema::create('acc_cellular_import_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('batch_id')->constrained('acc_cellular_import_batches')->cascadeOnDelete();
            $table->uuid('actor_id');
            $table->string('actor_role', 30);
            $table->string('action', 30);
            $table->json('metadata');
            $table->timestampTz('created_at');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE acc_cellular_import_batches ADD CONSTRAINT acc_cellular_batch_values_valid CHECK (profile IN ('daily','income','shift','ecsys','update') AND status IN ('staged','committed','superseded') AND version >= 1)");
            DB::statement("ALTER TABLE acc_cellular_import_rows ADD CONSTRAINT acc_cellular_row_status_valid CHECK (validation_status IN ('valid','warning','error'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_cellular_import_events');
        Schema::dropIfExists('acc_cellular_import_rows');
        Schema::dropIfExists('acc_cellular_import_batches');
    }
};
