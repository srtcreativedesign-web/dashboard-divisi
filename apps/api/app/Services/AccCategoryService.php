<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AccountingCategory;
use App\Models\AccountingCategoryAlias;
use App\Models\AccountingMasterHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccCategoryService
{
    public function __construct(
        protected AuditService $audit
    ) {}

    public static function normalizeAliasCode(string $alias): string
    {
        return strtolower(trim($alias));
    }

    public static function normalizeCanonicalCode(string $code): string
    {
        $trimmed = trim($code);
        if (! preg_match('/^([BCD])(\d+)([a-zA-Z]?)$/i', $trimmed, $matches)) {
            throw new ApiException('VALIDATION_ERROR', 'Kode kategori harus format B##/C##/D## (contoh: B2a, C14, C25)');
        }

        return strtoupper($matches[1]).$matches[2].strtolower($matches[3]);
    }

    public function list(array $params = []): array
    {
        $query = AccountingCategory::query()->with('aliases');

        if (! empty($params['parent'])) {
            $query->where('parent', $params['parent']);
        }
        if (! empty($params['is_active'])) {
            $query->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (! empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($params['per_page'] ?? 50);
        $page = (int) ($params['page'] ?? 1);

        $total = $query->count();
        $items = $query->orderBy('display_order')->orderBy('code')->forPage($page, $perPage)->get();

        return [
            'data' => $items->map(fn ($c) => $this->toResource($c))->toArray(),
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }

    public function find(string $id): AccountingCategory
    {
        $category = AccountingCategory::with('aliases')->find($id);
        if (! $category) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Kategori tidak ditemukan');
        }

        return $category;
    }

    public function resolve(string $input): AccountingCategory
    {
        $trimmed = trim($input);
        if ($trimmed === '') {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Kode input tidak boleh kosong');
        }

        // 1. Match canonical code (case-insensitive)
        $canonical = AccountingCategory::whereRaw('LOWER(code) = ?', [strtolower($trimmed)])->first();
        if ($canonical) {
            return $canonical;
        }

        // 2. Match alias by deterministic normalized_alias
        $normalized = self::normalizeAliasCode($trimmed);
        $alias = AccountingCategoryAlias::with('category')->where('normalized_alias', $normalized)->first();
        if ($alias && $alias->category) {
            return $alias->category;
        }

        throw new ApiException('RESOURCE_NOT_FOUND', "Kategori dengan kode '{$input}' tidak ditemukan");
    }

    public function create(array $user, array $data): AccountingCategory
    {
        return DB::transaction(function () use ($user, $data) {
            $rawCode = (string) ($data['code'] ?? '');
            if (trim($rawCode) === '') {
                throw new ApiException('VALIDATION_ERROR', 'Kode kategori (code) wajib diisi');
            }

            $canonicalCode = self::normalizeCanonicalCode($rawCode);

            $existing = AccountingCategory::where('code', $canonicalCode)->exists();
            if ($existing) {
                throw new ApiException('VERSION_CONFLICT', "Kode kanonik '{$canonicalCode}' sudah digunakan");
            }

            $name = trim((string) ($data['name'] ?? ''));
            if ($name === '') {
                throw new ApiException('VALIDATION_ERROR', 'Nama kategori wajib diisi');
            }

            $parent = $data['parent'] ?? null;
            if ($parent !== null && ! in_array(strtoupper($parent), ['B', 'C', 'D'], true)) {
                throw new ApiException('VALIDATION_ERROR', "Parent harus 'B', 'C', atau 'D'");
            }

            $displayOrder = (int) ($data['display_order'] ?? 0);
            $isActive = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $requiresOutlet = filter_var($data['requires_outlet'] ?? false, FILTER_VALIDATE_BOOLEAN);

            $category = AccountingCategory::create([
                'id' => (string) Str::uuid(),
                'code' => $canonicalCode,
                'name' => $name,
                'parent' => $parent !== null ? strtoupper($parent) : null,
                'display_order' => $displayOrder,
                'is_active' => $isActive,
                'requires_outlet' => $requiresOutlet,
                'effective_from' => $data['effective_from'] ?? null,
                'effective_to' => $data['effective_to'] ?? null,
                'version' => '1.0',
                'created_by_id' => $user['sub'] ?? $user['id'] ?? null,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ]);

            if (! empty($data['aliases']) && is_array($data['aliases'])) {
                foreach ($data['aliases'] as $aliasCode) {
                    $this->addAlias($category->id, $aliasCode, $user);
                }
            }

            $this->logHistory('CATEGORY', $category->id, 'CREATE', null, $user);

            return $category->refresh();
        });
    }

    public function update(array $user, string $id, array $data): AccountingCategory
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $category = $this->find($id);

            $changes = [];
            $updates = [
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ];

            if (isset($data['name'])) {
                $name = trim((string) $data['name']);
                if ($name === '') {
                    throw new ApiException('VALIDATION_ERROR', 'Nama kategori tidak boleh kosong');
                }
                if ($name !== $category->name) {
                    $changes['name'] = [$category->name, $name];
                    $updates['name'] = $name;
                }
            }

            if (isset($data['parent'])) {
                $parent = $data['parent'];
                if ($parent !== null && ! in_array(strtoupper($parent), ['B', 'C', 'D'], true)) {
                    throw new ApiException('VALIDATION_ERROR', "Parent harus 'B', 'C', atau 'D'");
                }
                $normalizedParent = $parent !== null ? strtoupper($parent) : null;
                if ($normalizedParent !== $category->parent) {
                    $changes['parent'] = [$category->parent, $normalizedParent];
                    $updates['parent'] = $normalizedParent;
                }
            }

            if (isset($data['display_order'])) {
                $newOrder = (int) $data['display_order'];
                if ($newOrder !== $category->display_order) {
                    $changes['display_order'] = [$category->display_order, $newOrder];
                    $updates['display_order'] = $newOrder;
                }
            }

            if (isset($data['is_active'])) {
                $newActive = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
                if ($newActive !== $category->is_active) {
                    $changes['is_active'] = [$category->is_active, $newActive];
                    $updates['is_active'] = $newActive;
                }
            }

            if (isset($data['requires_outlet'])) {
                $newRequiresOutlet = filter_var($data['requires_outlet'], FILTER_VALIDATE_BOOLEAN);
                if ($newRequiresOutlet !== $category->requires_outlet) {
                    $changes['requires_outlet'] = [$category->requires_outlet, $newRequiresOutlet];
                    $updates['requires_outlet'] = $newRequiresOutlet;
                }
            }

            if (isset($data['effective_from'])) {
                $updates['effective_from'] = $data['effective_from'];
                $changes['effective_from'] = [$category->effective_from, $data['effective_from']];
            }

            if (isset($data['effective_to'])) {
                $updates['effective_to'] = $data['effective_to'];
                $changes['effective_to'] = [$category->effective_to, $data['effective_to']];
            }

            if (! empty($updates) && count($updates) > 1) {
                $category->update($updates);
                $this->logHistory('CATEGORY', $category->id, 'UPDATE', $changes, $user);
            }

            if (isset($data['aliases']) && is_array($data['aliases'])) {
                $this->syncAliases($category->id, $data['aliases'], $user);
            }

            return $category->refresh();
        });
    }

    public function addAlias(string $categoryId, string $aliasCode, array $user): AccountingCategoryAlias
    {
        return DB::transaction(function () use ($categoryId, $aliasCode, $user) {
            $category = $this->find($categoryId);
            $trimmedAlias = trim($aliasCode);

            if ($trimmedAlias === '') {
                throw new ApiException('VALIDATION_ERROR', 'Kode alias tidak boleh kosong');
            }

            $normalized = self::normalizeAliasCode($aliasCode);

            if (AccountingCategoryAlias::where('normalized_alias', $normalized)->exists()) {
                throw new ApiException('VERSION_CONFLICT', "Alias '{$trimmedAlias}' sudah digunakan");
            }

            $canonicalConflict = AccountingCategory::whereRaw('LOWER(code) = ?', [$normalized])->exists();
            if ($canonicalConflict) {
                throw new ApiException('VERSION_CONFLICT', "Alias '{$trimmedAlias}' bertabrakan dengan kode kanonik kategori resmi");
            }

            $alias = AccountingCategoryAlias::create([
                'id' => (string) Str::uuid(),
                'alias_code' => $trimmedAlias,
                'canonical_id' => $category->id,
                'normalized_alias' => $normalized,
            ]);

            $this->logHistory('CATEGORY', $category->id, 'UPDATE', [
                'aliases_added' => [null, $trimmedAlias],
            ], $user);

            return $alias;
        });
    }

    public function removeAlias(string $categoryId, string $aliasCode, array $user): void
    {
        DB::transaction(function () use ($categoryId, $aliasCode, $user) {
            $category = $this->find($categoryId);
            $normalized = self::normalizeAliasCode($aliasCode);

            $alias = AccountingCategoryAlias::where('canonical_id', $categoryId)
                ->where('normalized_alias', $normalized)
                ->first();

            if (! $alias) {
                throw new ApiException('RESOURCE_NOT_FOUND', "Alias '{$aliasCode}' tidak ditemukan pada kategori ini");
            }

            $alias->delete();

            $this->logHistory('CATEGORY', $category->id, 'UPDATE', [
                'aliases_removed' => [null, $aliasCode],
            ], $user);
        });
    }

    public function syncAliases(string $categoryId, array $aliases, array $user): void
    {
        DB::transaction(function () use ($categoryId, $aliases, $user) {
            $category = $this->find($categoryId);

            $existingAliases = $category->aliases->pluck('alias_code')->toArray();
            $newAliases = array_map('trim', $aliases);

            $toRemove = array_diff($existingAliases, $newAliases);
            $toAdd = array_diff($newAliases, $existingAliases);

            foreach ($toRemove as $aliasCode) {
                $this->removeAlias($categoryId, $aliasCode, $user);
            }

            foreach ($toAdd as $aliasCode) {
                $this->addAlias($categoryId, $aliasCode, $user);
            }
        });
    }

    public function deactivate(array $user, string $id): AccountingCategory
    {
        return DB::transaction(function () use ($user, $id) {
            $category = $this->find($id);

            if (! $category->is_active) {
                throw new ApiException('VALIDATION_ERROR', 'Kategori sudah tidak aktif');
            }

            $category->update([
                'is_active' => false,
                'updated_by_id' => $user['sub'] ?? $user['id'] ?? null,
            ]);

            $this->logHistory('CATEGORY', $category->id, 'DEACTIVATE', [
                'is_active' => [true, false],
            ], $user);

            return $category->refresh();
        });
    }

    public function toResource(AccountingCategory $category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'name' => $category->name,
            'parent' => $category->parent,
            'displayOrder' => $category->display_order,
            'isActive' => $category->is_active,
            'requiresOutlet' => $category->requires_outlet,
            'effectiveFrom' => $category->effective_from?->toISOString(),
            'effectiveTo' => $category->effective_to?->toISOString(),
            'version' => $category->version,
            'createdById' => $category->created_by_id,
            'updatedById' => $category->updated_by_id,
            'aliases' => $category->aliases?->map(fn ($a) => [
                'aliasCode' => $a->alias_code,
                'normalizedAlias' => $a->normalized_alias,
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
}
