<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMilestone;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('name', 'ilike', '%'.$request->search.'%');
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($projects);
    }

    public function show($id)
    {
        $project = Project::with([
            'milestones.photos',
            'milestones.invoices',
            'milestones.progressLogs',
            'rabs.expenses',
            'documents.uploader',
            'photos.uploader',
            'photos.milestone',
            'expenses.vendor',
            'expenses.rab',
            'invoices.milestone',
        ])->findOrFail($id);

        return response()->json($project);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_code' => 'nullable|string|max:50|unique:projects,project_code',
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $validated['division_code'] = 'PROJECT';
        $project = Project::create($validated);

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'project_code' => 'nullable|string|max:50|unique:projects,project_code,'.$project->id,
            'name' => 'string|max:255',
            'client_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    public function paymentToggle(Request $request, $id)
    {
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
            'actual_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:pending,in_progress,review,completed',
            'due_date' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $milestone = $project->milestones()->create([
            'title' => $validated['title'],
            'weight_percentage' => $validated['weight_percentage'],
            'actual_percentage' => $validated['actual_percentage'] ?? 0,
            'status' => $validated['status'] ?? 'pending',
            'payment_status' => false,
            'due_date' => $validated['due_date'] ?? null,
            'completion_date' => $validated['completion_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($milestone, 201);
    }

    public function updateMilestone(Request $request, $id, $milestoneId)
    {
        $milestone = ProjectMilestone::where('project_id', $id)->findOrFail($milestoneId);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'weight_percentage' => 'sometimes|required|numeric|min:0|max:100',
            'actual_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'nullable|in:pending,in_progress,review,completed',
            'payment_status' => 'nullable|boolean',
            'due_date' => 'nullable|date',
            'completion_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $milestone->update($validated);

        return response()->json($milestone);
    }

    public function destroyMilestone($id, $milestoneId)
    {
        $milestone = ProjectMilestone::where('project_id', $id)->findOrFail($milestoneId);
        $milestone->delete();

        return response()->json(null, 204);
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
}
