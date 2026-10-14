<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cel_settlement_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('settlement_id')->constrained('cel_settlements')->restrictOnDelete();
            $table->uuid('uploaded_by');
            $table->string('original_name', 240);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->string('sha256', 64);
            $table->string('file_path');
            $table->timestampsTz();
            $table->unique(['settlement_id', 'sha256'], 'cel_settlement_attachment_hash_unique');
            $table->index(['settlement_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cel_settlement_attachments');
    }
};
