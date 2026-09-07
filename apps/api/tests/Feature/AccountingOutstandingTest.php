<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingOutstanding;
use App\Models\AccountingPeriod;
use App\Models\Division;
use Database\Seeders\AccMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingOutstandingTest extends TestCase
{
    use RefreshDatabase;

    protected AccountingPeriod $period;

    protected AccountingAccount $account;

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

        $this->account = AccountingAccount::where('code', 'ACC-1001')->first();
    }

    public function test_admin_can_list_outstandings_and_kpis()
    {
        AccountingOutstanding::create([
            'id' => (string) Str::uuid(),
            'division_id' => $this->period->division_id,
            'period_id' => $this->period->id,
            'code' => 'OTS-TEST-01',
            'description' => 'Tagihan KSO Wrapping',
            'amount' => 50000000,
            'paid_amount' => 0,
            'remaining_amount' => 50000000,
            'due_date' => '2026-09-15',
            'status' => 'unpaid',
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/outstandings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'kpis' => [
                    'total_active_outstanding',
                    'total_paid',
                    'actual_cash_balance',
                    'projected_ending_balance',
                ],
                'items',
            ],
        ]);
        $this->assertEquals(50000000, $response->json('data.kpis.total_active_outstanding'));
        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_admin_can_create_new_outstanding_item()
    {
        $payload = [
            'period_id' => $this->period->id,
            'account_id' => $this->account->id,
            'description' => 'Sewa Gudang Tahunan',
            'amount' => 100000000,
            'due_date' => '2026-09-30',
            'category_name' => 'Operasional Wrapping',
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/outstandings', $payload);

        $response->assertStatus(201);
        $this->assertEquals(100000000, $response->json('data.amount'));
        $this->assertEquals(100000000, $response->json('data.remaining_amount'));
        $this->assertEquals('unpaid', $response->json('data.status'));

        $this->assertDatabaseHas('accounting_outstandings', [
            'description' => 'Sewa Gudang Tahunan',
            'amount' => 100000000,
            'status' => 'unpaid',
        ]);
    }

    public function test_recording_partial_payment_updates_remaining_amount_and_status()
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(),
            'division_id' => $this->period->division_id,
            'period_id' => $this->period->id,
            'code' => 'OTS-TEST-02',
            'description' => 'Gaji Lapangan Agustus',
            'amount' => 100000000,
            'paid_amount' => 0,
            'remaining_amount' => 100000000,
            'due_date' => '2026-09-15',
            'status' => 'unpaid',
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", [
                'amount' => 40000000,
                'notes' => 'Pembayaran termin 1',
            ]);

        $response->assertStatus(200);
        $this->assertEquals(40000000, $response->json('data.outstanding.paid_amount'));
        $this->assertEquals(60000000, $response->json('data.outstanding.remaining_amount'));
        $this->assertEquals('partial', $response->json('data.outstanding.status'));

        $this->assertDatabaseHas('accounting_outstanding_payments', [
            'outstanding_id' => $item->id,
            'amount' => 40000000,
        ]);
    }

    public function test_payment_exceeding_remaining_amount_fails_validation()
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(),
            'division_id' => $this->period->division_id,
            'period_id' => $this->period->id,
            'code' => 'OTS-TEST-03',
            'description' => 'Biaya Ekspedisi Mesin',
            'amount' => 20000000,
            'paid_amount' => 0,
            'remaining_amount' => 20000000,
            'due_date' => '2026-09-15',
            'status' => 'unpaid',
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", [
                'amount' => 25000000,
            ]);

        $response->assertStatus(422);
    }

    public function test_soft_cancel_outstanding_item_with_reason()
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(),
            'division_id' => $this->period->division_id,
            'period_id' => $this->period->id,
            'code' => 'OTS-TEST-04',
            'description' => 'Tagihan dibatalkan pihak vendor',
            'amount' => 15000000,
            'paid_amount' => 0,
            'remaining_amount' => 15000000,
            'due_date' => '2026-09-15',
            'status' => 'unpaid',
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/cancel", [
                'reason' => 'Vendor salah menerbitkan invoice',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $response->json('data.status'));
        $this->assertEquals('Vendor salah menerbitkan invoice', $response->json('data.cancellation_reason'));

        $this->assertDatabaseHas('accounting_outstandings', [
            'id' => $item->id,
            'status' => 'cancelled',
            'cancellation_reason' => 'Vendor salah menerbitkan invoice',
        ]);
    }
}
