<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\PolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function __construct(
        protected PolicyService $policy,
        protected AuditService $audit
    ) {}

    public function status(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->policy->assertDivisionScope($user, 'ACC');

        return response()->json([
            'divisionCode' => 'ACC',
            'divisionName' => 'Accounting',
            'status' => 'FOUNDATION_READY',
            'phase' => 1,
            'enabledModules' => ['dashboard', 'accounting'],
            'enabledKpis' => ['accounting.balance'],
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->policy->assertDivisionScope($user, 'ACC');

        $statusFilter = $request->query('status');
        $role = $user['role'] ?? '';

        // BOD hanya diizinkan membaca laporan berstatus Disetujui atau Ditutup
        if ($role === 'BOD') {
            if ($statusFilter && ! in_array(strtolower($statusFilter), ['disetujui', 'ditutup'], true)) {
                $this->audit->log([
                    'actorId' => $user['sub'] ?? $user['id'] ?? null,
                    'actorEmail' => $user['email'] ?? null,
                    'actorRole' => $role,
                    'action' => 'policy.forbidden_capability',
                    'entity' => 'AccountingReport',
                    'divisionCode' => 'ACC',
                    'metadata' => [
                        'capability' => 'view:acc_report',
                        'requested_status' => $statusFilter,
                        'reason' => 'BOD hanya dapat membaca laporan berstatus Disetujui atau Ditutup',
                    ],
                ]);

                throw new ApiException(
                    'FORBIDDEN_CAPABILITY',
                    'BOD hanya dapat mengakses laporan Accounting yang sudah disetujui atau ditutup'
                );
            }
        }

        // Mock response laporan tahap 1 yang sesuai kontrak SOP
        $reports = [
            [
                'id' => 'rep-acc-2026-08',
                'period' => '2026-08',
                'title' => 'Laporan Cashflow Accounting Agustus 2026',
                'status' => 'Disetujui',
                'balanceStart' => '1500000000.00',
                'balanceEnd' => '1750000000.00',
                'approvedAt' => '2026-08-31T23:59:59Z',
                'approvedBy' => 'Manager Accounting',
            ],
            [
                'id' => 'rep-acc-2026-07',
                'period' => '2026-07',
                'title' => 'Laporan Cashflow Accounting Juli 2026',
                'status' => 'Ditutup',
                'balanceStart' => '1200000000.00',
                'balanceEnd' => '1500000000.00',
                'closedAt' => '2026-07-31T23:59:59Z',
                'closedBy' => 'Manager Accounting',
            ],
        ];

        // Jika bukan BOD dan tidak filter status non-draft, sertakan draft
        if ($role !== 'BOD' && (! $statusFilter || strtolower($statusFilter) === 'draft')) {
            $reports[] = [
                'id' => 'rep-acc-2026-09',
                'period' => '2026-09',
                'title' => 'Laporan Cashflow Accounting September 2026',
                'status' => 'Draft',
                'balanceStart' => '1750000000.00',
                'balanceEnd' => '1820000000.00',
                'approvedAt' => null,
                'approvedBy' => null,
            ];
        }

        return response()->json($reports);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->policy->assertDivisionScope($user, 'ACC');

        // Validasi input tahap 1
        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:DEBIT,CREDIT',
            'description' => 'required|string|max:255',
            'referenceNo' => 'nullable|string|max:100',
        ]);

        return response()->json([
            'id' => 'acc-tx-mock-001',
            'divisionCode' => 'ACC',
            'date' => $validated['date'],
            'amount' => number_format((float) $validated['amount'], 2, '.', ''),
            'type' => $validated['type'],
            'description' => $validated['description'],
            'referenceNo' => $validated['referenceNo'] ?? null,
            'status' => 'RECORDED',
            'createdAt' => now()->toISOString(),
        ], 201);
    }

    public function approvePeriod(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->policy->assertDivisionScope($user, 'ACC');

        $validated = $request->validate([
            'period' => 'required|string',
            'action' => 'required|in:APPROVE,REJECT,CLOSE,REOPEN',
            'notes' => 'nullable|string|max:500',
        ]);

        $this->audit->log([
            'actorId' => $user['sub'] ?? $user['id'] ?? null,
            'actorEmail' => $user['email'] ?? null,
            'actorRole' => $user['role'] ?? 'UNKNOWN',
            'action' => 'accounting.period_'.$validated['action'],
            'entity' => 'AccountingPeriod',
            'divisionCode' => 'ACC',
            'metadata' => [
                'period' => $validated['period'],
                'action' => $validated['action'],
                'notes' => $validated['notes'] ?? null,
            ],
        ]);

        return response()->json([
            'period' => $validated['period'],
            'status' => $validated['action'] === 'APPROVE' ? 'Disetujui' : ($validated['action'] === 'CLOSE' ? 'Ditutup' : 'Perlu Koreksi'),
            'updatedBy' => $user['name'] ?? $user['email'] ?? 'Manager Accounting',
            'updatedAt' => now()->toISOString(),
        ]);
    }
}
