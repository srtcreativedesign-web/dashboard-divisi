<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $table = 'acc_vouchers';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['type', 'outlet_id', 'outlet_name', 'source_division_code', 'voucher_date', 'due_date', 'entity_name', 'source_reference', 'amount', 'description', 'company_name', 'priority', 'payment_method', 'bank_name', 'bank_account_holder', 'bank_account', 'invoice_number', 'invoice_date', 'tax_invoice_number', 'billing_period', 'delivery_reference'];

    protected $attributes = ['priority' => 'NORMAL', 'payment_method' => 'UNDECIDED'];

    protected $hidden = ['bank_account'];

    protected $appends = ['bank_account_masked'];

    public function getBankAccountMaskedAttribute(): ?string
    {
        return $this->bank_account ? '••••'.substr($this->bank_account, -4) : null;
    }

    protected $casts = ['amount' => 'decimal:2', 'version' => 'integer', 'bank_account' => 'encrypted'];
}
