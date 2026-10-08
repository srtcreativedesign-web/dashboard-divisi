<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectInvoice;
use App\Models\ProjectMilestone;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectInvoiceController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $query = $project->invoices()->with(['milestone', 'creator']);

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('due_date', 'asc')->orderBy('id', 'asc')->get();

        return response()->json($invoices);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $request->validate([
            'term_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'status' => 'nullable|in:draft,invoiced,paid,overdue,cancelled',
            'due_date' => 'nullable|date',
            'paid_date' => 'nullable|date',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'project_milestone_id' => 'nullable|exists:project_milestones,id',
            'invoice_number' => 'nullable|string|max:100|unique:project_invoices,invoice_number',
        ]);

        $user = $request->attributes->get('user');
        $userId = is_array($user) ? ($user['id'] ?? $user['sub'] ?? null) : ($request->user()?->id ?? null);

        $invoiceNumber = $request->invoice_number;
        if (! $invoiceNumber) {
            $prefix = $project->project_code ? preg_replace('/[^A-Za-z0-9]/', '', $project->project_code) : 'PRJ'.$project->id;
            $count = $project->invoices()->count() + 1;
            $invoiceNumber = sprintf('INV/%s/%s/%03d', $prefix, date('Ymd'), $count);
            // Pastikan unik
            if (ProjectInvoice::where('invoice_number', $invoiceNumber)->exists()) {
                $invoiceNumber .= '-'.strtoupper(Str::random(4));
            }
        }

        $status = $request->status ?? 'draft';

        $invoice = $project->invoices()->create([
            'invoice_number' => $invoiceNumber,
            'term_name' => $request->term_name,
            'amount' => $request->amount,
            'status' => $status,
            'due_date' => $request->due_date,
            'paid_date' => $status === 'paid' ? ($request->paid_date ?? now()->toDateString()) : $request->paid_date,
            'payment_reference' => $request->payment_reference,
            'notes' => $request->notes,
            'project_milestone_id' => $request->project_milestone_id,
            'created_by' => $userId,
        ]);

        // Sinkronkan payment_status milestone jika paid
        if ($status === 'paid' && $invoice->project_milestone_id) {
            ProjectMilestone::where('id', $invoice->project_milestone_id)->update(['payment_status' => true]);
        }

        return response()->json($invoice->load(['milestone', 'creator']), 201);
    }

    public function update(Request $request, $projectId, $invoiceId)
    {
        $invoice = ProjectInvoice::where('project_id', $projectId)->findOrFail($invoiceId);

        $request->validate([
            'term_name' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:draft,invoiced,paid,overdue,cancelled',
            'due_date' => 'nullable|date',
            'paid_date' => 'nullable|date',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'project_milestone_id' => 'nullable|exists:project_milestones,id',
            'invoice_number' => 'sometimes|required|string|max:100|unique:project_invoices,invoice_number,'.$invoice->id,
        ]);

        $data = $request->only([
            'term_name',
            'amount',
            'status',
            'due_date',
            'paid_date',
            'payment_reference',
            'notes',
            'project_milestone_id',
            'invoice_number',
        ]);

        $invoice->update($data);

        if (($data['status'] ?? null) === 'paid' && $invoice->project_milestone_id) {
            ProjectMilestone::where('id', $invoice->project_milestone_id)->update(['payment_status' => true]);
        }

        return response()->json($invoice->load(['milestone', 'creator']));
    }

    public function markPaid(Request $request, $projectId, $invoiceId)
    {
        $invoice = ProjectInvoice::where('project_id', $projectId)->findOrFail($invoiceId);

        $request->validate([
            'paid_date' => 'nullable|date',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $invoice->status = 'paid';
        $invoice->paid_date = $request->paid_date ?? now()->toDateString();
        if ($request->has('payment_reference')) {
            $invoice->payment_reference = $request->payment_reference;
        }
        if ($request->has('notes')) {
            $invoice->notes = $request->notes;
        }
        $invoice->save();

        if ($invoice->project_milestone_id) {
            ProjectMilestone::where('id', $invoice->project_milestone_id)->update(['payment_status' => true]);
        }

        return response()->json($invoice->load(['milestone', 'creator']));
    }

    public function destroy($projectId, $invoiceId)
    {
        $invoice = ProjectInvoice::where('project_id', $projectId)->findOrFail($invoiceId);
        $invoice->delete();

        return response()->json(['message' => 'Faktur termin berhasil dihapus']);
    }
}
