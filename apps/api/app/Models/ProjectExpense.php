<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectExpense extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'project_rab_id',
        'project_vendor_id',
        'item_name',
        'category',
        'amount',
        'expense_date',
        'receipt_path',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date:Y-m-d',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function rab()
    {
        return $this->belongsTo(ProjectRab::class, 'project_rab_id');
    }

    public function vendor()
    {
        return $this->belongsTo(ProjectVendor::class, 'project_vendor_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
