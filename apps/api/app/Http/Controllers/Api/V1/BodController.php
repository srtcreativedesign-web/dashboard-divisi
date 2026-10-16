<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BodDivisionReport;
use App\Services\BodOverviewService;
use App\Services\BodReadModelService;
use App\Services\ProjectReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BodController extends Controller
{
    public function __construct(
        protected BodReadModelService $bodReadModel,
        protected BodOverviewService $bodOverview,
        protected ProjectReportService $projectReportService
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

    public function reports(Request $request): JsonResponse
    {
        $query = BodDivisionReport::with(['metrics', 'submitter', 'acknowledger'])
            ->latest('period_start');

        if ($request->has('division')) {
            $query->where('division_code', (string) $request->query('division'));
        }

        if ($request->has('status')) {
            $query->where('status', (string) $request->query('status'));
        } else {
            $query->whereIn('status', ['SUBMITTED', 'ACKNOWLEDGED']);
        }

        $reports = $query->paginate((int) $request->query('per_page', 15));

        return response()->json($reports);
    }

    public function reportDetail(string $id): JsonResponse
    {
        $report = BodDivisionReport::with(['metrics', 'breakdowns', 'submitter', 'acknowledger', 'division'])
            ->findOrFail($id);

        return response()->json($report);
    }

    public function acknowledgeReport(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $report = $this->projectReportService->acknowledge($user, $id);

        return response()->json($report);
    }
}
