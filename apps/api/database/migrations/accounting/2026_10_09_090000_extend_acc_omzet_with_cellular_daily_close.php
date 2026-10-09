<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_omzet_records', function (Blueprint $table) {
            $table->decimal('expense_amount', 16, 2)->default(0);
            $table->decimal('expected_deposit_amount', 16, 2)->default(0);
        });

        Schema::create('acc_omzet_shift_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('record_id')->constrained('acc_omzet_records')->cascadeOnDelete();
            $table->unsignedTinyInteger('shift_no');
            $table->decimal('gross_amount', 16, 2);
            $table->timestampsTz();
            $table->unique(['record_id', 'shift_no']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE acc_omzet_records ADD CONSTRAINT acc_omzet_daily_amounts_valid CHECK (expense_amount >= 0 AND expected_deposit_amount >= 0)');
            DB::statement('ALTER TABLE acc_omzet_shift_lines ADD CONSTRAINT acc_omzet_shift_values_valid CHECK (shift_no BETWEEN 1 AND 3 AND gross_amount >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_omzet_shift_lines');
        Schema::table('acc_omzet_records', fn (Blueprint $table) => $table->dropColumn(['expense_amount', 'expected_deposit_amount']));
    }
};
