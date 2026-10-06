<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectDocumentAccessTest extends TestCase
{
    public function test_upload_uses_authenticated_actor_and_private_storage(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $project = Project::create(['name' => 'Dokumen MVP', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $response = $this->authenticated('manager.project@dashboard.test')->post('/api/v1/projects/'.$project->id.'/documents', [
            'title' => 'kontrak.pdf', 'document_type' => 'Contract', 'file' => UploadedFile::fake()->create('kontrak.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $response->assertJsonMissingPath('data.file_path');
        $this->getJson('/api/v1/projects/'.$project->id.'/documents')->assertOk()->assertJsonMissingPath('data.0.file_path');
        $this->getJson('/api/v1/projects/'.$project->id)->assertOk()->assertJsonMissingPath('data.documents.0.file_path');
        $document = ProjectDocument::findOrFail($response->json('data.id'));
        $this->assertNotNull($document->uploaded_by);
        $this->assertSame('Contract', $document->file_type);
        Storage::disk('local')->assertExists($document->file_path);
        Storage::disk('public')->assertMissing($document->file_path);
        $url = '/api/v1/projects/'.$project->id.'/documents/'.$document->id.'/download';
        $this->authenticated('manager.project@dashboard.test')->get($url)->assertOk()->assertDownload('kontrak.pdf');
        $this->authenticated('manager.cell@dashboard.test')->getJson($url)->assertForbidden();
    }

    public function test_project_queries_hide_records_outside_project_module(): void
    {
        $foreign = Project::withoutGlobalScopes()->create(['name' => 'Di luar modul', 'division_code' => 'CELL', 'status' => 'planning', 'contract_value' => 0]);
        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects/'.$foreign->id)->assertNotFound();
    }

    public function test_document_id_cannot_be_downloaded_through_another_project(): void
    {
        Storage::fake('local');
        $first = Project::create(['name' => 'Pertama', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $second = Project::create(['name' => 'Kedua', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $document = $first->documents()->create(['file_type' => 'General', 'title' => 'uji.pdf', 'file_path' => 'project_documents_private/'.$first->id.'/uji.pdf']);
        Storage::disk('local')->put($document->file_path, 'anonim');
        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects/'.$second->id.'/documents/'.$document->id.'/download')->assertNotFound();
    }

    public function test_document_path_outside_project_folder_cannot_be_read_or_deleted(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('other_module/evidence.txt', 'anonim');
        $project = Project::create(['name' => 'Keamanan', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $document = $project->documents()->create(['file_type' => 'General', 'title' => 'uji.pdf', 'file_path' => 'other_module/evidence.txt']);
        $base = '/api/v1/projects/'.$project->id.'/documents/'.$document->id;
        $this->authenticated('manager.project@dashboard.test')->getJson($base.'/download')->assertNotFound();
        $this->authenticated('manager.project@dashboard.test')->deleteJson($base)->assertNotFound();
        Storage::disk('public')->assertExists('other_module/evidence.txt');
        $this->assertDatabaseHas('project_documents', ['id' => $document->id]);
    }
}
