<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectDocument;
use App\Services\MutationFileRollback;
use App\Services\Project\DocumentStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

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
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx|max:10240', // max 10MB
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('project_documents_private/'.$projectId, 'local');
            if (! is_string($path)) {
                throw new RuntimeException('Penyimpanan dokumen gagal');
            }
            MutationFileRollback::register(fn () => Storage::disk('local')->delete($path));

            $document = $project->documents()->create([
                'file_type' => $request->document_type,
                'title' => $request->title,
                'file_path' => $path,
                'uploaded_by' => $request->attributes->get('user')['sub'],
            ]);

            return response()->json($document->load('uploader'), 201);
        }

        return response()->json(['error' => 'File not found'], 400);
    }

    public function download($projectId, $documentId)
    {
        Project::findOrFail($projectId);
        $document = ProjectDocument::where('project_id', $projectId)->findOrFail($documentId);
        // File lama tetap dibaca dari disk asal; unggahan baru selalu privat.
        $disk = app(DocumentStorageService::class)->diskFor($document);
        abort_unless(Storage::disk($disk)->exists($document->file_path), 404);

        return Storage::disk($disk)->download($document->file_path, basename($document->title), ['X-Content-Type-Options' => 'nosniff']);
    }

    public function destroy($projectId, $documentId)
    {
        Project::findOrFail($projectId);
        $document = ProjectDocument::where('project_id', $projectId)->findOrFail($documentId);

        if ($document->file_path) {
            $disk = Storage::disk(app(DocumentStorageService::class)->diskFor($document));
            if ($disk->exists($document->file_path)) {
                $content = $disk->get($document->file_path);
                $path = $document->file_path;
                MutationFileRollback::register(fn () => $disk->put($path, $content));
                if (! $disk->delete($path)) {
                    throw new RuntimeException('Penghapusan dokumen gagal');
                }
            }
        }

        $document->delete();

        return response()->json(null, 204);
    }
}
