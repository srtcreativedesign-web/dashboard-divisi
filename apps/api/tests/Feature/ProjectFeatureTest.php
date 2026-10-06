<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\ProjectProgressPhoto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\ProjectSeeder::class);
    }

    public function test_unauthenticated_user_cannot_access_projects()
    {
        $response = $this->getJson('/api/v1/projects');
        $response->assertStatus(401);
    }

    public function test_user_without_capability_cannot_access_projects()
    {
        // Manager Accounting cannot access Projects
        $response = $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/projects');
        $response->assertStatus(403);
    }

    public function test_user_with_capability_can_access_projects()
    {
        // Manager Project CAN access Projects
        $response = $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects');
        $response->assertStatus(200);
    }

    public function test_can_view_project_details_with_milestones_and_photos()
    {
        $project = Project::first();
        $response = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'milestones',
                'photos'
            ]
        ]);
    }

    public function test_can_update_milestone_progress_and_notes()
    {
        $project = Project::first();
        $milestone = $project->milestones()->first();

        $payload = [
            'title' => 'Tahap Desain Revisi',
            'actual_percentage' => 75.5,
            'status' => 'in_progress',
            'notes' => 'Pekerjaan revisi gambar teknis sedang berjalan.',
            'completion_date' => null,
        ];

        $response = $this->authenticated('manager.project@dashboard.test')
            ->putJson("/api/v1/projects/{$project->id}/milestones/{$milestone->id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('project_milestones', [
            'id' => $milestone->id,
            'title' => 'Tahap Desain Revisi',
            'actual_percentage' => 75.5,
            'status' => 'in_progress',
        ]);
    }

    public function test_can_upload_and_delete_progress_photo()
    {
        Storage::fake('public');
        $project = Project::first();
        $milestone = $project->milestones()->first();

        $file = UploadedFile::fake()->image('before_progress.jpg');

        $response = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/photos", [
                'stage' => 'before',
                'area_name' => 'Fasad Luar',
                'caption' => 'Kondisi sebelum renovasi',
                'milestone_id' => $milestone->id,
                'file' => $file,
            ]);

        $response->assertStatus(201);
        $photoId = $response->json('data.id');
        $this->assertNotNull($photoId);

        $this->assertDatabaseHas('project_progress_photos', [
            'id' => $photoId,
            'project_id' => $project->id,
            'stage' => 'before',
            'area_name' => 'Fasad Luar',
        ]);

        // List photos
        $listResponse = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/photos?stage=before");
        $listResponse->assertStatus(200);
        $this->assertNotEmpty($listResponse->json('data'));

        // Delete photo
        $deleteResponse = $this->authenticated('manager.project@dashboard.test')
            ->deleteJson("/api/v1/projects/{$project->id}/photos/{$photoId}");
        $deleteResponse->assertStatus(204);

        $this->assertDatabaseMissing('project_progress_photos', [
            'id' => $photoId,
        ]);
    }
}
