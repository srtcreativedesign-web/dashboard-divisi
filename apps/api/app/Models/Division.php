<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Division extends Model
{
    protected $table = 'divisions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'name',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class, 'division_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(EmployeeAssignment::class, 'division_id');
    }

    public function userScopes(): HasMany
    {
        return $this->hasMany(UserScope::class, 'division_id');
    }

    public function config(): HasOne
    {
        return $this->hasOne(DivisionConfig::class, 'division_id');
    }
}
