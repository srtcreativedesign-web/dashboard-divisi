<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccountingOutstanding extends Model
{
    use HasFactory;

    protected $table = 'accounting_outstandings';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'division_id',
        'period_id',
        'account_id',
        'category_id',
        'outlet_id',
        'code',
        'description',
        'amount',
        'paid_amount',
        'remaining_amount',
        'due_date',
        'status',
        'category_name',
        'cancelled_at',
        'cancelled_by_id',
        'cancellation_reason',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_amount' => 'integer',
        'remaining_amount' => 'integer',
        'due_date' => 'date',
        'cancelled_at' => 'datetime',
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

    public function payments(): HasMany
    {
        return $this->hasMany(AccountingOutstandingPayment::class, 'outstanding_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }
}
