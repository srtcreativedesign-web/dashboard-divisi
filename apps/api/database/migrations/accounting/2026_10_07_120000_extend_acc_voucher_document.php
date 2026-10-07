<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acc_vouchers', function (Blueprint $table) {
            $table->string('company_name', 150)->nullable();
            $table->string('priority', 20)->default('NORMAL');
            $table->string('payment_method', 20)->default('UNDECIDED');
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_holder', 150)->nullable();
            $table->text('bank_account')->nullable();
            $table->string('invoice_number', 150)->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('tax_invoice_number', 150)->nullable();
            $table->string('billing_period', 7)->nullable();
            $table->string('delivery_reference', 150)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('acc_vouchers', fn (Blueprint $table) => $table->dropColumn(['company_name', 'priority', 'payment_method', 'bank_name', 'bank_account_holder', 'bank_account', 'invoice_number', 'invoice_date', 'tax_invoice_number', 'billing_period', 'delivery_reference']));
    }
};
