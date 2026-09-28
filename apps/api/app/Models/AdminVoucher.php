<?php

namespace App\Models;

use App\Models\Concerns\HasDivisionScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminVoucher extends Model
{
    use HasDivisionScope;

    protected $table = 'admin_vouchers';

    protected $fillable = [
        'division_code',
        'voucher_no',
        'type',
        'entity_name',
        'amount',
        'description',
        'status',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
