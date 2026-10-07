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
        'status',
        'payment_status',
        'due_date',
    ];

    protected $casts = [
        'payment_status' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
