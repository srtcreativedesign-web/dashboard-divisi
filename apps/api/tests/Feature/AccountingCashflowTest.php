<?php

namespace Tests\Feature;

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
}
