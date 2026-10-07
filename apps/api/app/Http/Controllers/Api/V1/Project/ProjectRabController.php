<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectRab;
use Illuminate\Http\Request;

class ProjectRabController extends Controller
{
    public function store(Request $request, $projectId)
    {
        Project::findOrFail($projectId);
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'volume' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $validated['project_id'] = $projectId;
        $validated['total_price'] = $validated['volume'] * $validated['unit_price'];

        $rab = ProjectRab::create($validated);

        return response()->json($rab, 201);
    }
}
