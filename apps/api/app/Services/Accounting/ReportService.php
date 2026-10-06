<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\AccountingPeriod;
use App\Services\AuditService;
use App\Services\PolicyService;

class ReportService
{
    private const LABELS = [
        'draft' => 'Draft',
        'pending_approval' => 'Menunggu Persetujuan',
        'needs_correction' => 'Perlu Koreksi',
        'approved' => 'Disetujui',
        'closed' => 'Ditutup',
        'reopened' => 'Dibuka Kembali',
    ];

    public function __construct(private PolicyService $policy, private AuditService $audit) {}

    public function list(array $user, mixed $statusFilter = null): array
    {
        $this->policy->assertDivisionScope($user, 'ACC');
        $this->policy->assertCapability($user, 'view:acc_report');
        $status = null;
        if ($statusFilter !== null && $statusFilter !== '') {
            if (! is_string($statusFilter)) {
                throw new ApiException('VALIDATION_ERROR', 'Filter status laporan harus berupa teks');
            }
            $status = match (strtolower($statusFilter)) {
                'draft' => 'draft',
                'disetujui', 'approved' => 'approved',
                'ditutup', 'closed' => 'closed',
                default => throw new ApiException('VALIDATION_ERROR', 'Filter status laporan tidak valid: gunakan Disetujui, Ditutup, atau Draft'),
            };
        }

        $bod = ($user['role'] ?? '') === 'BOD';
        if ($bod && $status === 'draft') {
            $this->audit->log([
                'actorId' => $user['sub'] ?? $user['id'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => 'BOD',
                'action' => 'policy.forbidden_capability',
                'entity' => 'AccountingReport',
                'divisionCode' => 'ACC',
                'metadata' => ['capability' => 'view:acc_report', 'requested_status' => $statusFilter],
            ]);
            throw new ApiException('FORBIDDEN_CAPABILITY', 'BOD hanya dapat mengakses laporan Accounting yang sudah disetujui atau ditutup');
        }

        $query = AccountingPeriod::query()
            ->whereHas('division', fn ($division) => $division->where('code', 'ACC'))
            ->with(['approvedBy', 'closedBy']);
        if ($bod) {
            $query->whereIn('status', ['approved', 'closed']);
        }
        if ($status !== null) {
            $query->where('status', $status);
        }

        $reports = $query->orderBy('period_month', 'desc')->get()->map(fn ($period) => [
            'id' => 'rep-acc-'.$period->period_month->format('Y-m'),
            'period' => $period->period_month->format('Y-m'),
            'title' => 'Laporan Cashflow Accounting '.$period->period_month->format('F Y'),
            'status' => self::LABELS[$period->status] ?? $period->status,
            'balanceStart' => null,
            'balanceEnd' => null,
            'approvedAt' => $period->approved_at?->toIso8601String(),
            'approvedBy' => $period->approvedBy?->name,
            'closedAt' => $period->closed_at?->toIso8601String(),
            'closedBy' => $period->closedBy?->name,
        ])->all();

        if (! $this->policy->hasCapability($user, 'view:acc_detail')) {
            return array_map(fn ($report) => array_intersect_key($report, array_flip(['id', 'period', 'title', 'status'])), $reports);
        }

        return $reports;
    }
}
