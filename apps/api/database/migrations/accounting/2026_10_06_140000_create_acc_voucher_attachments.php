<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acc_voucher_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('voucher_id')->constrained('acc_vouchers');
            $table->uuid('uploaded_by');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('sha256', 64);
            $table->string('file_path');
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acc_voucher_attachments');
    }
};
