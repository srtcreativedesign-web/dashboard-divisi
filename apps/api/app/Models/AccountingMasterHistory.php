<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AccountingMasterHistory extends Model
{
    protected $table = 'accounting_master_history';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'entity_type',
        'entity_id',
        'action',
        'changes',
        'actor_id',
        'actor_email',
        'actor_role',
        'division_code',
        'trace_id',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
