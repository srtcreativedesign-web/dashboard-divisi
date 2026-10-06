<?php

namespace App\Http\Middleware;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class ScanUploadedFile
{
    public function __construct(private MalwareScanner $scanner) {}

    public function handle(Request $request, Closure $next): Response
    {
        $file = $request->file('file');
        if ($file === null) {
            return $next($request);
        }
        if (! $file instanceof UploadedFile || ! $file->isValid() || $file->getSize() > config('uploads.max_bytes')) {
            throw new ApiException('VALIDATION_ERROR', 'Unggahan harus berupa satu berkas valid maksimal 10 MB');
        }
        $disk = Storage::disk('quarantine');
        $path = (string) Str::uuid();
        $stream = fopen($file->getRealPath(), 'rb');
        if ($stream === false) {
            throw new RuntimeException('Berkas unggahan tidak dapat dibaca');
        }
        try {
            try {
                $disk->put($path, $stream);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }
            $fullPath = $disk->path($path);
            $checksum = hash_file('sha256', $fullPath);
            if (! is_string($checksum) || ! hash_equals($checksum, hash_file('sha256', $file->getRealPath()))) {
                throw new RuntimeException('Salinan karantina tidak sesuai');
            }
            $this->scanner->assertClean($fullPath);
            if (! hash_equals($checksum, hash_file('sha256', $fullPath))
                || ! hash_equals($checksum, hash_file('sha256', $file->getRealPath()))) {
                throw new RuntimeException('Berkas berubah setelah pemindaian');
            }

            $request->attributes->set('file_scan', ['engine' => 'ClamAV', 'sha256' => $checksum]);

            return $next($request);
        } finally {
            if (! $disk->delete($path)) {
                report(new RuntimeException('Pembersihan karantina gagal; perlu rekonsiliasi storage'));
            }
        }
    }
}
