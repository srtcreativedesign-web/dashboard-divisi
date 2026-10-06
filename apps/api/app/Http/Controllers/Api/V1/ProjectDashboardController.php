<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMilestone;
use Illuminate\Database\Eloquent\Builder;

class ProjectDashboardController extends Controller
{
    public function __invoke()
    {
        $projects = Project::query()->where('division_code', 'PROJECT');
        $active = (clone $projects)->where('status', 'in_progress');
        $asOf = now('Asia/Jakarta');
        $today = $asOf->toDateString();
        $overdue = fn (Builder $query) => $query->where('due_date', '<', $today)
            ->where('actual_percentage', '<', 100)->where('status', '!=', 'completed');
        $attention = (clone $active)->whereHas('milestones', $overdue);
        $statusCounts = (clone $projects)->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')->pluck('aggregate', 'status');

        $milestoneTotals = ProjectMilestone::query()->select('project_id')
            ->selectRaw('SUM(weight_percentage) as total_weight')
            ->selectRaw('SUM(weight_percentage * COALESCE(actual_percentage, 0) / 100) as progress')
            ->groupBy('project_id');
        $validProgress = (clone $active)->joinSub($milestoneTotals, 'milestone_totals', function ($join) {
            $join->on('projects.id', '=', 'milestone_totals.project_id');
        })->whereRaw('ABS(milestone_totals.total_weight - 100) < 0.0001');
        $covered = (clone $validProgress)->count();
        $trend = [];
        for ($offset = 5; $offset >= 0; $offset--) {
            $month = $asOf->copy()->startOfMonth()->subMonths($offset);
            $start = $month->copy()->utc();
            $end = $month->copy()->addMonth()->utc();
            $trend[] = [
                'month' => $month->format('Y-m'),
                'new_count' => (clone $projects)->where('created_at', '>=', $start)->where('created_at', '<', $end)->count(),
                'total_count' => (clone $projects)->where('created_at', '<', $end)->count(),
            ];
        }

        return response()->json([
            'as_of' => $asOf->toIso8601String(),
            'total_projects' => (clone $projects)->count(),
            'active_projects' => (clone $active)->count(),
            'active_contract_value' => (string) (clone $active)->sum('contract_value'),
            'average_recorded_progress' => $covered ? round((float) (clone $validProgress)->avg('milestone_totals.progress'), 2) : null,
            'progress_covered_projects' => $covered,
            'status_counts' => $statusCounts,
            'overdue_projects' => (clone $attention)->count(),
            'attention_projects' => $attention->withCount(['milestones as overdue_milestones_count' => $overdue])
                ->orderByDesc('overdue_milestones_count')->orderBy('projects.id')->limit(5)
                ->get(['projects.id', 'projects.name', 'projects.client_name']),
            'monthly_trend' => $trend,
        ]);
    }
}
