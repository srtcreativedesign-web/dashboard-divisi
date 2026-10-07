<?php

namespace App\Models\Accounting;

use App\Services\Accounting\VoucherPaymentService;
use Illuminate\Database\Eloquent\Model;

class VoucherPayment extends Model
{
    protected $table = 'acc_voucher_payments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['file_path', 'source_key', 'amount_cents'];

    protected $appends = ['amount'];

    protected $casts = ['amount_cents' => 'integer', 'size_bytes' => 'integer'];

    public function getAmountAttribute(): string
    {
        return VoucherPaymentService::money($this->amount_cents);
    }
}
