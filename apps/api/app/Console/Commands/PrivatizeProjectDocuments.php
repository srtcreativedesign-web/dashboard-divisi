<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\ProjectDocument;
use App\Services\Project\DocumentStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class PrivatizeProjectDocuments extends Command
{
    protected $signature = 'erp:privatize-project-documents {--apply : Terapkan setelah backup dan checksum diverifikasi}';

    protected $description = 'Inventaris dokumen Project publik dan pindahkan ke privat dengan salinan pemulihan.';

    private function assertContainedPath(string $root, string $target): void
    {
        $base = realpath($root);
        if ($base === false) {
            throw new RuntimeException('Root storage tidak tersedia');
        }
        $cursor = $target;
        while ($cursor !== $root && strlen($cursor) >= strlen($root)) {
            if (is_link($cursor)) {
                throw new RuntimeException('Symlink storage tidak diizinkan');
            }
            if (file_exists($cursor)) {
                $resolved = realpath($cursor);
                if ($resolved === false || ($resolved !== $base && ! str_starts_with($resolved, $base.DIRECTORY_SEPARATOR))) {
                    throw new RuntimeException('Lokasi storage di luar root');
                }
            }
            $parent = dirname($cursor);
            if ($parent === $cursor) {
                throw new RuntimeException('Lokasi storage tidak aman');
            }
            $cursor = $parent;
        }
    }

    public function handle(DocumentStorageService $paths): int
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $documents = ProjectDocument::where('file_path', 'like', 'project_documents/%')
            ->orWhere('file_path', 'like', 'project_documents_private/%')->get();
        $count = $documents->filter(fn ($document) => str_starts_with($document->file_path, 'project_documents/'))->count();
        $this->info('Dokumen publik terdaftar: '.$count.'; berkas publik: '.count($public->allFiles('project_documents')));
        if (! $this->option('apply')) {
            $this->info('Mode inventaris: tidak ada file atau metadata yang diubah.');

            return self::SUCCESS;
        }
        $run = (string) Str::uuid();
        $migrated = 0;
        try {
            foreach ($documents as $document) {
                Project::findOrFail($document->project_id);
                $disk = $paths->diskFor($document);
                $source = $disk === 'public' ? $document->file_path : str_replace('project_documents_private/', 'project_documents/', $document->file_path);
                $target = str_replace('project_documents/', 'project_documents_private/', $source);
                if (! $public->exists($source)) {
                    if ($disk === 'public') {
                        throw new RuntimeException('Sumber dokumen publik hilang; metadata tidak diubah');
                    }

                    continue;
                }
                $this->assertContainedPath($public->path(''), $public->path($source));
                $this->assertContainedPath($private->path(''), $private->path($target));
                $resolved = realpath($public->path($source));
                $allowed = realpath($public->path('project_documents/'.$document->project_id));
                if ($resolved === false || $allowed === false || is_link($public->path($source))
                    || ! str_starts_with($resolved, $allowed.DIRECTORY_SEPARATOR)) {
                    throw new RuntimeException('Lokasi sumber tidak aman');
                }
                $content = $public->get($source);
                $hash = hash('sha256', $content);
                if ($private->exists($target) && hash('sha256', $private->get($target)) !== $hash) {
                    throw new RuntimeException('Tujuan berbeda; tidak boleh ditimpa');
                }
                $backup = 'project_document_migration_backups/'.$run.'/'.$source;
                $this->assertContainedPath($private->path(''), $private->path($backup));
                $this->assertContainedPath($private->path(''), $private->path('project_document_migration_backups/'.$run.'/'.$document->id.'.json'));
                if (! $private->put($backup, $content) || hash('sha256', $private->get($backup)) !== $hash) {
                    throw new RuntimeException('Verifikasi backup gagal');
                }
                if (! $private->put($target, $content) || hash('sha256', $private->get($target)) !== $hash) {
                    throw new RuntimeException('Verifikasi salinan privat gagal');
                }
                $manifest = json_encode(['document_id' => $document->id, 'source' => $source, 'target' => $target, 'backup' => $backup, 'sha256' => $hash], JSON_THROW_ON_ERROR);
                if (! $private->put('project_document_migration_backups/'.$run.'/'.$document->id.'.json', $manifest)) {
                    throw new RuntimeException('Manifest pemulihan gagal');
                }
                DB::transaction(function () use ($document, $target) {
                    $locked = ProjectDocument::query()->lockForUpdate()->findOrFail($document->id);
                    if ($locked->file_path !== $document->file_path) {
                        throw new RuntimeException('Dokumen berubah saat migrasi');
                    }
                    $locked->update(['file_path' => $target]);
                });
                if (! $public->delete($source)) {
                    throw new RuntimeException('Salinan publik belum terhapus; jalankan ulang setelah storage diperbaiki');
                }
                $migrated++;
            }
            $remaining = count($public->allFiles('project_documents'));
            if ($remaining > 0) {
                throw new RuntimeException('Masih ada '.$remaining.' berkas publik tanpa metadata; tidak dihapus otomatis');
            }
        } catch (Throwable $error) {
            $this->error('Migrasi dihentikan: '.$error->getMessage());

            return self::FAILURE;
        }
        $this->info('Selesai: '.$migrated.' dokumen; salinan pemulihan dan manifest disimpan pada storage privat.');

        return self::SUCCESS;
    }
}
