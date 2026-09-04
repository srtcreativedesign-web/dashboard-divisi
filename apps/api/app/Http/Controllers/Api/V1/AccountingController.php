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

        if ($statusFilter !== null && $statusFilter !== '') {
            $normalizedStatus = strtolower($statusFilter);
            if (! in_array($normalizedStatus, ['disetujui', 'ditutup', 'draft'], true)) {
                throw new ApiException('VALIDATION_ERROR', 'Filter status laporan tidak valid: gunakan Disetujui, Ditutup, atau Draft');
            }

            // BOD hanya diizinkan membaca laporan berstatus Disetujui atau Ditutup
            if ($role === 'BOD' && $normalizedStatus === 'draft') {
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

        // Mock fixture laporan tahap 1 yang sesuai kontrak SOP
        $allReports = [
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
            [
                'id' => 'rep-acc-2026-09',
                'period' => '2026-09',
                'title' => 'Laporan Cashflow Accounting September 2026',
                'status' => 'Draft',
                'balanceStart' => '1750000000.00',
                'balanceEnd' => '1820000000.00',
                'approvedAt' => null,
                'approvedBy' => null,
            ],
        ];

        // Filter visibilitas berdasarkan role: BOD tidak pernah menerima draft
        $availableReports = $role === 'BOD'
            ? array_values(array_filter($allReports, fn ($r) => in_array(strtolower($r['status']), ['disetujui', 'ditutup'], true)))
            : $allReports;

        // Terapkan filter query parameter ?status bila disertakan
        if ($statusFilter !== null && $statusFilter !== '') {
            $filteredReports = array_values(array_filter(
                $availableReports,
                fn ($r) => strcasecmp($r['status'], $statusFilter) === 0
            ));
        } else {
            $filteredReports = $availableReports;
        }

        return response()->json($filteredReports);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->policy->assertDivisionScope($user, 'ACC');

        // Validasi input kontrak tahap 1
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:DEBIT,CREDIT',
            'description' => 'required|string|max:255',
            'referenceNo' => 'nullable|string|max:100',
        ]);

        // Fail-closed: Tahap 1 hanya menetapkan fondasi & guard; persistensi jurnal aktif pada tahap berikutnya
        throw new ApiException(
            'STAGE_LOCKED',
            'Persistensi transaksi jurnal Accounting terkunci pada Tahap 1 Fondasi (tersedia pada tahap implementasi jurnal berikutnya).'
        );
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

        // Fail-closed: Tahap 1 hanya menetapkan fondasi & guard; workflow approval aktif pada tahap berikutnya
        throw new ApiException(
            'STAGE_LOCKED',
            'Workflow approval periode Accounting terkunci pada Tahap 1 Fondasi (tersedia pada tahap implementasi approval berikutnya).'
        );
    }
}
