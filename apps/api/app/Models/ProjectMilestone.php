<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'weight_percentage',
        'actual_percentage',
        'status',
        'payment_status',
        'due_date',
        'completion_date',
        'notes',
    ];

    protected $casts = [
        'payment_status' => 'boolean',
        'weight_percentage' => 'float',
        'actual_percentage' => 'float',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function photos()
    {
        return $this->hasMany(ProjectProgressPhoto::class, 'milestone_id');
    }
}
