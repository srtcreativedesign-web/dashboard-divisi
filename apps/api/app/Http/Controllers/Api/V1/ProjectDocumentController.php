<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectDocumentController extends Controller
{
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);
        $documents = $project->documents()->with('uploader')->orderBy('created_at', 'desc')->get();

        return response()->json($documents);
    }

    public function store(Request $request, $projectId)
    {
        $project = Project::findOrFail($projectId);

        $request->validate([
            'document_type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:10240', // max 10MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('project_documents/' . $projectId, 'public');
            
            $document = $project->documents()->create([
                'document_type' => $request->document_type,
                'title' => $request->title,
                'file_path' => $path,
                'uploaded_by' => $request->user()->id,
            ]);

            return response()->json($document->load('uploader'), 201);
        }

        return response()->json(['error' => 'File not found'], 400);
    }

    public function destroy($projectId, $documentId)
    {
        $document = ProjectDocument::where('project_id', $projectId)->findOrFail($documentId);
        
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }
        
        $document->delete();

        return response()->json(null, 204);
    }
}
