<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectRab;
use Illuminate\Http\Request;

class ProjectRabController extends Controller
{
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);

        $rabs = ProjectRab::where('project_id', $project->id)
            ->withSum('expenses', 'amount')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($rabs);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'volume' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $validated['project_id'] = $project->id;
        $validated['total_price'] = $validated['volume'] * $validated['unit_price'];

        $rab = ProjectRab::create($validated);

        return response()->json($rab, 201);
    }

    public function update(Request $request, $projectId, $rabId)
    {
        $rab = ProjectRab::where('project_id', $projectId)->findOrFail($rabId);

        $validated = $request->validate([
            'item_name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'volume' => 'sometimes|required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'sometimes|required|numeric|min:0',
        ]);

        if (isset($validated['volume']) || isset($validated['unit_price'])) {
            $volume = $validated['volume'] ?? $rab->volume;
            $unitPrice = $validated['unit_price'] ?? $rab->unit_price;
            $validated['total_price'] = $volume * $unitPrice;
        }

        $rab->update($validated);

        return response()->json($rab);
    }

    public function destroy($projectId, $rabId)
    {
        $rab = ProjectRab::where('project_id', $projectId)->findOrFail($rabId);
        $rab->delete();

        return response()->json(['message' => 'Item RAB berhasil dihapus']);
    }
}
