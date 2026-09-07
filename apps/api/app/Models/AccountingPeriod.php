<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AccountingPeriod extends Model
{
    protected $table = 'accounting_periods';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'division_id',
        'period_month',
        'status',
        'created_by_id',
        'updated_by_id',
        'approved_by_id',
        'closed_by_id',
        'approved_at',
        'closed_at',
        'notes',
        'version',
    ];

    protected $casts = [
        'period_month' => 'date',
        'approved_at' => 'datetime',
        'closed_at' => 'datetime',
        'version' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }
}
