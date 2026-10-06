<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectReportController extends Controller
{
    /**
     * Generate comprehensive periodic progress report data.
     */
    public function progressReport(Request $request, $projectId)
    {
        $project = Project::with([
            'milestones' => function ($q) {
                $q->orderBy('id', 'asc');
            },
            'rabs.expenses',
            'expenses',
            'invoices',
            'photos' => function ($q) {
                $q->orderBy('taken_at', 'desc')->take(10);
            },
        ])->findOrFail($projectId);

        // Physical Progress Calculation (Weighted)
        $totalWeight = (float) $project->milestones->sum('weight_percentage');
        $plannedProgress = 0.0;
        $actualProgress = 0.0;

        $milestonesSummary = $project->milestones->map(function ($ms) use (&$actualProgress) {
            $weight = (float) $ms->weight_percentage;
            $actual = (float) ($ms->actual_percentage ?? 0);
            $contribution = ($actual / 100) * $weight;
            $actualProgress += $contribution;

            return [
                'id' => $ms->id,
                'title' => $ms->title,
                'weight_percentage' => $weight,
                'actual_percentage' => $actual,
                'contribution' => round($contribution, 2),
                'status' => $ms->status,
                'due_date' => $ms->due_date,
                'completion_date' => $ms->completion_date,
                'payment_status' => (bool) $ms->payment_status,
                'notes' => $ms->notes,
            ];
        });

        // Financial summary
        $contractValue = (float) $project->contract_value;
        $totalRab = (float) $project->rabs->sum('total_price');
        $totalExpense = (float) $project->expenses->sum('amount');
        $invoicedAmount = (float) $project->invoices->whereIn('status', ['invoiced', 'paid', 'overdue'])->sum('amount');
        $paidAmount = (float) $project->invoices->where('status', 'paid')->sum('amount');

        return response()->json([
            'report_title' => 'Laporan Kemajuan Proyek (Progress Report)',
            'generated_at' => now()->toDateTimeString(),
            'project' => [
                'id' => $project->id,
                'project_code' => $project->project_code,
                'name' => $project->name,
                'client_name' => $project->client_name,
                'location' => $project->location,
                'status' => $project->status,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
                'description' => $project->description,
            ],
            'physical_progress' => [
                'total_weight' => $totalWeight,
                'actual_percentage' => round($actualProgress, 2),
                'milestones' => $milestonesSummary,
            ],
            'financial_progress' => [
                'contract_value' => $contractValue,
                'total_rab_budget' => $totalRab,
                'total_actual_expense' => $totalExpense,
                'budget_variance' => $totalRab - $totalExpense,
                'absorption_percentage' => $totalRab > 0 ? round(($totalExpense / $totalRab) * 100, 2) : 0,
                'invoiced_amount' => $invoicedAmount,
                'paid_amount' => $paidAmount,
                'outstanding_receivable' => max(0, $invoicedAmount - $paidAmount),
            ],
            'recent_photos' => $project->photos,
        ]);
    }

    /**
     * Generate BAST (Handover Documentation) with Before-After visual comparison matrix.
     */
    public function bastReport(Request $request, $projectId)
    {
        $project = Project::with([
            'milestones',
            'photos',
            'invoices',
        ])->findOrFail($projectId);

        // Group photos by area_name
        $photosByArea = $project->photos->groupBy(function ($photo) {
            return $photo->area_name ?: 'Area Umum / Tanpa Kategori';
        });

        $comparisonMatrix = [];
        foreach ($photosByArea as $areaName => $photos) {
            $beforePhoto = $photos->where('stage', 'before')->sortByDesc('taken_at')->first();
            $inProgressPhoto = $photos->where('stage', 'in_progress')->sortByDesc('taken_at')->first();
            $afterPhoto = $photos->where('stage', 'after')->sortByDesc('taken_at')->first();

            $comparisonMatrix[] = [
                'area_name' => $areaName,
                'before' => $beforePhoto,
                'in_progress' => $inProgressPhoto,
                'after' => $afterPhoto,
                'total_photos' => $photos->count(),
            ];
        }

        // Determine handover eligibility (all milestones 100% or completed)
        $completedMilestones = $project->milestones->where('status', 'completed')->count();
        $totalMilestones = $project->milestones->count();
        $isEligibleForBast = $totalMilestones > 0 && ($completedMilestones === $totalMilestones);

        return response()->json([
            'document_title' => 'Lampiran Visual Berita Acara Serah Terima (BAST)',
            'generated_at' => now()->toDateTimeString(),
            'project' => [
                'id' => $project->id,
                'project_code' => $project->project_code,
                'name' => $project->name,
                'client_name' => $project->client_name,
                'location' => $project->location,
                'contract_value' => (float) $project->contract_value,
                'start_date' => $project->start_date,
                'end_date' => $project->end_date,
            ],
            'handover_summary' => [
                'total_milestones' => $totalMilestones,
                'completed_milestones' => $completedMilestones,
                'is_eligible' => $isEligibleForBast,
                'payment_cleared' => (bool) ($project->milestones->where('payment_status', false)->count() === 0),
            ],
            'visual_comparison' => $comparisonMatrix,
            'milestone_checklist' => $project->milestones,
        ]);
    }
}
