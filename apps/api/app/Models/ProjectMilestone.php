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

    protected static function booted(): void
    {
        static::saved(function (self $milestone) {
            if ($milestone->wasRecentlyCreated || $milestone->wasChanged('actual_percentage')) {
                ProjectMilestoneProgressLog::updateOrCreate(
                    ['milestone_id' => $milestone->id, 'log_date' => now('Asia/Jakarta')->toDateString()],
                    ['actual_percentage' => $milestone->actual_percentage ?? 0],
                );
            }
        });
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function progressLogs()
    {
        return $this->hasMany(ProjectMilestoneProgressLog::class, 'milestone_id')->orderBy('log_date');
    }

    public function photos()
    {
        return $this->hasMany(ProjectProgressPhoto::class, 'milestone_id');
    }

    public function invoices()
    {
        return $this->hasMany(ProjectInvoice::class, 'project_milestone_id');
    }
}
