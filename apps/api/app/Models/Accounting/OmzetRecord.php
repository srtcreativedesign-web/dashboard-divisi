<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

class OmzetRecord extends Model
{
    protected $table = 'acc_omzet_records';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'business_date' => 'date:Y-m-d',
        'requires_ap' => 'boolean',
        'outlet_amount' => 'decimal:2',
        'cash_amount' => 'decimal:2',
        'qris_amount' => 'decimal:2',
        'edc_amount' => 'decimal:2',
        'transfer_amount' => 'decimal:2',
        'other_amount' => 'decimal:2',
        'expense_amount' => 'decimal:2',
        'expected_deposit_amount' => 'decimal:2',
        'ap_amount' => 'decimal:2',
        'version' => 'integer',
    ];
}
