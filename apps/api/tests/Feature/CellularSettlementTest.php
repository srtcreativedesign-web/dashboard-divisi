<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CellularSettlementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function approvedClosing(): array
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $date = now('Asia/Jakarta')->toDateString();
        $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/daily-closings', ['outlet_id' => $outlet->id, 'business_date' => $date, 'shift_code' => 'SETTLEMENT-UJI', 'cash' => '1000.00', 'qris' => '2000.00', 'edc' => '0', 'transfer' => '0', 'source_reference' => 'CLOSE-SET-001'])->assertCreated();
        $submitted = $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/submit', ['version' => 1])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->authenticated('manager.cell@dashboard.test');
        $validated = $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/validate', ['version' => $submitted->json('data.version')])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'MANAGER']);
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/approve', ['version' => $validated->json('data.version')])->assertOk();

        return ['id' => $draft->json('data.id'), 'date' => $date];
    }

    public function test_finance_and_accounting_complete_partial_settlement_workflow(): void
    {
        $closing = $this->approvedClosing();
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.cell@dashboard.test');
        $sources = $this->getJson('/api/v1/cellular/settlements/sources?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk();
        $this->assertSame('1000.00', collect($sources->json('data'))->firstWhere('channel', 'cash')['expected']);
        $draft = $this->postJson('/api/v1/cellular/settlements', ['daily_closing_id' => $closing['id'], 'channel' => 'cash', 'settlement_date' => $closing['date'], 'gross' => '600.00', 'fee' => '10.00', 'destination' => 'Kas Pusat', 'reference' => 'CASH-UJI-001'])->assertCreated()->assertJsonPath('data.net', '590.00');
        $proof = $this->post('/api/v1/cellular/settlements/'.$draft->json('data.id').'/attachments', ['version' => 1, 'file' => UploadedFile::fake()->create('mutasi-bank.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.version', 2)->assertJsonCount(1, 'data.attachments');
        $this->assertArrayNotHasKey('file_path', $proof->json('data.attachments.0'));
        $this->assertDatabaseHas('audit_events', ['action' => 'cellular.settlement.attachment_uploaded']);
        $this->get('/api/v1/cellular/settlements/'.$draft->json('data.id').'/attachments/'.$proof->json('data.attachments.0.id').'/download')->assertOk()->assertDownload('mutasi-bank.pdf');
        $submitted = $this->postJson('/api/v1/cellular/settlements/'.$draft->json('data.id').'/submit', ['version' => 2])->assertOk()->assertJsonPath('data.status', 'submitted');
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson('/api/v1/cellular/settlements/'.$draft->json('data.id').'/reconcile', ['version' => $submitted->json('data.version')])->assertOk()->assertJsonPath('data.status', 'reconciled');
        $sources = $this->getJson('/api/v1/cellular/settlements/sources?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk();
        $cash = collect($sources->json('data'))->firstWhere('channel', 'cash');
        $this->assertSame('600.00', $cash['reconciled']);
        $this->assertSame('400.00', $cash['remaining']);
    }

    public function test_controls_reject_duplicate_reference_and_invalid_role(): void
    {
        $closing = $this->approvedClosing();
        $payload = ['daily_closing_id' => $closing['id'], 'channel' => 'qris', 'settlement_date' => $closing['date'], 'gross' => '500.00', 'fee' => '5.00', 'destination' => 'BCA', 'reference' => 'QRIS-UJI-001'];
        $this->authenticated('admin.cell@dashboard.test')->postJson('/api/v1/cellular/settlements', $payload)->assertForbidden();
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.cell@dashboard.test')->postJson('/api/v1/cellular/settlements', $payload)->assertCreated();
        $this->postJson('/api/v1/cellular/settlements', $payload)->assertStatus(409);
    }

    public function test_submission_requires_proof_and_attachment_respects_role_version_and_integrity(): void
    {
        $closing = $this->approvedClosing();
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/settlements', ['daily_closing_id' => $closing['id'], 'channel' => 'qris', 'settlement_date' => $closing['date'], 'gross' => '500.00', 'fee' => '5.00', 'destination' => 'BCA', 'reference' => 'QRIS-BUKTI-001'])->assertCreated()->json('data');
        $this->postJson('/api/v1/cellular/settlements/'.$draft['id'].'/submit', ['version' => 1])->assertStatus(400)->assertJsonPath('error.code', 'VALIDATION_ERROR');

        $this->authenticated('manager.cell@dashboard.test')->post('/api/v1/cellular/settlements/'.$draft['id'].'/attachments', ['version' => 1, 'file' => UploadedFile::fake()->create('bukti.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])->assertForbidden();
        $this->authenticated('admin.cell@dashboard.test');
        $this->post('/api/v1/cellular/settlements/'.$draft['id'].'/attachments', ['version' => 99, 'file' => UploadedFile::fake()->create('bukti.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])->assertStatus(409);
        $this->post('/api/v1/cellular/settlements/'.$draft['id'].'/attachments', ['version' => 1, 'file' => UploadedFile::fake()->create('script.php', 1, 'text/x-php')], ['Accept' => 'application/json'])->assertStatus(400);
        $this->assertDatabaseCount('cel_settlement_attachments', 0);
        $uploaded = $this->post('/api/v1/cellular/settlements/'.$draft['id'].'/attachments', ['version' => 1, 'file' => UploadedFile::fake()->create('bukti.png', 10, 'image/png')], ['Accept' => 'application/json'])->assertCreated()->json('data');
        $attachment = DB::table('cel_settlement_attachments')->where('id', $uploaded['attachments'][0]['id'])->first();
        Storage::disk('local')->put($attachment->file_path, 'berkas berubah');
        $this->getJson('/api/v1/cellular/settlements/'.$draft['id'].'/attachments/'.$attachment->id.'/download')->assertNotFound();
    }
}
