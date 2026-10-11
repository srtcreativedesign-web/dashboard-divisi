<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\ProjectInvoice;
use App\Models\ProjectPettyCash;
use Database\Seeders\ProjectTwoMonthUatSeeder;
use Tests\TestCase;

class ProjectTwoMonthUatTest extends TestCase
{
    public function test_seed_persists_two_months_without_duplicates_or_overwriting_existing_projects(): void
    {
        $original = Project::create(['division_code' => 'PROJECT', 'name' => 'Proyek existing', 'contract_value' => '1000000.25', 'status' => 'planning']);
        $this->seed(ProjectTwoMonthUatSeeder::class);
        $counts = [Project::count(), ProjectInvoice::count(), ProjectExpense::count(), ProjectPettyCash::count()];
        $this->seed(ProjectTwoMonthUatSeeder::class);
        $this->assertSame($counts, [Project::count(), ProjectInvoice::count(), ProjectExpense::count(), ProjectPettyCash::count()]);
        $this->assertSame('1000000.25', (string) $original->fresh()->contract_value);
        $projects = Project::where('project_code', 'like', ProjectTwoMonthUatSeeder::BATCH.'%')->get();
        $this->assertCount(8, $projects);
        foreach ($projects as $project) {
            $this->assertEquals(100, $project->milestones()->sum('weight_percentage'));
            $this->assertLessThanOrEqual((float) $project->contract_value, (float) $project->invoices()->sum('amount'));
            $this->assertGreaterThanOrEqual(0, (float) $project->pettyCashes()->where('type', 'in')->sum('amount') - (float) $project->pettyCashes()->where('type', 'out')->sum('amount'));
        }
        $this->assertSame('2026-09-01', substr((string) ProjectPettyCash::min('transaction_date'), 0, 10));
        $this->assertSame('2026-10-08', substr((string) ProjectPettyCash::max('transaction_date'), 0, 10));
        $this->assertEquals(0, ProjectInvoice::where('status', '!=', 'paid')->whereNotNull('paid_date')->count());
    }

    public function test_project_reader_can_view_seed_but_cannot_mutate_it_and_accounting_cannot_read_project(): void
    {
        $this->seed(ProjectTwoMonthUatSeeder::class);
        $project = Project::where('project_code', ProjectTwoMonthUatSeeder::BATCH.'-03')->firstOrFail();
        $this->authenticated('leader.project@dashboard.test')->getJson('/api/v1/projects/'.$project->id.'/petty-cash')->assertOk();
        $this->authenticated('leader.project@dashboard.test')->postJson('/api/v1/projects/'.$project->id.'/petty-cash', ['type' => 'out', 'amount' => 1, 'transaction_date' => '2026-10-08', 'category' => 'UAT', 'description' => 'Mutasi ditolak'])->assertForbidden();
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/projects/'.$project->id.'/invoices')->assertForbidden();
        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects?classification=maintenance')->assertOk()->assertJsonPath('data.total', 4);
    }

    public function test_batch_code_collision_rolls_back_without_overwriting(): void
    {
        Project::create(['division_code' => 'PROJECT', 'project_code' => ProjectTwoMonthUatSeeder::BATCH.'-02', 'name' => 'Existing collision', 'status' => 'planning']);
        try {
            $this->seed(ProjectTwoMonthUatSeeder::class);
            $this->fail('Collision should reject seed');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('berbenturan', $e->getMessage());
        }
        $this->assertDatabaseMissing('projects', ['project_code' => ProjectTwoMonthUatSeeder::BATCH.'-01']);
        $this->assertDatabaseHas('projects', ['name' => 'Existing collision']);
    }
}
