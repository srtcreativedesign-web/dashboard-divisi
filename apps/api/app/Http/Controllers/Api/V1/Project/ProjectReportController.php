<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\BodDivisionReport;
use App\Services\ProjectReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectReportController extends Controller
{
    public function __construct(
        protected ProjectReportService $reportService
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $today = CarbonImmutable::now('Asia/Jakarta');
        $start = (string) $request->query('period_start', $today->startOfMonth()->format('Y-m-d'));
        $end = (string) $request->query('period_end', $today->format('Y-m-d'));
        $user = $request->attributes->get('user') ?? [];

        $data = $this->reportService->preview($start, $end, $user);

        return response()->json($data);
    }

    public function submit(Request $request): JsonResponse
    {
        $today = CarbonImmutable::now('Asia/Jakarta');
        $start = (string) $request->input('period_start', $today->startOfMonth()->format('Y-m-d'));
        $end = (string) $request->input('period_end', $today->format('Y-m-d'));
        $payload = $request->only(['metrics', 'breakdowns']);

        $user = $request->attributes->get('user') ?? [];
        $report = $this->reportService->submit($user, $start, $end, $payload);

        return response()->json($report, 201);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $report = $this->reportService->approveReport($user, $id);

        return response()->json($report);
    }

    public function returnReport(Request $request, string $id): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $notes = (string) $request->input('notes', '');
        $report = $this->reportService->returnReport($user, $id, $notes);

        return response()->json($report);
    }

    public function show(string $id): JsonResponse
    {
        $report = BodDivisionReport::with(['metrics', 'breakdowns', 'submitter', 'reviewer', 'acknowledger'])
            ->where('division_code', 'PROJECT')
            ->findOrFail($id);

        return response()->json($report);
    }
}
