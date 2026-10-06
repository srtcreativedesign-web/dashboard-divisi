<?php

namespace Tests\Feature;

use App\Models\Accounting\Voucher;
use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingVoucherTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-10-05 12:00:00', 'Asia/Jakarta'));
        User::create(['email' => 'voucher.other@dashboard.test', 'name' => 'Admin pengujian', 'role' => 'ADMIN',
            'division_code' => 'ACC', 'password_hash' => 'tidak-digunakan-untuk-login-uji', 'is_active' => true]);
    }

    private function payload(array $overrides = []): array
    {
        return $overrides + ['type' => 'BILLING', 'outlet_id' => Outlet::where('code', 'CELL-001')->firstOrFail()->id,
            'voucher_date' => '2026-10-05', 'due_date' => '2026-10-20', 'entity_name' => 'Penerbit tagihan anonim',
            'source_reference' => 'INV-TEST-001', 'amount' => '1234.56', 'description' => 'Tagihan outlet untuk pengujian'];
    }

    private function createRecord(array $overrides = []): array
    {
        return $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload($overrides))->assertCreated()->json('data');
    }

    private function action(array $record, string $action, string $email, array $data = [])
    {
        return $this->authenticated($email)->postJson('/api/v1/accounting/vouchers/'.$record['id'].'/'.$action, $data + ['version' => $record['version']]);
    }

    private function submit(array $record): array
    {
        return $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
    }

    public function test_billing_workflow_requires_three_actors_and_approved_voucher_is_immutable(): void
    {
        $record = $this->createRecord();
        $this->assertSame('draft', $record['status']);
        $this->assertSame('1234.56', $record['amount']);
        $this->assertSame('CELL', $record['source_division_code']);
        $submitted = $this->submit($record);
        $pending = $this->action($submitted, 'review', 'accounting@dashboard.test', ['decision' => 'validate', 'reason' => 'Tagihan dan rincian telah diperiksa'])->assertOk()->json('data');
        $this->assertSame('pending_approval', $pending['status']);
        $approved = $this->action($pending, 'decide', 'manager.acc@dashboard.test', ['decision' => 'approve', 'reason' => 'Dokumen dan kebutuhan telah disetujui'])->assertOk()->json('data');
        $this->assertSame('approved', $approved['status']);
        $this->assertNotNull($approved['approved_at']);
        $this->assertNotSame($approved['created_by'], $approved['reviewed_by']);
        $this->assertNotSame($approved['reviewed_by'], $approved['approved_by']);
        $this->assertCount(4, $approved['events']);
        $this->assertSame('1234.56', $approved['events'][0]['metadata']['snapshot']['amount']);
        $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$record['id'], $this->payload(['version' => $approved['version'], 'amount' => '50']))->assertStatus(409);
        $this->action($approved, 'submit', 'admin.acc@dashboard.test')->assertStatus(409);
        $this->authenticated('admin.acc@dashboard.test')->deleteJson('/api/v1/accounting/vouchers/'.$record['id'])->assertStatus(405);
        $this->assertDatabaseCount('acc_voucher_events', 4);
        $this->assertDatabaseCount('accounting_transactions', 0);
        $this->assertDatabaseCount('accounting_outstanding_payments', 0);
        $this->assertDatabaseHas('audit_events', ['action' => 'accounting.voucher.decide']);
    }

    public function test_purchasing_corrections_keep_history_and_clear_old_decisions_when_resubmitted(): void
    {
        $record = $this->createRecord(['type' => 'PURCHASING']);
        $returned = $this->action($this->submit($record), 'review', 'accounting@dashboard.test', ['decision' => 'return', 'reason' => 'Rincian jumlah barang perlu dilengkapi'])->assertOk()->json('data');
        $this->assertSame('correction', $returned['status']);
        $updated = $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$record['id'], $this->payload(['type' => 'PURCHASING', 'version' => $returned['version'], 'amount' => '2000.01', 'description' => 'Pembelian sepuluh barang anonim']))->assertOk()->json('data');
        $pending = $this->action($this->submit($updated), 'review', 'accounting@dashboard.test', ['decision' => 'validate', 'reason' => 'Rincian barang sudah diperiksa'])->assertOk()->json('data');
        $rejected = $this->action($pending, 'decide', 'manager.acc@dashboard.test', ['decision' => 'reject', 'reason' => 'Jumlah barang perlu diperbaiki kembali'])->assertOk()->json('data');
        $this->assertSame('correction', $rejected['status']);
        $this->assertNull($rejected['approved_by']);
        $resubmitted = $this->submit($rejected);
        $this->assertNull($resubmitted['reviewed_by']);
        $this->assertNull($resubmitted['review_notes']);
        $this->assertNull($resubmitted['decision_notes']);
        $this->assertCount(8, $resubmitted['events']);
        $this->assertSame('1234.56', $resubmitted['events'][0]['metadata']['snapshot']['amount']);
        $this->assertSame('2000.01', $resubmitted['amount']);
        $this->assertDatabaseCount('cel_inventories', 0);
    }

    public function test_role_scope_and_actor_identity_cannot_be_forged(): void
    {
        $this->getJson('/api/v1/accounting/vouchers?month=2026-10')->assertUnauthorized();
        foreach (['manager.cell@dashboard.test', 'admin.project@dashboard.test', 'bod1@dashboard.test', 'finance@dashboard.test', 'accounting@dashboard.test'] as $email) {
            $this->authenticated($email)->postJson('/api/v1/accounting/vouchers', $this->payload())->assertForbidden();
        }
        $record = $this->createRecord();
        $this->action($record, 'review', 'admin.acc@dashboard.test', ['decision' => 'validate', 'reason' => 'Tidak boleh memeriksa sendiri'])->assertForbidden();
        $this->action($record, 'decide', 'accounting@dashboard.test', ['decision' => 'approve', 'reason' => 'Tidak memiliki hak Manager'])->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['source_reference' => 'INV-002', 'created_by' => $record['created_by']]))->assertStatus(400);
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/accounting/vouchers/'.$record['id'].'?divisionCode=CELL')->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['division_code' => 'CELL']))->assertForbidden();
        $other = Voucher::findOrFail($record['id'])->replicate();
        $other->id = (string) Str::uuid();
        $other->voucher_no = 'VCH-OTHER';
        $other->source_key = str_repeat('a', 64);
        $other->division_code = 'CELL';
        $other->save();
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/vouchers/'.$other->id)->assertNotFound();
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/vouchers?month=2026-10')->assertOk()->assertJsonPath('data.total', 1);
    }

    public function test_only_creator_can_edit_or_submit_and_role_changes_do_not_allow_self_review_or_self_approval(): void
    {
        $record = $this->createRecord();
        $this->authenticated('voucher.other@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$record['id'], $this->payload(['version' => 1]))->assertForbidden();
        $this->action($record, 'submit', 'voucher.other@dashboard.test')->assertForbidden();
        $submitted = $this->submit($record);
        User::where('email', 'admin.acc@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->action($submitted, 'review', 'admin.acc@dashboard.test', ['decision' => 'validate', 'reason' => 'Perubahan role tidak cukup'])->assertForbidden();
        $pending = $this->action($submitted, 'review', 'accounting@dashboard.test', ['decision' => 'validate', 'reason' => 'Diperiksa oleh akun terpisah'])->assertOk()->json('data');
        User::where('email', 'accounting@dashboard.test')->update(['role' => 'MANAGER']);
        $this->action($pending, 'decide', 'accounting@dashboard.test', ['decision' => 'approve', 'reason' => 'Pemeriksa tidak boleh menyetujui'])->assertForbidden();
        User::where('email', 'admin.acc@dashboard.test')->update(['role' => 'MANAGER']);
        $this->action($pending, 'decide', 'admin.acc@dashboard.test', ['decision' => 'approve', 'reason' => 'Pembuat tidak boleh menyetujui'])->assertForbidden();
    }

    public function test_stale_versions_and_skipped_steps_do_not_change_the_voucher(): void
    {
        $record = $this->createRecord();
        $this->action($record, 'decide', 'manager.acc@dashboard.test', ['decision' => 'approve', 'reason' => 'Melewati pemeriksaan ditolak'])->assertStatus(409);
        $submitted = $this->submit($record);
        $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertStatus(409);
        $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$record['id'], $this->payload(['version' => $submitted['version']]))->assertStatus(409);
        $this->action($submitted, 'review', 'accounting@dashboard.test', ['decision' => 'approve', 'reason' => 'Keputusan pemeriksa tidak sah'])->assertStatus(400);
        $this->action($submitted, 'review', 'accounting@dashboard.test', ['decision' => 'return', 'reason' => 'singkat'])->assertStatus(400);
        $this->assertDatabaseCount('acc_voucher_events', 2);
        $this->assertSame(2, Voucher::findOrFail($record['id'])->version);
    }

    public function test_invalid_money_dates_and_inactive_outlets_are_rejected(): void
    {
        foreach (['-1', '0', '1.001', '1000000000000', '1e4'] as $amount) {
            $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['amount' => $amount]))->assertStatus(400);
        }
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['voucher_date' => '2026-10-06']))->assertStatus(400);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['due_date' => '2026-10-04']))->assertStatus(400);
        $record = $this->createRecord();
        Outlet::where('id', $record['outlet_id'])->update(['is_active' => false]);
        $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertStatus(400);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['source_reference' => 'INV-002']))->assertStatus(400);
        $this->assertSame('draft', Voucher::findOrFail($record['id'])->status);
    }

    public function test_duplicate_sources_are_normalized_and_duplicate_update_is_rolled_back(): void
    {
        $record = $this->createRecord();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload(['entity_name' => '  PENERBIT   TAGIHAN ANONIM ', 'source_reference' => ' inv-test-001 ']))->assertStatus(409);
        $other = $this->createRecord(['source_reference' => 'INV-002']);
        $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$other['id'], $this->payload(['version' => $other['version']]))->assertStatus(409);
        $this->assertDatabaseCount('acc_vouchers', 2);
        $this->assertDatabaseCount('acc_voucher_events', 2);
        $this->assertSame(1, Voucher::findOrFail($other['id'])->version);
        $this->assertSame($record['source_reference'], Voucher::findOrFail($record['id'])->source_reference);
    }

    public function test_list_filters_and_readonly_bod_access(): void
    {
        $record = $this->createRecord();
        $this->createRecord(['type' => 'PURCHASING', 'source_reference' => 'REQ-002']);
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/accounting/vouchers?month=2026-10&type=PURCHASING')->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.items.0.type', 'PURCHASING');
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/vouchers?month=2026-09')->assertOk()->assertJsonPath('data.total', 0);
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/vouchers?month=2026-10&status=approved')->assertOk()->assertJsonPath('data.total', 0);
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/accounting/vouchers/'.$record['id'])->assertOk();
        $this->assertDatabaseCount('acc_voucher_events', 2);
    }
}
