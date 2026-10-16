<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BodReportBreakdown extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'bod_report_breakdowns';

    protected $fillable = [
        'report_id',
        'entity_code',
        'entity_name',
        'figures',
        'display_order',
    ];

    protected $casts = [
        'figures' => 'array',
        'display_order' => 'integer',
    ];

    public function report()
    {
        return $this->belongsTo(BodDivisionReport::class, 'report_id');
    }
}
