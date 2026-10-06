<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectDocumentMigrationTest extends TestCase
{
    private function document(): ProjectDocument
    {
        Storage::fake('local');
        Storage::fake('public');
        $project = Project::create(['name' => 'Migrasi anonim', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $document = $project->documents()->create(['title' => 'Uji.pdf', 'file_type' => 'General', 'file_path' => 'project_documents/'.$project->id.'/uji.pdf']);
        Storage::disk('public')->put($document->file_path, 'dokumen anonim');

        return $document;
    }

    public function test_inventory_is_read_only_and_apply_preserves_verified_backup(): void
    {
        $document = $this->document();
        $old = $document->file_path;
        $this->artisan('erp:privatize-project-documents')->assertSuccessful();
        $this->assertSame($old, $document->fresh()->file_path);
        Storage::disk('public')->assertExists($old);
        $this->artisan('erp:privatize-project-documents', ['--apply' => true])->assertSuccessful();
        $target = str_replace('project_documents/', 'project_documents_private/', $old);
        $this->assertSame($target, $document->fresh()->file_path);
        $this->assertSame('dokumen anonim', Storage::disk('local')->get($target));
        Storage::disk('public')->assertMissing($old);
        $files = Storage::disk('local')->allFiles('project_document_migration_backups');
        $this->assertCount(2, $files);
        $manifestPath = collect($files)->first(fn ($file) => str_ends_with($file, '.json'));
        $manifest = json_decode(Storage::disk('local')->get($manifestPath), true);
        $this->assertSame(hash('sha256', 'dokumen anonim'), $manifest['sha256']);
        $this->assertSame('dokumen anonim', Storage::disk('local')->get($manifest['backup']));
        $this->artisan('erp:privatize-project-documents', ['--apply' => true])->assertSuccessful();
    }

    public function test_different_destination_is_never_overwritten(): void
    {
        $document = $this->document();
        $target = str_replace('project_documents/', 'project_documents_private/', $document->file_path);
        Storage::disk('local')->put($target, 'berbeda');
        $this->artisan('erp:privatize-project-documents', ['--apply' => true])->assertFailed();
        $this->assertSame('berbeda', Storage::disk('local')->get($target));
        Storage::disk('public')->assertExists($document->file_path);
        $this->assertSame($document->file_path, $document->fresh()->file_path);
    }

    public function test_unregistered_public_file_is_not_silently_deleted(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Storage::disk('public')->put('project_documents/orphan.pdf', 'anonim');
        $this->artisan('erp:privatize-project-documents', ['--apply' => true])->assertFailed();
        Storage::disk('public')->assertExists('project_documents/orphan.pdf');
    }
}
