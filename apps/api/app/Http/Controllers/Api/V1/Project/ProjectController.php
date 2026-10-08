<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMilestone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => 'nullable|in:planning,in_progress,on_hold,completed',
            'classification' => 'nullable|in:new,maintenance',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);
        $query = Project::query();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['classification'])) {
            $query->where('classification', $filters['classification']);
        }

        if (! empty($filters['search'])) {
            $query->whereLike('name', '%'.$filters['search'].'%');
        }

        $projects = $query->with(['milestones', 'rabs'])->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 15);

        foreach ($projects->items() as $project) {
            if ($project->milestones->isEmpty()) {
                $this->ensureStandardMilestones($project);
                $project->load('milestones');
            }
        }

        return response()->json($projects);
    }

    public function show($id)
    {
        $project = Project::with(['milestones', 'rabs', 'documents.uploader'])->findOrFail($id);

        return response()->json($project);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_code' => 'nullable|string|max:100',
            'client_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'contract_value' => 'numeric|min:0|max:9999999999999.99|decimal:0,2',
            'classification' => 'nullable|in:new,maintenance',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $validated['division_code'] = 'PROJECT';
        if (empty($validated['classification'])) {
            $validated['classification'] = 'new';
        }
        $this->validateDates($validated);
        $project = Project::create($validated);
        $this->ensureStandardMilestones($project);
        $project->load(['milestones', 'rabs']);

        return response()->json($project, 201);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Proyek berhasil dihapus']);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'project_code' => 'nullable|string|max:100',
            'client_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'contract_value' => 'numeric|min:0|max:9999999999999.99|decimal:0,2',
            'classification' => 'nullable|in:new,maintenance',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $this->validateDates([
            'start_date' => array_key_exists('start_date', $validated) ? $validated['start_date'] : $project->start_date,
            'end_date' => array_key_exists('end_date', $validated) ? $validated['end_date'] : $project->end_date,
        ]);
        $project->update($validated);

        return response()->json($project);
    }

    public function paymentToggle(Request $request, $id)
    {
        Project::findOrFail($id);
        $request->validate([
            'milestone_id' => 'required|exists:project_milestones,id',
            'payment_status' => 'required|boolean',
        ]);

        $milestone = ProjectMilestone::where('project_id', $id)->findOrFail($request->milestone_id);
        $milestone->payment_status = $request->payment_status;
        $milestone->save();

        return response()->json($milestone);
    }

    public function storeMilestone(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'weight_percentage' => 'required|numeric|min:0|max:100',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $milestone = $project->milestones()->create([
            'title' => $validated['title'],
            'weight_percentage' => $validated['weight_percentage'],
            'status' => 'pending',
            'payment_status' => false,
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($milestone, 201);
    }

    public function updateMilestone(Request $request, $projectId, $milestoneId)
    {
        $project = Project::findOrFail($projectId);
        $milestone = ProjectMilestone::where('project_id', $projectId)->findOrFail($milestoneId);

        $validated = $request->validate([
            'status' => 'nullable|in:pending,in_progress,completed',
            'notes' => 'nullable|string|max:500',
            'completion_date' => 'nullable|date',
            'actual_percentage' => 'nullable|numeric|min:0|max:100',
            'payment_status' => 'nullable|boolean',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed' && empty($validated['completion_date'])) {
            $validated['completion_date'] = now()->toDateString();
        }

        $milestone->update($validated);

        // Sync project overall status if appropriate
        $allCompleted = $project->milestones()->where('status', '!=', 'completed')->count() === 0;
        if ($allCompleted && $project->status !== 'completed') {
            $project->update(['status' => 'completed']);
        } elseif (! $allCompleted && $milestone->status === 'in_progress' && $project->status === 'planning') {
            $project->update(['status' => 'in_progress']);
        }

        return response()->json($milestone->fresh());
    }

    public function syncStandardMilestones($id)
    {
        $project = Project::findOrFail($id);
        $this->ensureStandardMilestones($project);

        return response()->json($project->milestones()->get());
    }

    private function ensureStandardMilestones(Project $project): void
    {
        if ($project->milestones()->count() === 0) {
            $defaultStages = [
                ['title' => '1. SURVEI', 'weight_percentage' => 20, 'status' => 'pending', 'notes' => 'Survei lokasi'],
                ['title' => '2. IZIN KERJA', 'weight_percentage' => 20, 'status' => 'pending', 'notes' => 'Izin kerja & K3'],
                ['title' => '3. RAB', 'weight_percentage' => 20, 'status' => 'pending', 'notes' => 'Penyusunan RAB'],
                ['title' => '4. PAYMENT', 'weight_percentage' => 20, 'status' => 'pending', 'notes' => '-'],
                ['title' => '5. EXECUTION', 'weight_percentage' => 20, 'status' => 'pending', 'notes' => '-'],
            ];
            foreach ($defaultStages as $stage) {
                $project->milestones()->create($stage);
            }
        }
    }

    public function financialSummary($id)
    {
        $project = Project::with(['rabs.expenses', 'expenses', 'invoices'])->findOrFail($id);

        $contractValue = (float) $project->contract_value;
        $totalRabBudget = (float) $project->rabs->sum('total_price');
        $totalActualExpense = (float) $project->expenses->sum('amount');
        $budgetVariance = $totalRabBudget - $totalActualExpense;
        $budgetAbsorptionPct = $totalRabBudget > 0 ? round(($totalActualExpense / $totalRabBudget) * 100, 2) : 0;

        $realizedGrossProfit = $contractValue - $totalActualExpense;
        $realizedMarginPct = $contractValue > 0 ? round(($realizedGrossProfit / $contractValue) * 100, 2) : 0;

        $invoicedAmount = (float) $project->invoices->whereIn('status', ['invoiced', 'paid', 'overdue'])->sum('amount');
        $paidAmount = (float) $project->invoices->where('status', 'paid')->sum('amount');
        $outstandingReceivable = max(0, $invoicedAmount - $paidAmount);

        // Kategori RAB vs Aktual
        $categoryBreakdown = [];
        $rabByCategory = $project->rabs->groupBy('category');
        $expensesByCategory = $project->expenses->groupBy('category');

        $allCategories = $rabByCategory->keys()->merge($expensesByCategory->keys())->unique();

        foreach ($allCategories as $cat) {
            $budget = (float) ($rabByCategory->get($cat)?->sum('total_price') ?? 0);
            $actual = (float) ($expensesByCategory->get($cat)?->sum('amount') ?? 0);
            $categoryBreakdown[] = [
                'category' => $cat,
                'budget' => $budget,
                'actual' => $actual,
                'variance' => $budget - $actual,
                'absorption_percentage' => $budget > 0 ? round(($actual / $budget) * 100, 2) : 0,
                'is_over_budget' => $actual > $budget,
            ];
        }

        // Over-budget RAB items
        $overBudgetItems = [];
        foreach ($project->rabs as $rab) {
            $actualItem = (float) $rab->expenses->sum('amount');
            $budgetItem = (float) $rab->total_price;
            if ($actualItem > $budgetItem) {
                $overBudgetItems[] = [
                    'id' => $rab->id,
                    'item_name' => $rab->item_name,
                    'category' => $rab->category,
                    'budget' => $budgetItem,
                    'actual' => $actualItem,
                    'overrun' => $actualItem - $budgetItem,
                ];
            }
        }

        return response()->json([
            'contract_value' => $contractValue,
            'total_rab_budget' => $totalRabBudget,
            'total_actual_expense' => $totalActualExpense,
            'budget_variance' => $budgetVariance,
            'budget_absorption_percentage' => $budgetAbsorptionPct,
            'realized_gross_profit' => $realizedGrossProfit,
            'realized_margin_percentage' => $realizedMarginPct,
            'invoiced_amount' => $invoicedAmount,
            'paid_amount' => $paidAmount,
            'outstanding_receivable' => $outstandingReceivable,
            'category_breakdown' => $categoryBreakdown,
            'over_budget_items' => $overBudgetItems,
        ]);
    }

    private function validateDates(array $dates): void
    {
        if (! empty($dates['start_date']) && ! empty($dates['end_date'])) {
            Validator::make($dates, ['end_date' => 'after_or_equal:start_date'])->validate();
        }
    }
}
