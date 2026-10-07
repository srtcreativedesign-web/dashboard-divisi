<?php

namespace Tests\Feature;

use App\Models\Accounting\OmzetRecord;
use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingDepositTest extends TestCase
{
    private function payload(): array
    {
        $this->authenticated('admin.acc@dashboard.test');
        $r = $this->postJson('/api/v1/accounting/omzet', ['outlet_id' => Outlet::where('is_active', true)->firstOrFail()->id, 'business_date' => now('Asia/Jakarta')->subDay()->toDateString(), 'shift' => '1', 'outlet_amount' => '1000.50', 'cash_amount' => '500.25', 'qris_amount' => '500.25', 'edc_amount' => '0', 'transfer_amount' => '0', 'other_amount' => '0', 'requires_ap' => false, 'source_reference' => 'OMZ-ANONIM'])->assertCreated()->json('data');
        $r = $this->postJson('/api/v1/accounting/omzet/'.$r['id'].'/submit', ['version' => $r['version']])->assertOk()->json('data');
        $this->authenticated('accounting@dashboard.test')->postJson('/api/v1/accounting/omzet/'.$r['id'].'/review', ['version' => $r['version'], 'decision' => 'validate'])->assertOk();
        $this->authenticated('admin.acc@dashboard.test');

        return ['omzet_id' => $r['id'], 'channel' => 'cash', 'deposit_date' => now('Asia/Jakarta')->toDateString(), 'amount' => '500.25', 'destination' => 'Tujuan anonim', 'source_reference' => 'SETOR-UJI-1', 'evidence_reference' => 'BUKTI-SETOR-1'];
    }

    private function receipt(int $version, string $amount = '200.10', string $ref = 'BANK-UJI-1'): array
    {
        return ['version' => $version, 'amount' => $amount, 'received_date' => now('Asia/Jakarta')->toDateString(), 'evidence_reference' => $ref];
    }

    public function test_source_drilldown_includes_all_deposit_dates_and_excludes_other_sources(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-30 10:00:00', 'Asia/Jakarta'));
        $d = $this->payload();
        $first = $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '200.00']))->assertCreated()->json('data.id');
        $this->travelTo(CarbonImmutable::parse('2026-10-02 10:00:00', 'Asia/Jakarta'));
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['channel' => 'qris', 'amount' => '200.00', 'deposit_date' => '2026-10-02', 'source_reference' => 'SETOR-BULAN-2']))->assertCreated();
        $other = OmzetRecord::findOrFail($d['omzet_id'])->replicate();
        $other->id = (string) Str::uuid();
        $other->shift = '2';
        $other->source_reference = 'OMZ-LAIN';
        $other->save();
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['omzet_id' => $other->id, 'amount' => '100.00', 'deposit_date' => '2026-10-02', 'source_reference' => 'SETOR-LAIN']))->assertCreated();
        $url = '/api/v1/accounting/deposits?omzet_id='.$d['omzet_id'];
        foreach (['admin.acc@dashboard.test', 'manager.acc@dashboard.test', 'accounting@dashboard.test', 'finance@dashboard.test'] as $email) {
            $response = $this->authenticated($email)->getJson($url)->assertOk()->assertJsonPath('data.total', 2)->assertJsonPath('data.source.id', $d['omzet_id']);
            $this->assertSame(['2026-10-02', '2026-09-30'], array_column($response->json('data.items'), 'deposit_date'));
            $this->assertSame(['id', 'outlet_name', 'business_date', 'shift', 'source_reference'], array_keys($response->json('data.source')));
        }
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$first.'/void', ['version' => 1, 'reason' => 'Koreksi catatan sumber anonim'])->assertOk();
        $this->getJson($url)->assertOk()->assertJsonPath('data.items.1.status', 'voided');
        $this->getJson('/api/v1/accounting/deposits?month=2026-10')->assertOk()->assertJsonPath('data.total', 2)->assertJsonPath('data.source', null);
        $this->travelBack();
    }

    public function test_source_drilldown_rejects_invalid_missing_and_foreign_sources(): void
    {
        $d = $this->payload();
        $this->getJson('/api/v1/accounting/deposits?omzet_id=invalid')->assertStatus(400);
        $this->getJson('/api/v1/accounting/deposits')->assertStatus(400);
        $missing = $this->getJson('/api/v1/accounting/deposits?omzet_id='.Str::uuid())->assertNotFound()->json('error.message');
        OmzetRecord::where('id', $d['omzet_id'])->update(['division_code' => 'PROJECT']);
        $this->assertSame($missing, $this->getJson('/api/v1/accounting/deposits?omzet_id='.$d['omzet_id'])->assertNotFound()->json('error.message'));
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/deposits?omzet_id='.$d['omzet_id'])->assertForbidden();
        }
    }

    public function test_source_drilldown_pagination_remains_bounded(): void
    {
        $d = $this->payload();
        for ($i = 0; $i < 51; $i++) {
            $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '1.00', 'source_reference' => 'SETOR-PAGE-'.$i]))->assertCreated();
        }
        $url = '/api/v1/accounting/deposits?omzet_id='.$d['omzet_id'];
        $first = $this->getJson($url)->assertOk()->assertJsonPath('data.total', 51)->assertJsonCount(50, 'data.items')->json('data.items');
        $second = $this->getJson($url.'&page=2')->assertOk()->assertJsonCount(1, 'data.items')->json('data.items');
        $this->assertNotContains($second[0]['id'], array_column($first, 'id'));
    }

    public function test_reconciliation_preserves_channel_allocation_and_partial_receipts(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '300.15']))->assertCreated()->json('data.id');
        $qris = $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['channel' => 'qris', 'amount' => '400.00', 'source_reference' => 'SETOR-QRIS']))->assertCreated()->json('data.id');
        $this->authenticated('finance@dashboard.test');
        $receipt = $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1, '100.10'))->assertOk()->json('data.receipts.0.id');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(2, '50.05', 'BANK-2'))->assertOk();
        $this->postJson('/api/v1/accounting/deposits/'.$qris.'/receive', $this->receipt(1, '100.20', 'BANK-QRIS'))->assertOk();
        $url = '/api/v1/accounting/deposits/reconciliation?month='.now('Asia/Jakarta')->subDay()->format('Y-m');
        $response = $this->getJson($url)->assertOk()->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.items.0.channels.0.reported_amount', '500.25')->assertJsonPath('data.items.0.channels.0.allocated_amount', '300.15')
            ->assertJsonPath('data.items.0.channels.0.received_amount', '150.15')->assertJsonPath('data.items.0.channels.0.unallocated_amount', '200.10')
            ->assertJsonPath('data.items.0.channels.0.remaining_amount', '150.00')->assertJsonPath('data.items.0.channels.1.received_amount', '100.20')
            ->assertJsonPath('data.items.0.channels.2.reported_amount', '0.00');
        $this->assertSame(['id', 'outlet_name', 'business_date', 'shift', 'source_reference', 'channels'], array_keys($response->json('data.items.0')));
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receipts/'.$receipt.'/void', ['version' => 3, 'reason' => 'Koreksi bukti penerimaan anonim'])->assertOk();
        $this->getJson($url)->assertOk()->assertJsonPath('data.items.0.channels.0.received_amount', '50.05')->assertJsonPath('data.items.0.channels.0.remaining_amount', '250.10');
    }

    public function test_reconciliation_ignores_voided_allocations_and_draft_sources(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/void', ['version' => 1, 'reason' => 'Koreksi alokasi sumber anonim'])->assertOk();
        $url = '/api/v1/accounting/deposits/reconciliation?month='.now('Asia/Jakarta')->subDay()->format('Y-m');
        $this->getJson($url)->assertOk()->assertJsonPath('data.items.0.channels.0.allocated_amount', '0.00')->assertJsonPath('data.items.0.channels.0.unallocated_amount', '500.25');
        OmzetRecord::where('id', $d['omzet_id'])->update(['status' => 'draft']);
        $this->getJson($url)->assertOk()->assertJsonPath('data.total', 0)->assertJsonCount(0, 'data.items');
    }

    public function test_reconciliation_includes_receipts_after_source_month(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-30 10:00:00', 'Asia/Jakarta'));
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        $this->travelTo(CarbonImmutable::parse('2026-10-02 10:00:00', 'Asia/Jakarta'));
        $this->authenticated('finance@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertOk();
        $this->getJson('/api/v1/accounting/deposits/reconciliation?month=2026-09')->assertOk()->assertJsonPath('data.items.0.channels.0.received_amount', '200.10');
        $this->getJson('/api/v1/accounting/deposits/reconciliation?month=2026-10')->assertOk()->assertJsonPath('data.total', 0);
        $this->travelBack();
    }

    public function test_reconciliation_denies_summary_and_other_domains(): void
    {
        $url = '/api/v1/accounting/deposits/reconciliation?month=2026-10';
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.acc@dashboard.test')->getJson($url)->assertForbidden();
        }
        foreach (['bod1@dashboard.test', 'manager.project@dashboard.test', 'manager.cell@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson($url)->assertForbidden();
        }
    }

    public function test_reconciliation_pagination_and_filters(): void
    {
        $d = $this->payload();
        $source = OmzetRecord::findOrFail($d['omzet_id']);
        for ($i = 0; $i < 50; $i++) {
            $copy = $source->replicate();
            $copy->id = (string) Str::uuid();
            $copy->shift = 'UJI-'.($i + 2);
            $copy->source_reference = 'OMZ-PAGE-'.$i;
            $copy->save();
        }
        $url = '/api/v1/accounting/deposits/reconciliation?month='.now('Asia/Jakarta')->subDay()->format('Y-m');
        $first = $this->getJson($url)->assertOk()->assertJsonPath('data.total', 51)->assertJsonCount(50, 'data.items')->json('data.items');
        $second = $this->getJson($url.'&page=2')->assertOk()->assertJsonCount(1, 'data.items')->json('data.items');
        $this->assertNotContains($second[0]['id'], array_column($first, 'id'));
        foreach (['month=2026-13', 'month=2026-10&page=0'] as $query) {
            $this->getJson('/api/v1/accounting/deposits/reconciliation?'.$query)->assertStatus(400);
        }
    }

    public function test_reconciliation_keeps_large_decimal_amount_exact(): void
    {
        $d = $this->payload();
        OmzetRecord::where('id', $d['omzet_id'])->update(['cash_amount' => '999999999999.99']);
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '999999999999.98']))->assertCreated();
        $this->getJson('/api/v1/accounting/deposits/reconciliation?month='.now('Asia/Jakarta')->subDay()->format('Y-m'))->assertOk()
            ->assertJsonPath('data.items.0.channels.0.reported_amount', '999999999999.99')->assertJsonPath('data.items.0.channels.0.unallocated_amount', '0.01');
    }

    public function test_partial_receipts_void_history_and_stale_versions(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->assertJsonPath('data.remaining_amount', '500.25')->json('data.id');
        $this->authenticated('finance@dashboard.test');
        $r = $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertOk()->assertJsonPath('data.remaining_amount', '300.15')->json('data');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertStatus(409);
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(2, '300.16', 'BANK-UJI-2'))->assertStatus(409);
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(2, '300.15', 'BANK-UJI-2'))->assertOk()->assertJsonPath('data.remaining_amount', '0.00');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receipts/'.$r['receipts'][0]['id'].'/void', ['version' => 3, 'reason' => 'Referensi sumber penerimaan keliru'])->assertOk()->assertJsonPath('data.remaining_amount', '200.10')->assertJsonPath('data.events.3.snapshot.received_amount', '300.15');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(4))->assertStatus(409);
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/void', ['version' => 4, 'reason' => 'Catatan setoran akan dibatalkan'])->assertStatus(409);
        $this->assertDatabaseCount('acc_deposit_events', 4);
    }

    public function test_allocation_reference_and_source_validation(): void
    {
        $d = $this->payload();
        $d['amount'] = '300.00';
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '200.26', 'source_reference' => 'SETOR-2']))->assertStatus(409);
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['channel' => 'qris', 'source_reference' => '  setor-uji-1  ']))->assertStatus(409);
        $this->getJson('/api/v1/accounting/deposits/sources?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk()->assertJsonPath('data.items.0.cash_available', '200.25');
        foreach ([['amount' => '0'], ['amount' => '1.123'], ['amount' => '1000000000000'], ['amount' => 1], ['deposit_date' => now('Asia/Jakarta')->addDay()->toDateString()], ['deposit_date' => '2020-01-01'], ['evidence_reference' => '']] as $bad) {
            $this->postJson('/api/v1/accounting/deposits', array_replace($d, $bad))->assertStatus(400);
        }
        OmzetRecord::where('id', $d['omzet_id'])->update(['status' => 'draft']);
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['source_reference' => 'SETOR-NEW']))->assertStatus(400);
        OmzetRecord::where('id', $d['omzet_id'])->update(['status' => 'validated']);
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/void', ['version' => 1, 'reason' => 'Sumber keliru dan perlu dibuat ulang'])->assertOk()->assertJsonPath('data.status', 'voided')->assertJsonPath('data.remaining_amount', '0.00');
        $this->postJson('/api/v1/accounting/deposits', $d)->assertStatus(409);
        $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['amount' => '500.25', 'source_reference' => 'SETOR-NEW']))->assertCreated();
    }

    public function test_read_write_scope_and_separate_actor(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        foreach (['bod1@dashboard.test', 'manager.cell@dashboard.test', 'manager.project@dashboard.test'] as $email) {
            $this->authenticated($email);
            $this->getJson('/api/v1/accounting/deposits/'.$id)->assertForbidden()->assertDontSee('Tujuan anonim');
            $this->postJson('/api/v1/accounting/deposits', $d)->assertForbidden();
        }
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/deposits?month=2026-10')->assertForbidden();
        }
        $this->authenticated('accounting@dashboard.test')->getJson('/api/v1/accounting/deposits/'.$id)->assertOk();
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/void', ['version' => 1, 'reason' => 'Pembatalan oleh pemeriksa'])->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertForbidden();
        User::where('email', 'admin.acc@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertForbidden();
    }

    public function test_receipt_reference_date_and_parent_ownership(): void
    {
        $d = $this->payload();
        $d['amount'] = '250';
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        $id2 = $this->postJson('/api/v1/accounting/deposits', array_replace($d, ['source_reference' => 'SETOR-2']))->assertCreated()->json('data.id');
        $this->authenticated('finance@dashboard.test');
        foreach ([['received_date' => '2020-01-01'], ['received_date' => now('Asia/Jakarta')->addDay()->toDateString()], ['amount' => '0']] as $bad) {
            $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', array_replace($this->receipt(1), $bad))->assertStatus(400);
        }
        $r = $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertOk()->json('data.receipts.0.id');
        $this->postJson('/api/v1/accounting/deposits/'.$id2.'/receive', $this->receipt(1, '1', ' bank-uji-1 '))->assertStatus(409);
        $this->postJson('/api/v1/accounting/deposits/'.$id2.'/receipts/'.$r.'/void', ['version' => 1, 'reason' => 'Penerimaan pada induk keliru'])->assertNotFound();
        $this->assertDatabaseCount('acc_deposit_receipts', 1);
        $this->assertDatabaseCount('acc_deposit_events', 3);
    }

    public function test_audit_failure_rolls_back_creation_and_receipt(): void
    {
        $d = $this->payload();
        Schema::drop('audit_events');
        $this->postJson('/api/v1/accounting/deposits', $d)->assertStatus(500);
        $this->assertDatabaseCount('acc_deposits', 0);
        $this->assertDatabaseCount('acc_deposit_events', 0);
    }

    public function test_receipt_audit_failure_rolls_back_version_and_receipt(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        $this->authenticated('finance@dashboard.test');
        Schema::drop('audit_events');
        $this->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertStatus(500);
        $this->assertDatabaseCount('acc_deposit_receipts', 0);
        $this->assertDatabaseCount('acc_deposit_events', 1);
        $this->assertDatabaseHas('acc_deposits', ['id' => $id, 'version' => 1]);
    }

    public function test_admin_and_finance_cannot_void_another_creators_records(): void
    {
        $d = $this->payload();
        $id = $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->json('data.id');
        User::where('email', 'accounting@dashboard.test')->update(['role' => 'ADMIN']);
        $this->authenticated('accounting@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/void', ['version' => 1, 'reason' => 'Pembatalan bukan oleh pembuat'])->assertForbidden();
        $r = $this->authenticated('finance@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receive', $this->receipt(1))->assertOk()->json('data.receipts.0.id');
        User::where('email', 'accounting@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('accounting@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receipts/'.$r.'/void', ['version' => 2, 'reason' => 'Pembatalan bukan oleh penerima'])->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/deposits/'.$id.'/receipts/'.$r.'/void', ['version' => 2, 'reason' => 'Manager mengoreksi catatan sumber'])->assertOk()->assertJsonPath('data.received_amount', '0.00');
    }

    public function test_filters_and_exact_large_amount(): void
    {
        $d = $this->payload();
        OmzetRecord::where('id', $d['omzet_id'])->update(['cash_amount' => '999999999999.99', 'outlet_amount' => '999999999999.99']);
        $d['amount'] = '999999999999.99';
        $this->postJson('/api/v1/accounting/deposits', $d)->assertCreated()->assertJsonPath('data.amount', '999999999999.99');
        foreach (['month=2026-13', 'month=2026-10&page=0'] as $query) {
            $this->getJson('/api/v1/accounting/deposits?'.$query)->assertStatus(400);
            $this->getJson('/api/v1/accounting/deposits/sources?'.$query)->assertStatus(400);
        }
    }
}
