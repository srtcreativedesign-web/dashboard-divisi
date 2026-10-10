<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_inventory_documents', function (Blueprint $table) {
            $table->foreignUuid('voucher_id')->nullable()->after('destination_location_id')->constrained('acc_vouchers')->restrictOnDelete();
            $table->index(['voucher_id', 'status'], 'acc_inventory_voucher_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('acc_inventory_documents', function (Blueprint $table) {
            $table->dropIndex('acc_inventory_voucher_status_index');
            $table->dropConstrainedForeignId('voucher_id');
        });
    }
};
