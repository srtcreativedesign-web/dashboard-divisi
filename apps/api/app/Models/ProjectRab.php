<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectRab extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'item_name',
        'category',
        'volume',
        'unit',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'volume' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function expenses()
    {
        return $this->hasMany(ProjectExpense::class, 'project_rab_id');
    }
}
