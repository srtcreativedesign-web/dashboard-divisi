<?php

namespace Tests\Feature;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use App\Models\AuditEvent;
use App\Services\ClamavScanner;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class UploadScanningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Process::preventStrayProcesses();
        Route::post('/api/v1/test-upload-scanning', function (Request $request) {
            $bytes = file_get_contents($request->file('file')->getRealPath());
            Storage::disk('local')->put('accepted.bin', $bytes);

            return response()->json(['bytes' => strlen($bytes)]);
        })->middleware(['api', 'jwt.auth', 'critical.audit', 'file.scan']);
    }

    public function test_clean_file_is_processed_only_after_private_snapshot_scan_and_quarantine_is_cleaned(): void
    {
        $scanner = Mockery::mock(MalwareScanner::class);
        $scanner->shouldReceive('assertClean')->once()->withArgs(function (string $path) {
            $this->assertFileExists($path);
            $this->assertSame('berkas anonim', file_get_contents($path));
            $this->assertSame([], Storage::disk('local')->allFiles());

            return true;
        });
        $this->app->instance(MalwareScanner::class, $scanner);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/test-upload-scanning',
            ['file' => UploadedFile::fake()->createWithContent('contoh.pdf', 'berkas anonim')])->assertOk()->assertJsonPath('data.bytes', 13);
        $this->assertSame('berkas anonim', Storage::disk('local')->get('accepted.bin'));
        $audit = AuditEvent::where('action', 'api.mutation')->firstOrFail();
        $this->assertSame(hash('sha256', 'berkas anonim'), $audit->metadata['file_scan']['sha256']);
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_detected_or_unavailable_scan_never_reaches_processing(): void
    {
        foreach ([['UPLOAD_REJECTED', 422], ['SCANNER_UNAVAILABLE', 503]] as [$code, $status]) {
            $scanner = Mockery::mock(MalwareScanner::class);
            $scanner->shouldReceive('assertClean')->once()->andThrow(new ApiException($code, 'Pesan aman', null, $status));
            $this->app->instance(MalwareScanner::class, $scanner);
            $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/test-upload-scanning',
                ['file' => UploadedFile::fake()->createWithContent('contoh.pdf', 'anonim')])->assertStatus($status)->assertJsonPath('error.code', $code);
            $this->assertSame([], Storage::disk('local')->allFiles());
            $this->assertSame([], Storage::disk('quarantine')->allFiles());
            $this->assertDatabaseHas('audit_events', ['action' => 'upload.scan.denied', 'entity' => 'api/v1/test-upload-scanning']);
        }
    }

    public function test_byte_changes_during_scan_are_rejected(): void
    {
        $file = UploadedFile::fake()->createWithContent('anonim.pdf', 'awal');
        $scanner = Mockery::mock(MalwareScanner::class);
        $scanner->shouldReceive('assertClean')->once()->andReturnUsing(function (string $path) use ($file) {
            file_put_contents($file->getRealPath(), 'berubah');
        });
        $this->app->instance(MalwareScanner::class, $scanner);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/test-upload-scanning', ['file' => $file])->assertStatus(500);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_oversized_file_is_rejected_before_scanner(): void
    {
        $scanner = Mockery::mock(MalwareScanner::class);
        $scanner->shouldNotReceive('assertClean');
        $this->app->instance(MalwareScanner::class, $scanner);
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/test-upload-scanning',
            ['file' => UploadedFile::fake()->create('besar.pdf', 10241)])->assertStatus(400);
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_existing_upload_endpoints_fail_closed_without_scanner(): void
    {
        config(['uploads.scanner_binary' => '']);
        $this->app->instance(MalwareScanner::class, new ClamavScanner);
        foreach ([['admin.acc@dashboard.test', '/api/v1/accounting/import/preview'],
            ['admin.acc@dashboard.test', '/api/v1/accounting/transactions/00000000-0000-4000-8000-000000000000/attachments'],
            ['manager.project@dashboard.test', '/api/v1/projects/00000000-0000-4000-8000-000000000000/documents']] as [$email, $path]) {
            $this->flushHeaders()->authenticated($email)->postJson($path,
                ['file' => UploadedFile::fake()->createWithContent('anonim.pdf', 'anonim')])->assertStatus(503)->assertJsonPath('error.code', 'SCANNER_UNAVAILABLE');
            $this->assertSame([], Storage::disk('quarantine')->allFiles());
        }
        $this->assertDatabaseCount('project_documents', 0);
        $this->assertDatabaseCount('accounting_transaction_attachments', 0);
    }

    public function test_untrusted_actor_is_denied_before_scanning(): void
    {
        $scanner = Mockery::mock(MalwareScanner::class);
        $scanner->shouldNotReceive('assertClean');
        $this->app->instance(MalwareScanner::class, $scanner);
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/accounting/import/preview',
            ['file' => UploadedFile::fake()->createWithContent('anonim.pdf', 'anonim')])->assertStatus(403);
    }

    public function test_scanner_accepts_only_an_explicit_success_verdict(): void
    {
        config(['uploads.scanner_binary' => PHP_BINARY]);
        Storage::disk('quarantine')->put('contoh dengan spasi', 'anonim');
        $path = Storage::disk('quarantine')->path('contoh dengan spasi');
        Process::fake(fn () => Process::result(output: $path.': OK'.PHP_EOL));
        (new ClamavScanner)->assertClean($path);
        Process::assertRan(fn ($process) => is_array($process->command) && end($process->command) === $path);
    }

    public function test_scanner_rejects_error_detection_and_missing_verdict(): void
    {
        config(['uploads.scanner_binary' => PHP_BINARY]);
        Storage::disk('quarantine')->put('contoh', 'anonim');
        $path = Storage::disk('quarantine')->path('contoh');
        foreach ([[1, 'FOUND', '', 422], [2, '', 'scanner error', 503], [0, '', '', 503],
            [0, $path.': OK', 'warning', 503]] as [$exit, $output, $error, $status]) {
            Process::fake(fn () => Process::result(output: $output, errorOutput: $error, exitCode: $exit));
            try {
                (new ClamavScanner)->assertClean($path);
                $this->fail('Hasil scanner tidak valid harus ditolak');
            } catch (ApiException $exception) {
                $this->assertSame($status, $exception->getHttpStatus());
            }
        }
    }

    public function test_health_command_fails_when_scanner_does_not_detect_test_sample(): void
    {
        $this->artisan('erp:scan-check')->assertFailed();
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_health_command_succeeds_only_with_clean_and_rejected_verdicts(): void
    {
        $scanner = Mockery::mock(MalwareScanner::class);
        $scanner->shouldReceive('assertClean')->once()->ordered()->andReturnNull();
        $scanner->shouldReceive('assertClean')->once()->ordered()->andThrow(new ApiException('UPLOAD_REJECTED', 'Uji anonim', null, 422));
        $this->app->instance(MalwareScanner::class, $scanner);
        $this->artisan('erp:scan-check')->assertSuccessful();
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }
}
