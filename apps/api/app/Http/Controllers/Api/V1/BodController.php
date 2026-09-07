<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BodOverviewService;
use App\Services\BodReadModelService;
use App\Services\PnlComparisonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BodController extends Controller
{
    public function __construct(
        protected BodReadModelService $bodReadModel,
        protected BodOverviewService $bodOverview,
        protected PnlComparisonService $pnlComparisonService
    ) {}

    public function executiveReadModel(Request $request): JsonResponse
    {
        $data = $this->bodReadModel->getExecutiveReadModel($request->attributes->get('user') ?? []);

        return response()->json($data);
    }

    public function checkCompatibility(Request $request): JsonResponse
    {
        $a = (string) $request->query('a', '');
        $b = (string) $request->query('b', '');
        $kpi = (string) $request->query('kpi', '');

        $compatible = $this->bodReadModel->isComparable($a, $b, $kpi);

        return response()->json([
            'divisionA' => $a,
            'divisionB' => $b,
            'kpiCode' => $kpi,
            'compatible' => $compatible,
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $data = $this->bodOverview->getOverview($request->attributes->get('user') ?? [], $from, $to);

        return response()->json($data);
    }

    public function pnlComparison(Request $request): JsonResponse
    {
        $filters = [
            'year' => $request->query('year'),
            'divisions' => $request->query('divisions', []),
            'outlets' => $request->query('outlets', []),
            'periodType' => $request->query('periodType', 'monthly'),
            'month' => $request->query('month'),
        ];

        $data = $this->pnlComparisonService->getComparison($request->attributes->get('user') ?? [], $filters);

        return response()->json($data);
    }
}
