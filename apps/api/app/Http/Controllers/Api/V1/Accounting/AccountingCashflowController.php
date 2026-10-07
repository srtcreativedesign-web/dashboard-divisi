<?php

namespace App\Http\Controllers\Api\V1\Accounting;

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
        $request->validate(['period_month' => 'nullable|date_format:Y-m,Y-m-d']);
        $division = Division::where('code', 'ACC')->firstOrFail();
        $periodMonth = $request->query('period_month');

        $data = $this->cashflowService->getCashflowReport($division, $periodMonth);

        return response()->json($data);
    }

    public function summary(Request $request): JsonResponse
    {
        $request->validate(['period_month' => 'nullable|date_format:Y-m,Y-m-d']);
        $division = Division::where('code', 'ACC')->firstOrFail();
        $report = $this->cashflowService->getCashflowReport($division, $request->query('period_month'));

        return response()->json([
            'period' => $report['period'],
            'kpis' => array_intersect_key($report['kpis'], array_flip(['total_revenue', 'total_expenses', 'ending_cash_balance'])),
        ]);
    }
}
