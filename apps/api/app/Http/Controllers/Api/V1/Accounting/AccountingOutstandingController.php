<?php

namespace App\Http\Controllers\Api\V1\Accounting;

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
            'direction' => $request->query('direction'),
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
            'direction' => 'required|in:PAYABLE,RECEIVABLE',
            'counterparty_name' => 'required|string|max:200',
            'document_number' => 'nullable|string|max:150',
            'amount' => 'required|integer|min:1',
            'due_date' => 'required|date_format:Y-m-d',
            'category_name' => 'nullable|string|max:100',
            'period_id' => 'required|uuid',
            'account_id' => 'nullable|uuid',
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
            'account_id' => 'nullable|uuid',
            'payment_date' => 'required|date_format:Y-m-d',
            'notes' => 'required|string|min:10|max:500',
            'version' => 'required|integer|min:1',
        ]);

        try {
            $division = Division::where('code', 'ACC')->firstOrFail();
            $result = $this->outstandingService->recordPayment($division, $id, $validated, $user);

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
            'version' => 'required|integer|min:1',
        ]);

        try {
            $division = Division::where('code', 'ACC')->firstOrFail();
            $item = $this->outstandingService->cancel($division, $id, $validated['reason'], (int) $validated['version'], $user);

            return response()->json($item);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('CANCEL_ERROR', $e->getMessage(), null, 422);
        }
    }
}
