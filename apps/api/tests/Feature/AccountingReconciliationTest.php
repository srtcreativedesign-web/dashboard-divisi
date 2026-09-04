<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingBankReconciliation;
use App\Models\AccountingPeriod;
use App\Models\Division;
use Database\Seeders\AccMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected AccountingPeriod $period;

    protected AccountingAccount $accountBank1;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(AccMasterSeeder::class);

        $acc = Division::where('code', 'ACC')->first();

        $this->period = AccountingPeriod::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_month' => '2026-08-01',
            'status' => 'draft',
            'version' => 1,
        ]);

        $this->accountBank1 = AccountingAccount::where('code', 'ACC-1001')->first();

        AccountingBankReconciliation::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->period->id,
            'account_id' => $this->accountBank1->id,
            'jul_balance' => 50000000,
            'aug_balance' => 75000000,
            'mutation' => 25000000,
            'is_verified' => true,
        ]);
    }

    public function test_admin_can_list_reconciliations_and_summary()
    {
        $response = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/reconciliations');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'period' => ['id', 'period_month', 'status'],
                'summary' => [
                    'total_bank_accounts',
                    'total_bank_jul',
                    'total_bank_aug',
                    'total_mutation',
                    'cashflow_ending_balance',
                    'variance',
                ],
                'items',
            ],
        ]);
        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_admin_can_submit_period()
    {
        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/reconciliations/submit', [
                'period_id' => $this->period->id,
                'notes' => 'Pengajuan rekonsiliasi kas periode Agustus',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('submitted', $response->json('data.status'));
        $this->assertDatabaseHas('accounting_periods', [
            'id' => $this->period->id,
            'status' => 'submitted',
        ]);
    }

    public function test_non_manager_cannot_approve_period()
    {
        $this->period->update(['status' => 'submitted']);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/reconciliations/approve', [
                'period_id' => $this->period->id,
            ]);

        // Capability middleware blocks non-manager for approve
        $this->assertTrue(in_array($response->status(), [403, 422]));
    }

    public function test_manager_can_approve_and_close_period()
    {
        $this->period->update(['status' => 'submitted']);

        $approveRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/reconciliations/approve', [
                'period_id' => $this->period->id,
                'notes' => 'Disetujui oleh Manager ACC',
            ]);

        $approveRes->assertStatus(200);
        $this->assertEquals('approved', $approveRes->json('data.status'));

        $closeRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/reconciliations/close', [
                'period_id' => $this->period->id,
                'notes' => 'Periode resmi ditutup dan dikunci',
            ]);

        $closeRes->assertStatus(200);
        $this->assertEquals('closed', $closeRes->json('data.status'));
    }

    public function test_manager_can_reopen_period_with_audit_notes()
    {
        $this->period->update(['status' => 'closed']);

        $response = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/reconciliations/reopen', [
                'period_id' => $this->period->id,
                'notes' => 'Koreksi penyesuaian bunga bank',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('draft', $response->json('data.status'));
    }
}
