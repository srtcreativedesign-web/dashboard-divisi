<?php

namespace App\Services;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ClamavScanner implements MalwareScanner
{
    public function assertClean(string $path): void
    {
        $binary = (string) config('uploads.scanner_binary');
        if ($binary === '' || ! is_file($binary) || ! is_file($path)) {
            logger()->warning('upload.scanner.unavailable', ['reason' => 'configuration_or_file', 'binary_exists' => is_file($binary), 'file_exists' => is_file($path)]);
            $this->unavailable();
        }
        $command = [$binary, '--stdout', '--no-summary', '--max-filesize=10M', '--max-scansize=100M',
            '--max-recursion=16', '--fail-if-cvd-older-than=7', '--alert-exceeds-max=yes', '--alert-encrypted=yes', '--alert-broken=yes'];
        $database = (string) config('uploads.scanner_database');
        if ($database !== '') {
            $command[] = '--database='.$database;
        }
        $command[] = $path;
        $disk = Storage::disk('quarantine');
        $temporary = 'scan-tmp-'.Str::uuid();
        $temporaryCreated = false;
        $lock = null;
        $acquired = false;
        try {
            $lock = Cache::store(config('uploads.scanner_lock_store'))->lock('erp:upload-scanner', (int) config('uploads.scanner_timeout') + 10);
            $acquired = $lock->get();
            if (! $acquired) {
                throw new ApiException('SCANNER_BUSY', 'Pemindai sedang memproses berkas lain. Coba unggah kembali setelah selesai', null, 429);
            }
            if (! $disk->makeDirectory($temporary)) {
                $this->unavailable();
            }
            $temporaryCreated = true;
            array_splice($command, -1, 0, ['--tempdir='.$disk->path($temporary)]);
            $result = Process::timeout((int) config('uploads.scanner_timeout'))->run($command);
        } catch (ApiException $error) {
            throw $error;
        } catch (Throwable $error) {
            logger()->warning('upload.scanner.unavailable', ['reason' => 'process_exception', 'exception_class' => get_class($error)]);
            $this->unavailable();
        } finally {
            if ($temporaryCreated && ! $disk->deleteDirectory($temporary)) {
                logger()->warning('upload.scanner.temp_cleanup_failed');
            }
            if ($acquired) {
                $lock->release();
            }
        }
        if ($result->exitCode() === 1) {
            throw new ApiException('UPLOAD_REJECTED', 'Berkas ditolak oleh pemeriksaan keamanan; gunakan berkas lain', null, 422);
        }
        // Exit sukses saja tidak cukup: file harus benar-benar mendapat verdict OK.
        $expected = $path.': OK';
        $lines = preg_split('/\r\n|\r|\n/', trim($result->output()));
        if ($result->exitCode() !== 0 || trim($result->errorOutput()) !== '' || ! in_array($expected, $lines, true)) {
            logger()->warning('upload.scanner.unavailable', ['reason' => 'invalid_verdict', 'exit_code' => $result->exitCode(), 'stderr_present' => trim($result->errorOutput()) !== '', 'verdict_matches' => in_array($expected, $lines, true)]);
            $this->unavailable();
        }
    }

    private function unavailable(): never
    {
        throw new ApiException('SCANNER_UNAVAILABLE', 'Pemindaian berkas belum tersedia. Unggahan belum disimpan; coba lagi setelah scanner siap', null, 503);
    }
}
