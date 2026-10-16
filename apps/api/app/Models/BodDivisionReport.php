<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BodDivisionReport extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bod_division_reports';

    protected $fillable = [
        'division_code',
        'period_start',
        'period_end',
        'status',
        'submitted_by',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'acknowledged_by',
        'acknowledged_at',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date:Y-m-d',
        'period_end' => 'date:Y-m-d',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'acknowledged_at' => 'datetime',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class, 'division_code', 'code');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function acknowledger()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function metrics()
    {
        return $this->hasMany(BodReportMetric::class, 'report_id')->orderBy('display_order');
    }

    public function breakdowns()
    {
        return $this->hasMany(BodReportBreakdown::class, 'report_id')->orderBy('display_order');
    }
}
