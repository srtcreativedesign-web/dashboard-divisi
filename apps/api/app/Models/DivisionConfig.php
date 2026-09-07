<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DivisionConfig extends Model
{
    protected $table = 'division_configs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'division_id',
        'enabled_modules',
        'enabled_kpis',
        'is_active',
    ];

    protected $casts = [
        'enabled_modules' => 'array',
        'enabled_kpis' => 'array',
        'is_active' => 'boolean',
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
}
