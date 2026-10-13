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
        $this->assertEquals(50000000, $response->json('data.kpis.total_active_payable'));
        $this->assertEquals(0, $response->json('data.kpis.total_active_receivable'));
        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_admin_can_create_new_outstanding_item()
    {
        $payload = [
            'period_id' => $this->period->id,
            'account_id' => $this->account->id,
            'description' => 'Sewa Gudang Tahunan',
            'direction' => 'PAYABLE',
            'counterparty_name' => 'PT Pemilik Gudang',
            'document_number' => 'INV-GDG-2026-08',
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

        $response = $this->authenticated('finance@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", [
                'amount' => 40000000,
                'notes' => 'Pembayaran termin 1',
                'payment_date' => '2026-09-01',
                'version' => 1,
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

        $response = $this->authenticated('finance@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", [
                'amount' => 25000000,
                'notes' => 'Pembayaran melebihi sisa tagihan',
                'payment_date' => '2026-09-01',
                'version' => 1,
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

        $response = $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/cancel", [
                'reason' => 'Vendor salah menerbitkan invoice',
                'version' => 1,
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

    public function test_receivable_changes_projection_and_is_returned_with_direction(): void
    {
        AccountingOutstanding::create([
            'id' => (string) Str::uuid(), 'division_id' => $this->period->division_id,
            'period_id' => $this->period->id, 'code' => 'AR-TEST-01', 'direction' => 'RECEIVABLE',
            'counterparty_name' => 'Tenant Cellular', 'document_number' => 'INV-AR-001',
            'description' => 'Piutang tenant', 'amount' => 25000000, 'paid_amount' => 0,
            'remaining_amount' => 25000000, 'due_date' => '2026-09-20', 'status' => 'unpaid', 'version' => 1,
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/outstandings?direction=RECEIVABLE');

        $response->assertOk()->assertJsonPath('data.kpis.total_active_receivable', 25000000)
            ->assertJsonPath('data.items.0.direction', 'RECEIVABLE')
            ->assertJsonPath('data.items.0.counterparty_name', 'Tenant Cellular');
    }

    public function test_create_rejects_locked_period(): void
    {
        $this->period->update(['status' => 'closed']);

        $response = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/outstandings', [
            'period_id' => $this->period->id, 'direction' => 'PAYABLE', 'counterparty_name' => 'Vendor',
            'description' => 'Tagihan periode tutup', 'amount' => 1000, 'due_date' => '2026-09-30',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('accounting_outstandings', ['description' => 'Tagihan periode tutup']);
    }

    public function test_payment_rejects_stale_version(): void
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(), 'division_id' => $this->period->division_id,
            'period_id' => $this->period->id, 'code' => 'AP-TEST-VERSION', 'direction' => 'PAYABLE',
            'description' => 'Tagihan versi', 'amount' => 10000, 'paid_amount' => 0,
            'remaining_amount' => 10000, 'due_date' => '2026-09-15', 'status' => 'unpaid', 'version' => 2,
        ]);

        $response = $this->authenticated('finance@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", [
                'amount' => 5000, 'payment_date' => '2026-09-01',
                'notes' => 'Pembayaran dengan versi lama', 'version' => 1,
            ]);

        $response->assertStatus(409)->assertJsonPath('error.code', 'VERSION_CONFLICT');
    }

    public function test_roles_are_separated_between_create_settlement_and_cancel(): void
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(), 'division_id' => $this->period->division_id,
            'period_id' => $this->period->id, 'code' => 'AP-ROLE-01', 'direction' => 'PAYABLE',
            'description' => 'Tagihan pemisahan tugas', 'amount' => 10000, 'paid_amount' => 0,
            'remaining_amount' => 10000, 'due_date' => '2026-09-15', 'status' => 'unpaid', 'version' => 1,
        ]);
        $payment = ['amount' => 5000, 'payment_date' => '2026-09-01', 'notes' => 'Referensi transfer pengujian', 'version' => 1];

        $this->authenticated('admin.acc@dashboard.test')->postJson("/api/v1/accounting/outstandings/{$item->id}/pay", $payment)->assertForbidden();
        $this->authenticated('finance@dashboard.test')->postJson('/api/v1/accounting/outstandings', [
            'period_id' => $this->period->id, 'direction' => 'PAYABLE', 'counterparty_name' => 'Vendor',
            'description' => 'Finance tidak boleh membuat', 'amount' => 1000, 'due_date' => '2026-09-30',
        ])->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->postJson("/api/v1/accounting/outstandings/{$item->id}/cancel", ['reason' => 'Admin tidak dapat membatalkan', 'version' => 1])->assertForbidden();
    }

    public function test_partially_settled_document_cannot_be_cancelled(): void
    {
        $item = AccountingOutstanding::create([
            'id' => (string) Str::uuid(), 'division_id' => $this->period->division_id,
            'period_id' => $this->period->id, 'code' => 'AP-PARTIAL-01', 'direction' => 'PAYABLE',
            'description' => 'Tagihan sudah sebagian', 'amount' => 10000, 'paid_amount' => 5000,
            'remaining_amount' => 5000, 'due_date' => '2026-09-15', 'status' => 'partial', 'version' => 2,
        ]);

        $this->authenticated('manager.acc@dashboard.test')
            ->postJson("/api/v1/accounting/outstandings/{$item->id}/cancel", ['reason' => 'Mencoba membatalkan transaksi parsial', 'version' => 2])
            ->assertStatus(422);
    }
}
