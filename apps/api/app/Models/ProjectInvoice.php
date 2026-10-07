<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'project_milestone_id',
        'invoice_number',
        'term_name',
        'amount',
        'status',
        'due_date',
        'paid_date',
        'payment_reference',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date:Y-m-d',
        'paid_date' => 'date:Y-m-d',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function milestone()
    {
        return $this->belongsTo(ProjectMilestone::class, 'project_milestone_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
