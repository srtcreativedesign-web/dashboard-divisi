<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AccountingAccount;
use App\Models\AccountingAccountOutlet;
use App\Models\AccountingCategory;
use App\Models\AccountingMasterHistory;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\AccountingTransactionAttachment;
use App\Models\Division;
use App\Models\Outlet;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccTransactionService
{
    public function __construct(
        protected AuditService $audit
    ) {}

    public function list(array $user, array $params = []): array
    {
        $this->assertAccScope($user);

        $query = AccountingTransaction::query()
            ->with(['period', 'account', 'category', 'outlet', 'attachments']);

        if (! empty($params['period_id'])) {
            $query->where('period_id', $params['period_id']);
        }
        if (! empty($params['account_id'])) {
            $query->where('account_id', $params['account_id']);
        }
        if (! empty($params['category_id'])) {
            $query->where('category_id', $params['category_id']);
        }
        if (! empty($params['outlet_id'])) {
            $query->where('outlet_id', $params['outlet_id']);
        }
        if (! empty($params['start_date'])) {
            $query->where('transaction_date', '>=', $params['start_date']);
        }
        if (! empty($params['end_date'])) {
            $query->where('transaction_date', '<=', $params['end_date']);
        }
        if (isset($params['is_draft'])) {
            $query->where('is_draft', filter_var($params['is_draft'], FILTER_VALIDATE_BOOLEAN));
        }
        if (isset($params['include_cancelled']) && filter_var($params['include_cancelled'], FILTER_VALIDATE_BOOLEAN)) {
            // Include cancelled
        } else {
            $query->whereNull('cancelled_at');
        }

        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($params['per_page'] ?? 50);
        $page = (int) ($params['page'] ?? 1);

        $total = $query->count();
        $items = $query->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->forPage($page, $perPage)
            ->get();

        $runningBalance = 0;
        if (! empty($params['period_id']) || ! empty($params['account_id'])) {
            $runningBalance = $this->calculateInitialBalance($params, $page, $perPage);
        }

        $data = [];
        foreach ($items as $item) {
            if ($item->cancelled_at === null) {
                $debit = (int) $item->debit_amount;
                $credit = (int) $item->credit_amount;
                $runningBalance = $runningBalance + $debit - $credit;
            }
            $resource = $this->toResource($item);
            $resource['runningBalance'] = $this->decimalString($runningBalance);
            $data[] = $resource;
        }

        return [
            'data' => $data,
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }

    public function find(array $user, string $id): AccountingTransaction
    {
        $this->assertAccScope($user);

        $tx = AccountingTransaction::with(['period', 'account', 'category', 'outlet', 'attachments'])->find($id);
        if (! $tx) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Transaksi tidak ditemukan');
        }

        return $tx;
    }

    public function create(array $user, array $data): AccountingTransaction
    {
        $this->assertAccScope($user);

        return DB::transaction(function () use ($user, $data) {
            $divisionId = $this->resolveAccDivisionId();

            $idempotencyKey = $data['idempotency_key'] ?? null;
            $requestData = $data;
            unset($requestData['idempotency_key']);
            ksort($requestData);
            $requestHash = hash('sha256', json_encode($requestData, JSON_THROW_ON_ERROR));
            if ($idempotencyKey !== null) {
                $existing = AccountingTransaction::where('division_id', $divisionId)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();
                if ($existing) {
                    if (! hash_equals((string) $existing->request_hash, $requestHash)) {
                        throw new ApiException('IDEMPOTENCY_CONFLICT', 'Idempotency-Key telah digunakan untuk payload berbeda');
                    }

                    return $existing;
                }
            }

            $periodId = $data['period_id'];
            $period = AccountingPeriod::find($periodId);
            if (! $period) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Periode tidak ditemukan');
            }
            $this->assertPeriodMutable($period);

            $accountId = $data['account_id'];
            $account = AccountingAccount::find($accountId);
            if (! $account || ! $account->is_active) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Rekening tidak valid atau tidak aktif');
            }

            $categoryId = $data['category_id'];
            $category = AccountingCategory::find($categoryId);
            if (! $category || ! $category->is_active) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Kategori tidak valid atau tidak aktif');
            }

            $outletId = $data['outlet_id'] ?? null;
            if ($category->requires_outlet) {
                if (empty($outletId)) {
                    throw new ApiException('VALIDATION_ERROR', "Kategori '{$category->code}' mewajibkan pengisian outlet", null, 422);
                }
            }

            if (! empty($outletId)) {
                $outlet = Outlet::find($outletId);
                if (! $outlet || ! $outlet->is_active) {
                    throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet tidak ditemukan atau tidak aktif');
                }
                $this->assertOutletLinkedToAccount($accountId, $outletId);
            }

            $debit = (int) ($data['debit_amount'] ?? 0);
            $credit = (int) ($data['credit_amount'] ?? 0);

            $this->validateDebitCredit($debit, $credit);

            $tx = AccountingTransaction::create([
                'id' => (string) Str::uuid(),
                'division_id' => $divisionId,
                'period_id' => $periodId,
                'account_id' => $accountId,
                'category_id' => $categoryId,
                'outlet_id' => $outletId,
                'transaction_date' => $data['transaction_date'],
                'description' => trim($data['description']),
                'reference_no' => ! empty($data['reference_no']) ? trim($data['reference_no']) : null,
                'debit_amount' => $debit,
                'credit_amount' => $credit,
                'is_draft' => filter_var($data['is_draft'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'version' => 1,
                'created_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'idempotency_key' => $idempotencyKey,
                'request_hash' => $requestHash,
            ]);

            $this->logHistory('TRANSACTION', $tx->id, 'CREATE', null, $user);

            return $tx->refresh();
        });
    }

    public function update(array $user, string $id, array $data): AccountingTransaction
    {
        $this->assertAccScope($user);

        return DB::transaction(function () use ($user, $id, $data) {
            $tx = AccountingTransaction::lockForUpdate()->find($id);
            if (! $tx) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Transaksi tidak ditemukan');
            }

            if ($tx->cancelled_at !== null) {
                throw new ApiException('INVALID_STATE_OPERATION', 'Transaksi yang sudah dibatalkan tidak dapat diperbarui');
            }

            $period = $tx->period;
            $this->assertPeriodMutable($period);

            if (isset($data['version']) && (int) $data['version'] !== (int) $tx->version) {
                throw new ApiException('VERSION_CONFLICT', 'Versi transaksi telah diperbarui oleh pengguna lain');
            }

            $changes = [];
            $updates = [
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'version' => $tx->version + 1,
            ];

            if (isset($data['account_id']) && $data['account_id'] !== $tx->account_id) {
                $account = AccountingAccount::find($data['account_id']);
                if (! $account || ! $account->is_active) {
                    throw new ApiException('RESOURCE_NOT_FOUND', 'Rekening tidak valid atau tidak aktif');
                }
                $changes['account_id'] = [$tx->account_id, $data['account_id']];
                $updates['account_id'] = $data['account_id'];
            }

            $categoryId = $data['category_id'] ?? $tx->category_id;
            $category = AccountingCategory::find($categoryId);
            if (! $category || ! $category->is_active) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Kategori tidak valid atau tidak aktif');
            }
            if (isset($data['category_id']) && $data['category_id'] !== $tx->category_id) {
                $changes['category_id'] = [$tx->category_id, $data['category_id']];
                $updates['category_id'] = $data['category_id'];
            }

            $outletId = array_key_exists('outlet_id', $data) ? $data['outlet_id'] : $tx->outlet_id;
            if ($category->requires_outlet && empty($outletId)) {
                throw new ApiException('VALIDATION_ERROR', "Kategori '{$category->code}' mewajibkan pengisian outlet", null, 422);
            }
            if (! empty($outletId) && $outletId !== $tx->outlet_id) {
                $outlet = Outlet::find($outletId);
                if (! $outlet || ! $outlet->is_active) {
                    throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet tidak valid atau tidak aktif');
                }
                $changes['outlet_id'] = [$tx->outlet_id, $outletId];
                $updates['outlet_id'] = $outletId;
            } elseif (array_key_exists('outlet_id', $data) && $data['outlet_id'] === null) {
                $changes['outlet_id'] = [$tx->outlet_id, null];
                $updates['outlet_id'] = null;
            }

            $debit = isset($data['debit_amount']) ? (int) $data['debit_amount'] : (int) $tx->debit_amount;
            $credit = isset($data['credit_amount']) ? (int) $data['credit_amount'] : (int) $tx->credit_amount;

            if (isset($data['debit_amount']) || isset($data['credit_amount'])) {
                $this->validateDebitCredit($debit, $credit);
                if ($debit !== (int) $tx->debit_amount) {
                    $changes['debit_amount'] = [(int) $tx->debit_amount, $debit];
                    $updates['debit_amount'] = $debit;
                }
                if ($credit !== (int) $tx->credit_amount) {
                    $changes['credit_amount'] = [(int) $tx->credit_amount, $credit];
                    $updates['credit_amount'] = $credit;
                }
            }

            $effectiveAccountId = $updates['account_id'] ?? $tx->account_id;
            if (! empty($outletId)) {
                $this->assertOutletLinkedToAccount($effectiveAccountId, $outletId);
            }

            if (isset($data['transaction_date']) && $data['transaction_date'] !== $tx->transaction_date?->toDateString()) {
                $changes['transaction_date'] = [$tx->transaction_date?->toDateString(), $data['transaction_date']];
                $updates['transaction_date'] = $data['transaction_date'];
            }

            if (isset($data['description']) && trim($data['description']) !== $tx->description) {
                $changes['description'] = [$tx->description, trim($data['description'])];
                $updates['description'] = trim($data['description']);
            }

            if (array_key_exists('reference_no', $data) && $data['reference_no'] !== $tx->reference_no) {
                $changes['reference_no'] = [$tx->reference_no, $data['reference_no']];
                $updates['reference_no'] = $data['reference_no'];
            }

            if (isset($data['is_draft'])) {
                $isDraft = filter_var($data['is_draft'], FILTER_VALIDATE_BOOLEAN);
                if ($isDraft !== $tx->is_draft) {
                    $changes['is_draft'] = [$tx->is_draft, $isDraft];
                    $updates['is_draft'] = $isDraft;
                }
            }

            $tx->update($updates);
            $this->logHistory('TRANSACTION', $tx->id, 'UPDATE', $changes, $user);

            return $tx->refresh();
        });
    }

    public function cancel(array $user, string $id, string $reason): AccountingTransaction
    {
        $this->assertAccScope($user);

        return DB::transaction(function () use ($user, $id, $reason) {
            $tx = AccountingTransaction::lockForUpdate()->find($id);
            if (! $tx) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Transaksi tidak ditemukan');
            }

            if ($tx->cancelled_at !== null) {
                throw new ApiException('INVALID_STATE_OPERATION', 'Transaksi sudah dibatalkan sebelumnya');
            }

            $period = $tx->period;
            $this->assertPeriodMutable($period);

            $trimmedReason = trim($reason);
            if ($trimmedReason === '') {
                throw new ApiException('VALIDATION_ERROR', 'Alasan pembatalan (cancellation_reason) wajib diisi');
            }

            $tx->update([
                'cancelled_at' => now(),
                'cancelled_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'cancellation_reason' => $trimmedReason,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'version' => $tx->version + 1,
            ]);

            $changes = [
                'status' => ['active', 'cancelled'],
                'cancellation_reason' => [null, $trimmedReason],
            ];

            $this->logHistory('TRANSACTION', $tx->id, 'DEACTIVATE', $changes, $user);

            return $tx->refresh();
        });
    }

    public function addAttachment(array $user, string $id, UploadedFile $file): AccountingTransactionAttachment
    {
        $this->assertAccScope($user);

        return DB::transaction(function () use ($user, $id, $file) {
            $tx = $this->find($user, $id);
            $this->assertPeriodMutable($tx->period);

            if ($tx->cancelled_at !== null) {
                throw new ApiException('INVALID_STATE_OPERATION', 'Tidak dapat menambah bukti pada transaksi yang dibatalkan');
            }

            $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (! in_array($file->getMimeType(), $allowedMimes, true)) {
                throw new ApiException('VALIDATION_ERROR', 'Format file bukti harus JPG, PNG, atau PDF');
            }

            if ($file->getSize() > 5 * 1024 * 1024) {
                throw new ApiException('VALIDATION_ERROR', 'Ukuran file bukti maksimal 5MB');
            }

            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('attachments/accounting', $filename, 'local');

            $attachment = AccountingTransactionAttachment::create([
                'id' => (string) Str::uuid(),
                'transaction_id' => $tx->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'uploaded_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ]);

            $this->logHistory('TRANSACTION_ATTACHMENT', $attachment->id, 'CREATE', null, $user);

            return $attachment;
        });
    }

    public function getSummary(array $user, string $periodId): array
    {
        $this->assertAccScope($user);

        $period = AccountingPeriod::find($periodId);
        if (! $period) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Periode tidak ditemukan');
        }

        $activeTx = AccountingTransaction::where('period_id', $periodId)->whereNull('cancelled_at')->get();

        $totalDebit = 0;
        $totalCredit = 0;
        $missingAttachmentCount = 0;

        foreach ($activeTx as $tx) {
            $totalDebit += (int) $tx->debit_amount;
            $totalCredit += (int) $tx->credit_amount;
            if ($tx->attachments()->count() === 0) {
                $missingAttachmentCount++;
            }
        }

        $netBalance = $totalDebit - $totalCredit;

        return [
            'periodId' => $periodId,
            'periodMonth' => (string) $period->period_month,
            'status' => $period->status,
            'totalTransactions' => $activeTx->count(),
            'totalDebit' => $this->decimalString($totalDebit),
            'totalCredit' => $this->decimalString($totalCredit),
            'netBalance' => $this->decimalString($netBalance),
            'missingAttachmentCount' => $missingAttachmentCount,
            'isReadyForSubmission' => $activeTx->count() > 0 && $missingAttachmentCount === 0,
        ];
    }

    public function toResource(AccountingTransaction $tx): array
    {
        return [
            'id' => $tx->id,
            'divisionId' => $tx->division_id,
            'periodId' => $tx->period_id,
            'accountId' => $tx->account_id,
            'categoryId' => $tx->category_id,
            'outletId' => $tx->outlet_id,
            'transactionDate' => $tx->transaction_date instanceof Carbon ? $tx->transaction_date->toDateString() : (string) $tx->transaction_date,
            'description' => $tx->description,
            'referenceNo' => $tx->reference_no,
            'debitAmount' => $this->decimalString((int) $tx->debit_amount),
            'creditAmount' => $this->decimalString((int) $tx->credit_amount),
            'isDraft' => (bool) $tx->is_draft,
            'cancelledAt' => $tx->cancelled_at?->toISOString(),
            'cancelledById' => $tx->cancelled_by_id,
            'cancellationReason' => $tx->cancellation_reason,
            'version' => $tx->version,
            'attachments' => $tx->attachments->map(fn ($a) => [
                'id' => $a->id,
                'fileName' => $a->file_name,
                'fileSize' => $a->file_size,
                'mimeType' => $a->mime_type,
                'createdAt' => $a->created_at?->toISOString(),
            ])->toArray(),
            'createdById' => $tx->created_by_id,
            'updatedById' => $tx->updated_by_id,
            'createdAt' => $tx->created_at?->toISOString(),
            'updatedAt' => $tx->updated_at?->toISOString(),
        ];
    }

    protected function validateDebitCredit(int $debit, int $credit): void
    {
        if ($debit < 0 || $credit < 0) {
            throw new ApiException('VALIDATION_ERROR', 'Nominal debit dan kredit tidak boleh bernilai negatif', null, 422);
        }

        if (($debit > 0 && $credit > 0) || ($debit == 0 && $credit == 0)) {
            throw new ApiException('VALIDATION_ERROR', 'Tepat satu sisi (debit atau kredit) yang harus bernilai lebih besar dari 0', null, 422);
        }
    }

    protected function assertPeriodMutable(AccountingPeriod $period): void
    {
        $status = strtolower($period->status);
        if (! in_array($status, [AccPeriodService::STATUS_DRAFT, AccPeriodService::STATUS_REOPENED], true)) {
            throw new ApiException('PERIOD_LOCKED', "Periode berstatus '{$period->status}' terkunci dari mutasi transaksi");
        }
    }

    protected function assertAccScope(array $user): void
    {
        $divisionCode = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $role = $user['role'] ?? '';

        if ($role === 'BOD') {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'BOD tidak diizinkan mengakses transaksi Accounting');
        }

        if ($divisionCode !== 'ACC') {
            throw new ApiException('SCOPE_VIOLATION', "Akses ditolak untuk divisi Accounting (user {$role}/{$divisionCode})");
        }
    }

    protected function resolveAccDivisionId(): string
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Divisi ACC tidak ditemukan');
        }

        return (string) $acc->id;
    }

    protected function calculateInitialBalance(array $params, int $page, int $perPage): int
    {
        if ($page <= 1) {
            return 0;
        }

        $query = AccountingTransaction::query()->whereNull('cancelled_at');

        if (! empty($params['period_id'])) {
            $query->where('period_id', $params['period_id']);
        }
        if (! empty($params['account_id'])) {
            $query->where('account_id', $params['account_id']);
        }

        $skip = ($page - 1) * $perPage;
        $priorItems = $query->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->take($skip)
            ->get();

        $bal = 0;
        foreach ($priorItems as $item) {
            $bal += ((int) $item->debit_amount - (int) $item->credit_amount);
        }

        return $bal;
    }

    protected function assertOutletLinkedToAccount(string $accountId, string $outletId): void
    {
        $linked = AccountingAccountOutlet::query()
            ->where('account_id', $accountId)
            ->where('outlet_id', $outletId)
            ->exists();

        if (! $linked) {
            throw new ApiException('VALIDATION_ERROR', 'Outlet tidak terhubung dengan rekening yang dipilih', null, 422);
        }
    }

    protected function decimalString(int $amount): string
    {
        return $amount.'.00';
    }

    protected function logHistory(string $entityType, string $entityId, string $action, ?array $changes, array $user): void
    {
        $rawTrace = request()->attributes->get('trace_id');
        $traceId = is_string($rawTrace) && trim($rawTrace) !== ''
            ? substr(preg_replace('/[^a-zA-Z0-9_-]/', '', trim($rawTrace)), 0, 100)
            : (string) Str::uuid();

        AccountingMasterHistory::create([
            'id' => (string) Str::uuid(),
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'changes' => $changes,
            'actor_id' => $user['sub'] ?? $user['id'] ?? null,
            'actor_email' => $user['email'] ?? null,
            'actor_role' => $user['role'] ?? null,
            'division_code' => 'ACC',
            'trace_id' => $traceId,
        ]);
    }
}
