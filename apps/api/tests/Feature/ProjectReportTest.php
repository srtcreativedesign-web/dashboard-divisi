<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\ProjectInvoice;
use App\Models\ProjectMilestone;
use App\Models\ProjectRab;
use Tests\TestCase;

class ProjectReportTest extends TestCase
{
    public function test_can_preview_project_report_with_calculated_metrics(): void
    {
        $project = Project::create([
            'name' => 'Tower Bali Seluler',
            'client_name' => 'Telkomsel',
            'contract_value' => 1500000000,
            'status' => 'in_progress',
            'start_date' => '2026-10-01',
            'end_date' => '2026-12-31',
        ]);

        ProjectRab::create([
            'project_id' => $project->id,
            'item_name' => 'Struktur Pondasi',
            'category' => 'material',
            'volume' => 1,
            'unit' => 'ls',
            'unit_price' => 1200000000,
            'total_price' => 1200000000,
        ]);

        ProjectMilestone::create([
            'project_id' => $project->id,
            'title' => 'Pondasi',
            'weight_percentage' => 30,
            'actual_percentage' => 30,
            'status' => 'completed',
        ]);

        ProjectExpense::create([
            'project_id' => $project->id,
            'item_name' => 'Semen & Besi',
            'category' => 'material',
            'amount' => 350000000,
            'expense_date' => '2026-10-10',
        ]);

        ProjectInvoice::create([
            'project_id' => $project->id,
            'invoice_number' => 'INV-2026-001',
            'term_name' => 'DP 20%',
            'amount' => 300000000,
            'status' => 'paid',
            'due_date' => '2026-10-05',
            'paid_date' => '2026-10-07',
        ]);

        \App\Models\ProjectPettyCash::create([
            'project_id' => $project->id,
            'type' => 'in',
            'category' => 'operasional',
            'amount' => 50000000,
            'transaction_date' => '2026-10-02',
            'description' => 'Topup Kas Kecil',
        ]);

        \App\Models\ProjectPettyCash::create([
            'project_id' => $project->id,
            'type' => 'out',
            'category' => 'operasional',
            'amount' => 15000000,
            'transaction_date' => '2026-10-08',
            'description' => 'Beli bensin & konsumsi lapangan',
        ]);

        $res = $this->authenticated('manager.project@dashboard.test')
            ->getJson('/api/v1/projects/reports/preview?period_start=2026-10-01&period_end=2026-10-31')
            ->assertOk()
            ->json('data');

        $this->assertSame('PROJECT', $res['division_code']);
        $this->assertFalse($res['is_already_submitted']);

        $metricsMap = collect($res['metrics'])->pluck('metric_value', 'metric_key');
        $this->assertEquals(1500000000, $metricsMap['contract_value_total']);
        $this->assertEquals(1200000000, $metricsMap['total_budget_rab']);
        $this->assertEquals(850000000, $metricsMap['remaining_budget_rab']);
        $this->assertEquals(350000000, $metricsMap['actual_expenses_period']);
        $this->assertEquals(300000000, $metricsMap['cash_collected_period']);
        $this->assertEquals(30.0, $metricsMap['average_physical_progress']);
        $this->assertEquals(15000000, $metricsMap['petty_cash_disbursed_period']);
        $this->assertEquals(35000000, $metricsMap['petty_cash_balance_total']);
        $this->assertEquals(1, $metricsMap['milestones_total_count']);
        $this->assertEquals(1, $metricsMap['milestones_completed_count']);

        $this->assertCount(1, $res['breakdowns']);
        $this->assertSame('Tower Bali Seluler', $res['breakdowns'][0]['entity_name']);
        $figures = $res['breakdowns'][0]['figures'];
        $this->assertEquals(1500000000, $figures['contract_value']);
        $this->assertEquals(1200000000, $figures['rab_total']);
        $this->assertEquals(850000000, $figures['rab_remaining']);
        $this->assertEquals(35000000, $figures['petty_balance']);
        $this->assertCount(1, $figures['milestones']);
        $this->assertSame('Pondasi', $figures['milestones'][0]['title']);
    }

    public function test_manager_project_can_submit_report_to_bod(): void
    {
        $project = Project::create([
            'name' => 'Renovasi Kantor Denpasar',
            'contract_value' => 500000000,
            'status' => 'in_progress',
        ]);

        $submitRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson('/api/v1/projects/reports/submit', [
                'period_start' => '2026-10-01',
                'period_end' => '2026-10-31',
            ])
            ->assertStatus(201)
            ->json('data');

        $reportId = $submitRes['id'];
        $this->assertSame('SUBMITTED', $submitRes['status']);
        $this->assertNotNull($submitRes['submitted_at']);

        // BOD reads list of reports
        $bodList = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/reports?division=PROJECT')
            ->assertOk()
            ->json('data.data');

        $this->assertNotEmpty($bodList);
        $this->assertSame($reportId, $bodList[0]['id']);

        // BOD acknowledges the report
        $ackRes = $this->authenticated('bod1@dashboard.test')
            ->postJson("/api/v1/bod/reports/{$reportId}/acknowledge")
            ->assertOk()
            ->json('data');

        $this->assertSame('ACKNOWLEDGED', $ackRes['status']);
        $this->assertNotNull($ackRes['acknowledged_at']);

        // BOD Overview endpoint reflects submitted report
        $overview = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/overview?from=2026-10-01&to=2026-10-31')
            ->assertOk()
            ->json('data');

        $projectOverview = collect($overview)->firstWhere('divisionCode', 'PROJECT');
        $this->assertNotNull($projectOverview);
        $this->assertSame('verified', $projectOverview['dataStatus']);
        $this->assertEquals(500000000, $projectOverview['revenue']['gross']);
    }

    public function test_admin_project_auto_saves_pending_and_manager_reviews(): void
    {
        Project::create([
            'name' => 'Gardu Distribusi Ubud',
            'contract_value' => 750000000,
            'status' => 'in_progress',
        ]);

        // 1. Admin project previews/syncs data -> automatically creates PENDING report
        $adminPreview = $this->authenticated('admin.project@dashboard.test')
            ->getJson('/api/v1/projects/reports/preview?period_start=2026-10-01&period_end=2026-10-31')
            ->assertOk()
            ->json('data');

        $reportId = $adminPreview['id'];
        $this->assertSame('PENDING', $adminPreview['status']);
        $this->assertFalse($adminPreview['is_already_submitted']);

        // 2. Admin project cannot approve or return reports (Segregation of Duties)
        $this->authenticated('admin.project@dashboard.test')
            ->postJson("/api/v1/projects/reports/{$reportId}/approve")
            ->assertStatus(403);

        $this->authenticated('admin.project@dashboard.test')
            ->postJson("/api/v1/projects/reports/{$reportId}/return", [
                'notes' => 'Perbaiki angka',
            ])
            ->assertStatus(403);

        // 3. BOD does NOT see PENDING reports in their dashboard
        $bodReports = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/reports?division=PROJECT')
            ->assertOk()
            ->json('data.data');
        $this->assertEmpty($bodReports);

        // 4. Manager project reviews and returns report with notes
        $returnRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/reports/{$reportId}/return", [
                'notes' => 'Tolong periksa kembali realisasi biaya material',
            ])
            ->assertOk()
            ->json('data');

        $this->assertSame('REVISION', $returnRes['status']);
        $this->assertSame('Tolong periksa kembali realisasi biaya material', $returnRes['notes']);
        $this->assertNotNull($returnRes['reviewed_at']);

        // 5. Admin project refreshes data -> status automatically re-pending for manager review
        $adminRePreview = $this->authenticated('admin.project@dashboard.test')
            ->getJson('/api/v1/projects/reports/preview?period_start=2026-10-01&period_end=2026-10-31')
            ->assertOk()
            ->json('data');
        $this->assertSame('PENDING', $adminRePreview['status']);

        // 6. Manager project approves report -> status becomes SUBMITTED
        $approveRes = $this->authenticated('manager.project@dashboard.test')
            ->postJson("/api/v1/projects/reports/{$reportId}/approve")
            ->assertOk()
            ->json('data');

        $this->assertSame('SUBMITTED', $approveRes['status']);
        $this->assertNotNull($approveRes['reviewed_at']);

        // 7. BOD now sees the approved report in their dashboard
        $bodReportsAfter = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/reports?division=PROJECT')
            ->assertOk()
            ->json('data.data');
        $this->assertCount(1, $bodReportsAfter);
        $this->assertSame($reportId, $bodReportsAfter[0]['id']);
    }

    public function test_unauthorized_division_cannot_submit_project_report(): void
    {
        $this->authenticated('manager.cell@dashboard.test')
            ->postJson('/api/v1/projects/reports/submit', [
                'period_start' => '2026-10-01',
                'period_end' => '2026-10-31',
            ])
            ->assertStatus(403);
    }
}
