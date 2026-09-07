<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Services\AccCashflowReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingCashflowController extends Controller
{
    public function __construct(
        protected AccCashflowReportService $cashflowService
    ) {}

    public function report(Request $request): JsonResponse
    {
        $division = Division::where('code', 'ACC')->firstOrFail();
        $periodMonth = $request->query('period_month', '2026-08-01');

        $data = $this->cashflowService->getCashflowReport($division, $periodMonth);

        return response()->json($data);
    }
}
