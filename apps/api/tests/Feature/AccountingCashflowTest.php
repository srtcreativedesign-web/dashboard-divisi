<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingBankReconciliation;
use App\Models\AccountingOutstanding;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
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
                'quality' => [
                    'posted_transaction_count',
                    'draft_transaction_count',
                    'missing_attachment_count',
                    'bank_account_count',
                    'unverified_bank_count',
                    'exception_count',
                    'is_complete',
                ],
                'comparison',
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $division = Division::where('code', 'ACC')->firstOrFail();
        $period = AccountingPeriod::where('division_id', $division->id)->whereDate('period_month', '2026-08-01')->firstOrFail();
        $opening = (float) AccountingBankReconciliation::where('period_id', $period->id)->sum('jul_balance');
        $net = (float) AccountingTransaction::where('period_id', $period->id)->whereNull('cancelled_at')->where('is_draft', false)
            ->selectRaw('SUM(debit_amount - credit_amount) as net')->value('net');
        $closing = $opening + $net;
        $this->assertEqualsWithDelta($closing, $response->json('data.kpis.ending_cash_balance'), 0.01);
        $bank = (float) AccountingBankReconciliation::where('period_id', $period->id)->sum('aug_balance');
        $this->assertSame(abs($bank - $closing) <= 1, $response->json('data.kpis.is_reconciled'));
        $outstanding = (int) AccountingOutstanding::where('period_id', $period->id)->whereNotIn('status', ['paid', 'cancelled'])->sum('remaining_amount');
        $this->assertEquals($outstanding, $response->json('data.kpis.total_active_outstanding'));
        $this->assertNotEmpty($response->json('data.breakdown.operational'));
        $this->assertNotEmpty($response->json('data.breakdown.backoffice'));
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/accounting/cashflow/report');
        $response->assertStatus(401);
    }

    public function test_empty_period_does_not_reuse_sample_balances(): void
    {
        $division = Division::where('code', 'ACC')->firstOrFail();
        AccountingPeriod::create(['division_id' => $division->id, 'period_month' => '2027-01-01', 'status' => 'draft']);
        $response = $this->getJson('/api/v1/accounting/cashflow/report?period_month=2027-01-01', $this->getAuthHeader());
        $response->assertOk()->assertJsonPath('data.kpis.ending_cash_balance', 0)
            ->assertJsonPath('data.kpis.total_active_outstanding', 0)
            ->assertJsonPath('data.kpis.is_reconciled', false);
    }

    public function test_report_changes_when_a_posted_transaction_changes(): void
    {
        $headers = $this->getAuthHeader();
        $before = $this->getJson('/api/v1/accounting/cashflow/report?period_month=2026-08-01', $headers)->json('data.kpis.ending_cash_balance');
        $transaction = AccountingTransaction::whereNull('cancelled_at')->where('is_draft', false)->where('debit_amount', '>', 0)->firstOrFail();
        $transaction->update(['debit_amount' => $transaction->debit_amount + 25000]);
        $after = $this->getJson('/api/v1/accounting/cashflow/report?period_month=2026-08-01', $headers)->json('data.kpis.ending_cash_balance');
        $this->assertEqualsWithDelta($before + 25000, $after, 0.01);
    }

    public function test_report_compares_with_previous_period_and_exposes_category_movements(): void
    {
        $division = Division::where('code', 'ACC')->firstOrFail();
        $july = AccountingPeriod::create([
            'division_id' => $division->id,
            'period_month' => '2026-07-01',
            'status' => 'closed',
        ]);
        AccountingBankReconciliation::create([
            'id' => 'cashflow-comparison-july',
            'division_id' => $division->id,
            'period_id' => $july->id,
            'account_id' => AccountingAccount::where('code', 'ACC-1001')->firstOrFail()->id,
            'jul_balance' => 100000,
            'aug_balance' => 100000,
            'mutation' => 0,
            'is_verified' => true,
        ]);

        $response = $this->getJson('/api/v1/accounting/cashflow/report?period_month=2026-08', $this->getAuthHeader());

        $response->assertOk()
            ->assertJsonPath('data.comparison.previous_period_month', '2026-07-01')
            ->assertJsonStructure(['data' => ['comparison' => ['metrics' => ['total_revenue' => ['current', 'previous', 'delta', 'delta_percentage']], 'top_category_movements']]]);
    }

    public function test_can_drill_down_cashflow_sources_with_filters_and_pagination(): void
    {
        $response = $this->getJson('/api/v1/accounting/cashflow/details?period_month=2026-08&group=operational&per_page=5&page=1', $this->getAuthHeader());

        $response->assertOk()->assertJsonStructure([
            'data' => [
                'period' => ['id', 'period_month', 'status'],
                'items' => [['id', 'transaction_date', 'reference_no', 'description', 'category_code', 'category_name', 'account_code', 'account_name', 'outlet_name', 'group', 'debit_amount', 'credit_amount', 'cashflow_amount', 'has_attachment']],
                'meta' => ['total', 'per_page', 'current_page', 'last_page'],
            ],
        ]);
        $this->assertLessThanOrEqual(5, count($response->json('data.items')));
        $this->assertTrue(collect($response->json('data.items'))->every(fn (array $item) => $item['group'] === 'operational'));
    }

    public function test_cashflow_details_rejects_cross_division_and_invalid_filters(): void
    {
        $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/accounting/cashflow/details?period_month=2026-08')
            ->assertForbidden();
        $this->getJson('/api/v1/accounting/cashflow/details?period_month=2026-08&group=invalid', $this->getAuthHeader())
            ->assertStatus(400);
    }
}
