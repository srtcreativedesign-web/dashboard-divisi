<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::addGlobalScope('project_module', function (Builder $query) {
            $query->where('projects.division_code', 'PROJECT');
        });
    }

    protected $fillable = [
        'division_code',
        'name',
        'client_name',
        'contract_value',
        'status',
        'start_date',
        'end_date',
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
}
