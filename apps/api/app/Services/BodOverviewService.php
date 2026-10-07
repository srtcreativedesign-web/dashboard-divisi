<?php

namespace App\Services;

use App\Exceptions\ApiException;
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

        return array_map(fn ($division) => [
            'divisionCode' => $division['code'],
            'divisionName' => $division['name'],
            'revenue' => ['gross' => null, 'source' => null, 'freshness' => null],
            'target' => ['value' => null, 'achievement' => null, 'source' => null],
            'performance' => ['score' => null, 'level' => null, 'source' => null],
            'workforce' => ['count' => null, 'risk' => null, 'source' => null],
            'dataStatus' => 'not_available',
            'period' => ['from' => $from, 'to' => $to],
            'drillDown' => ['href' => match ($division['code']) {
                'ACC' => '/accounting', 'PROJECT' => '/projects', 'CELL' => '/cellular',
            }],
        ], $divisions);
    }
}
