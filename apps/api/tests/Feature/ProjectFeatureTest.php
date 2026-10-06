<?php

namespace Tests\Feature;

use App\Models\Project;
use Database\Seeders\ProjectSeeder;
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
        $this->seed(ProjectSeeder::class);
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
                'photos',
            ],
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

    public function test_can_manage_project_rab_and_expenses()
    {
        $project = Project::first();

        // 1. Create RAB item
        $rabRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/rab", [
                'item_name' => 'Semen Portland 50kg',
                'category' => 'material',
                'volume' => 100,
                'unit' => 'sak',
                'unit_price' => 65000,
            ]);

        $rabRes->assertStatus(201);
        $rabId = $rabRes->json('data.id');
        $this->assertEquals(6500000, $rabRes->json('data.total_price'));

        // 2. Create Expense linked to RAB
        $expenseRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/expenses", [
                'item_name' => 'Pembelian Semen Gelombang 1',
                'category' => 'material',
                'amount' => 3250000,
                'expense_date' => now()->toDateString(),
                'project_rab_id' => $rabId,
                'notes' => '50 sak semen tahap 1',
            ]);

        $expenseRes->assertStatus(201);
        $expenseId = $expenseRes->json('data.id');

        // 3. List Expenses
        $listRes = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/expenses");
        $listRes->assertStatus(200);
        $this->assertCount(1, $listRes->json('data'));

        // 4. Update Expense
        $updateRes = $this->authenticated('manager.project@dashboard.test')
            ->putJson("/api/v1/projects/{$project->id}/expenses/{$expenseId}", [
                'amount' => 3500000,
                'notes' => 'Ada biaya ongkos angkut',
            ]);
        $updateRes->assertStatus(200);
        $this->assertEquals(3500000, $updateRes->json('data.amount'));

        // 5. Delete Expense
        $delRes = $this->authenticated('manager.project@dashboard.test')
            ->deleteJson("/api/v1/projects/{$project->id}/expenses/{$expenseId}");
        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('project_expenses', ['id' => $expenseId]);
    }

    public function test_can_manage_project_invoices_and_settlement()
    {
        $project = Project::first();
        $milestone = $project->milestones()->create([
            'title' => 'Termin Pengadaan Material Pondasi',
            'weight_percentage' => 15,
            'actual_percentage' => 0,
            'payment_status' => false,
            'status' => 'pending',
        ]);
        $this->assertFalse((bool) $milestone->payment_status);

        // 1. Create Invoice linked to Milestone
        $invRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/{$project->id}/invoices", [
                'term_name' => 'Termin 1 (Uang Muka 20%)',
                'amount' => 100000000,
                'status' => 'draft',
                'due_date' => now()->addDays(14)->toDateString(),
                'project_milestone_id' => $milestone->id,
            ]);

        $invRes->assertStatus(201);
        $invoiceId = $invRes->json('data.id');
        $this->assertNotEmpty($invRes->json('data.invoice_number'));

        // 2. Mark invoice as Paid and check Milestone payment_status sync
        $payRes = $this->authenticated('manager.project@dashboard.test')
            ->patchJson("/api/v1/projects/{$project->id}/invoices/{$invoiceId}/pay", [
                'paid_date' => now()->toDateString(),
                'payment_reference' => 'TRF-BCA-9823412',
                'notes' => 'Lunas via transfer bank',
            ]);

        $payRes->assertStatus(200);
        $this->assertEquals('paid', $payRes->json('data.status'));

        // Verify milestone payment_status updated to true
        $milestone->refresh();
        $this->assertTrue((bool) $milestone->payment_status);
    }

    public function test_can_calculate_financial_summary_and_variance()
    {
        $project = Project::first();
        $project->update(['contract_value' => 500000000]);

        // Add RAB item
        $rab = $project->rabs()->create([
            'item_name' => 'Pekerjaan Struktur',
            'category' => 'material',
            'volume' => 1,
            'unit' => 'ls',
            'unit_price' => 300000000,
            'total_price' => 300000000,
        ]);

        // Add Actual Expense
        $project->expenses()->create([
            'project_rab_id' => $rab->id,
            'item_name' => 'Pembelian Besi Beton',
            'category' => 'material',
            'amount' => 120000000,
            'expense_date' => now()->toDateString(),
        ]);

        // Add Invoice
        $project->invoices()->create([
            'invoice_number' => 'INV-TEST-001',
            'term_name' => 'Termin 1 (DP)',
            'amount' => 150000000,
            'status' => 'paid',
            'due_date' => now()->toDateString(),
            'paid_date' => now()->toDateString(),
        ]);

        $res = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/financial-summary");

        $res->assertStatus(200);
        $data = $res->json('data');

        $this->assertEquals(500000000, $data['contract_value']);
        $this->assertEquals(300000000, $data['total_rab_budget']);
        $this->assertEquals(120000000, $data['total_actual_expense']);
        $this->assertEquals(180000000, $data['budget_variance']); // 300M - 120M = 180M
        $this->assertEquals(40.0, $data['budget_absorption_percentage']); // 120 / 300 = 40%
        $this->assertEquals(380000000, $data['realized_gross_profit']); // 500M - 120M = 380M
        $this->assertEquals(76.0, $data['realized_margin_percentage']); // 380 / 500 = 76%
        $this->assertEquals(150000000, $data['paid_amount']);
    }

    public function test_can_generate_progress_and_bast_reports()
    {
        $project = Project::first();

        // 1. Progress Report
        $progRes = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/reports/progress");

        $progRes->assertStatus(200);
        $progRes->assertJsonStructure([
            'data' => [
                'report_title',
                'project',
                'physical_progress' => ['milestones'],
                'financial_progress',
                'recent_photos',
            ],
        ]);

        // 2. BAST Handover Report
        $bastRes = $this->authenticated('manager.project@dashboard.test')
            ->getJson("/api/v1/projects/{$project->id}/reports/bast");

        $bastRes->assertStatus(200);
        $bastRes->assertJsonStructure([
            'data' => [
                'document_title',
                'project',
                'handover_summary',
                'visual_comparison',
                'milestone_checklist',
            ],
        ]);
    }
}
