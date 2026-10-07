<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\OmzetRecord;
use App\Services\PolicyService;

class AnnualOmzetService
{
    public function __construct(private PolicyService $policy) {}

    public function report(int $year, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'ACC');
        $this->policy->assertCapability($user, 'view:acc_detail');
        $months = [];
        for ($month = 1; $month <= 12; $month++) {
            $months[$month] = ['month' => sprintf('%04d-%02d', $year, $month), 'cents' => 0, 'validated_count' => 0, 'pending_count' => 0];
        }
        $outlets = [];
        $total = 0;
        $validated = 0;
        $pending = 0;
        $records = OmzetRecord::where('division_code', 'ACC')
            ->whereBetween('business_date', [sprintf('%04d-01-01', $year), sprintf('%04d-12-31', $year)])
            ->orderBy('business_date')->orderBy('id')->cursor();
        foreach ($records as $record) {
            $month = (int) $record->business_date->format('m');
            if ($record->status !== 'validated') {
                $months[$month]['pending_count']++;
                $pending++;

                continue;
            }
            if (! preg_match('/^\d{1,14}\.\d{2}$/D', $record->outlet_amount)) {
                throw new ApiException('SOURCE_DATA_UNAVAILABLE', 'Nominal sumber omzet tidak valid.');
            }
            $cents = (int) str_replace('.', '', $record->outlet_amount);
            if ($total > PHP_INT_MAX - $cents) {
                throw new ApiException('SOURCE_DATA_UNAVAILABLE', 'Total omzet melampaui kapasitas perhitungan.');
            }
            $total += $cents;
            $validated++;
            $months[$month]['cents'] += $cents;
            $months[$month]['validated_count']++;
            $outlets[$record->outlet_id] ??= ['outlet_id' => $record->outlet_id, 'outlet_name' => $record->outlet_name,
                'source_division_code' => $record->source_division_code, 'cents' => 0, 'validated_count' => 0, 'months_with_data' => []];
            $outlets[$record->outlet_id]['outlet_name'] = $record->outlet_name;
            $outlets[$record->outlet_id]['cents'] += $cents;
            $outlets[$record->outlet_id]['validated_count']++;
            $outlets[$record->outlet_id]['months_with_data'][$month] = true;
        }
        $money = fn (int $value) => intdiv($value, 100).'.'.str_pad((string) ($value % 100), 2, '0', STR_PAD_LEFT);
        $monthly = array_map(function ($row) use ($money) {
            $row['amount'] = $row['validated_count'] ? $money($row['cents']) : null;
            unset($row['cents']);

            return $row;
        }, array_values($months));
        $comparison = array_map(function ($row) use ($money) {
            $row['amount'] = $money($row['cents']);
            $row['months_with_data'] = count($row['months_with_data']);
            unset($row['cents']);

            return $row;
        }, array_values($outlets));
        usort($comparison, fn ($left, $right) => strcmp($left['outlet_name'], $right['outlet_name']) ?: strcmp($left['outlet_id'], $right['outlet_id']));

        return ['year' => $year, 'source' => 'acc_omzet_records:validated', 'amount' => $validated ? $money($total) : null,
            'validated_count' => $validated, 'pending_count' => $pending, 'months' => $monthly, 'outlets' => $comparison];
    }
}
