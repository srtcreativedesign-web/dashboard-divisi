<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $table = 'acc_vouchers';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['type', 'outlet_id', 'outlet_name', 'source_division_code', 'voucher_date', 'due_date', 'entity_name', 'source_reference', 'amount', 'description'];

    protected $casts = ['amount' => 'decimal:2', 'version' => 'integer'];
}
