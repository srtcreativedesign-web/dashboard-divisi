<?php

namespace Tests\Feature;

use App\Exceptions\ApiException;
use App\Services\ClamavScanner;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class UploadOperationsTest extends TestCase
{
    public function test_concurrent_scan_is_denied_without_starting_another_process(): void
    {
        config(['uploads.scanner_binary' => PHP_BINARY]);
        Storage::disk('quarantine')->put('probe', 'anonim');
        Process::fake();
        $lock = Cache::store('array')->lock('erp:upload-scanner', 70);
        $this->assertTrue($lock->get());
        try {
            (new ClamavScanner)->assertClean(Storage::disk('quarantine')->path('probe'));
            $this->fail('Scan bersamaan harus ditolak');
        } catch (ApiException $error) {
            $this->assertSame('SCANNER_BUSY', $error->getErrorCode());
            $this->assertSame(429, $error->getHttpStatus());
        } finally {
            $lock->release();
        }
        Process::assertNothingRan();
    }

    public function test_scan_lock_is_released_after_process_failure(): void
    {
        config(['uploads.scanner_binary' => PHP_BINARY]);
        Storage::disk('quarantine')->put('probe', 'anonim');
        $path = Storage::disk('quarantine')->path('probe');
        Process::fake(fn () => throw new \RuntimeException('Timeout simulasi'));
        try {
            (new ClamavScanner)->assertClean($path);
            $this->fail('Process gagal harus ditolak');
        } catch (ApiException $error) {
            $this->assertSame('SCANNER_UNAVAILABLE', $error->getErrorCode());
        }
        $lock = Cache::store('array')->lock('erp:upload-scanner', 70);
        $this->assertTrue($lock->get());
        $lock->release();
    }

    public function test_reconciliation_only_removes_stale_uuid_snapshots_when_applied(): void
    {
        $disk = Storage::disk('quarantine');
        $stale = (string) Str::uuid();
        $recent = (string) Str::uuid();
        $disk->put($stale, 'sisa anonim');
        $disk->put($recent, 'aktif anonim');
        touch($disk->path($stale), time() - 1200);
        $this->artisan('erp:quarantine-reconcile')->assertSuccessful();
        $disk->assertExists($stale);
        $this->artisan('erp:quarantine-reconcile', ['--apply' => true])->assertSuccessful();
        $disk->assertMissing($stale);
        $disk->assertExists($recent);
    }

    public function test_unexpected_names_and_subdirectories_are_preserved_and_reported(): void
    {
        $disk = Storage::disk('quarantine');
        $disk->put('dokumen-bisnis.pdf', 'jangan hapus');
        $disk->put('folder/'.Str::uuid(), 'jangan hapus');
        touch($disk->path('dokumen-bisnis.pdf'), time() - 1200);
        $this->artisan('erp:quarantine-reconcile', ['--apply' => true])->assertFailed();
        $disk->assertExists('dokumen-bisnis.pdf');
        $this->assertCount(2, $disk->allFiles());
    }

    public function test_changed_quarantine_root_never_deletes_other_storage(): void
    {
        Storage::fake('local');
        $name = (string) Str::uuid();
        Storage::disk('local')->put($name, 'berkas bisnis anonim');
        touch(Storage::disk('local')->path($name), time() - 1200);
        config(['filesystems.disks.quarantine.root' => Storage::disk('local')->path('')]);
        Storage::forgetDisk('quarantine');
        $this->artisan('erp:quarantine-reconcile', ['--apply' => true])->assertFailed();
        Storage::disk('local')->assertExists($name);
    }
}
