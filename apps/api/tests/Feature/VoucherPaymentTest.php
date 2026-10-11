<?php

namespace Tests\Feature;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Models\Accounting\VoucherPayment;
use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VoucherPaymentTest extends TestCase
{
    private array $v;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->travelTo(CarbonImmutable::parse('2026-10-07 12:00:00', 'Asia/Jakarta'));
        $this->v = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', ['type' => 'OPERATIONAL', 'outlet_id' => Outlet::where('code', 'CELL-001')->firstOrFail()->id, 'voucher_date' => '2026-10-07', 'due_date' => '2026-10-20', 'entity_name' => 'Penerima anonim', 'source_reference' => 'PAY-UJI', 'amount' => '1000.00', 'description' => 'Kebutuhan operasional anonim', 'payment_method' => 'BANK', 'bank_name' => 'Bank uji', 'bank_account_holder' => 'Penerima anonim', 'bank_account' => '123456789012'])->assertCreated()->json('data');
    }

    private function approve(): void
    {
        foreach ([['admin.acc@dashboard.test', 'submit', []], ['accounting@dashboard.test', 'review', ['decision' => 'validate', 'reason' => 'Dokumen sudah diperiksa lengkap']], ['manager.acc@dashboard.test', 'decide', ['decision' => 'approve', 'reason' => 'Pengeluaran disetujui sesuai kebutuhan']]] as [$email,$action,$data]) {
            $this->v = $this->authenticated($email)->postJson('/api/v1/accounting/vouchers/'.$this->v['id'].'/'.$action, $data + ['version' => $this->v['version']])->assertOk()->json('data');
        }
    }

    private function pay(array $d = [])
    {
        return $this->post('/api/v1/accounting/vouchers/'.$this->v['id'].'/payments', $d + ['version' => $this->v['version'], 'paid_date' => '2026-10-07', 'amount' => '150.25', 'method' => 'BANK', 'reference' => 'TRANSFER-UJI', 'notes' => 'Pembayaran dilakukan di luar ERP', 'file' => UploadedFile::fake()->create('bukti.pdf', 10, 'application/pdf')], ['Accept' => 'application/json']);
    }

    public function test_partial_and_full_payment_are_exact_separate_from_approval_and_do_not_post_journal(): void
    {
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        $this->v = $this->pay()->assertCreated()->json('data');
        $this->assertSame(['paid_amount' => '150.25', 'remaining_amount' => '849.75', 'status' => 'PARTIAL'], $this->v['payment_summary']);
        $this->assertSame('approved', $this->v['status']);
        $this->assertSame(5, $this->v['version']);
        $this->assertSame('123456789012', $this->v['bank_account']);
        $this->assertArrayNotHasKey('file_path', $this->v['payments'][0]);
        $this->assertArrayNotHasKey('bank_account', end($this->v['events'])['metadata']['snapshot']);
        $this->pay(['amount' => '849.76', 'reference' => 'OVER-UJI'])->assertStatus(409);
        $this->pay(['reference' => '  transfer-uji  '])->assertStatus(409)->assertJsonPath('error.code', 'IDEMPOTENCY_CONFLICT');
        $this->pay(['version' => 4, 'reference' => 'STALE-UJI'])->assertStatus(409)->assertJsonPath('error.code', 'VERSION_CONFLICT');
        $this->v = $this->pay(['amount' => '849.75', 'reference' => 'TRANSFER-UJI-2'])->assertCreated()->json('data');
        $this->assertSame(['paid_amount' => '1000.00', 'remaining_amount' => '0.00', 'status' => 'PAID'], $this->v['payment_summary']);
        $this->pay(['amount' => '0.01', 'reference' => 'AFTER-PAID'])->assertStatus(409);
        $this->getJson('/api/v1/accounting/vouchers?month=2026-10')->assertOk()->assertJsonPath('data.items.0.payment_summary.status', 'PAID');
        $this->assertDatabaseCount('acc_voucher_payments', 2);
        $this->assertDatabaseCount('accounting_transactions', 0);
        $this->assertDatabaseHas('audit_events', ['action' => 'accounting.voucher.payment_recorded']);
    }

    public function test_only_finance_can_record_after_approval_with_different_actor_and_valid_dates_method(): void
    {
        $this->authenticated('finance@dashboard.test');
        $this->pay()->assertStatus(409);
        $this->approve();
        foreach (['admin.acc@dashboard.test', 'accounting@dashboard.test', 'manager.acc@dashboard.test', 'bod1@dashboard.test', 'admin.project@dashboard.test', 'manager.cell@dashboard.test'] as $email) {
            $this->authenticated($email);
            $this->pay()->assertForbidden();
        }
        $this->authenticated('finance@dashboard.test');
        $this->pay(['paid_date' => '2026-10-06'])->assertStatus(400);
        $this->pay(['paid_date' => '2026-10-08'])->assertStatus(400);
        $this->pay(['method' => 'CASH'])->assertStatus(400);
        $this->pay(['amount' => '1e3'])->assertStatus(400);
        $this->pay(['created_by' => 'forged'])->assertStatus(400);
        $this->pay(['reference' => '   '])->assertStatus(400);
        $this->pay(['file' => null])->assertStatus(400);
        Voucher::whereKey($this->v['id'])->update(['reviewed_by' => User::where('email', 'finance@dashboard.test')->value('id')]);
        $this->pay()->assertForbidden();
        $this->assertDatabaseCount('acc_voucher_payments', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_manager_void_keeps_evidence_history_and_requires_version_reason_and_parent(): void
    {
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        $this->v = $this->pay()->assertCreated()->json('data');
        $p = $this->v['payments'][0];
        $url = '/api/v1/accounting/vouchers/'.$this->v['id'].'/payments/'.$p['id'];
        $this->get($url.'/download')->assertOk();
        $this->postJson($url.'/void', ['version' => 5, 'reason' => 'Catatan transaksi keliru'])->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test');
        $this->postJson($url.'/void', ['version' => 4, 'reason' => 'Catatan transaksi keliru'])->assertStatus(409);
        $this->postJson($url.'/void', ['version' => 5, 'reason' => '   '])->assertStatus(400);
        $data = $this->postJson($url.'/void', ['version' => 5, 'reason' => 'Catatan transaksi keliru, bukan refund'])->assertOk()->json('data');
        $this->assertSame('UNPAID', $data['payment_summary']['status']);
        $this->assertSame('voided', $data['payments'][0]['status']);
        $this->assertSame(6, $data['version']);
        $this->postJson($url.'/void', ['version' => 6, 'reason' => 'Catatan transaksi keliru'])->assertStatus(409);
        $this->getJson('/api/v1/accounting/vouchers/00000000-0000-4000-8000-000000000000/payments/'.$p['id'].'/download')->assertNotFound();
        $row = VoucherPayment::findOrFail($p['id']);
        Storage::disk('local')->assertExists($row->file_path);
        $this->authenticated('admin.project@dashboard.test')->getJson($url.'/download')->assertForbidden();
        $this->authenticated('accounting@dashboard.test');
        Storage::disk('local')->put($row->file_path, 'berkas berubah');
        $this->getJson($url.'/download')->assertNotFound();
        $this->assertDatabaseHas('audit_events', ['action' => 'accounting.voucher.payment_voided']);
    }

    public function test_payment_date_uses_approval_day_in_jakarta_across_utc_midnight(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-06T18:30:00Z'));
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        $this->pay(['paid_date' => '2026-10-06'])->assertStatus(400);
        $this->pay(['paid_date' => '2026-10-07'])->assertCreated();
    }

    public function test_cash_and_large_nominal_keep_sen_without_float_and_reject_bank_without_destination(): void
    {
        Voucher::whereKey($this->v['id'])->update(['payment_method' => 'UNDECIDED', 'bank_account' => null, 'amount' => '999999999999.99']);
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        $this->pay()->assertStatus(400);
        $data = $this->pay(['method' => 'CASH', 'amount' => '999999999999.98'])->assertCreated()->json('data');
        $this->assertSame('0.01', $data['payment_summary']['remaining_amount']);
        $this->assertSame('999999999999.98', $data['payments'][0]['amount']);
    }

    public function test_scanner_failure_or_invalid_file_stops_payment_without_partial_mutation(): void
    {
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        $this->pay(['file' => UploadedFile::fake()->create('script.php', 1, 'text/x-php')])->assertStatus(400);
        $this->app->instance(MalwareScanner::class, new class implements MalwareScanner
        {
            public function assertClean(string $path): void
            {
                throw new ApiException('SCANNER_UNAVAILABLE', 'Scanner belum siap', null, 503);
            }
        });
        $this->pay()->assertStatus(503);
        $this->assertDatabaseCount('acc_voucher_payments', 0);
        $this->assertDatabaseHas('acc_vouchers', ['id' => $this->v['id'], 'version' => 4]);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_required_audit_failure_rolls_back_payment_version_event_and_private_file(): void
    {
        $this->approve();
        $this->authenticated('finance@dashboard.test');
        Schema::drop('audit_events');
        $this->pay()->assertStatus(500);
        $this->assertDatabaseCount('acc_voucher_payments', 0);
        $this->assertDatabaseCount('acc_voucher_events', 4);
        $this->assertDatabaseHas('acc_vouchers', ['id' => $this->v['id'], 'version' => 4]);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }
}
