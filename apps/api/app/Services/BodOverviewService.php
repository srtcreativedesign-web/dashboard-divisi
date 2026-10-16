<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\BodDivisionReport;
use Carbon\CarbonImmutable;

class BodOverviewService
{
    public function __construct(private MvpDivisionReadService $divisions) {}

    public function getOverview(array $user, mixed $periodFrom = null, mixed $periodTo = null): array
    {
        $divisions = $this->divisions->list($user);
        $today = CarbonImmutable::now('Asia/Jakarta');
        $from = $periodFrom ?? $today->format('Y-m-01');
        $to = $periodTo ?? $today->format('Y-m-d');
        foreach ([$from, $to] as $date) {
            if (! is_string($date) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
                || ! checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4))) {
                throw new ApiException('VALIDATION_ERROR', 'Periode ringkasan harus berupa tanggal Y-m-d yang valid');
            }
        }
        if ($from > $to) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal akhir tidak boleh mendahului tanggal awal');
        }

        return array_map(function ($division) use ($from, $to, $today) {
            $report = BodDivisionReport::with('metrics')
                ->where('division_code', $division['code'])
                ->whereIn('status', ['SUBMITTED', 'ACKNOWLEDGED'])
                ->where('period_start', '<=', $to)
                ->where('period_end', '>=', $from)
                ->latest('submitted_at')
                ->first();

            if (! $report) {
                return [
                    'divisionCode' => $division['code'],
                    'divisionName' => $division['name'],
                    'revenue' => ['gross' => null, 'source' => null, 'freshness' => null],
                    'target' => ['value' => null, 'achievement' => null, 'source' => null],
                    'performance' => ['score' => null, 'level' => null, 'source' => null],
                    'workforce' => ['count' => null, 'risk' => null, 'source' => null],
                    'dataStatus' => 'not_available',
                    'period' => ['from' => $from, 'to' => $to],
                    'drillDown' => ['href' => match ($division['code']) {
                        'ACC' => '/accounting/pendapatan/analisis', 'PROJECT' => '/projects/report-to-bod', 'CELL' => '/cellular/laporan',
                    }],
                ];
            }

            $metricMap = $report->metrics->pluck('metric_value', 'metric_key')->all();
            $gross = isset($metricMap['contract_value_total'])
                ? (float) $metricMap['contract_value_total']
                : (isset($metricMap['revenue.gross']) ? (float) $metricMap['revenue.gross'] : null);

            $target = isset($metricMap['total_budget_rab'])
                ? (float) $metricMap['total_budget_rab']
                : (isset($metricMap['target.value']) ? (float) $metricMap['target.value'] : null);

            $ach = isset($metricMap['average_physical_progress'])
                ? (float) $metricMap['average_physical_progress']
                : (isset($metricMap['target.achievement']) ? (float) $metricMap['target.achievement'] : null);

            return [
                'divisionCode' => $division['code'],
                'divisionName' => $division['name'],
                'revenue' => [
                    'gross' => $gross,
                    'source' => 'bod_division_reports',
                    'freshness' => $report->submitted_at ? $report->submitted_at->format('Y-m-d') : $today->format('Y-m-d'),
                ],
                'target' => [
                    'value' => $target,
                    'achievement' => $ach,
                    'source' => 'bod_division_reports',
                ],
                'performance' => ['score' => null, 'level' => null, 'source' => null],
                'workforce' => ['count' => null, 'risk' => null, 'source' => null],
                'dataStatus' => $report->status === 'ACKNOWLEDGED' ? 'verified' : 'submitted',
                'period' => ['from' => $from, 'to' => $to],
                'drillDown' => ['href' => match ($division['code']) {
                    'ACC' => '/accounting/pendapatan/analisis', 'PROJECT' => '/projects/report-to-bod', 'CELL' => '/cellular/laporan',
                }],
            ];
        }, $divisions);
    }
}
