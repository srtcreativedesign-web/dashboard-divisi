<?php

namespace Tests\Feature;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Models\Accounting\VoucherAttachment;
use App\Models\Outlet;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VoucherAttachmentTest extends TestCase
{
    private array $record;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->record = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', [
            'type' => 'BILLING', 'outlet_id' => Outlet::where('is_active', true)->firstOrFail()->id,
            'voucher_date' => '2026-10-05', 'due_date' => '2026-10-20', 'entity_name' => 'Penerbit anonim',
            'source_reference' => 'ATTACH-TEST', 'amount' => '1000.00', 'description' => 'Tagihan untuk pengujian lampiran',
        ])->assertCreated()->json('data');
    }

    private function upload(?int $version = null, ?UploadedFile $file = null)
    {
        return $this->post('/api/v1/accounting/vouchers/'.$this->record['id'].'/attachments', [
            'version' => $version ?? $this->record['version'], 'file' => $file ?? UploadedFile::fake()->create('tagihan.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json']);
    }

    public function test_creator_uploads_private_file_and_readers_download_without_storage_path(): void
    {
        $data = $this->upload()->assertCreated()->assertJsonPath('data.version', 2)->json('data');
        $attachment = VoucherAttachment::findOrFail($data['attachments'][0]['id']);
        $this->assertArrayNotHasKey('file_path', $data['attachments'][0]);
        Storage::disk('local')->assertExists($attachment->file_path);
        $url = '/api/v1/accounting/vouchers/'.$this->record['id'].'/attachments/'.$attachment->id.'/download';
        foreach (['manager.acc@dashboard.test', 'accounting@dashboard.test', 'finance@dashboard.test', 'bod1@dashboard.test'] as $email) {
            $this->authenticated($email)->get($url)->assertOk()->assertDownload('tagihan.pdf');
        }
        $this->authenticated('manager.project@dashboard.test')->getJson($url)->assertForbidden();
        $this->assertDatabaseHas('audit_events', ['action' => 'accounting.voucher.attachment_uploaded']);
    }

    public function test_role_version_and_status_boundaries_prevent_changes(): void
    {
        foreach (['manager.acc@dashboard.test', 'finance@dashboard.test', 'bod1@dashboard.test', 'admin.project@dashboard.test'] as $email) {
            $this->authenticated($email);
            $this->upload()->assertForbidden();
        }
        $this->authenticated('accounting@dashboard.test');
        $this->upload()->assertStatus(409);
        $this->authenticated('admin.acc@dashboard.test');
        $this->upload(999)->assertStatus(409);
        Voucher::whereKey($this->record['id'])->update(['status' => 'approved']);
        $this->upload()->assertStatus(409);
        $this->assertDatabaseCount('acc_voucher_attachments', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_reviewer_can_attach_before_review_and_wrong_parent_or_modified_file_cannot_download(): void
    {
        $submitted = $this->postJson('/api/v1/accounting/vouchers/'.$this->record['id'].'/submit', ['version' => 1])->assertOk()->json('data');
        $this->authenticated('accounting@dashboard.test');
        $data = $this->upload($submitted['version'])->assertCreated()->json('data');
        $attachment = VoucherAttachment::findOrFail($data['attachments'][0]['id']);
        $this->getJson('/api/v1/accounting/vouchers/00000000-0000-4000-8000-000000000000/attachments/'.$attachment->id.'/download')->assertNotFound();
        Storage::disk('local')->put($attachment->file_path, 'berkas berubah');
        $this->getJson('/api/v1/accounting/vouchers/'.$this->record['id'].'/attachments/'.$attachment->id.'/download')->assertNotFound();
    }

    public function test_invalid_or_infected_upload_never_reaches_private_storage(): void
    {
        $this->upload(null, UploadedFile::fake()->create('script.php', 1, 'text/x-php'))->assertStatus(400);
        $this->app->instance(MalwareScanner::class, new class implements MalwareScanner
        {
            public function assertClean(string $path): void
            {
                throw new ApiException('UPLOAD_REJECTED', 'Berkas ditolak', null, 422);
            }
        });
        $this->upload()->assertStatus(422);
        $this->assertDatabaseCount('acc_voucher_attachments', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_required_audit_failure_rolls_back_file_attachment_and_version(): void
    {
        Schema::drop('audit_events');
        $this->upload()->assertStatus(500);
        $this->assertDatabaseCount('acc_voucher_attachments', 0);
        $this->assertDatabaseHas('acc_vouchers', ['id' => $this->record['id'], 'version' => 1]);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }
}
