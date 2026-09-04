<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AccountingPeriod;
use App\Models\Division;
use App\Models\User;
use App\Services\AccExcelParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AccountingImportController extends Controller
{
    public function __construct(
        protected AccExcelParserService $parserService
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $division = Division::where('code', 'ACC')->firstOrFail();

        $periodId = $request->input('period_id');
        $period = null;
        if ($periodId) {
            $period = AccountingPeriod::find($periodId);
        } else {
            $period = AccountingPeriod::where('division_id', $division->id)
                ->where('period_month', '2026-08-01')
                ->first();
        }

        if (! $period) {
            throw new ApiException('PERIOD_NOT_FOUND', 'Periode akuntansi tidak ditemukan', null, 404);
        }

        // Source can be file upload OR raw json rows payload (e.g. from UI simulation or automated client)
        $source = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $ext = strtolower($file->getClientOriginalExtension());
            if (! in_array($ext, ['xlsx', 'csv', 'json'])) {
                throw new ApiException('INVALID_FILE_TYPE', 'Format file harus .xlsx, .csv, atau .json', null, 422);
            }
            $source = $file;
        } elseif ($request->has('rows') && is_array($request->input('rows'))) {
            $source = $request->input('rows');
        } else {
            throw new ApiException('MISSING_SOURCE', 'File upload (.xlsx) atau array rows wajib disertakan', null, 422);
        }

        try {
            $result = $this->parserService->preview($division, $period, $source);

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('PARSE_ERROR', $e->getMessage(), null, 422);
        }
    }

    public function commit(Request $request): JsonResponse
    {
        $userData = $request->attributes->get('user') ?? [];
        $user = User::find($userData['id'] ?? '') ?? User::where('email', $userData['email'] ?? '')->firstOrFail();

        $division = Division::where('code', 'ACC')->firstOrFail();

        $periodId = $request->input('period_id');
        $period = AccountingPeriod::find($periodId)
            ?? AccountingPeriod::where('division_id', $division->id)->where('period_month', '2026-08-01')->firstOrFail();

        $rows = $request->input('rows');
        if (! is_array($rows) || empty($rows)) {
            throw new ApiException('EMPTY_ROWS', 'Tidak ada data baris yang akan di-commit', null, 422);
        }

        $idempotencyKey = $request->header('Idempotency-Key');

        try {
            $result = $this->parserService->commitBatch($division, $period, $rows, $user, $idempotencyKey);

            return response()->json($result, 201);
        } catch (InvalidArgumentException $e) {
            throw new ApiException('COMMIT_ERROR', $e->getMessage(), null, 422);
        }
    }
}
