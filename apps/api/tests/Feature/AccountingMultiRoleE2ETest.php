<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Database\Seeders\AccMasterSeeder;
use Database\Seeders\AccountingAugust2026Seeder;
use Database\Seeders\AccountingBankReconciliationSeeder;
use Database\Seeders\AccountingOutstandingSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountingMultiRoleE2ETest extends TestCase
{
    use RefreshDatabase;

    private User $adminAcc;

    private User $managerAcc;

    private User $bodUser;

    private User $managerWrap;

    private User $adminCell;

    private Division $accDivision;

    private Division $wrapDivision;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $this->seed(AccMasterSeeder::class);
        $this->seed(AccountingAugust2026Seeder::class);
        $this->seed(AccountingOutstandingSeeder::class);
        $this->seed(AccountingBankReconciliationSeeder::class);

        $this->adminAcc = User::where('email', 'admin.acc@dashboard.test')->firstOrFail();
        $this->managerAcc = User::where('email', 'manager.acc@dashboard.test')->firstOrFail();
        $this->bodUser = User::where('email', 'bod1@dashboard.test')->firstOrFail();
        $this->managerWrap = User::where('email', 'manager.wrap@dashboard.test')->firstOrFail();
        $this->adminCell = User::where('email', 'admin.cell@dashboard.test')->firstOrFail();

        $this->accDivision = Division::where('code', 'ACC')->firstOrFail();
        $this->wrapDivision = Division::where('code', 'WRAP')->firstOrFail();
    }

    private function getHeaders(string $email, ?string $division = 'accounting'): array
    {
        $res = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'Password123!',
        ]);

        $token = $res->json('data.accessToken');
        $headers = [
            'Authorization' => "Bearer {$token}",
        ];
        if ($division) {
            $headers['X-User-Division'] = $division;
        }

        return $headers;
    }

    public function test_admin_acc_has_operational_access_but_cannot_approve_or_close(): void
    {
        $headers = $this->getHeaders('admin.acc@dashboard.test', 'accounting');

        // 1. Admin ACC can view outstandings
        $res = $this->getJson('/api/v1/accounting/outstandings', $headers);
        $res->assertStatus(200);

        // 2. Admin ACC can view reconciliations
        $res = $this->getJson('/api/v1/accounting/reconciliations', $headers);
        $res->assertStatus(200);

        // 3. Admin ACC CANNOT approve reconciliation (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/reconciliations/approve', [
            'notes' => 'Admin mencoba approve',
        ], $headers);
        $res->assertStatus(403);

        // 4. Admin ACC CANNOT close reconciliation (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/reconciliations/close', [
            'notes' => 'Admin mencoba close',
        ], $headers);
        $res->assertStatus(403);
    }

    public function test_manager_acc_has_supervision_access_but_cannot_create_mutations(): void
    {
        $headers = $this->getHeaders('manager.acc@dashboard.test', 'accounting');

        // 1. Manager ACC can view reconciliations
        $res = $this->getJson('/api/v1/accounting/reconciliations', $headers);
        $res->assertStatus(200);

        // 2. Manager ACC can view cashflow report
        $res = $this->getJson('/api/v1/accounting/cashflow/report', $headers);
        $res->assertStatus(200);

        // 3. Manager ACC CANNOT write transaction mutations (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/transactions', [
            'transaction_date' => '2026-08-15',
            'description' => 'Manager trying to post journal',
            'debit_amount' => 100000,
            'credit_amount' => 0,
        ], $headers);
        $res->assertStatus(403);

        // 4. Manager ACC CANNOT commit imports (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/import/commit', [
            'rows' => [],
        ], $headers);
        $res->assertStatus(403);
    }

    public function test_bod_has_read_only_access_and_cannot_mutate(): void
    {
        $headers = $this->getHeaders('bod1@dashboard.test', null);

        // 1. BOD can view cashflow report
        $res = $this->getJson('/api/v1/accounting/cashflow/report', $headers);
        $res->assertStatus(200);

        // 2. BOD cannot create transaction (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/transactions', [
            'description' => 'BOD mutation attempt',
        ], $headers);
        $res->assertStatus(403);

        // 3. BOD cannot modify reconciliations (403 Forbidden)
        $res = $this->postJson('/api/v1/accounting/reconciliations/approve', [], $headers);
        $res->assertStatus(403);
    }

    public function test_retail_division_users_are_forbidden_from_accounting_endpoints(): void
    {
        // 1. Wrapping Manager
        $wrapHeaders = $this->getHeaders('manager.wrap@dashboard.test', 'wrapping');

        $res = $this->getJson('/api/v1/accounting/outstandings', $wrapHeaders);
        $res->assertStatus(403);

        $res = $this->getJson('/api/v1/accounting/reconciliations', $wrapHeaders);
        $res->assertStatus(403);

        $res = $this->getJson('/api/v1/accounting/cashflow/report', $wrapHeaders);
        $res->assertStatus(403);

        // 2. Cellular Admin
        $cellHeaders = $this->getHeaders('admin.cell@dashboard.test', 'cellular');

        $res = $this->getJson('/api/v1/accounting/transactions', $cellHeaders);
        $res->assertStatus(403);

        $res = $this->postJson('/api/v1/accounting/import/preview', [], $cellHeaders);
        $res->assertStatus(403);
    }

    public function test_retail_division_endpoints_remain_functional_for_retail_users(): void
    {
        $wrapHeaders = $this->getHeaders('manager.wrap@dashboard.test', 'wrapping');

        // Org divisions endpoint accessible
        $res = $this->getJson('/api/v1/org/divisions', $wrapHeaders);
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                '*' => ['id', 'code', 'name'],
            ],
        ]);

        // Health check accessible
        $res = $this->getJson('/api/v1/health');
        $res->assertStatus(200);
    }
}
