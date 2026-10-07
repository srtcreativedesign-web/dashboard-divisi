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
        $filters = $request->validate(['status' => 'nullable|in:planning,in_progress,on_hold,completed', 'search' => 'nullable|string|max:255', 'per_page' => 'nullable|integer|min:1|max:100', 'page' => 'nullable|integer|min:1']);
        $query = Project::query();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->whereLike('name', '%'.$filters['search'].'%');
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 15);

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
            'client_name' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0|max:9999999999999.99|decimal:0,2',
            'status' => 'in:planning,in_progress,on_hold,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $validated['division_code'] = 'PROJECT';
        $this->validateDates($validated);
        $project = Project::create($validated);

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'client_name' => 'nullable|string|max:255',
            'contract_value' => 'numeric|min:0|max:9999999999999.99|decimal:0,2',
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
        ]);

        $milestone = $project->milestones()->create([
            'title' => $validated['title'],
            'weight_percentage' => $validated['weight_percentage'],
            'status' => 'pending',
            'payment_status' => false,
            'due_date' => $validated['due_date'] ?? null,
        ]);

        return response()->json($milestone, 201);
    }

    private function validateDates(array $dates): void
    {
        if (! empty($dates['start_date']) && ! empty($dates['end_date'])) {
            Validator::make($dates, ['end_date' => 'after_or_equal:start_date'])->validate();
        }
    }
}
