<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_outstandings', function (Blueprint $table) {
            $table->string('direction', 10)->default('PAYABLE')->after('code');
            $table->string('counterparty_name', 200)->nullable()->after('direction');
            $table->string('document_number', 150)->nullable()->after('counterparty_name');
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->index(['division_id', 'period_id', 'direction', 'status'], 'acc_outstanding_direction_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('accounting_outstandings', function (Blueprint $table) {
            $table->dropIndex('acc_outstanding_direction_status_idx');
            $table->dropColumn(['direction', 'counterparty_name', 'document_number', 'version']);
        });
    }
};
