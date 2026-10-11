<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingOmzetTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-10-05 12:00:00', 'Asia/Jakarta'));
        User::firstOrCreate(['email' => 'reviewer.omzet@dashboard.test'], [
            'id' => (string) Str::uuid(), 'name' => 'Pemeriksa Uji', 'role' => 'ACCOUNTING', 'division_code' => 'ACC',
            'password_hash' => 'tidak-digunakan-untuk-login-uji', 'is_active' => true,
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return $overrides + ['outlet_id' => Outlet::where('is_active', true)->firstOrFail()->id,
            'business_date' => '2026-10-04', 'shift' => '1', 'outlet_amount' => '1000.50',
            'cash_amount' => '500.25', 'qris_amount' => '500.25', 'edc_amount' => '0',
            'transfer_amount' => '0', 'other_amount' => '0', 'requires_ap' => false,
            'source_reference' => 'Laporan outlet anonim', 'notes' => ''];
    }

    private function createRecord(array $overrides = []): array
    {
        return $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload($overrides))->assertCreated()->json('data');
    }

    private function action(array $record, string $action, string $email, array $data = [])
    {
        return $this->authenticated($email)->postJson('/api/v1/accounting/omzet/'.$record['id'].'/'.$action, $data + ['version' => $record['version']]);
    }

    public function test_authentication_and_role_assignment_protect_all_omzet_actions(): void
    {
        $this->getJson('/api/v1/accounting/omzet?month=2026-10')->assertUnauthorized();
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload())->assertForbidden();
        $this->authenticated('bod1@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload())->assertForbidden();
        $record = $this->createRecord();
        $this->action($record, 'review', 'admin.acc@dashboard.test', ['decision' => 'validate'])->assertForbidden();
        $this->action($record, 'decide', 'reviewer.omzet@dashboard.test', ['decision' => 'approve'])->assertForbidden();
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/accounting/omzet/'.$record['id'].'?divisionCode=CELL')->assertForbidden();
    }

    public function test_accounting_directory_covers_other_divisions_without_spoofing_identity(): void
    {
        $response = $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/omzet/outlets')->assertOk();
        $this->assertGreaterThan(1, count(array_unique(array_column($response->json('data'), 'divisionCode'))));
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload(['division_code' => 'CELL']))->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload(['outlet_id' => (string) Str::uuid()]))->assertStatus(400);
    }

    public function test_balanced_recap_is_validated_and_immutable_with_history(): void
    {
        $record = $this->createRecord();
        $this->assertSame('0.00', $record['payment_difference']);
        $submitted = $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $this->assertSame('submitted', $submitted['status']);
        $validated = $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate'])->assertOk()->json('data');
        $this->assertSame('validated', $validated['status']);
        $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/omzet/'.$record['id'], $this->payload(['version' => $validated['version'], 'cash_amount' => '0']))->assertStatus(409);
        $this->action($validated, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate'])->assertStatus(409);
        $this->assertCount(3, $validated['events']);
        $summary = $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/omzet?month=2026-10')->assertOk()->json('data.summary');
        $this->assertSame(1, $summary['validated_count']);
        $this->assertSame('1000.50', $summary['outlet_amount']);
        $this->assertDatabaseHas('audit_events', ['action' => 'accounting.omzet.review']);
    }

    public function test_ap_difference_requires_reason_and_manager_approval(): void
    {
        $record = $this->createRecord(['requires_ap' => true]);
        $submitted = $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate'])->assertStatus(400);
        $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate', 'ap_amount' => '900'])->assertStatus(400);
        $pending = $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate', 'ap_amount' => '900', 'reason' => 'Selisih laporan perlu ditinjau Manager'])->assertOk()->json('data');
        $this->assertSame('pending_approval', $pending['status']);
        $this->assertSame('100.50', $pending['ap_difference']);
        $this->assertSame(0, $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/omzet?month=2026-10')->json('data.summary.validated_count'));
        $approved = $this->action($pending, 'decide', 'manager.acc@dashboard.test', ['decision' => 'approve', 'reason' => 'Dokumen selisih sudah diperiksa'])->assertOk()->json('data');
        $this->assertSame('validated', $approved['status']);
        $this->assertNotNull($approved['approved_by']);
        $this->assertDatabaseCount('acc_omzet_events', 4);
    }

    public function test_payment_difference_also_requires_manager_review(): void
    {
        $record = $this->createRecord(['cash_amount' => '600.25']);
        $submitted = $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $pending = $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'validate', 'reason' => 'Pembayaran lebih dari laporan outlet'])->assertOk()->json('data');
        $this->assertSame('-100.00', $pending['payment_difference']);
        $this->assertSame('pending_approval', $pending['status']);
        $correct = $this->action($pending, 'decide', 'manager.acc@dashboard.test', ['decision' => 'reject', 'reason' => 'Mohon perbaiki rincian pembayaran'])->assertOk()->json('data');
        $this->assertSame('correction', $correct['status']);
    }

    public function test_returned_record_can_be_corrected_and_resubmitted(): void
    {
        $record = $this->createRecord();
        $submitted = $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $returned = $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'return', 'reason' => 'Referensi laporan belum lengkap'])->assertOk()->json('data');
        $updated = $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/omzet/'.$record['id'], $this->payload(['version' => $returned['version'], 'source_reference' => 'Referensi sudah dikoreksi']))->assertOk()->json('data');
        $this->action($updated, 'submit', 'admin.acc@dashboard.test')->assertOk()->assertJsonPath('data.status', 'submitted');
    }

    public function test_jakarta_h_plus_one_boundaries_are_enforced_by_server(): void
    {
        $record = $this->createRecord();
        $this->travelTo(CarbonImmutable::parse('2026-10-04 23:59:59', 'Asia/Jakarta'));
        $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertStatus(422);
        $this->travelTo(CarbonImmutable::parse('2026-10-05 23:59:59', 'Asia/Jakarta'));
        $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk();
        $late = $this->createRecord(['shift' => '2']);
        $this->travelTo(CarbonImmutable::parse('2026-10-06 00:00:00', 'Asia/Jakarta'));
        $this->action($late, 'submit', 'admin.acc@dashboard.test')->assertStatus(422);
    }

    public function test_late_permission_is_single_use_and_expires(): void
    {
        $record = $this->createRecord(['business_date' => '2026-10-02']);
        $requested = $this->action($record, 'request-unlock', 'admin.acc@dashboard.test', ['reason' => 'Laporan shift diterima terlambat'])->assertOk()->json('data');
        $approved = $this->action($requested, 'decide-unlock', 'manager.acc@dashboard.test', ['unlock_id' => $requested['unlock_requests'][0]['id'], 'decision' => 'approve', 'reason' => 'Izin diberikan untuk laporan tertunda'])->assertOk()->json('data');
        $submitted = $this->action($approved, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $returned = $this->action($submitted, 'review', 'reviewer.omzet@dashboard.test', ['decision' => 'return', 'reason' => 'Masih perlu koreksi rincian pembayaran'])->assertOk()->json('data');
        $this->action($returned, 'submit', 'admin.acc@dashboard.test')->assertStatus(422);
        $other = $this->createRecord(['business_date' => '2026-10-02', 'shift' => '2']);
        $request = $this->action($other, 'request-unlock', 'admin.acc@dashboard.test', ['reason' => 'Laporan shift kedua terlambat'])->assertOk()->json('data');
        $permit = $this->action($request, 'decide-unlock', 'manager.acc@dashboard.test', ['unlock_id' => $request['unlock_requests'][0]['id'], 'decision' => 'approve', 'reason' => 'Diperbolehkan mengajukan laporan'])->assertOk()->json('data');
        $this->travelTo(CarbonImmutable::parse('2026-10-06 12:00:01', 'Asia/Jakarta'));
        $this->action($permit, 'submit', 'admin.acc@dashboard.test')->assertStatus(422);
    }

    public function test_duplicates_invalid_money_and_stale_versions_do_not_overwrite_data(): void
    {
        $record = $this->createRecord();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload())->assertStatus(409);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload(['shift' => '3', 'cash_amount' => '-1']))->assertStatus(400);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload(['shift' => '3', 'cash_amount' => '0.001']))->assertStatus(400);
        $submitted = $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertOk()->json('data');
        $this->action($record, 'submit', 'admin.acc@dashboard.test')->assertStatus(409);
        $this->assertSame($submitted['version'], DB::table('acc_omzet_records')->where('id', $record['id'])->value('version'));
    }

    public function test_cellular_daily_close_derives_gross_and_expected_deposit_from_source_lines(): void
    {
        $record = $this->createRecord([
            'outlet_amount' => '999999.00',
            'cash_amount' => '600.00', 'qris_amount' => '200.00', 'edc_amount' => '200.00',
            'expense_amount' => '100.00',
            'shift_breakdown' => [
                ['shift_no' => 1, 'gross_amount' => '100.00'],
                ['shift_no' => 2, 'gross_amount' => '200.00'],
                ['shift_no' => 3, 'gross_amount' => '700.00'],
            ],
        ]);

        $this->assertSame('HARIAN', $record['shift']);
        $this->assertSame('1000.00', $record['outlet_amount']);
        $this->assertSame('1000.00', $record['shift_total']);
        $this->assertSame('0.00', $record['shift_difference']);
        $this->assertSame('500.00', $record['expected_deposit_amount']);
        $this->assertCount(3, $record['shift_breakdown']);
        $this->assertDatabaseCount('acc_omzet_shift_lines', 3);
    }

    public function test_cellular_daily_close_rejects_invalid_shift_and_negative_deposit_plan(): void
    {
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload([
            'expense_amount' => '600.00',
            'shift_breakdown' => [
                ['shift_no' => 1, 'gross_amount' => '500.25'],
                ['shift_no' => 1, 'gross_amount' => '500.25'],
            ],
        ]))->assertStatus(400);

        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', $this->payload([
            'expense_amount' => '500.26',
            'shift_breakdown' => [['shift_no' => 1, 'gross_amount' => '1000.50']],
        ]))->assertStatus(400);
        $this->assertDatabaseCount('acc_omzet_records', 0);
    }
}
