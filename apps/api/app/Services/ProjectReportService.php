<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\BodDivisionReport;
use App\Models\BodReportBreakdown;
use App\Models\BodReportMetric;
use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\ProjectInvoice;
use App\Models\ProjectMilestone;
use App\Models\ProjectPettyCash;
use App\Models\ProjectRab;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ProjectReportService
{
    public function __construct(
        protected AuditService $audit,
        protected PolicyService $policy
    ) {}

    public function validatePeriod(string $periodStart, string $periodEnd): void
    {
        foreach ([$periodStart, $periodEnd] as $date) {
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
                || ! checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4))) {
                throw new ApiException('VALIDATION_ERROR', 'Format tanggal periode harus Y-m-d yang valid');
            }
        }

        if ($periodStart > $periodEnd) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal akhir tidak boleh mendahului tanggal awal');
        }
    }

    public function preview(string $periodStart, string $periodEnd, ?array $user = null): array
    {
        $this->validatePeriod($periodStart, $periodEnd);

        $projects = Project::with(['milestones', 'rabs', 'expenses', 'invoices', 'pettyCashes'])->get();

        $activeProjects = $projects->filter(fn ($p) => $p->status === 'in_progress');
        $completedProjects = $projects->filter(fn ($p) => $p->status === 'completed');
        $onHoldProjects = $projects->filter(fn ($p) => $p->status === 'on_hold');
        $planningProjects = $projects->filter(fn ($p) => $p->status === 'planning');

        $totalContractValue = (float) $projects->sum('contract_value');
        $totalRab = (float) ProjectRab::sum('total_price');

        $periodExpenses = (float) ProjectExpense::whereBetween('expense_date', [$periodStart, $periodEnd])->sum('amount');
        $cumulativeExpenses = (float) ProjectExpense::sum('amount');

        $remainingRab = max(0, $totalRab - $cumulativeExpenses);
        $rabAbsorption = $totalRab > 0 ? round(($cumulativeExpenses / $totalRab) * 100, 1) : 0.0;

        // Petty Cash metrics
        $periodPettyIn = (float) ProjectPettyCash::where('type', 'in')
            ->whereBetween('transaction_date', [$periodStart, $periodEnd])
            ->sum('amount');
        $periodPettyOut = (float) ProjectPettyCash::where('type', 'out')
            ->whereBetween('transaction_date', [$periodStart, $periodEnd])
            ->sum('amount');
        $cumulativePettyIn = (float) ProjectPettyCash::where('type', 'in')->sum('amount');
        $cumulativePettyOut = (float) ProjectPettyCash::where('type', 'out')->sum('amount');
        $pettyCashBalance = $cumulativePettyIn - $cumulativePettyOut;

        // Milestone metrics
        $totalMilestones = ProjectMilestone::count();
        $completedMilestones = ProjectMilestone::where('status', 'completed')->count();
        $inProgressMilestones = ProjectMilestone::where('status', 'in_progress')->count();

        $periodInvoiced = (float) ProjectInvoice::where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [$periodStart.' 00:00:00', $periodEnd.' 23:59:59'])
            ->sum('amount');

        $periodPaid = (float) ProjectInvoice::where('status', 'paid')
            ->whereBetween('paid_date', [$periodStart, $periodEnd])
            ->sum('amount');

        $outstandingReceivables = (float) ProjectInvoice::whereIn('status', ['invoiced', 'overdue'])->sum('amount');

        // Physical progress: average across active projects with milestones
        $progressList = [];
        foreach ($activeProjects as $p) {
            if ($p->milestones->isNotEmpty()) {
                $avg = $p->milestones->avg('actual_percentage');
                if ($avg !== null) {
                    $progressList[] = (float) $avg;
                }
            }
        }
        $avgProgress = ! empty($progressList) ? round(array_sum($progressList) / count($progressList), 2) : 0.0;

        $metrics = [
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'contract_value_total',
                'metric_label' => 'Total Nilai Kontrak',
                'metric_value' => $totalContractValue,
                'unit' => 'IDR',
                'display_order' => 1,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'total_budget_rab',
                'metric_label' => 'Total Anggaran RAB',
                'metric_value' => $totalRab,
                'unit' => 'IDR',
                'display_order' => 2,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'remaining_budget_rab',
                'metric_label' => 'Sisa Anggaran RAB',
                'metric_value' => $remainingRab,
                'unit' => 'IDR',
                'display_order' => 3,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'budget_absorption_pct',
                'metric_label' => 'Penyerapan Anggaran RAB',
                'metric_value' => $rabAbsorption,
                'unit' => 'PERCENT',
                'display_order' => 4,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'actual_expenses_period',
                'metric_label' => 'Biaya Aktual (Periode)',
                'metric_value' => $periodExpenses,
                'unit' => 'IDR',
                'display_order' => 5,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'actual_expenses_cumulative',
                'metric_label' => 'Biaya Aktual (Kumulatif)',
                'metric_value' => $cumulativeExpenses,
                'unit' => 'IDR',
                'display_order' => 6,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'invoiced_period',
                'metric_label' => 'Tagihan Diterbitkan (Invoice)',
                'metric_value' => $periodInvoiced,
                'unit' => 'IDR',
                'display_order' => 7,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'cash_collected_period',
                'metric_label' => 'Pembayaran Masuk (Cash In)',
                'metric_value' => $periodPaid,
                'unit' => 'IDR',
                'display_order' => 8,
            ],
            [
                'category' => 'FINANCIAL',
                'metric_key' => 'outstanding_receivables',
                'metric_label' => 'Sisa Piutang Berjalan',
                'metric_value' => $outstandingReceivables,
                'unit' => 'IDR',
                'display_order' => 9,
            ],
            [
                'category' => 'PETTY_CASH',
                'metric_key' => 'petty_cash_disbursed_period',
                'metric_label' => 'Kas Kecil Terpakai (Periode)',
                'metric_value' => $periodPettyOut,
                'unit' => 'IDR',
                'display_order' => 10,
            ],
            [
                'category' => 'PETTY_CASH',
                'metric_key' => 'petty_cash_topup_period',
                'metric_label' => 'Kas Kecil Masuk (Periode)',
                'metric_value' => $periodPettyIn,
                'unit' => 'IDR',
                'display_order' => 11,
            ],
            [
                'category' => 'PETTY_CASH',
                'metric_key' => 'petty_cash_balance_total',
                'metric_label' => 'Saldo Kas Kecil Lapangan',
                'metric_value' => $pettyCashBalance,
                'unit' => 'IDR',
                'display_order' => 12,
            ],
            [
                'category' => 'PROGRESS',
                'metric_key' => 'average_physical_progress',
                'metric_label' => 'Rata-rata Progres Fisik',
                'metric_value' => $avgProgress,
                'unit' => 'PERCENT',
                'display_order' => 13,
            ],
            [
                'category' => 'MILESTONE',
                'metric_key' => 'milestones_total_count',
                'metric_label' => 'Total Milestone Proyek',
                'metric_value' => $totalMilestones,
                'unit' => 'COUNT',
                'display_order' => 14,
            ],
            [
                'category' => 'MILESTONE',
                'metric_key' => 'milestones_completed_count',
                'metric_label' => 'Milestone Selesai',
                'metric_value' => $completedMilestones,
                'unit' => 'COUNT',
                'display_order' => 15,
            ],
            [
                'category' => 'MILESTONE',
                'metric_key' => 'milestones_in_progress_count',
                'metric_label' => 'Milestone Berjalan',
                'metric_value' => $inProgressMilestones,
                'unit' => 'COUNT',
                'display_order' => 16,
            ],
            [
                'category' => 'VOLUME',
                'metric_key' => 'active_projects_count',
                'metric_label' => 'Jumlah Proyek Berjalan',
                'metric_value' => $activeProjects->count(),
                'unit' => 'COUNT',
                'display_order' => 17,
            ],
            [
                'category' => 'VOLUME',
                'metric_key' => 'completed_projects_count',
                'metric_label' => 'Jumlah Proyek Selesai',
                'metric_value' => $completedProjects->count(),
                'unit' => 'COUNT',
                'display_order' => 18,
            ],
            [
                'category' => 'VOLUME',
                'metric_key' => 'on_hold_projects_count',
                'metric_label' => 'Jumlah Proyek Tertunda',
                'metric_value' => $onHoldProjects->count(),
                'unit' => 'COUNT',
                'display_order' => 19,
            ],
        ];

        $breakdowns = [];
        $order = 1;
        foreach ($projects as $project) {
            $pExpenses = (float) $project->expenses->sum('amount');
            $pInvoiced = (float) $project->invoices->where('status', '!=', 'cancelled')->sum('amount');
            $pPaid = (float) $project->invoices->where('status', 'paid')->sum('amount');
            $pProgress = $project->status === 'completed'
                ? 100.0
                : ($project->milestones->isNotEmpty() ? (float) round($project->milestones->avg('actual_percentage') ?? 0, 1) : 0.0);

            $pRabTotal = (float) $project->rabs->sum('total_price');
            $pRabRemaining = max(0, $pRabTotal - $pExpenses);
            $pRabAbsorption = $pRabTotal > 0 ? round(($pExpenses / $pRabTotal) * 100, 1) : 0.0;

            $pRabCategories = $project->rabs->groupBy('category')->map(function ($items, $cat) {
                return [
                    'category' => (string) $cat,
                    'budget' => (float) $items->sum('total_price'),
                ];
            })->values()->all();

            $pPettyIn = (float) $project->pettyCashes->where('type', 'in')->sum('amount');
            $pPettyOut = (float) $project->pettyCashes->where('type', 'out')->sum('amount');
            $pPettyBalance = $pPettyIn - $pPettyOut;

            $pMilestonesTotal = $project->milestones->count();
            $pMilestonesCompleted = $project->milestones->where('status', 'completed')->count();
            $formatDate = function ($val) {
                if (! $val) return null;
                if ($val instanceof \DateTimeInterface) return $val->format('Y-m-d');
                if (is_string($val)) return substr($val, 0, 10);
                return null;
            };

            $pMilestones = $project->milestones->map(function ($m) use ($project, $formatDate) {
                return [
                    'title' => $m->title,
                    'weight' => (float) $m->weight_percentage,
                    'actual' => (float) $m->actual_percentage,
                    'status' => $m->status,
                    'start_date' => $formatDate($m->start_date) ?? $formatDate($project->start_date),
                    'due_date' => $formatDate($m->due_date) ?? $formatDate($project->end_date),
                    'completion_date' => $formatDate($m->completion_date),
                ];
            })->values()->all();

            $breakdowns[] = [
                'entity_code' => $project->project_code ?? ('PRJ-'.str_pad((string) $project->id, 3, '0', STR_PAD_LEFT)),
                'entity_name' => $project->name,
                'figures' => [
                    'contract_value' => (float) $project->contract_value,
                    'actual_expense' => $pExpenses,
                    'invoiced' => $pInvoiced,
                    'paid' => $pPaid,
                    'progress_pct' => $pProgress,
                    'status' => $project->status,
                    // RAB
                    'rab_total' => $pRabTotal,
                    'rab_remaining' => $pRabRemaining,
                    'rab_absorption' => $pRabAbsorption,
                    'rab_categories' => $pRabCategories,
                    // Petty Cash
                    'petty_in' => $pPettyIn,
                    'petty_out' => $pPettyOut,
                    'petty_balance' => $pPettyBalance,
                    // Milestones
                    'milestones_total' => $pMilestonesTotal,
                    'milestones_completed' => $pMilestonesCompleted,
                    'milestones' => $pMilestones,
                ],
                'display_order' => $order++,
            ];
        }

        $existing = BodDivisionReport::with('reviewer')
            ->where('division_code', 'PROJECT')
            ->where('period_start', $periodStart)
            ->where('period_end', $periodEnd)
            ->first();

        $userId = $user ? ($user['sub'] ?? $user['id'] ?? null) : null;

        // Otomatisasi pengajuan draft PENDING:
        // Jika belum ada atau statusnya PENDING/REVISION, simpan agregasi terbaru sebagai pengajuan PENDING
        if (! $existing) {
            $report = DB::transaction(function () use ($userId, $periodStart, $periodEnd, $metrics, $breakdowns) {
                $created = BodDivisionReport::create([
                    'division_code' => 'PROJECT',
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'status' => 'PENDING',
                    'submitted_by' => $userId,
                    'submitted_at' => CarbonImmutable::now('Asia/Jakarta'),
                ]);

                foreach ($metrics as $m) {
                    BodReportMetric::create([
                        'report_id' => $created->id,
                        'category' => $m['category'],
                        'metric_key' => $m['metric_key'],
                        'metric_label' => $m['metric_label'],
                        'metric_value' => $m['metric_value'],
                        'unit' => $m['unit'],
                        'display_order' => $m['display_order'],
                    ]);
                }

                foreach ($breakdowns as $b) {
                    BodReportBreakdown::create([
                        'report_id' => $created->id,
                        'entity_code' => $b['entity_code'],
                        'entity_name' => $b['entity_name'],
                        'figures' => $b['figures'],
                        'display_order' => $b['display_order'],
                    ]);
                }

                return $created;
            });
            $existing = $report->load('reviewer');
        } elseif (in_array($existing->status, ['PENDING', 'REVISION'])) {
            // Update data angka terbaru dan reset status ke PENDING (otomatis diajukan kembali)
            DB::transaction(function () use ($existing, $userId, $metrics, $breakdowns) {
                $existing->update([
                    'status' => 'PENDING',
                    'submitted_by' => $userId ?? $existing->submitted_by,
                    'submitted_at' => CarbonImmutable::now('Asia/Jakarta'),
                ]);

                BodReportMetric::where('report_id', $existing->id)->delete();
                foreach ($metrics as $m) {
                    BodReportMetric::create([
                        'report_id' => $existing->id,
                        'category' => $m['category'],
                        'metric_key' => $m['metric_key'],
                        'metric_label' => $m['metric_label'],
                        'metric_value' => $m['metric_value'],
                        'unit' => $m['unit'],
                        'display_order' => $m['display_order'],
                    ]);
                }

                BodReportBreakdown::where('report_id', $existing->id)->delete();
                foreach ($breakdowns as $b) {
                    BodReportBreakdown::create([
                        'report_id' => $existing->id,
                        'entity_code' => $b['entity_code'],
                        'entity_name' => $b['entity_name'],
                        'figures' => $b['figures'],
                        'display_order' => $b['display_order'],
                    ]);
                }
            });
            $existing->refresh()->load('reviewer');
        }

        return [
            'id' => $existing->id,
            'division_code' => 'PROJECT',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'is_already_submitted' => in_array($existing->status, ['SUBMITTED', 'ACKNOWLEDGED']),
            'status' => $existing->status,
            'submitted_at' => $existing->submitted_at?->toIso8601String(),
            'reviewed_at' => $existing->reviewed_at?->toIso8601String(),
            'reviewed_by' => $existing->reviewed_by,
            'reviewer_name' => $existing->reviewer?->name,
            'acknowledged_at' => $existing->acknowledged_at?->toIso8601String(),
            'notes' => $existing->notes,
            'metrics' => $metrics,
            'breakdowns' => $breakdowns,
        ];
    }

    public function approveReport(array $user, string $reportId): BodDivisionReport
    {
        $role = $user['role'] ?? '';
        $division = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $userId = $user['sub'] ?? $user['id'] ?? null;
        $isBod = $role === 'BOD';
        $isProjectManager = $role === 'MANAGER' && $division === 'PROJECT';

        if (! $isBod && ! $isProjectManager) {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Manajer Divisi Project atau BOD yang berwenang menyetujui laporan');
        }

        $report = BodDivisionReport::findOrFail($reportId);
        $report->update([
            'status' => 'SUBMITTED',
            'reviewed_by' => $userId,
            'reviewed_at' => CarbonImmutable::now('Asia/Jakarta'),
            'submitted_at' => CarbonImmutable::now('Asia/Jakarta'),
        ]);

        $this->audit->log([
            'actor_id' => $userId,
            'actor_email' => $user['email'] ?? null,
            'actor_role' => $user['role'] ?? null,
            'action' => 'bod_report.approved',
            'entity' => 'bod_division_reports',
            'entity_id' => $report->id,
            'division_code' => $report->division_code,
            'metadata' => [
                'division' => $report->division_code,
                'status' => 'SUBMITTED',
            ],
        ]);

        return $report->load(['metrics', 'breakdowns', 'submitter', 'reviewer', 'acknowledger']);
    }

    public function returnReport(array $user, string $reportId, string $notes): BodDivisionReport
    {
        $role = $user['role'] ?? '';
        $division = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $userId = $user['sub'] ?? $user['id'] ?? null;
        $isBod = $role === 'BOD';
        $isProjectManager = $role === 'MANAGER' && $division === 'PROJECT';

        if (! $isBod && ! $isProjectManager) {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Manajer Divisi Project atau BOD yang berwenang mengembalikan laporan');
        }

        $notes = trim($notes);
        if ($notes === '') {
            throw new ApiException('VALIDATION_ERROR', 'Catatan alasan pengembalian wajib diisi');
        }

        $report = BodDivisionReport::findOrFail($reportId);
        $report->update([
            'status' => 'REVISION',
            'reviewed_by' => $userId,
            'reviewed_at' => CarbonImmutable::now('Asia/Jakarta'),
            'notes' => $notes,
        ]);

        $this->audit->log([
            'actor_id' => $userId,
            'actor_email' => $user['email'] ?? null,
            'actor_role' => $user['role'] ?? null,
            'action' => 'bod_report.returned',
            'entity' => 'bod_division_reports',
            'entity_id' => $report->id,
            'division_code' => $report->division_code,
            'metadata' => [
                'division' => $report->division_code,
                'status' => 'REVISION',
                'notes' => $notes,
            ],
        ]);

        return $report->load(['metrics', 'breakdowns', 'submitter', 'reviewer', 'acknowledger']);
    }

    public function submit(array $user, string $periodStart, string $periodEnd, array $payload = []): BodDivisionReport
    {
        $role = $user['role'] ?? '';
        $division = $user['divisionCode'] ?? $user['division_code'] ?? null;
        $userId = $user['sub'] ?? $user['id'] ?? null;

        $isBod = $role === 'BOD';
        $isProjectManager = $role === 'MANAGER' && $division === 'PROJECT';
        $hasCap = $this->policy->hasCapability($user, 'manage:projects', 'PROJECT');

        if (! $isBod && ! $isProjectManager && ! $hasCap) {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'Akses ditolak untuk mengirimkan laporan ke BOD');
        }

        $targetStatus = ($isBod || $isProjectManager) ? 'SUBMITTED' : 'PENDING';
        $preview = $this->preview($periodStart, $periodEnd, $user);

        $metricsData = ! empty($payload['metrics']) ? $payload['metrics'] : $preview['metrics'];
        $breakdownsData = ! empty($payload['breakdowns']) ? $payload['breakdowns'] : $preview['breakdowns'];

        return DB::transaction(function () use ($user, $userId, $periodStart, $periodEnd, $targetStatus, $metricsData, $breakdownsData) {
            $report = BodDivisionReport::updateOrCreate(
                [
                    'division_code' => 'PROJECT',
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                ],
                [
                    'status' => $targetStatus,
                    'submitted_by' => $userId,
                    'submitted_at' => CarbonImmutable::now('Asia/Jakarta'),
                ]
            );

            // Re-sync metrics
            BodReportMetric::where('report_id', $report->id)->delete();
            foreach ($metricsData as $m) {
                BodReportMetric::create([
                    'report_id' => $report->id,
                    'category' => $m['category'] ?? 'FINANCIAL',
                    'metric_key' => $m['metric_key'],
                    'metric_label' => $m['metric_label'] ?? $m['metric_key'],
                    'metric_value' => $m['metric_value'] ?? 0,
                    'unit' => $m['unit'] ?? 'IDR',
                    'display_order' => $m['display_order'] ?? 0,
                ]);
            }

            // Re-sync breakdowns
            BodReportBreakdown::where('report_id', $report->id)->delete();
            foreach ($breakdownsData as $b) {
                BodReportBreakdown::create([
                    'report_id' => $report->id,
                    'entity_code' => $b['entity_code'],
                    'entity_name' => $b['entity_name'],
                    'figures' => $b['figures'] ?? [],
                    'display_order' => $b['display_order'] ?? 0,
                ]);
            }

            $this->audit->log([
                'actor_id' => $userId,
                'actor_email' => $user['email'] ?? null,
                'actor_role' => $user['role'] ?? null,
                'action' => $targetStatus === 'SUBMITTED' ? 'bod_report.submitted' : 'bod_report.pending_saved',
                'entity' => 'bod_division_reports',
                'entity_id' => $report->id,
                'division_code' => 'PROJECT',
                'metadata' => [
                    'division' => 'PROJECT',
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'status' => $targetStatus,
                    'metric_count' => count($metricsData),
                    'breakdown_count' => count($breakdownsData),
                ],
            ]);

            return $report->load(['metrics', 'breakdowns', 'submitter', 'reviewer']);
        });
    }

    public function acknowledge(array $user, string $reportId): BodDivisionReport
    {
        if (($user['role'] ?? '') !== 'BOD') {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Dewan Direksi (BOD) yang dapat menyetujui/menandai laporan diterima');
        }

        $userId = $user['sub'] ?? $user['id'] ?? null;
        $report = BodDivisionReport::findOrFail($reportId);
        $report->update([
            'status' => 'ACKNOWLEDGED',
            'acknowledged_by' => $userId,
            'acknowledged_at' => CarbonImmutable::now('Asia/Jakarta'),
        ]);

        $this->audit->log([
            'actor_id' => $userId,
            'actor_email' => $user['email'] ?? null,
            'actor_role' => $user['role'] ?? null,
            'action' => 'bod_report.acknowledged',
            'entity' => 'bod_division_reports',
            'entity_id' => $report->id,
            'division_code' => $report->division_code,
            'metadata' => [
                'division' => $report->division_code,
                'status' => 'ACKNOWLEDGED',
            ],
        ]);

        return $report->load(['metrics', 'breakdowns', 'submitter', 'acknowledger']);
    }
}
