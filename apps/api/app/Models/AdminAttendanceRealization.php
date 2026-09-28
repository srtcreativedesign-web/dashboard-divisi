<?php

namespace App\Models;

use App\Models\Concerns\HasDivisionScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAttendanceRealization extends Model
{
    use HasDivisionScope;

    protected $table = 'admin_attendance_realizations';

    protected $fillable = [
        'employee_id',
        'division_code',
        'period_start',
        'period_end',
        'days_scheduled',
        'days_present',
        'days_absent',
        'days_leave',
        'days_sick',
        'minutes_late',
        'status',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
