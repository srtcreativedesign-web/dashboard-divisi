<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\User;
use App\Services\AccOutstandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountingOutstandingController extends Controller
{
    public function __construct(
        protected AccOutstandingService $outstandingService
    ) {}

    public function list(Request $request): JsonResponse
    {
        $division = Division::where('code', 'ACC')->firstOrFail();
        $filters = [
            'period_id' => $request->query('period_id'),
            'status' => $request->query('status'),
            'search' => $request->query('search'),
        ];

        $data = $this->outstandingService->getOutstandings($division, $filters);

        return response()->json($data);
    }

    public function create(Request $request): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'description' => 'required|string|max:500',
            'amount' => 'required|integer|min:1',
            'due_date' => 'nullable|date',
            'category_name' => 'nullable|string|max:100',
            'period_id' => 'nullable|string',
            'account_id' => 'nullable|string',
        ]);

        $division = Division::where('code', 'ACC')->firstOrFail();

        try {
            $item = $this->outstandingService->create($division, $validated, $user);

            return response()->json($item, 201);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('VALIDATION_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'account_id' => 'nullable|string',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->outstandingService->recordPayment($id, $validated, $user);

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('PAYMENT_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $item = $this->outstandingService->cancel($id, $validated['reason'], $user);

            return response()->json($item);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('CANCEL_ERROR', $e->getMessage(), null, 422);
        }
    }
}
