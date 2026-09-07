<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AccountingAccount;
use App\Models\AccountingAccountOutlet;
use App\Models\AccountingCategory;
use App\Models\AccountingMasterHistory;
use App\Models\Division;
use App\Models\Outlet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccAccountService
{
    public function __construct(
        protected AuditService $audit
    ) {}

    public function list(array $params = []): array
    {
        $query = AccountingAccount::query()->with(['division', 'category']);

        if (! empty($params['division_id'])) {
            $query->where('division_id', $params['division_id']);
        }
        if (! empty($params['type'])) {
            $query->where('type', $params['type']);
        }
        if (! empty($params['is_active'])) {
            $query->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (! empty($params['category_id'])) {
            $query->where('category_id', $params['category_id']);
        }
        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        if (! empty($params['requires_outlet']) && $params['requires_outlet'] === true) {
            $query->whereHas('outlets', function ($q) {
                $q->where('is_active', true);
            });
        }

        $perPage = (int) ($params['per_page'] ?? 50);
        $page = (int) ($params['page'] ?? 1);

        $total = $query->count();
        $items = $query->orderBy('display_order')->orderBy('code')->forPage($page, $perPage)->get();

        return [
            'data' => $items->map(fn ($a) => $this->toResource($a))->toArray(),
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }

    public function find(string $id): AccountingAccount
    {
        $account = AccountingAccount::with(['division', 'category', 'outlets.outlet'])->find($id);
        if (! $account) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Rekening tidak ditemukan');
        }

        return $account;
    }

    public function create(array $user, array $data): AccountingAccount
    {
        return DB::transaction(function () use ($user, $data) {
            $code = trim((string) ($data['code'] ?? ''));
            if ($code === '') {
                throw new ApiException('VALIDATION_ERROR', 'Kode rekening wajib diisi');
            }

            $divisionId = $data['division_id'] ?? null;
            if ($divisionId) {
                $division = Division::find($divisionId);
                if (! $division) {
                    throw new ApiException('RESOURCE_NOT_FOUND', 'Divisi tidak ditemukan');
                }
                if ((string) $division->code !== 'ACC') {
                    throw new ApiException('SCOPE_VIOLATION', 'Rekening hanya boleh dibuat untuk divisi ACC');
                }
            } else {
                $divisionId = $this->resolveAccDivisionId();
            }

            if (AccountingAccount::where('division_id', $divisionId)->where('code', $code)->exists()) {
                throw new ApiException('VERSION_CONFLICT', "Kode rekening '{$code}' sudah digunakan");
            }

            $displayName = trim((string) ($data['display_name'] ?? ''));
            if ($displayName === '') {
                throw new ApiException('VALIDATION_ERROR', 'Display name rekening wajib diisi');
            }

            $type = (string) ($data['type'] ?? 'ASSET');
            if (! in_array($type, ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], true)) {
                throw new ApiException('VALIDATION_ERROR', 'Type rekening harus ASSET, LIABILITY, EQUITY, REVENUE, atau EXPENSE');
            }

            $categoryId = $data['category_id'] ?? null;
            if (! empty($categoryId)) {
                $category = AccountingCategory::find($categoryId);
                if (! $category) {
                    throw new ApiException('RESOURCE_NOT_FOUND', "Kategori '{$categoryId}' tidak ditemukan");
                }
                if ($category->requires_outlet) {
                    if (empty($data['outlet_ids']) || ! is_array($data['outlet_ids']) || count($data['outlet_ids']) === 0) {
                        throw new ApiException('VALIDATION_ERROR', "Kategori '{$category->code}' mewajibkan rekening memiliki relasi outlet");
                    }
                }
            }

            $displayOrder = (int) ($data['display_order'] ?? 0);

            $account = AccountingAccount::create([
                'id' => (string) Str::uuid(),
                'code' => $code,
                'display_name' => $displayName,
                'type' => $type,
                'display_order' => $displayOrder,
                'is_active' => true,
                'division_id' => $divisionId,
                'category_id' => ! empty($categoryId) ? $categoryId : null,
                'description' => $data['description'] ?? null,
                'version' => '1.0',
                'created_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ]);

            if (! empty($data['outlet_ids']) && is_array($data['outlet_ids'])) {
                $this->assignOutlets($account->id, $data['outlet_ids'], $user);
            }

            $this->logHistory('ACCOUNT', $account->id, 'CREATE', null, $user);

            return $account->refresh();
        });
    }

    public function update(array $user, string $id, array $data): AccountingAccount
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $account = $this->find($id);

            $changes = [];
            $updates = ['updated_by_id' => $user['sub'] ?? $user['id'] ?? null];

            if (isset($data['display_name'])) {
                $newName = trim((string) $data['display_name']);
                if ($newName === '') {
                    throw new ApiException('VALIDATION_ERROR', 'Display name tidak boleh kosong');
                }
                if ($newName !== $account->display_name) {
                    $changes['display_name'] = [$account->display_name, $newName];
                    $updates['display_name'] = $newName;
                }
            }

            if (isset($data['type'])) {
                $newType = (string) $data['type'];
                if (! in_array($newType, ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], true)) {
                    throw new ApiException('VALIDATION_ERROR', 'Type rekening tidak valid');
                }
                if ($newType !== $account->type) {
                    $changes['type'] = [$account->type, $newType];
                    $updates['type'] = $newType;
                }
            }

            if (isset($data['display_order'])) {
                $newOrder = (int) $data['display_order'];
                if ($newOrder !== $account->display_order) {
                    $changes['display_order'] = [$account->display_order, $newOrder];
                    $updates['display_order'] = $newOrder;
                }
            }

            if (isset($data['is_active'])) {
                $newActive = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
                if ($newActive !== $account->is_active) {
                    $changes['is_active'] = [$account->is_active, $newActive];
                    $updates['is_active'] = $newActive;
                }
            }

            if (array_key_exists('category_id', $data)) {
                $newCategory = $data['category_id'];
                if ($newCategory !== null && ! is_string($newCategory)) {
                    throw new ApiException('VALIDATION_ERROR', 'Kategori ID harus berupa string');
                }
                if ($newCategory !== null) {
                    $catModel = AccountingCategory::find($newCategory);
                    if (! $catModel) {
                        throw new ApiException('RESOURCE_NOT_FOUND', "Kategori '{$newCategory}' tidak ditemukan");
                    }
                    if ($catModel->requires_outlet) {
                        $outletCount = isset($data['outlet_ids']) && is_array($data['outlet_ids'])
                            ? count($data['outlet_ids'])
                            : $account->outlets()->count();
                        if ($outletCount === 0) {
                            throw new ApiException('VALIDATION_ERROR', "Kategori '{$catModel->code}' mewajibkan rekening memiliki relasi outlet");
                        }
                    }
                }
                if ($newCategory !== $account->category_id) {
                    $changes['category_id'] = [$account->category_id, $newCategory];
                    $updates['category_id'] = $newCategory;
                }
            }

            if (isset($data['description'])) {
                $updates['description'] = $data['description'];
                $changes['description'] = [$account->description, $data['description']];
            }

            if (! empty($updates) && count($updates) > 1) {
                $account->update($updates);
                $this->logHistory('ACCOUNT', $account->id, 'UPDATE', $changes, $user);
            }

            if (isset($data['outlet_ids']) && is_array($data['outlet_ids'])) {
                $this->syncOutlets($account->id, $data['outlet_ids'], $user);
            }

            return $account->refresh();
        });
    }

    public function deactivate(array $user, string $id): AccountingAccount
    {
        return DB::transaction(function () use ($user, $id) {
            $account = $this->find($id);

            if (! $account->is_active) {
                throw new ApiException('VALIDATION_ERROR', 'Rekening sudah tidak aktif');
            }

            $account->update([
                'is_active' => false,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ]);

            $this->logHistory('ACCOUNT', $account->id, 'DEACTIVATE', [
                'is_active' => [true, false],
            ], $user);

            return $account->refresh();
        });
    }

    public function assignOutlets(string $accountId, array $outletIds, array $user): void
    {
        $account = $this->find($accountId);

        $validOutlets = [];
        foreach ($outletIds as $outletId) {
            $outlet = Outlet::with('division')->find($outletId);
            if (! $outlet) {
                throw new ApiException('RESOURCE_NOT_FOUND', "Outlet {$outletId} tidak ditemukan");
            }
            if ((string) ($outlet->division->code ?? '') !== 'ACC') {
                throw new ApiException('SCOPE_VIOLATION', "Outlet {$outletId} bukan divisi ACC");
            }
            $validOutlets[] = $outlet->id;
        }

        foreach ($validOutlets as $outletId) {
            $outlet = Outlet::find($outletId);
            AccountingAccountOutlet::firstOrCreate([
                'account_id' => $accountId,
                'outlet_id' => $outletId,
            ], [
                'division_id' => $outlet ? $outlet->division_id : $this->resolveAccDivisionId(),
                'is_active' => true,
            ]);
        }

        $this->logHistory('ACCOUNT', $account->id, 'UPDATE', [
            'outlets_assigned' => [null, implode(',', $validOutlets)],
        ], $user);
    }

    public function syncOutlets(string $accountId, array $outletIds, array $user): void
    {
        $account = $this->find($accountId);

        $currentOutlets = $account->outlets->pluck('outlet_id')->toArray();
        $toRemove = array_diff($currentOutlets, $outletIds);
        $toAdd = array_diff($outletIds, $currentOutlets);

        AccountingAccountOutlet::whereIn('account_id', [$accountId])
            ->whereIn('outlet_id', $toRemove)
            ->delete();

        $this->assignOutlets($accountId, $toAdd, $user);

        $this->logHistory('ACCOUNT', $account->id, 'UPDATE', [
            'outlets_changed' => [implode(',', $currentOutlets), implode(',', $outletIds)],
        ], $user);
    }

    public function toResource(AccountingAccount $account): array
    {
        return [
            'id' => $account->id,
            'code' => $account->code,
            'display_name' => $account->display_name,
            'type' => $account->type,
            'displayOrder' => $account->display_order,
            'is_active' => $account->is_active,
            'divisionId' => $account->division_id,
            'categoryId' => $account->category_id,
            'description' => $account->description,
            'effectiveFrom' => $account->effective_from?->toISOString(),
            'effectiveTo' => $account->effective_to?->toISOString(),
            'version' => $account->version,
            'createdById' => $account->created_by_id,
            'updatedById' => $account->updated_by_id,
            'outlets' => $account->outlets->map(fn ($ao) => [
                'id' => $ao->outlet_id,
                'outletCode' => $ao->outlet?->code ?? '',
                'outletName' => $ao->outlet?->name ?? '',
                'divisionId' => $ao->division_id,
                'isActive' => $ao->is_active,
            ])->toArray() ?? [],
        ];
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

    protected function resolveAccDivisionId(): string
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Divisi ACC tidak ditemukan');
        }

        return (string) $acc->id;
    }
}
