<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

class VoucherAttachment extends Model
{
    protected $table = 'acc_voucher_attachments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = ['file_path'];

    protected $casts = ['size_bytes' => 'integer'];
}
