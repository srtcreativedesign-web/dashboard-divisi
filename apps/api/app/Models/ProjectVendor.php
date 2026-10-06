<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectVendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'contact_person',
        'phone',
        'email',
        'bank_details',
    ];

    public function expenses()
    {
        return $this->hasMany(ProjectExpense::class, 'project_vendor_id');
    }
}
