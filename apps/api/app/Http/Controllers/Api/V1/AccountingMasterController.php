<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\AccAccountService;
use App\Services\AccCategoryService;
use App\Services\AccMasterHistoryService;
use App\Services\AccPeriodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingMasterController extends Controller
{
    public function __construct(
        protected AccPeriodService $periodService,
        protected AccCategoryService $categoryService,
        protected AccAccountService $accountService,
        protected AccMasterHistoryService $historyService
    ) {}

    public function listPeriods(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertPeriodScope($user);

        $result = $this->periodService->list($user, [
            'period_month' => $request->query('period_month'),
            'status' => $request->query('status'),
            'per_page' => $request->query('per_page', 20),
            'page' => $request->query('page', 1),
        ]);

        return response()->json($result['data'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function createPeriod(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'period_month' => 'required|date_format:Y-m',
            'notes' => 'nullable|string|max:500',
        ]);

        $period = $this->periodService->create($user, $validated);

        return response()->json($this->periodService->toResource($period), 201);
    }

    public function getPeriod(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertPeriodScope($user);

        $period = $this->periodService->find($id);

        if (($user['role'] ?? '') === 'BOD') {
            if (! in_array($period->status, [AccPeriodService::STATUS_APPROVED, AccPeriodService::STATUS_CLOSED], true)) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'BOD hanya dapat mengakses periode yang sudah disetujui atau ditutup');
            }
        }

        return response()->json($this->periodService->toResource($period));
    }

    public function transitionPeriod(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'status' => 'required|string|in:pending_approval,approved,needs_correction,closed,reopened,draft',
            'notes' => 'nullable|string|max:500',
        ]);

        $period = $this->periodService->transition($user, $id, $validated['status'], $validated['notes'] ?? null);

        return response()->json($this->periodService->toResource($period));
    }

    public function listCategories(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $result = $this->categoryService->list([
            'parent' => $request->query('parent'),
            'is_active' => $request->query('is_active'),
            'search' => $request->query('search'),
            'per_page' => $request->query('per_page', 50),
            'page' => $request->query('page', 1),
        ]);

        return response()->json($result['data'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'parent' => 'nullable|string|in:B,C,D',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'requires_outlet' => 'nullable|boolean',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'aliases' => 'nullable|array',
            'aliases.*' => 'string|max:20',
        ]);

        $category = $this->categoryService->create($user, $validated);

        return response()->json($this->categoryService->toResource($category), 201);
    }

    public function getCategory(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $category = $this->categoryService->find($id);

        return response()->json($this->categoryService->toResource($category));
    }

    public function updateCategory(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'parent' => 'nullable|string|in:B,C,D',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'requires_outlet' => 'nullable|boolean',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'aliases' => 'nullable|array',
            'aliases.*' => 'string|max:20',
        ]);

        $category = $this->categoryService->update($user, $id, $validated);

        return response()->json($this->categoryService->toResource($category));
    }

    public function deactivateCategory(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $category = $this->categoryService->deactivate($user, $id);

        return response()->json($this->categoryService->toResource($category));
    }

    public function addCategoryAlias(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'alias_code' => 'required|string|max:20',
        ]);

        $alias = $this->categoryService->addAlias($id, $validated['alias_code'], $user);

        return response()->json(['id' => $alias->id, 'aliasCode' => $alias->alias_code], 201);
    }

    public function removeCategoryAlias(Request $request, string $id, string $aliasCode): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $this->categoryService->removeAlias($id, $aliasCode, $user);

        return response()->json(['message' => "Alias '{$aliasCode}' berhasil dihapus"]);
    }

    public function resolveCategory(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'code' => 'required|string|max:20',
        ]);

        $category = $this->categoryService->resolve($validated['code']);

        return response()->json($this->categoryService->toResource($category));
    }

    public function listAccounts(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $result = $this->accountService->list([
            'type' => $request->query('type'),
            'is_active' => $request->query('is_active'),
            'category_id' => $request->query('category_id'),
            'search' => $request->query('search'),
            'requires_outlet' => $request->has('requires_outlet') ? filter_var($request->query('requires_outlet'), FILTER_VALIDATE_BOOLEAN) : null,
            'per_page' => $request->query('per_page', 50),
            'page' => $request->query('page', 1),
        ]);

        return response()->json($result['data'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function createAccount(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'display_name' => 'required|string|max:255',
            'type' => 'required|string|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'display_order' => 'nullable|integer|min:0',
            'category_id' => 'nullable|string',
            'description' => 'nullable|string|max:500',
            'outlet_ids' => 'nullable|array',
            'outlet_ids.*' => 'string',
        ]);

        $account = $this->accountService->create($user, $validated);

        return response()->json($this->accountService->toResource($account), 201);
    }

    public function getAccount(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $account = $this->accountService->find($id);

        return response()->json($this->accountService->toResource($account));
    }

    public function updateAccount(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $validated = $request->validate([
            'display_name' => 'nullable|string|max:255',
            'type' => 'nullable|string|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'category_id' => 'nullable|string',
            'description' => 'nullable|string|max:500',
            'outlet_ids' => 'nullable|array',
            'outlet_ids.*' => 'string',
        ]);

        $account = $this->accountService->update($user, $id, $validated);

        return response()->json($this->accountService->toResource($account));
    }

    public function deactivateAccount(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $account = $this->accountService->deactivate($user, $id);

        return response()->json($this->accountService->toResource($account));
    }

    public function listMasterHistory(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $this->assertAccScope($user);

        $result = $this->historyService->list([
            'entity_type' => $request->query('entity_type'),
            'entity_id' => $request->query('entity_id'),
            'action' => $request->query('action'),
            'per_page' => $request->query('per_page', 50),
            'page' => $request->query('page', 1),
        ]);

        return response()->json($result['data'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    protected function assertAccScope(array $user): void
    {
        $divisionCode = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $role = $user['role'] ?? '';

        if ($role === 'BOD') {
            throw new ApiException(
                'FORBIDDEN_CAPABILITY',
                'BOD tidak diizinkan mengakses master data Accounting'
            );
        }

        if ($divisionCode !== 'ACC') {
            throw new ApiException(
                'SCOPE_VIOLATION',
                "Akses ditolak untuk divisi Accounting (user {$role}/{$divisionCode})"
            );
        }
    }

    protected function assertPeriodScope(array $user): void
    {
        $divisionCode = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $role = $user['role'] ?? '';

        if ($role === 'BOD') {
            return;
        }

        if ($divisionCode !== 'ACC') {
            throw new ApiException(
                'SCOPE_VIOLATION',
                "Akses ditolak untuk divisi Accounting (user {$role}/{$divisionCode})"
            );
        }
    }
}
