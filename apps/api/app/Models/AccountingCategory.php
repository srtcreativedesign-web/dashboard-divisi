<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AccountingCategory extends Model
{
    protected $table = 'accounting_categories';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'name',
        'parent',
        'display_order',
        'is_active',
        'requires_outlet',
        'effective_from',
        'effective_to',
        'version',
        'created_by_id',
        'updated_by_id',
        'aliases',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'requires_outlet' => 'boolean',
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

    public function aliases(): HasMany
    {
        return $this->hasMany(AccountingCategoryAlias::class, 'canonical_id');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(AccountingAccount::class, 'category_id');
    }
}
