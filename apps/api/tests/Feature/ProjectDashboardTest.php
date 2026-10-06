<?php

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProjectDashboardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Project::query()->delete();
        Carbon::setTestNow(Carbon::parse('2026-10-06 00:30:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function project(array $data = []): Project
    {
        return Project::create(array_merge([
            'division_code' => 'PROJECT', 'name' => 'Proyek Uji',
            'contract_value' => 100, 'status' => 'in_progress',
        ], $data));
    }

    public function test_totals_include_more_than_one_page_and_exclude_other_divisions(): void
    {
        for ($i = 0; $i < 121; $i++) {
            $this->project();
        }
        $this->project(['division_code' => 'ACC', 'contract_value' => 900000]);

        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects/dashboard')
            ->assertOk()->assertJsonPath('data.total_projects', 121)
            ->assertJsonPath('data.active_projects', 121)
            ->assertJsonPath('data.active_contract_value', '12100')
            ->assertJsonPath('data.status_counts.in_progress', 121)
            ->assertJsonPath('data.average_recorded_progress', null);
    }

    public function test_progress_coverage_and_overdue_use_real_milestones_and_wib(): void
    {
        $valid = $this->project();
        $valid->milestones()->create(['title' => 'Tahap A', 'weight_percentage' => 40, 'actual_percentage' => 25, 'status' => 'pending', 'due_date' => '2026-10-05']);
        $valid->milestones()->create(['title' => 'Tahap B', 'weight_percentage' => 60, 'actual_percentage' => 50, 'status' => 'pending', 'due_date' => '2026-10-06']);
        $incomplete = $this->project();
        $incomplete->milestones()->create(['title' => 'Bobot belum lengkap', 'weight_percentage' => 50, 'actual_percentage' => 100, 'status' => 'completed']);
        $hold = $this->project(['status' => 'on_hold']);
        $hold->milestones()->create(['title' => 'Ditunda', 'weight_percentage' => 100, 'actual_percentage' => 0, 'status' => 'pending', 'due_date' => '2026-10-01']);

        $response = $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects/dashboard')->assertOk();
        $response->assertJsonPath('data.average_recorded_progress', 40)
            ->assertJsonPath('data.progress_covered_projects', 1)
            ->assertJsonPath('data.active_projects', 2)
            ->assertJsonPath('data.overdue_projects', 1)
            ->assertJsonPath('data.attention_projects.0.id', $valid->id)
            ->assertJsonPath('data.attention_projects.0.overdue_milestones_count', 1);
        $this->assertSame($response->json('data'), $this->getJson('/api/v1/projects/dashboard')->assertOk()->json('data'));
    }

    public function test_monthly_counts_use_wib_month_boundary(): void
    {
        $this->project()->forceFill(['created_at' => Carbon::parse('2026-09-30 16:59:59', 'UTC')])->save();
        $this->project()->forceFill(['created_at' => Carbon::parse('2026-09-30 17:00:00', 'UTC')])->save();
        $months = $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects/dashboard')->assertOk()->json('data.monthly_trend');
        $this->assertSame(['month' => '2026-10', 'new_count' => 1, 'total_count' => 2], $months[5]);
        $this->assertSame(1, $months[4]['new_count']);
    }

    public function test_dashboard_requires_authentication_and_project_read_capability(): void
    {
        $this->getJson('/api/v1/projects/dashboard')->assertUnauthorized();
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/projects/dashboard')->assertForbidden();
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/projects/dashboard')->assertOk();
    }
}
