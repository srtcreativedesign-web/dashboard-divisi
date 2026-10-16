<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BodReportMetric extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bod_report_metrics';

    protected $fillable = [
        'report_id',
        'category',
        'metric_key',
        'metric_label',
        'metric_value',
        'unit',
        'display_order',
    ];

    protected $casts = [
        'metric_value' => 'decimal:2',
        'display_order' => 'integer',
    ];

    public function report()
    {
        return $this->belongsTo(BodDivisionReport::class, 'report_id');
    }
}
