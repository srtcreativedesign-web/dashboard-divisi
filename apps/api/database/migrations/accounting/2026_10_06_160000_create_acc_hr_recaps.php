<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $t) {
            $t->string('source_reference')->nullable();
        });
        Schema::create('acc_hr_recaps', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('employee_id');
            $t->foreign('employee_id')->references('id')->on('employees');
            $t->string('employee_code');
            $t->string('employee_name');
            $t->string('kind', 20);
            $t->date('start_date');
            $t->date('end_date');
            $t->string('leave_type', 100)->nullable();
            $t->unsignedInteger('source_days_hundredths')->nullable();
            $t->string('approval_reference')->nullable();
            $t->string('attendance_status', 20)->nullable();
            $t->string('schedule_reference')->nullable();
            $t->unsignedInteger('late_minutes')->nullable();
            $t->string('source_reference');
            $t->string('source_key', 64)->unique();
            $t->string('status', 20)->default('recorded');
            $t->unsignedInteger('version')->default(1);
            $t->uuid('created_by');
            $t->timestampsTz();
            $t->index(['kind', 'start_date', 'end_date', 'status']);
        });
        DB::statement("CREATE UNIQUE INDEX acc_hr_attendance_active_unique ON acc_hr_recaps(employee_id,start_date) WHERE kind='attendance' AND status='recorded'");
        Schema::create('acc_hr_events', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('record_id')->constrained('acc_hr_recaps');
            $t->uuid('actor_id');
            $t->string('actor_role', 30);
            $t->string('action', 30);
            $t->unsignedInteger('version');
            $t->unique(['record_id', 'version']);
            $t->text('reason')->nullable();
            $t->json('before')->nullable();
            $t->json('after');
            $t->timestampTz('created_at');
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE acc_hr_recaps ADD CONSTRAINT acc_hr_values_valid CHECK ((start_date <= end_date AND version >= 1 AND status IN ('recorded','voided') AND ((kind='leave' AND leave_type IS NOT NULL AND source_days_hundredths BETWEEN 1 AND 36600 AND approval_reference IS NOT NULL AND attendance_status IS NULL AND late_minutes IS NULL AND schedule_reference IS NULL) OR (kind='attendance' AND start_date=end_date AND attendance_status IN ('PRESENT','ABSENT','LEAVE','SICK','OFF') AND late_minutes BETWEEN 0 AND 1440 AND schedule_reference IS NOT NULL AND leave_type IS NULL AND source_days_hundredths IS NULL AND approval_reference IS NULL))) IS TRUE)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_hr_events');
        Schema::dropIfExists('acc_hr_recaps');
        Schema::table('employees', function (Blueprint $t) {
            $t->dropColumn('source_reference');
        });
    }
};
