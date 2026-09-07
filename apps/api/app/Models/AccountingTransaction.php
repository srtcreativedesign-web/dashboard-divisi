<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountingTransaction extends Model
{
    use HasFactory;

    protected $table = 'accounting_transactions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'division_id', 'period_id', 'account_id', 'category_id', 'outlet_id',
        'transaction_date', 'description', 'reference_no', 'debit_amount', 'credit_amount',
        'is_draft', 'cancelled_at', 'cancelled_by_id', 'cancellation_reason', 'version',
        'created_by_id', 'updated_by_id', 'idempotency_key', 'request_hash',
    ];

    protected $casts = [
        'transaction_date' => 'date', 'debit_amount' => 'integer', 'credit_amount' => 'integer',
        'is_draft' => 'boolean', 'cancelled_at' => 'datetime', 'version' => 'integer',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(AccountingPeriod::class, 'period_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(AccountingAccount::class, 'account_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountingCategory::class, 'category_id');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AccountingTransactionAttachment::class, 'transaction_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('cancelled_at');
    }
}
