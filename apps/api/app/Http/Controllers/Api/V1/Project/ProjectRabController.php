<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectRab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectRabController extends Controller
{
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);

        return response()->json($project->rabs()->get());
    }

    public function store(Request $request, $projectId)
    {
        Project::findOrFail($projectId);
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'volume' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $validated['project_id'] = $projectId;
        $validated['category'] = $validated['category'] ?? 'material';
        $validated['unit'] = $validated['unit'] ?? 'pcs';
        $validated['total_price'] = $validated['volume'] * $validated['unit_price'];

        $rab = ProjectRab::create($validated);

        return response()->json($rab, 201);
    }

    public function update(Request $request, $projectId, $rabId)
    {
        $rab = ProjectRab::where('project_id', $projectId)->findOrFail($rabId);

        $validated = $request->validate([
            'item_name' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|max:255',
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

    public function batchSync(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'nullable|integer',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.category' => 'nullable|string|max:255',
            'items.*.volume' => 'required|numeric|min:0',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($project, $validated) {
            $existingIds = [];
            foreach ($validated['items'] as $item) {
                $volume = (float) $item['volume'];
                $unitPrice = (float) $item['unit_price'];
                $totalPrice = $volume * $unitPrice;

                $data = [
                    'project_id' => $project->id,
                    'item_name' => $item['item_name'],
                    'category' => $item['category'] ?? 'material',
                    'volume' => $volume,
                    'unit' => $item['unit'] ?? 'pcs',
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ];

                if (! empty($item['id'])) {
                    $rab = ProjectRab::where('project_id', $project->id)->find($item['id']);
                    if ($rab) {
                        $rab->update($data);
                        $existingIds[] = $rab->id;
                        continue;
                    }
                }

                $newRab = ProjectRab::create($data);
                $existingIds[] = $newRab->id;
            }

            // Remove items not in the submitted list
            ProjectRab::where('project_id', $project->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

            $updatedRabs = ProjectRab::where('project_id', $project->id)->get();

            return response()->json([
                'message' => 'RAB berhasil diperbarui',
                'data' => $updatedRabs,
                'total_rab' => (float) $updatedRabs->sum('total_price'),
            ]);
        });
    }
}
