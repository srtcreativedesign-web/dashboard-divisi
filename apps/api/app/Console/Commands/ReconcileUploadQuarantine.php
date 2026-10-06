<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ReconcileUploadQuarantine extends Command
{
    protected $signature = 'erp:quarantine-reconcile {--apply : Hapus hanya salinan sementara UUID yang usianya minimal 15 menit}';

    protected $description = 'Memeriksa salinan karantina tertinggal; tidak menyentuh dokumen bisnis';

    public function handle(): int
    {
        try {
            $disk = Storage::disk('quarantine');
            $root = rtrim($disk->path(''), '/\\');
            $expected = app()->environment('testing')
                ? storage_path('framework/testing/disks/quarantine') : storage_path('app/quarantine');
            if (str_replace('\\', '/', $root) !== str_replace('\\', '/', $expected)) {
                throw new RuntimeException('Lokasi karantina tidak sesuai konfigurasi yang diizinkan');
            }
            if (! is_dir($root)) {
                $this->line(json_encode(['stale' => 0, 'removed' => 0, 'unexpected' => 0]));

                return self::SUCCESS;
            }
            if (is_link($root) || realpath($root) === false) {
                throw new RuntimeException('Root karantina tidak aman');
            }
            $stale = 0;
            $removed = 0;
            $unexpected = 0;
            foreach (new \DirectoryIterator($root) as $entry) {
                if ($entry->isDot()) {
                    continue;
                }
                $name = $entry->getFilename();
                if ($entry->isLink() || ! $entry->isFile()
                    || ! preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $name)) {
                    $unexpected++;

                    continue;
                }
                $resolved = realpath($entry->getPathname());
                if ($resolved === false || dirname($resolved) !== realpath($root)) {
                    throw new RuntimeException('Salinan di luar root karantina');
                }
                if ($entry->getMTime() > time() - 900) {
                    continue;
                }
                $stale++;
                if ($this->option('apply')) {
                    // Nama UUID langsung di root; tidak ada penghapusan rekursif atau path dari input.
                    if (! $disk->delete($name)) {
                        throw new RuntimeException('Pembersihan salinan sementara gagal');
                    }
                    $removed++;
                }
            }
            $this->line(json_encode(['stale' => $stale, 'removed' => $removed, 'unexpected' => $unexpected]));

            return $unexpected === 0 ? self::SUCCESS : self::FAILURE;
        } catch (Throwable) {
            $this->error('Rekonsiliasi karantina gagal; berkas bisnis tidak dihapus.');

            return self::FAILURE;
        }
    }
}
