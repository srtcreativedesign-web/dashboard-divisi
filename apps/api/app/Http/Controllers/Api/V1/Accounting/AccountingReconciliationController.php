<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Services\AccPeriodService;
use App\Services\AccReconciliationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingReconciliationController extends Controller
{
    public function __construct(
        protected AccReconciliationService $reconciliationService,
        protected AccPeriodService $periodService
    ) {}

    public function list(Request $request): JsonResponse
    {
        $division = Division::where('code', 'ACC')->firstOrFail();
        $filters = [
            'period_id' => $request->query('period_id'),
            'bank_name' => $request->query('bank_name'),
            'search' => $request->query('search'),
        ];

        $data = $this->reconciliationService->getReconciliations($division, $filters);

        return response()->json($data);
    }

    public function submitPeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);
        $period = $this->periodService->transition($request->attributes->get('user') ?? [], $validated['period_id'], AccPeriodService::STATUS_PENDING, $validated['notes'] ?? null);

        return response()->json($this->periodService->toResource($period));
    }

    public function approvePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        $period = $this->periodService->transition($request->attributes->get('user') ?? [], $validated['period_id'], AccPeriodService::STATUS_APPROVED, $validated['notes'] ?? null);

        return response()->json($this->periodService->toResource($period));
    }

    public function closePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'required|string|min:10|max:500',
        ]);
        $period = $this->periodService->transition($request->attributes->get('user') ?? [], $validated['period_id'], AccPeriodService::STATUS_CLOSED, $validated['notes']);

        return response()->json($this->periodService->toResource($period));
    }

    public function reopenPeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'required|string|min:10|max:500',
        ]);
        $period = $this->periodService->transition($request->attributes->get('user') ?? [], $validated['period_id'], AccPeriodService::STATUS_REOPENED, $validated['notes']);

        return response()->json($this->periodService->toResource($period));
    }
}
