<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $transaction_id
 * @property string $file_path
 * @property string $file_name
 * @property int $file_size
 * @property string $mime_type
 * @property string $uploaded_by_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AccountingTransactionAttachment extends Model
{
    use HasFactory;

    protected $table = 'accounting_transaction_attachments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'transaction_id',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'uploaded_by_id',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(AccountingTransaction::class, 'transaction_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }
}
