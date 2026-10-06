<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectExpenseController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $query = $project->expenses()->with(['rab', 'vendor', 'creator']);

        if ($request->has('category') && $request->category !== '') {
            $query->where('category', $request->category);
        }

        if ($request->has('project_rab_id') && $request->project_rab_id !== '') {
            $query->where('project_rab_id', $request->project_rab_id);
        }

        if ($request->has('project_vendor_id') && $request->project_vendor_id !== '') {
            $query->where('project_vendor_id', $request->project_vendor_id);
        }

        if ($request->has('start_date') && $request->start_date !== '') {
            $query->where('expense_date', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date !== '') {
            $query->where('expense_date', '<=', $request->end_date);
        }

        if ($request->has('search') && $request->search !== '') {
            $query->where('item_name', 'like', '%'.$request->search.'%');
        }

        $expenses = $query->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->get();

        return response()->json($expenses);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'project_rab_id' => 'nullable|exists:project_rabs,id',
            'project_vendor_id' => 'nullable|exists:project_vendors,id',
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,pdf,webp|max:10240',
            'notes' => 'nullable|string',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('project_expenses/'.$projectId, 'public');
        }

        $user = $request->attributes->get('user');
        $userId = is_array($user) ? ($user['id'] ?? $user['sub'] ?? null) : ($request->user()?->id ?? null);

        $expense = $project->expenses()->create([
            'project_rab_id' => $request->project_rab_id,
            'project_vendor_id' => $request->project_vendor_id,
            'item_name' => $request->item_name,
            'category' => $request->category,
            'amount' => $request->amount,
            'expense_date' => $request->expense_date,
            'receipt_path' => $receiptPath,
            'notes' => $request->notes,
            'created_by' => $userId,
        ]);

        return response()->json($expense->load(['rab', 'vendor', 'creator']), 201);
    }

    public function update(Request $request, $projectId, $expenseId)
    {
        $expense = ProjectExpense::where('project_id', $projectId)->findOrFail($expenseId);

        $request->validate([
            'item_name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'project_rab_id' => 'nullable|exists:project_rabs,id',
            'project_vendor_id' => 'nullable|exists:project_vendors,id',
            'receipt' => 'nullable|file|mimes:jpeg,png,jpg,pdf,webp|max:10240',
            'notes' => 'nullable|string',
        ]);

        $data = $request->only([
            'item_name',
            'category',
            'amount',
            'expense_date',
            'project_rab_id',
            'project_vendor_id',
            'notes',
        ]);

        if ($request->hasFile('receipt')) {
            if ($expense->receipt_path && Storage::disk('public')->exists($expense->receipt_path)) {
                Storage::disk('public')->delete($expense->receipt_path);
            }
            $data['receipt_path'] = $request->file('receipt')->store('project_expenses/'.$projectId, 'public');
        }

        $expense->update($data);

        return response()->json($expense->load(['rab', 'vendor', 'creator']));
    }

    public function destroy($projectId, $expenseId)
    {
        $expense = ProjectExpense::where('project_id', $projectId)->findOrFail($expenseId);

        if ($expense->receipt_path && Storage::disk('public')->exists($expense->receipt_path)) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        $expense->delete();

        return response()->json(['message' => 'Biaya pengeluaran berhasil dihapus']);
    }
}
