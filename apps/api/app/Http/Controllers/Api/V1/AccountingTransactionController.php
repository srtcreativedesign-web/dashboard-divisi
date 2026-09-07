<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AccountingTransactionAttachment;
use App\Services\AccTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AccountingTransactionController extends Controller
{
    public function __construct(
        protected AccTransactionService $txService
    ) {}

    public function list(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $result = $this->txService->list($user, [
            'period_id' => $request->query('period_id'),
            'account_id' => $request->query('account_id'),
            'category_id' => $request->query('category_id'),
            'outlet_id' => $request->query('outlet_id'),
            'start_date' => $request->query('start_date'),
            'end_date' => $request->query('end_date'),
            'is_draft' => $request->query('is_draft'),
            'include_cancelled' => $request->query('include_cancelled'),
            'search' => $request->query('search'),
            'per_page' => $request->query('per_page', 50),
            'page' => $request->query('page', 1),
        ]);

        return response()->json($result['data'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $validated = $request->validate([
            'period_id' => 'required|uuid',
            'account_id' => 'required|uuid',
            'category_id' => 'required|uuid',
            'outlet_id' => 'nullable|uuid',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:1000',
            'reference_no' => 'nullable|string|max:100',
            'debit_amount' => 'nullable|integer|min:0',
            'credit_amount' => 'nullable|integer|min:0',
            'is_draft' => 'nullable|boolean',
        ]);
        if (strlen((string) $request->header('Idempotency-Key')) > 100) {
            throw new ApiException('VALIDATION_ERROR', 'Idempotency-Key maksimal 100 karakter', null, 422);
        }
        $validated['idempotency_key'] = $request->header('Idempotency-Key');

        $tx = $this->txService->create($user, $validated);

        return response()->json($this->txService->toResource($tx), 201);
    }

    public function get(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $tx = $this->txService->find($user, $id);

        return response()->json($this->txService->toResource($tx));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $validated = $request->validate([
            'account_id' => 'nullable|uuid',
            'category_id' => 'nullable|uuid',
            'outlet_id' => 'nullable|uuid',
            'transaction_date' => 'nullable|date',
            'description' => 'nullable|string|max:1000',
            'reference_no' => 'nullable|string|max:100',
            'debit_amount' => 'nullable|integer|min:0',
            'credit_amount' => 'nullable|integer|min:0',
            'is_draft' => 'nullable|boolean',
            'version' => 'nullable|integer',
        ]);

        $tx = $this->txService->update($user, $id, $validated);

        return response()->json($this->txService->toResource($tx));
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        $tx = $this->txService->cancel($user, $id, $validated['cancellation_reason']);

        return response()->json($this->txService->toResource($tx));
    }

    public function uploadAttachment(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];

        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
        ]);

        $attachment = $this->txService->addAttachment($user, $id, $request->file('file'));

        return response()->json([
            'id' => $attachment->id,
            'fileName' => $attachment->file_name,
            'fileSize' => $attachment->file_size,
            'mimeType' => $attachment->mime_type,
            'createdAt' => $attachment->created_at?->toISOString(),
        ], 201);
    }

    public function downloadAttachment(Request $request, string $id, string $attachmentId): BinaryFileResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $tx = $this->txService->find($user, $id);

        $attachment = AccountingTransactionAttachment::where('transaction_id', $tx->id)->where('id', $attachmentId)->first();
        if (! $attachment) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Bukti transaksi tidak ditemukan');
        }

        if (! Storage::disk('local')->exists($attachment->file_path)) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Berkas fisik bukti transaksi tidak ditemukan di storage');
        }

        $fullPath = Storage::disk('local')->path($attachment->file_path);

        return response()->download($fullPath, $attachment->file_name, [
            'Content-Type' => $attachment->mime_type,
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $periodId = (string) $request->query('period_id');

        if (empty($periodId)) {
            throw new ApiException('VALIDATION_ERROR', 'Parameter period_id wajib disertakan');
        }

        $summary = $this->txService->getSummary($user, $periodId);

        return response()->json($summary);
    }
}
