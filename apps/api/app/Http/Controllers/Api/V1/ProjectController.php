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
        // Notice we don't have vendors relationship setup in Project yet, but the PRD mentions it.
        // Usually, projects might have a pivot table with vendors or a project_vendor might belong to a project.
        // Wait, the PRD says project_vendors: id, name, category, contact_person, phone, email, bank_details.
        // It seems vendors are just a master list directory that might be used across projects.
        $project = Project::with(['milestones', 'rabs', 'documents.uploader'])->findOrFail($id);
        return response()->json($project);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $project = Project::create($validated);

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'client_name' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
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
            'due_date' => 'nullable|date',
        ]);

        $milestone = $project->milestones()->create([
            'title' => $validated['title'],
            'weight_percentage' => $validated['weight_percentage'],
            'status' => 'pending',
            'payment_status' => false,
            'due_date' => $validated['due_date'],
        ]);

        return response()->json($milestone, 201);
    }
}
