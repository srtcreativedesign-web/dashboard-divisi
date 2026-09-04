<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AccountingAccount extends Model
{
    protected $table = 'accounting_accounts';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'display_name',
        'type',
        'display_order',
        'is_active',
        'division_id',
        'category_id',
        'description',
        'effective_from',
        'effective_to',
        'version',
        'created_by_id',
        'updated_by_id',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountingCategory::class, 'category_id');
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(AccountingAccountOutlet::class, 'account_id');
    }
}
