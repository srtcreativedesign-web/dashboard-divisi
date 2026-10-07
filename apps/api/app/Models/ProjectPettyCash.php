<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectPettyCash extends Model
{
    use HasFactory;

    protected $table = 'project_petty_cashes';

    protected $fillable = [
        'project_id',
        'type',
        'category',
        'amount',
        'transaction_date',
        'description',
        'recipient_or_vendor',
        'receipt_path',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date:Y-m-d',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
