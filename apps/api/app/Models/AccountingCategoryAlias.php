<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AccountingCategoryAlias extends Model
{
    protected $table = 'accounting_category_aliases';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'alias_code',
        'canonical_id',
        'normalized_alias',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AccountingCategory::class, 'canonical_id');
    }
}
