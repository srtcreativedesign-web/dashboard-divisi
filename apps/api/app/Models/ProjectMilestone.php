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
        'actual_percentage',
        'completion_date',
        'notes',
    ];

    protected $casts = [
        'payment_status' => 'boolean',
        'weight_percentage' => 'float',
        'actual_percentage' => 'float',
        'completion_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function invoices()
    {
        return $this->hasMany(ProjectInvoice::class);
    }
}
