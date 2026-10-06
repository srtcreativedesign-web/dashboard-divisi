<?php

namespace App\Console\Commands;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CheckUploadScanner extends Command
{
    protected $signature = 'erp:scan-check';

    protected $description = 'Menguji scanner unggahan dengan berkas anonim dan EICAR, tanpa mengubah data bisnis';

    public function handle(MalwareScanner $scanner): int
    {
        $disk = Storage::disk('quarantine');
        $paths = [(string) Str::uuid(), (string) Str::uuid()];
        try {
            $disk->put($paths[0], 'Pengujian scanner ERP dengan berkas anonim.');
            $disk->put($paths[1], base64_decode('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo='));
            $scanner->assertClean($disk->path($paths[0]));
            try {
                $scanner->assertClean($disk->path($paths[1]));
                $this->error('Scanner tidak menolak berkas uji EICAR.');

                return self::FAILURE;
            } catch (ApiException $error) {
                if ($error->getErrorCode() !== 'UPLOAD_REJECTED') {
                    throw $error;
                }
            }
            $this->info('Scanner siap: berkas bersih diterima dan EICAR ditolak.');

            return self::SUCCESS;
        } catch (Throwable) {
            $this->error('Scanner belum siap atau gagal; periksa konfigurasi dan database deteksi.');

            return self::FAILURE;
        } finally {
            foreach ($paths as $path) {
                if (! $disk->delete($path)) {
                    report(new \RuntimeException('Pembersihan probe scanner gagal'));
                }
            }
        }
    }
}
