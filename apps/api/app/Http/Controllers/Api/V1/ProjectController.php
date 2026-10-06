<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMilestone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($projects);
    }

    public function show($id)
    {
        $project = Project::with([
            'milestones.photos',
            'rabs',
            'documents.uploader',
            'photos.uploader',
            'photos.milestone'
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
            'project_code' => 'nullable|string|max:50|unique:projects,project_code,' . $project->id,
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
            'payment_status' => 'required|boolean'
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
}
