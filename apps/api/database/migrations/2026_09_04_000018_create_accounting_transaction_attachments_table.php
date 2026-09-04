<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_transaction_attachments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('transaction_id');
            $table->foreign('transaction_id')->references('id')->on('accounting_transactions')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('file_size');
            $table->string('mime_type', 100);
            $table->string('uploaded_by_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_transaction_attachments');
    }
};
