<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'division_code',
        'project_code',
        'name',
        'client_name',
        'location',
        'contract_value',
        'status',
        'start_date',
        'end_date',
        'description',
    ];

    public function milestones()
    {
        return $this->hasMany(ProjectMilestone::class);
    }

    public function rabs()
    {
        return $this->hasMany(ProjectRab::class);
    }

    public function documents()
    {
        return $this->hasMany(ProjectDocument::class);
    }

    public function photos()
    {
        return $this->hasMany(ProjectProgressPhoto::class);
    }

    public function expenses()
    {
        return $this->hasMany(ProjectExpense::class);
    }

    public function invoices()
    {
        return $this->hasMany(ProjectInvoice::class);
    }
}
