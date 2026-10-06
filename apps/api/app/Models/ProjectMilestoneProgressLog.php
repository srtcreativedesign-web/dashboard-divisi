<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectMilestoneProgressLog extends Model
{
    protected $fillable = ['milestone_id', 'log_date', 'actual_percentage'];

    protected $casts = [
        'log_date' => 'date:Y-m-d',
        'actual_percentage' => 'float',
    ];
}
