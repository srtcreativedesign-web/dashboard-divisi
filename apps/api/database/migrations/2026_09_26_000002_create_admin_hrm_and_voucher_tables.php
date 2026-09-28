<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_leave_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('division_code', 10);
            $table->string('leave_type', 50); // TAHUNAN, SAKIT, IZIN
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('days_taken');
            $table->string('status', 20)->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_attendance_realizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('division_code', 10);
            $table->date('period_start');
            $table->date('period_end');
            $table->integer('days_scheduled');
            $table->integer('days_present');
            $table->integer('days_absent')->default(0);
            $table->integer('days_leave')->default(0);
            $table->integer('days_sick')->default(0);
            $table->integer('minutes_late')->default(0);
            $table->string('status', 20)->default('DRAFT'); // DRAFT, SUBMITTED, LOCKED
            $table->timestamps();
        });

        Schema::create('admin_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('division_code', 10);
            $table->string('voucher_no', 50)->unique();
            $table->string('type', 20); // BILLING, PURCHASING
            $table->string('entity_name', 150);
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('DRAFT'); // DRAFT, APPROVED, PAID, CANCELLED
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_vouchers');
        Schema::dropIfExists('admin_attendance_realizations');
        Schema::dropIfExists('admin_leave_records');
    }
};
