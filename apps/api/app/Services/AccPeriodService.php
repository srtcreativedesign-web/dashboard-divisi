<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AccountingMasterHistory;
use App\Models\AccountingPeriod;
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
        $query = AccountingPeriod::query()->with(['division', 'createdBy', 'approvedBy']);

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
        $period = AccountingPeriod::find($id);
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
            $period = $this->find($id);

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
            }

            if (! $this->canTransition($currentStatus, $targetStatus)) {
                throw new ApiException('INVALID_STATE_TRANSITION', "Transisi dari {$period->status} ke {$targetStatus} tidak diperbolehkan");
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
