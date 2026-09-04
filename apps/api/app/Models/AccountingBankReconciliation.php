<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingBankReconciliation extends Model
{
    use HasFactory;

    protected $table = 'accounting_bank_reconciliations';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'division_id',
        'period_id',
        'account_id',
        'outlet_id',
        'jul_balance',
        'aug_balance',
        'mutation',
        'notes',
        'is_verified',
        'verified_at',
        'verified_by_id',
    ];

    protected $casts = [
        'jul_balance' => 'float',
        'aug_balance' => 'float',
        'mutation' => 'float',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
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

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }
}
