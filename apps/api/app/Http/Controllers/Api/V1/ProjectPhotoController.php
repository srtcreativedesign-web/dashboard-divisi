<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectProgressPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectPhotoController extends Controller
{
    public function index(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $query = $project->photos()->with(['milestone', 'uploader']);

        if ($request->has('stage')) {
            $query->where('stage', $request->stage);
        }

        if ($request->has('area_name')) {
            $query->where('area_name', $request->area_name);
        }

        if ($request->has('milestone_id')) {
            $query->where('milestone_id', $request->milestone_id);
        }

        $photos = $query->orderBy('taken_at', 'desc')->orderBy('created_at', 'desc')->get();

        return response()->json($photos);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $request->validate([
            'stage' => 'required|in:before,in_progress,after',
            'file' => 'required|image|max:10240', // max 10MB
            'area_name' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:500',
            'milestone_id' => 'nullable|exists:project_milestones,id',
            'taken_at' => 'nullable|date',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('project_photos/' . $projectId, 'public');

            $user = $request->attributes->get('user');
            $userId = is_array($user) ? ($user['id'] ?? $user['sub'] ?? null) : ($request->user()?->id ?? null);

            $photo = $project->photos()->create([
                'milestone_id' => $request->milestone_id,
                'stage' => $request->stage,
                'area_name' => $request->area_name,
                'caption' => $request->caption,
                'photo_path' => $path,
                'taken_at' => $request->taken_at ?? now()->toDateString(),
                'uploaded_by' => $userId,
            ]);

            return response()->json($photo->load(['milestone', 'uploader']), 201);
        }

        return response()->json(['error' => 'File not found'], 400);
    }

    public function destroy($projectId, $photoId)
    {
        $photo = ProjectProgressPhoto::where('project_id', $projectId)->findOrFail($photoId);

        if ($photo->photo_path) {
            Storage::disk('public')->delete($photo->photo_path);
        }

        $photo->delete();

        return response()->json(null, 204);
    }
}
