<?php

namespace Tests\Feature;

use App\Models\AccountingPeriod;
use App\Models\Division;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingReadProjectionTest extends TestCase
{
    private AccountingPeriod $period;

    protected function setUp(): void
    {
        parent::setUp();
        $this->period = AccountingPeriod::create(['id' => (string) Str::uuid(),
            'division_id' => Division::where('code', 'ACC')->value('id'), 'period_month' => '2026-09-01',
            'status' => 'draft', 'notes' => 'Catatan internal anonim', 'version' => 1]);
    }

    public function test_operational_roles_receive_only_summary_and_period_projection(): void
    {
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->flushHeaders()->authenticated('manager.acc@dashboard.test');
            $summary = $this->getJson('/api/v1/accounting/cashflow/summary?period_month=2026-09')->assertOk()->json('data');
            $this->assertSame(['period', 'kpis'], array_keys($summary));
            $this->assertSame(['total_revenue', 'total_expenses', 'ending_cash_balance'], array_keys($summary['kpis']));
            $period = $this->getJson('/api/v1/accounting/periods')->assertOk()->json('data.0');
            $this->assertSame(['id', 'periodMonth', 'status'], array_keys($period));
            $report = $this->getJson('/api/v1/accounting/reports')->assertOk()->json('data.0');
            $this->assertSame(['id', 'period', 'title', 'status'], array_keys($report));
            foreach (['cashflow/report', 'vouchers', 'omzet', 'outstandings', 'reconciliations', 'accounts',
                'periods/'.$this->period->id] as $path) {
                $this->getJson('/api/v1/accounting/'.$path)->assertStatus(403)->assertJsonMissing(['Catatan internal anonim']);
            }
        }
    }

    public function test_financial_actors_keep_detail_and_month_filter_supports_ui_format(): void
    {
        foreach (['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->flushHeaders()->authenticated('manager.acc@dashboard.test')
                ->getJson('/api/v1/accounting/cashflow/report?period_month=2026-09')->assertOk()
                ->assertJsonPath('data.period.period_month', '2026-09-01');
        }
        $this->getJson('/api/v1/accounting/cashflow/report?period_month=not-a-month')->assertStatus(400);
    }

    public function test_period_read_cannot_leak_foreign_domain_records(): void
    {
        $foreign = AccountingPeriod::create(['id' => (string) Str::uuid(),
            'division_id' => Division::where('code', 'PROJECT')->value('id'), 'period_month' => '2026-10-01',
            'status' => 'draft', 'notes' => 'Domain lain', 'version' => 1]);
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/periods')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/accounting/periods/'.$foreign->id)->assertNotFound();
    }
}
