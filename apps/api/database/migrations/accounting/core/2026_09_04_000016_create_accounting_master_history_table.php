<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_master_history', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('entity_type');    // PERIOD | CATEGORY | ACCOUNT | ACCOUNT_OUTLET
            $table->string('entity_id');
            $table->string('action');         // CREATE | UPDATE | DEACTIVATE | REACTIVATE
            $table->json('changes')->nullable(); // { field: [old, new] }
            $table->string('actor_id')->nullable();
            $table->string('actor_email')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('division_code')->nullable();
            $table->string('trace_id')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
            $table->index('division_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_master_history');
    }
};
