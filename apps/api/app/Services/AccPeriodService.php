<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AccountingBankReconciliation;
use App\Models\AccountingMasterHistory;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccPeriodService
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending_approval';

    public const STATUS_NEEDS_CORRECTION = 'needs_correction';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_REOPENED = 'reopened';

    public const ALL_STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PENDING,
        self::STATUS_NEEDS_CORRECTION,
        self::STATUS_APPROVED,
        self::STATUS_CLOSED,
        self::STATUS_REOPENED,
    ];

    public const STATE_TRANSITIONS = [
        self::STATUS_DRAFT => [self::STATUS_PENDING],
        self::STATUS_PENDING => [self::STATUS_APPROVED, self::STATUS_NEEDS_CORRECTION],
        self::STATUS_NEEDS_CORRECTION => [self::STATUS_DRAFT],
        self::STATUS_APPROVED => [self::STATUS_CLOSED, self::STATUS_NEEDS_CORRECTION],
        self::STATUS_CLOSED => [self::STATUS_REOPENED],
        self::STATUS_REOPENED => [self::STATUS_DRAFT],
    ];

    public function __construct(
        protected AuditService $audit
    ) {}

    public function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::STATE_TRANSITIONS[$from] ?? [], true);
    }

    public function list(array $user, array $params = []): array
    {
        $role = $user['role'] ?? '';
        $query = AccountingPeriod::where('division_id', $this->resolveAccDivisionId())->with(['division', 'createdBy', 'approvedBy']);

        if ($role === 'BOD') {
            $query->whereIn('status', [self::STATUS_APPROVED, self::STATUS_CLOSED]);
            if (! empty($params['status'])) {
                $statusNorm = strtolower($params['status']);
                if (! in_array($statusNorm, [self::STATUS_APPROVED, self::STATUS_CLOSED], true)) {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'BOD hanya dapat membaca periode berstatus approved atau closed');
                }
                $query->where('status', $statusNorm);
            }
        } else {
            if (! empty($params['status'])) {
                $query->where('status', $params['status']);
            }
        }

        if (! empty($params['period_month'])) {
            $query->where('period_month', $params['period_month']);
        }
        if (! empty($params['division_id'])) {
            $query->where('division_id', $params['division_id']);
        }

        $perPage = (int) ($params['per_page'] ?? 20);
        $page = (int) ($params['page'] ?? 1);

        $total = $query->count();
        $items = $query->orderBy('period_month', 'desc')->forPage($page, $perPage)->get();

        return [
            'data' => $items->map(fn ($p) => $this->toResource($p))->toArray(),
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }

    public function find(string $id): AccountingPeriod
    {
        $period = AccountingPeriod::where('division_id', $this->resolveAccDivisionId())->find($id);
        if (! $period) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Periode tidak ditemukan');
        }

        return $period;
    }

    public function create(array $user, array $data): AccountingPeriod
    {
        return DB::transaction(function () use ($user, $data) {
            $divisionId = $data['division_id'] ?? $this->resolveAccDivisionId();
            $periodMonth = $data['period_month'];

            $normalizedPeriod = substr((string) $periodMonth, 0, 7).'-01';

            if (AccountingPeriod::where('division_id', $divisionId)->where('period_month', $normalizedPeriod)->exists()) {
                throw new ApiException('VERSION_CONFLICT', 'Periode sudah ada untuk bulan tersebut');
            }

            try {
                $period = AccountingPeriod::create([
                    'id' => (string) Str::uuid(),
                    'division_id' => $divisionId,
                    'period_month' => $normalizedPeriod,
                    'status' => self::STATUS_DRAFT,
                    'created_by_id' => $user['sub'] ?? $user['id'] ?? null,
                    'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'version' => 1,
                ]);

                $this->logHistory('PERIOD', $period->id, 'CREATE', null, $user);

                return $period;
            } catch (QueryException $e) {
                if ($e->errorInfo[1] == 1062 || str_contains($e->getMessage(), 'UNIQUE constraint')) {
                    throw new ApiException('VERSION_CONFLICT', 'Periode sudah ada untuk bulan tersebut');
                }
                throw $e;
            }
        });
    }

    public function transition(array $user, string $id, string $targetStatus, ?string $notes = null): AccountingPeriod
    {
        return DB::transaction(function () use ($user, $id, $targetStatus, $notes) {
            $period = AccountingPeriod::where('division_id', $this->resolveAccDivisionId())
                ->whereKey($id)
                ->lockForUpdate()
                ->first();
            if (! $period) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Periode tidak ditemukan');
            }

            $role = $user['role'] ?? '';
            $divisionCode = $user['divisionCode'] ?? $user['division_code'] ?? null;

            if ($divisionCode !== 'ACC') {
                throw new ApiException('SCOPE_VIOLATION', 'Akses ditolak untuk divisi Accounting');
            }

            $targetStatus = strtolower($targetStatus);
            $currentStatus = strtolower($period->status);

            if (! in_array($targetStatus, self::ALL_STATUSES, true)) {
                throw new ApiException('VALIDATION_ERROR', 'Target status tidak valid');
            }

            // Role-based transition permissions
            if (in_array($targetStatus, [self::STATUS_APPROVED, self::STATUS_NEEDS_CORRECTION, self::STATUS_CLOSED, self::STATUS_REOPENED], true)) {
                if ($role !== 'MANAGER') {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Manager ACC yang berwenang menyetujui, mengoreksi, menutup, atau membuka kembali periode');
                }
            } elseif ($targetStatus === self::STATUS_PENDING) {
                if (! in_array($role, ['ADMIN', 'MANAGER'], true)) {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Admin atau Manager ACC yang dapat mengajukan periode');
                }
            } elseif ($targetStatus === self::STATUS_DRAFT && $currentStatus === self::STATUS_REOPENED && $role !== 'MANAGER') {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Manager ACC yang dapat mengaktifkan kembali periode yang dibuka ulang');
            } elseif ($targetStatus === self::STATUS_DRAFT && $currentStatus === self::STATUS_NEEDS_CORRECTION && ! in_array($role, ['ADMIN', 'MANAGER'], true)) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Admin atau Manager ACC yang dapat memulai koreksi periode');
            }

            if (! $this->canTransition($currentStatus, $targetStatus)) {
                throw new ApiException('INVALID_STATE_TRANSITION', "Transisi dari {$period->status} ke {$targetStatus} tidak diperbolehkan");
            }

            if (in_array($targetStatus, [self::STATUS_NEEDS_CORRECTION, self::STATUS_CLOSED, self::STATUS_REOPENED], true)
                && mb_strlen(trim((string) $notes)) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Catatan keputusan minimal 10 karakter diperlukan untuk koreksi, penutupan, atau pembukaan kembali periode');
            }

            if ($targetStatus === self::STATUS_PENDING) {
                $readiness = $this->readiness($period);
                if (! $readiness['readyForSubmission']) {
                    throw new ApiException('PERIOD_NOT_READY', 'Periode belum siap diajukan. Selesaikan jurnal draf dan lampiran yang belum lengkap.', ['readiness' => $readiness], 422);
                }
            }
            if ($targetStatus === self::STATUS_CLOSED) {
                $readiness = $this->readiness($period);
                if (! $readiness['readyForClose']) {
                    throw new ApiException('PERIOD_NOT_READY', 'Periode belum siap ditutup. Selesaikan seluruh pengecualian rekonsiliasi.', ['readiness' => $readiness], 422);
                }
            }

            $changes = ['status' => [$period->status, $targetStatus]];

            $updates = [
                'status' => $targetStatus,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'version' => $period->version + 1,
            ];

            if ($targetStatus === self::STATUS_APPROVED) {
                $updates['approved_by_id'] = $user['sub'] ?? $user['id'] ?? null;
                $updates['approved_at'] = now();
            }
            if ($targetStatus === self::STATUS_CLOSED) {
                $updates['closed_by_id'] = $user['sub'] ?? $user['id'] ?? null;
                $updates['closed_at'] = now();
            }
            if ($notes !== null) {
                $changes['notes'] = [$period->notes, $notes];
                $updates['notes'] = $notes;
            }

            $period->update($updates);

            $this->logHistory('PERIOD', $period->id, 'UPDATE', $changes, $user);

            return $period->refresh();
        });
    }

    public function toResource(AccountingPeriod $period): array
    {
        return [
            'id' => $period->id,
            'divisionId' => $period->division_id,
            'periodMonth' => $period->period_month instanceof Carbon || $period->period_month instanceof \Illuminate\Support\Carbon
                ? $period->period_month->toDateString()
                : (string) $period->period_month,
            'status' => $period->status,
            'notes' => $period->notes,
            'version' => $period->version,
            'createdById' => $period->created_by_id,
            'updatedById' => $period->updated_by_id,
            'approvedById' => $period->approved_by_id,
            'closedById' => $period->closed_by_id,
            'approvedAt' => $period->approved_at?->toISOString(),
            'closedAt' => $period->closed_at?->toISOString(),
            'createdAt' => $period->created_at?->toISOString(),
            'updatedAt' => $period->updated_at?->toISOString(),
        ];
    }

    public function readiness(AccountingPeriod $period): array
    {
        if ((string) $period->division_id !== $this->resolveAccDivisionId()) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Periode tidak ditemukan');
        }

        $transactions = AccountingTransaction::where('division_id', $period->division_id)
            ->where('period_id', $period->id)
            ->whereNull('cancelled_at');
        $transactionCount = (clone $transactions)->count();
        $draftCount = (clone $transactions)->where('is_draft', true)->count();
        $missingAttachmentCount = (clone $transactions)->doesntHave('attachments')->count();

        $reconciliations = AccountingBankReconciliation::where('division_id', $period->division_id)
            ->where('period_id', $period->id);
        $bankAccountCount = (clone $reconciliations)->count();
        $unverifiedBankCount = (clone $reconciliations)->where('is_verified', false)->count();
        $bankBalance = (float) (clone $reconciliations)->sum('aug_balance');
        $division = Division::findOrFail($period->division_id);
        $cashBalance = (float) app(AccCashflowReportService::class)
            ->getCashflowReport($division, $period->period_month->format('Y-m-d'))['kpis']['ending_cash_balance'];
        $variance = round(abs($bankBalance - $cashBalance), 2);

        $checks = [
            ['code' => 'journal_reviewed', 'label' => 'Jurnal siap ditinjau', 'passed' => $draftCount === 0, 'count' => $draftCount, 'message' => $draftCount === 0 ? 'Tidak ada jurnal aktif berstatus draf.' : "{$draftCount} jurnal masih berstatus draf."],
            ['code' => 'attachments_complete', 'label' => 'Bukti transaksi lengkap', 'passed' => $missingAttachmentCount === 0, 'count' => $missingAttachmentCount, 'message' => $missingAttachmentCount === 0 ? 'Seluruh jurnal aktif memiliki lampiran.' : "{$missingAttachmentCount} jurnal belum memiliki lampiran."],
            ['code' => 'bank_data_available', 'label' => 'Data rekening tersedia', 'passed' => $bankAccountCount > 0, 'count' => $bankAccountCount, 'message' => $bankAccountCount > 0 ? "{$bankAccountCount} rekening tercatat." : 'Belum ada saldo rekening untuk periode ini.'],
            ['code' => 'bank_entries_verified', 'label' => 'Rekening sudah diverifikasi', 'passed' => $bankAccountCount > 0 && $unverifiedBankCount === 0, 'count' => $unverifiedBankCount, 'message' => $bankAccountCount > 0 && $unverifiedBankCount === 0 ? 'Seluruh rekening telah diverifikasi.' : "{$unverifiedBankCount} rekening belum diverifikasi."],
            ['code' => 'cash_matches_bank', 'label' => 'Saldo kas dan bank cocok', 'passed' => $bankAccountCount > 0 && $variance <= 1.0, 'count' => $variance, 'message' => $bankAccountCount > 0 && $variance <= 1.0 ? 'Selisih berada dalam toleransi Rp1.' : 'Selisih kas dan bank masih perlu ditelusuri.'],
        ];

        return [
            'periodId' => $period->id,
            'transactionCount' => $transactionCount,
            'draftTransactionCount' => $draftCount,
            'missingAttachmentCount' => $missingAttachmentCount,
            'bankAccountCount' => $bankAccountCount,
            'unverifiedBankCount' => $unverifiedBankCount,
            'bankBalance' => $bankBalance,
            'cashBalance' => $cashBalance,
            'variance' => $variance,
            'readyForSubmission' => $draftCount === 0 && $missingAttachmentCount === 0,
            'readyForClose' => collect($checks)->every(fn (array $check) => $check['passed']),
            'checks' => $checks,
        ];
    }

    protected function resolveAccDivisionId(): string
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Divisi ACC tidak ditemukan');
        }

        return (string) $acc->id;
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
