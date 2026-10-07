<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectPettyCash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ProjectPettyCashController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $query = $project->pettyCashes();

        if ($request->filled('type') && in_array($request->type, ['in', 'out'], true)) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->whereLike('description', $search)
                  ->orWhereLike('recipient_or_vendor', $search);
            });
        }

        if ($request->filled('start_date')) {
            $query->where('transaction_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('transaction_date', '<=', $request->end_date);
        }

        // Summary of all transactions for this project
        $totalIn = (float) $project->pettyCashes()->where('type', 'in')->sum('amount');
        $totalOut = (float) $project->pettyCashes()->where('type', 'out')->sum('amount');
        $balance = $totalIn - $totalOut;

        $items = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'data' => $items,
            'summary' => [
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'balance' => $balance,
                'transaction_count' => $items->count(),
            ],
        ]);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'type' => 'required|in:in,out',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01|max:9999999999999.99',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:1000',
            'recipient_or_vendor' => 'nullable|string|max:255',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('petty_cash_receipts/'.$projectId, 'local');
        }

        $user = $request->attributes->get('user');
        $userName = is_array($user) ? ($user['name'] ?? $user['email'] ?? $user['sub'] ?? null) : null;

        $entry = $project->pettyCashes()->create([
            'type' => $validated['type'],
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'transaction_date' => $validated['transaction_date'],
            'description' => $validated['description'],
            'recipient_or_vendor' => $validated['recipient_or_vendor'] ?? null,
            'receipt_path' => $receiptPath,
            'created_by' => $userName,
        ]);

        return response()->json($entry, Response::HTTP_CREATED);
    }

    public function update(Request $request, $projectId, $id)
    {
        $project = Project::findOrFail($projectId);
        $entry = $project->pettyCashes()->findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|in:in,out',
            'category' => 'sometimes|string|max:100',
            'amount' => 'sometimes|numeric|min:0.01|max:9999999999999.99',
            'transaction_date' => 'sometimes|date',
            'description' => 'sometimes|string|max:1000',
            'recipient_or_vendor' => 'nullable|string|max:255',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        if ($request->hasFile('receipt')) {
            if ($entry->receipt_path && Storage::disk('local')->exists($entry->receipt_path)) {
                Storage::disk('local')->delete($entry->receipt_path);
            }
            $validated['receipt_path'] = $request->file('receipt')->store('petty_cash_receipts/'.$projectId, 'local');
        }

        $entry->update($validated);

        return response()->json($entry);
    }

    public function destroy($projectId, $id)
    {
        $project = Project::findOrFail($projectId);
        $entry = $project->pettyCashes()->findOrFail($id);

        if ($entry->receipt_path && Storage::disk('local')->exists($entry->receipt_path)) {
            Storage::disk('local')->delete($entry->receipt_path);
        }

        $entry->delete();

        return response()->json(['message' => 'Transaksi kas kecil berhasil dihapus.']);
    }

    public function downloadReceipt($projectId, $id)
    {
        $project = Project::findOrFail($projectId);
        $entry = $project->pettyCashes()->findOrFail($id);

        if (! $entry->receipt_path || ! Storage::disk('local')->exists($entry->receipt_path)) {
            return response()->json(['message' => 'Bukti kuitansi / nota tidak ditemukan.'], 404);
        }

        return Storage::disk('local')->download($entry->receipt_path);
    }
}
