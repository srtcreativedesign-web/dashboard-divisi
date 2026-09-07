<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\User;
use App\Services\AccReconciliationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountingReconciliationController extends Controller
{
    public function __construct(
        protected AccReconciliationService $reconciliationService
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
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $period = $this->reconciliationService->updatePeriodStatus($validated['period_id'], 'submitted', $validated['notes'] ?? null, $user);

            return response()->json($period);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('TRANSITION_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function approvePeriod(Request $request): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $period = $this->reconciliationService->updatePeriodStatus($validated['period_id'], 'approved', $validated['notes'] ?? null, $user);

            return response()->json($period);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('TRANSITION_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function closePeriod(Request $request): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $period = $this->reconciliationService->updatePeriodStatus($validated['period_id'], 'closed', $validated['notes'] ?? null, $user);

            return response()->json($period);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('TRANSITION_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function reopenPeriod(Request $request): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'period_id' => 'required|string',
            'notes' => 'required|string|max:500',
        ]);

        try {
            $period = $this->reconciliationService->updatePeriodStatus($validated['period_id'], 'draft', $validated['notes'], $user);

            return response()->json($period);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('TRANSITION_ERROR', $e->getMessage(), null, 422);
        }
    }
}
