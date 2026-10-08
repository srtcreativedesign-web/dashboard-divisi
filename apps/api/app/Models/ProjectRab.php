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

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function expenses()
    {
        return $this->hasMany(ProjectExpense::class);
    }
}
