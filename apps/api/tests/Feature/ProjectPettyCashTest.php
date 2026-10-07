<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectPettyCash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPettyCashTest extends TestCase
{
    use RefreshDatabase;

    private function createProject(): Project
    {
        return Project::create([
            'division_code' => 'PROJECT',
            'name' => 'Renovasi Gedung Alpha',
            'client_name' => 'PT Megah Properti',
            'contract_value' => 500000000,
            'status' => 'in_progress',
        ]);
    }

    public function test_manager_project_can_list_and_summarize_petty_cash()
    {
        $project = $this->createProject();

        ProjectPettyCash::create([
            'project_id' => $project->id,
            'type' => 'in',
            'category' => 'Top-Up Dana Proyek',
            'amount' => 5000000,
            'transaction_date' => '2026-10-01',
            'description' => 'Drop kas kecil termin 1',
        ]);

        ProjectPettyCash::create([
            'project_id' => $project->id,
            'type' => 'out',
            'category' => 'Konsumsi & Lembur',
            'amount' => 350000,
            'transaction_date' => '2026-10-02',
            'description' => 'Makan malam lembor cor beton',
            'recipient_or_vendor' => 'Warung Bu Siti',
        ]);

        $response = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/petty-cash");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'data',
                'summary' => ['total_in', 'total_out', 'balance', 'transaction_count'],
            ],
        ]);

        $this->assertEquals(5000000, $response->json('data.summary.total_in'));
        $this->assertEquals(350000, $response->json('data.summary.total_out'));
        $this->assertEquals(4650000, $response->json('data.summary.balance'));
        $this->assertEquals(2, $response->json('data.summary.transaction_count'));
    }

    public function test_manager_project_can_create_and_delete_petty_cash_entry()
    {
        $project = $this->createProject();

        $createResponse = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/petty-cash", [
                'type' => 'out',
                'category' => 'Material Darurat',
                'amount' => 150000,
                'transaction_date' => '2026-10-05',
                'description' => 'Beli paku & kawat bendrat darurat',
                'recipient_or_vendor' => 'TB Sinar Terang',
            ]);

        $createResponse->assertStatus(201);
        $id = $createResponse->json('data.id') ?? $createResponse->json('id');
        $this->assertDatabaseHas('project_petty_cashes', [
            'id' => $id,
            'amount' => 150000,
            'type' => 'out',
        ]);

        $deleteResponse = $this->authenticated('manager.project@dashboard.test')
            ->deleteJson("/api/v1/projects/{$project->id}/petty-cash/{$id}");

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('project_petty_cashes', ['id' => $id]);
    }

    public function test_reader_cannot_mutate_petty_cash()
    {
        $project = $this->createProject();

        // SPV has view:projects but not manage:projects
        $response = $this->authenticated('spv.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/petty-cash", [
                'type' => 'out',
                'category' => 'Transport',
                'amount' => 50000,
                'transaction_date' => '2026-10-05',
                'description' => 'Bensin motor surveyor',
            ]);

        $response->assertStatus(403);
    }
}
