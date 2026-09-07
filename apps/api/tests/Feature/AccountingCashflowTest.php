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

class AccountingCashflowTest extends TestCase
{
    use RefreshDatabase;

    private User $accountingUser;

    private Division $wrappingDivision;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $this->seed(AccMasterSeeder::class);
        $this->seed(AccountingAugust2026Seeder::class);
        $this->seed(AccountingOutstandingSeeder::class);
        $this->seed(AccountingBankReconciliationSeeder::class);

        $this->wrappingDivision = Division::where('code', 'WRAP')->firstOrFail();
        $this->accountingUser = User::where('email', 'admin.acc@dashboard.test')->firstOrFail();
    }

    private function getAuthHeader(): array
    {
        $res = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin.acc@dashboard.test',
            'password' => 'Password123!',
        ]);

        $token = $res->json('data.accessToken');

        return [
            'Authorization' => "Bearer {$token}",
            'X-User-Division' => 'wrapping',
        ];
    }

    public function test_can_fetch_cashflow_report(): void
    {
        $headers = $this->getAuthHeader();

        $response = $this->getJson('/api/v1/accounting/cashflow/report', $headers);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'period' => ['period_month', 'status'],
                'kpis' => [
                    'initial_cash_balance',
                    'total_revenue',
                    'total_available',
                    'total_operational_expenses',
                    'total_backoffice_expenses',
                    'total_expenses',
                    'ending_cash_balance',
                    'total_bank_ending_balance',
                    'reconciliation_variance',
                    'is_reconciled',
                    'total_active_outstanding',
                    'projected_ending_balance',
                ],
                'breakdown' => [
                    'revenue',
                    'operational',
                    'backoffice',
                ],
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $this->assertTrue($response->json('data.kpis.is_reconciled'));
        $this->assertEquals(1546704169, $response->json('data.kpis.total_active_outstanding'));
        $this->assertNotEmpty($response->json('data.breakdown.operational'));
        $this->assertNotEmpty($response->json('data.breakdown.backoffice'));
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/accounting/cashflow/report');
        $response->assertStatus(401);
    }
}
