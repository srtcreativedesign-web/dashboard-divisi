<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\ReportService;
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

        return response()->json(app(ReportService::class)->list($user, $request->query('status')));
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
            'action' => 'accounting.period_action_locked',
            'entity' => 'AccountingPeriod',
            'divisionCode' => 'ACC',
            'metadata' => [
                'period' => $validated['period'],
                'requestedAction' => $validated['action'],
                'status' => 'STAGE_LOCKED',
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
