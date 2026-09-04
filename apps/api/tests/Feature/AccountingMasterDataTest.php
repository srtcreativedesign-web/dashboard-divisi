<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingCategory;
use App\Models\AccountingCategoryAlias;
use App\Models\Division;
use App\Models\Outlet;
use App\Services\AccCategoryService;
use Database\Seeders\AccMasterSeeder;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

class AccountingMasterDataTest extends TestCase
{
    public const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->seed(AccMasterSeeder::class);
    }

    public function test_seed_categories_and_aliases_idempotent(): void
    {
        $this->assertCount(97, AccountingCategory::all());

        $c14 = AccountingCategory::where('code', 'C14')->first();
        $this->assertNotNull($c14);
        $this->assertTrue($c14->is_active);
        $this->assertFalse($c14->requires_outlet);

        $c25 = AccountingCategory::where('code', 'C25')->first();
        $this->assertNotNull($c25);
        $this->assertTrue($c25->is_active);
        $this->assertTrue($c25->requires_outlet);

        $b2a = AccountingCategory::where('code', 'B2a')->first();
        $this->assertNotNull($b2a);
        $this->assertTrue($b2a->is_active);
        $this->assertEquals('B2a', $b2a->code);

        $aliases = AccountingCategoryAlias::all();
        $this->assertGreaterThanOrEqual(4, $aliases->count());

        $this->seed(AccMasterSeeder::class);
        $this->assertCount(97, AccountingCategory::all());
        $this->assertEquals(1, AccountingCategory::where('code', 'C14')->count());
        $this->assertEquals(1, AccountingCategory::where('code', 'C25')->count());
        $this->assertEquals(1, AccountingCategory::where('code', 'B2a')->count());
    }

    public function test_alias_normalization(): void
    {
        $this->assertEquals('2a', AccCategoryService::normalizeAliasCode('2a'));
        $this->assertEquals('2a', AccCategoryService::normalizeAliasCode('2A'));
        $this->assertEquals('2a', AccCategoryService::normalizeAliasCode(' 2a '));
        $this->assertEquals('14c', AccCategoryService::normalizeAliasCode('14C'));
        $this->assertEquals('25c', AccCategoryService::normalizeAliasCode('25c'));

        $this->assertEquals('B2a', AccCategoryService::normalizeCanonicalCode('b2a'));
        $this->assertEquals('B2a', AccCategoryService::normalizeCanonicalCode('B2A'));
        $this->assertEquals('B2a', AccCategoryService::normalizeCanonicalCode('B2a'));
        $this->assertEquals('C14', AccCategoryService::normalizeCanonicalCode('c14'));
        $this->assertEquals('C25', AccCategoryService::normalizeCanonicalCode('C25'));
        $this->assertEquals('D1', AccCategoryService::normalizeCanonicalCode('D1'));
    }

    public function test_resolve_category_via_alias(): void
    {
        $cat = app(AccCategoryService::class);
        $resolved = $cat->resolve('2a');
        $this->assertEquals('B2a', $resolved->code);

        $resolved2 = $cat->resolve('2A');
        $this->assertEquals('B2a', $resolved2->code);

        $resolved3 = $cat->resolve(' 2a ');
        $this->assertEquals('B2a', $resolved3->code);

        $resolvedCanonical = $cat->resolve('B2a');
        $this->assertEquals('B2a', $resolvedCanonical->code);

        $resolvedLower = $cat->resolve('b2a');
        $this->assertEquals('B2a', $resolvedLower->code);

        $resolvedUpper = $cat->resolve('B2A');
        $this->assertEquals('B2a', $resolvedUpper->code);

        $resolved14 = $cat->resolve('C14');
        $this->assertEquals('C14', $resolved14->code);

        $resolved14c = $cat->resolve('14c');
        $this->assertEquals('C14', $resolved14c->code);

        $resolved25 = $cat->resolve('C25');
        $this->assertEquals('C25', $resolved25->code);

        $resolved25c = $cat->resolve('25c');
        $this->assertEquals('C25', $resolved25c->code);
    }

    public function test_admin_acc_can_read_master(): void
    {
        $res = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/categories');
        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(50, count($res->json('data')));

        $accountsRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/accounts');
        $accountsRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(12, count($accountsRes->json('data')));

        $historyRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/master/history');
        $historyRes->assertStatus(200);
    }

    public function test_manager_acc_can_manage_master(): void
    {
        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B4a',
                'name' => 'Piutang Divisi',
                'parent' => 'B',
                'display_order' => 10,
                'is_active' => true,
                'requires_outlet' => false,
            ]);
        $res->assertStatus(201);
        $this->assertEquals('B4a', $res->json('data.code'));

        $catId = $res->json('data.id');
        $updateRes = $this->authenticated('manager.acc@dashboard.test')
            ->putJson("/api/v1/accounting/categories/{$catId}", ['name' => 'Piutang Divisi Updated']);
        $updateRes->assertStatus(200);
        $this->assertEquals('Piutang Divisi Updated', $updateRes->json('data.name'));

        $deactivateRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/categories/{$catId}/deactivate");
        $deactivateRes->assertStatus(200);
        $this->assertFalse($deactivateRes->json('data.isActive'));
    }

    public function test_admin_acc_cannot_manage_master(): void
    {
        $res = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B99',
                'name' => 'Test Denied',
                'parent' => 'B',
            ]);
        $res->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $res->json('error.code'));
    }

    public function test_bod_cannot_access_master_data(): void
    {
        $catRes = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/categories');
        $catRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $catRes->json('error.code'));

        $accRes = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/accounts');
        $accRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $accRes->json('error.code'));

        $histRes = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/master/history');
        $histRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $histRes->json('error.code'));

        $createRes = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B98',
                'name' => 'BOD Denied',
                'parent' => 'B',
            ]);
        $createRes->assertStatus(403);
        $this->assertTrue(in_array($createRes->json('error.code'), ['SCOPE_VIOLATION', 'FORBIDDEN_CAPABILITY'], true));
    }

    public function test_cross_division_denied(): void
    {
        $res = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/accounting/categories');
        $res->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $res->json('error.code'));

        $res2 = $this->authenticated('admin.cell@dashboard.test')
            ->getJson('/api/v1/accounting/accounts');
        $res2->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $res2->json('error.code'));
    }

    public function test_anonymous_denied(): void
    {
        $res = $this->getJson('/api/v1/accounting/categories');
        $res->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $res->json('error.code'));

        $res2 = $this->getJson('/api/v1/accounting/accounts');
        $res2->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $res2->json('error.code'));
    }

    public function test_period_state_machine_valid_transitions(): void
    {
        $periodRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', [
                'period_month' => '2026-09',
                'notes' => 'Periode testing',
            ]);
        $periodRes->assertStatus(201);
        $periodId = $periodRes->json('data.id');
        $this->assertEquals('draft', $periodRes->json('data.status'));

        // Admin submits draft -> pending_approval
        $submitRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'pending_approval',
            ]);
        $submitRes->assertStatus(200);
        $this->assertEquals('pending_approval', $submitRes->json('data.status'));

        // Manager approves pending_approval -> approved
        $approveRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'approved',
            ]);
        $approveRes->assertStatus(200);
        $this->assertEquals('approved', $approveRes->json('data.status'));

        // Manager closes approved -> closed
        $closeRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'closed',
            ]);
        $closeRes->assertStatus(200);
        $this->assertEquals('closed', $closeRes->json('data.status'));

        // Manager reopens closed -> reopened
        $reopenRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'reopened',
            ]);
        $reopenRes->assertStatus(200);
        $this->assertEquals('reopened', $reopenRes->json('data.status'));

        // Manager sets reopened -> draft
        $reDraftRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'draft',
            ]);
        $reDraftRes->assertStatus(200);
        $this->assertEquals('draft', $reDraftRes->json('data.status'));
    }

    public function test_admin_cannot_approve_or_close_period(): void
    {
        $periodRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', [
                'period_month' => '2026-05',
            ]);
        $periodRes->assertStatus(201);
        $periodId = $periodRes->json('data.id');

        // Admin submits draft -> pending_approval
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'pending_approval',
            ])->assertStatus(200);

        // Admin attempts to approve -> 403 FORBIDDEN_CAPABILITY
        $approveRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'approved',
            ]);
        $approveRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $approveRes->json('error.code'));

        // Admin attempts to close -> 403 FORBIDDEN_CAPABILITY
        $closeRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'closed',
            ]);
        $closeRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $closeRes->json('error.code'));
    }

    public function test_period_state_machine_invalid_transitions(): void
    {
        $periodRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', [
                'period_month' => '2026-10',
            ]);
        $periodRes->assertStatus(201);
        $periodId = $periodRes->json('data.id');

        $invalidRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$periodId}/transition", [
                'status' => 'closed',
            ]);
        $invalidRes->assertStatus(409);
        $this->assertEquals('INVALID_STATE_TRANSITION', $invalidRes->json('error.code'));
    }

    public function test_bod_period_visibility_restrictions(): void
    {
        // 1. Create a draft period
        $p1 = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-02'])->json('data');

        // 2. Create an approved period
        $p2 = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-03'])->json('data');
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$p2['id']}/transition", ['status' => 'pending_approval']);
        $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/periods/{$p2['id']}/transition", ['status' => 'approved']);

        // BOD listing should only show approved period, not draft
        $bodList = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/periods');
        $bodList->assertStatus(200);
        $months = collect($bodList->json('data'))->pluck('periodMonth')->toArray();
        $this->assertContains('2026-03-01', $months);
        $this->assertNotContains('2026-02-01', $months);

        // BOD requesting draft detail should be forbidden
        $bodDraftDetail = $this->authenticated('bod1@dashboard.test')
            ->getJson("/api/v1/accounting/periods/{$p1['id']}");
        $bodDraftDetail->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $bodDraftDetail->json('error.code'));

        // BOD requesting approved detail should succeed
        $bodApprovedDetail = $this->authenticated('bod1@dashboard.test')
            ->getJson("/api/v1/accounting/periods/{$p2['id']}");
        $bodApprovedDetail->assertStatus(200);

        // BOD filtering by status=draft should be forbidden
        $bodFilterDraft = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/periods?status=draft');
        $bodFilterDraft->assertStatus(403);
    }

    public function test_cannot_hard_delete_referenced_category(): void
    {
        $c25 = AccountingCategory::where('code', 'C25')->first();
        $this->assertNotNull($c25);

        $account = AccountingAccount::where('category_id', $c25->id)->first();
        $this->assertNotNull($account, 'Harus ada rekening yang refer C25');
    }

    public function test_account_outlet_validation(): void
    {
        $acc = Division::where('code', 'ACC')->first();
        $outletAcc = Outlet::where('code', 'ACC-001')->first();
        $outletWrap = Outlet::where('code', 'WRAP-001')->first();

        $createRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-9001',
                'display_name' => 'Test Outlet Account',
                'type' => 'ASSET',
                'outlet_ids' => [$outletWrap->id],
            ]);
        $createRes->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $createRes->json('error.code'));

        $okRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-9002',
                'display_name' => 'Test ACC Account',
                'type' => 'ASSET',
                'outlet_ids' => [$outletAcc->id],
            ]);
        $okRes->assertStatus(201);
    }

    public function test_account_requires_outlet_when_category_demands_it(): void
    {
        $c25 = AccountingCategory::where('code', 'C25')->first();
        $this->assertNotNull($c25);
        $this->assertTrue($c25->requires_outlet);

        // Creating account with category C25 without outlet_ids fails with 400 VALIDATION_ERROR
        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-9003',
                'display_name' => 'Test No Outlet',
                'type' => 'EXPENSE',
                'category_id' => $c25->id,
            ]);
        $res->assertStatus(400);
        $this->assertEquals('VALIDATION_ERROR', $res->json('error.code'));
    }

    public function test_transaction_rollback_on_account_creation_failure(): void
    {
        $initialCount = AccountingAccount::count();
        $outletWrap = Outlet::where('code', 'WRAP-001')->first();

        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-FAIL-1',
                'display_name' => 'Will Fail',
                'type' => 'ASSET',
                'outlet_ids' => [$outletWrap->id],
            ]);
        $res->assertStatus(403);

        $this->assertEquals($initialCount, AccountingAccount::count());
        $this->assertNull(AccountingAccount::where('code', 'ACC-FAIL-1')->first());
    }

    public function test_period_list_and_filter(): void
    {
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-07']);
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-08']);

        $listRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/periods');
        $listRes->assertStatus(200);
        $this->assertCount(2, $listRes->json('data'));

        $filteredRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/periods?status=draft');
        $filteredRes->assertStatus(200);
        $this->assertCount(2, $filteredRes->json('data'));
    }

    public function test_duplicate_period_month_prevented(): void
    {
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-11']);
        $dupRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-11']);
        $dupRes->assertStatus(409);
        $this->assertEquals('VERSION_CONFLICT', $dupRes->json('error.code'));
    }

    public function test_create_category_with_aliases(): void
    {
        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B5a',
                'name' => 'Persediaan Outlet',
                'parent' => 'B',
                'aliases' => ['5a', 'persediaan-outlet'],
            ]);
        $res->assertStatus(201);
        $catId = $res->json('data.id');

        $aliases = $res->json('data.aliases');
        $this->assertCount(2, $aliases);

        $getRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson("/api/v1/accounting/categories/{$catId}");
        $getRes->assertStatus(200);
        $this->assertCount(2, $getRes->json('data.aliases'));
    }

    public function test_duplicate_alias_prevented(): void
    {
        $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B6a',
                'name' => 'Test Alias',
                'parent' => 'B',
                'aliases' => ['X1'],
            ]);

        $dupRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B7a',
                'name' => 'Test Alias Dup',
                'parent' => 'B',
                'aliases' => ['X1'],
            ]);
        $dupRes->assertStatus(409);
        $this->assertEquals('VERSION_CONFLICT', $dupRes->json('error.code'));
    }

    public function test_account_create_and_deactivate(): void
    {
        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-8001',
                'display_name' => 'Test Kas ACC',
                'type' => 'ASSET',
                'display_order' => 50,
            ]);
        $res->assertStatus(201);
        $accountId = $res->json('data.id');
        $this->assertEquals(50, $res->json('data.displayOrder'));

        $getRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson("/api/v1/accounting/accounts/{$accountId}");
        $getRes->assertStatus(200);
        $this->assertEquals('ACC-8001', $getRes->json('data.code'));
        $this->assertEquals(50, $getRes->json('data.displayOrder'));

        $deactivateRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/accounts/{$accountId}/deactivate");
        $deactivateRes->assertStatus(200);
        $this->assertFalse($deactivateRes->json('data.is_active'));
    }

    public function test_duplicate_account_code_prevented(): void
    {
        $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-7001',
                'display_name' => 'Test Dup',
                'type' => 'ASSET',
            ]);
        $dupRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-7001',
                'display_name' => 'Test Dup 2',
                'type' => 'LIABILITY',
            ]);
        $dupRes->assertStatus(409);
        $this->assertEquals('VERSION_CONFLICT', $dupRes->json('error.code'));
    }

    public function test_master_history_logged(): void
    {
        $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'B8a',
                'name' => 'History Test',
                'parent' => 'B',
            ]);

        $histRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/master/history?entity_type=CATEGORY');
        $histRes->assertStatus(200);
        $this->assertNotEmpty($histRes->json('data'));

        $createHist = collect($histRes->json('data'))->firstWhere('action', 'CREATE');
        $this->assertNotNull($createHist);
        $this->assertEquals('CATEGORY', $createHist['entity_type']);
    }

    public function test_period_history_logged(): void
    {
        $periodRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-06']);
        $periodId = $periodRes->json('data.id');

        $histRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/master/history?entity_type=PERIOD&entity_id='.$periodId);
        $histRes->assertStatus(200);
        $this->assertNotEmpty($histRes->json('data'));
    }

    public function test_account_outlet_requires_acc_scope(): void
    {
        $outletWrap = Outlet::where('code', 'WRAP-001')->first();

        $res = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/accounts', [
                'code' => 'ACC-6001',
                'display_name' => 'Wrong Scope',
                'type' => 'ASSET',
                'outlet_ids' => [$outletWrap->id],
            ]);
        $res->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $res->json('error.code'));
    }

    public function test_api_contract_success_envelope(): void
    {
        $res = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/categories');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                ['id', 'code', 'name'],
            ],
        ]);
    }

    public function test_regression_existing_divisions_unaffected(): void
    {
        $divisions = Division::all();
        $this->assertCount(8, $divisions);

        $fin = Division::where('code', 'FIN')->first();
        $this->assertEquals('Finance', $fin->name);
        $this->assertEquals(6, $fin->sort_order);

        $wrap = Division::where('code', 'WRAP')->first();
        $this->assertEquals('Wrapping', $wrap->name);
    }

    public function test_idor_different_division_manager_denied(): void
    {
        $res = $this->authenticated('manager.fin@dashboard.test')
            ->postJson('/api/v1/accounting/categories', [
                'code' => 'X1',
                'name' => 'FIN Manager tries ACC',
                'parent' => 'B',
            ]);
        $res->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $res->json('error.code'));
    }

    public function test_remove_category_alias(): void
    {
        $c14 = AccountingCategory::where('code', 'C14')->first();
        $aliases = AccountingCategoryAlias::where('canonical_id', $c14->id)->get();
        $this->assertGreaterThanOrEqual(1, $aliases->count());

        $aliasCode = $aliases->first()->alias_code;
        $delRes = $this->authenticated('manager.acc@dashboard.test')
            ->deleteJson("/api/v1/accounting/categories/{$c14->id}/aliases/{$aliasCode}");
        $delRes->assertStatus(200);

        $remaining = AccountingCategoryAlias::where('canonical_id', $c14->id)->count();
        $this->assertEquals($aliases->count() - 1, $remaining);
    }

    public function test_cross_division_cannot_create_period(): void
    {
        $res = $this->authenticated('manager.wrap@dashboard.test')
            ->postJson('/api/v1/accounting/periods', ['period_month' => '2026-01']);
        $res->assertStatus(403);
    }
}
