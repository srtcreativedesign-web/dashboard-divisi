<?php

namespace App\Services\Project;

use App\Exceptions\ApiException;
use App\Models\ProjectDocument;

class DocumentStorageService
{
    public function diskFor(ProjectDocument $document): string
    {
        $parts = explode('/', (string) $document->file_path);
        if (count($parts) !== 3 || ! in_array($parts[0], ['project_documents_private', 'project_documents'], true)
            || $parts[1] !== (string) $document->project_id || $parts[2] === ''
            || in_array($parts[2], ['.', '..'], true) || str_contains($document->file_path, '\\')) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen tidak tersedia');
        }

        return $parts[0] === 'project_documents_private' ? 'local' : 'public';
    }
}
