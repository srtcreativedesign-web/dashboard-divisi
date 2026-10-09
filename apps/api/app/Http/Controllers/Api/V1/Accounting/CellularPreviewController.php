<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Cellular\ReportPreviewReader;
use App\Services\Cellular\ReportStagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\Rule;
use Throwable;

class CellularPreviewController extends Controller
{
    public function __construct(private ReportStagingService $staging) {}

    public function preview(Request $request): JsonResponse
    {
        $input = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
            'profile' => ['required', Rule::in(ReportPreviewReader::PROFILES)],
            'month' => ['required', 'regex:/^20\d{2}-(0[1-9]|1[0-2])$/'],
            'outlet_id' => ['required', 'uuid'],
        ]);
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if (str_starts_with($file->getClientOriginalName(), '~$') || ! in_array($extension, ['xls', 'xlsx'], true)) {
            throw new ApiException('IMPORT_ROW_INVALID', 'Gunakan laporan XLS/XLSX, bukan file lock Excel.');
        }
        $scan = $request->attributes->get('file_scan');
        if (! is_array($scan) || ! hash_equals($scan['sha256'], hash_file('sha256', $file->getRealPath()))) {
            throw new ApiException('SCANNER_UNAVAILABLE', 'Berkas belum lolos pemindaian.', null, 503);
        }
        try {
            $process = Process::timeout(25)->run([
                PHP_BINARY, '-d', 'memory_limit=192M', '-d', 'display_errors=0',
                base_path('scripts/cellular-preview.php'), $file->getRealPath(), $extension, $input['profile'], $input['month'],
            ]);
        } catch (Throwable) {
            throw new ApiException('IMPORT_ROW_INVALID', 'Preview melewati batas proses; gunakan workbook yang lebih kecil.');
        }
        $output = json_decode($process->output(), true);
        if (! $process->successful() || ! is_array($output) || isset($output['error'])) {
            throw new ApiException('IMPORT_ROW_INVALID', $output['error'] ?? 'Preview gagal; workbook rusak atau batas resource terlampaui.');
        }
        if (! hash_equals($scan['sha256'], $output['sha256'] ?? '') || ! hash_equals($scan['sha256'], hash_file('sha256', $file->getRealPath()))) {
            throw new ApiException('IMPORT_ROW_INVALID', 'Berkas berubah selama preview.');
        }
        // Nama file untuk tampilan saja, tidak menjadi path storage atau identitas outlet.
        $output['filename'] = mb_substr($file->getClientOriginalName(), 0, 200);
        try {
            $batch = $this->staging->stage($output, ['name' => $output['filename'], 'sha256' => $scan['sha256']], $input['outlet_id'], $request->attributes->get('user'));
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('IDEMPOTENCY_CONFLICT', 'Berkas identik sudah pernah masuk staging untuk outlet, periode, dan profil ini.');
        }
        $output['batch_id'] = $batch['id'];
        $output['stage_status'] = $batch['status'];

        return response()->json($output);
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'month' => ['required', 'regex:/^20\d{2}-(0[1-9]|1[0-2])$/'],
            'outlet_id' => ['required', 'uuid'],
            'status' => ['nullable', Rule::in(['staged', 'committed', 'superseded'])],
        ]);

        return response()->json($this->staging->list($filters, $request->attributes->get('user')));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return response()->json($this->staging->detail($id, $request->attributes->get('user')));
    }

    public function commit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_ids' => ['required', 'array', 'size:2'],
            'batch_ids.*' => ['required', 'uuid', 'distinct'],
            'acknowledge_warnings' => ['required', 'boolean'],
        ]);

        return response()->json($this->staging->commit($data['batch_ids'], $data['acknowledge_warnings'], $request->attributes->get('user')), 201);
    }
}
