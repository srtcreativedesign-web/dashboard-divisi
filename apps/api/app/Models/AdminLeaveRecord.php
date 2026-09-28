<?php

namespace App\Models;

use App\Models\Concerns\HasDivisionScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminLeaveRecord extends Model
{
    use HasDivisionScope;

    protected $table = 'admin_leave_records';

    protected $fillable = [
        'employee_id',
        'division_code',
        'leave_type',
        'start_date',
        'end_date',
        'days_taken',
        'status',
        'notes',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
