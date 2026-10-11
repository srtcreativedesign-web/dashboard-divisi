<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function __construct(private OrgReadModelService $org, private PolicyService $policy) {}

    public function report(string $month, ?string $outletId, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL');
        $this->policy->assertCapability($user, 'view:cellular_sales');
        if (($user['divisionCode'] ?? null) === 'CELLULAR') {
            $user['divisionCode'] = $user['division_code'] = 'CELL';
        }
        $outlets = collect($this->org->getOutletsForUser($user, 'CELL'));
        if ($outletId && ! $outlets->contains('id', $outletId)) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet Cellular tidak ditemukan atau di luar cakupan Anda.');
        }
        $allowed = $outletId ? [$outletId] : $outlets->pluck('id')->all();
        $names = $outlets->pluck('name', 'id');
        $period = CarbonImmutable::createFromFormat('!Y-m', $month, 'Asia/Jakarta');
        $dateRange = [$period->startOfMonth()->toDateString(), $period->endOfMonth()->toDateString()];

        $sales = DB::table('cel_manual_sales as s')->join('cel_products as p', 'p.id', '=', 's.product_id')
            ->whereIn('s.outlet_id', $allowed)->where('s.status', 'posted')->whereBetween('s.business_date', $dateRange)
            ->select('s.outlet_id', 's.business_date', 's.quantity', 's.total_cents', 'p.provider', 'p.kind')->get();
        $closings = DB::table('cel_daily_closings')->whereIn('outlet_id', $allowed)->whereBetween('business_date', $dateRange)->get();
        $settlements = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')
            ->whereIn('c.outlet_id', $allowed)->where('s.status', 'reconciled')->whereBetween('c.business_date', $dateRange)
            ->select('c.outlet_id', 'c.business_date', 's.gross_cents', 's.fee_cents', 's.net_cents')->get();

        $daily = [];
        $outletRows = [];
        foreach ($allowed as $id) {
            $outletRows[$id] = ['outlet_id' => $id, 'outlet_name' => $names->get($id), 'sales_cents' => 0, 'units' => 0, 'closing_cents' => 0, 'settled_net_cents' => 0, 'ecsys_entered_cents' => null, 'ecsys_net_cents' => null, 'ecsys_days' => 0];
        }
        foreach ($sales as $row) {
            $date = (string) $row->business_date;
            $key = $row->outlet_id.'|'.$date;
            $daily[$key] ??= $this->dailyRow($row->outlet_id, $names->get($row->outlet_id), $date);
            $daily[$key]['sales_cents'] += (int) $row->total_cents;
            $daily[$key]['units'] += (int) $row->quantity;
            $outletRows[$row->outlet_id]['sales_cents'] += (int) $row->total_cents;
            $outletRows[$row->outlet_id]['units'] += (int) $row->quantity;
        }
        foreach ($closings as $row) {
            $date = (string) $row->business_date;
            $key = $row->outlet_id.'|'.$date;
            $daily[$key] ??= $this->dailyRow($row->outlet_id, $names->get($row->outlet_id), $date);
            $daily[$key]['closing_cents'] = ($daily[$key]['closing_cents'] ?? 0) + (int) $row->system_sales_cents;
            $daily[$key]['closing_statuses'][] = $row->status;
            $outletRows[$row->outlet_id]['closing_cents'] += (int) $row->system_sales_cents;
        }
        foreach ($settlements as $row) {
            $date = (string) $row->business_date;
            $key = $row->outlet_id.'|'.$date;
            $daily[$key] ??= $this->dailyRow($row->outlet_id, $names->get($row->outlet_id), $date);
            $daily[$key]['settled_net_cents'] += (int) $row->net_cents;
            $daily[$key]['fee_cents'] += (int) $row->fee_cents;
            $outletRows[$row->outlet_id]['settled_net_cents'] += (int) $row->net_cents;
        }

        $batches = DB::table('acc_cellular_import_batches')->whereIn('outlet_id', $allowed)->where('period', $month)->where('profile', 'ecsys')
            ->whereIn('status', ['staged', 'committed'])->orderByDesc('created_at')->get()->unique('outlet_id');
        foreach ($batches as $batch) {
            $rows = DB::table('acc_cellular_import_rows')->where('batch_id', $batch->id)->where('validation_status', '!=', 'error')->get();
            foreach ($rows as $row) {
                $payload = json_decode($row->payload, true) ?: [];
                $date = (string) $row->business_date;
                $key = $batch->outlet_id.'|'.$date;
                $daily[$key] ??= $this->dailyRow($batch->outlet_id, $names->get($batch->outlet_id), $date);
                $daily[$key]['ecsys_gross_cents'] = $this->nullableCents($payload['gross'] ?? null);
                $daily[$key]['ecsys_net_cents'] = $this->nullableCents($payload['ecsys_net'] ?? null);
                $daily[$key]['ecsys_entered_cents'] = $this->nullableCents($payload['ecsys_entered'] ?? null);
                $daily[$key]['ecsys_realization_cents'] = $this->nullableCents($payload['ecsys_realization'] ?? null);
                $daily[$key]['ecsys_validation'] = $row->validation_status;
                foreach (['ecsys_entered_cents', 'ecsys_net_cents'] as $metric) {
                    if ($daily[$key][$metric] !== null) {
                        $outletRows[$batch->outlet_id][$metric] = ($outletRows[$batch->outlet_id][$metric] ?? 0) + $daily[$key][$metric];
                    }
                }
                $outletRows[$batch->outlet_id]['ecsys_days']++;
            }
        }

        foreach ($daily as &$row) {
            $row['closing_status'] = $this->closingStatus($row['closing_statuses']);
            unset($row['closing_statuses']);
            $row['variance_cents'] = $row['ecsys_entered_cents'] === null ? null : $row['sales_cents'] - $row['ecsys_entered_cents'];
            $row['reconciliation_status'] = $this->reconciliationStatus($row);
            foreach (['sales_cents', 'closing_cents', 'settled_net_cents', 'fee_cents', 'ecsys_gross_cents', 'ecsys_net_cents', 'ecsys_entered_cents', 'ecsys_realization_cents', 'variance_cents'] as $metric) {
                $row[str_replace('_cents', '', $metric)] = $row[$metric] === null ? null : $this->money($row[$metric]);
                unset($row[$metric]);
            }
        }
        unset($row);
        foreach ($outletRows as &$row) {
            $row['variance_cents'] = $row['ecsys_entered_cents'] === null ? null : $row['sales_cents'] - $row['ecsys_entered_cents'];
            foreach (['sales_cents', 'closing_cents', 'settled_net_cents', 'ecsys_entered_cents', 'ecsys_net_cents', 'variance_cents'] as $metric) {
                $row[str_replace('_cents', '', $metric)] = $row[$metric] === null ? null : $this->money($row[$metric]);
                unset($row[$metric]);
            }
        }
        unset($row);

        $providers = $sales->groupBy(fn ($row) => $row->provider ?: ($row->kind === 'ACCESSORY' ? 'Aksesori' : 'Tanpa provider'))->map(function ($rows, $provider) {
            return ['provider' => $provider, 'sales' => $this->money((int) $rows->sum('total_cents')), 'units' => (int) $rows->sum('quantity')];
        })->sortByDesc(fn ($row) => (float) $row['sales'])->values()->all();
        $dailyRows = collect($daily)->sortBy([['business_date', 'desc'], ['outlet_name', 'asc']])->values();
        $salesTotal = (int) $sales->sum('total_cents');
        $ecsysTotal = collect($outletRows)->sum(fn ($row) => $row['ecsys_entered'] === null ? 0 : $this->toCents($row['ecsys_entered']));

        return [
            'period' => $month,
            'kpis' => ['sales' => $this->money($salesTotal), 'units' => (int) $sales->sum('quantity'), 'ecsys_entered' => $batches->isEmpty() ? null : $this->money($ecsysTotal), 'variance' => $batches->isEmpty() ? null : $this->money($salesTotal - $ecsysTotal), 'exception_days' => $dailyRows->whereIn('reconciliation_status', ['variance', 'incomplete'])->count()],
            'coverage' => ['outlets' => count($allowed), 'sales_days' => $sales->pluck('business_date')->unique()->count(), 'closing_days' => $closings->pluck('business_date')->unique()->count(), 'ecsys_days' => $dailyRows->whereNotNull('ecsys_entered')->count(), 'ecsys_batches' => $batches->count()],
            'outlets' => collect($outletRows)->sortByDesc(fn ($row) => (float) $row['sales'])->values()->all(),
            'providers' => $providers,
            'daily' => $dailyRows->all(),
            'sources' => ['sales' => $sales->isNotEmpty(), 'closing' => $closings->isNotEmpty(), 'settlement' => $settlements->isNotEmpty(), 'ecsys' => $batches->isNotEmpty()],
        ];
    }

    private function dailyRow(string $outletId, ?string $name, string $date): array
    {
        return ['outlet_id' => $outletId, 'outlet_name' => $name, 'business_date' => $date, 'sales_cents' => 0, 'units' => 0, 'closing_cents' => null, 'closing_statuses' => [], 'settled_net_cents' => 0, 'fee_cents' => 0, 'ecsys_gross_cents' => null, 'ecsys_net_cents' => null, 'ecsys_entered_cents' => null, 'ecsys_realization_cents' => null, 'ecsys_validation' => null];
    }

    private function closingStatus(array $statuses): ?string
    {
        if ($statuses === []) {
            return null;
        }
        foreach (['correction', 'draft', 'submitted', 'validated', 'approved'] as $status) {
            if (in_array($status, $statuses, true)) {
                return $status;
            }
        }

        return $statuses[0];
    }

    private function reconciliationStatus(array $row): string
    {
        if ($row['ecsys_entered_cents'] === null || $row['closing_cents'] === null) {
            return 'incomplete';
        }
        if (abs($row['sales_cents'] - $row['ecsys_entered_cents']) >= 1 || abs($row['sales_cents'] - $row['closing_cents']) >= 1) {
            return 'variance';
        }

        return 'matched';
    }

    private function nullableCents(mixed $value): ?int
    {
        return is_int($value) || is_float($value) ? (int) round($value * 100) : null;
    }

    private function toCents(string $value): int
    {
        return (int) round((float) $value * 100);
    }

    private function money(int $cents): string
    {
        $negative = $cents < 0;
        $cents = abs($cents);

        return ($negative ? '-' : '').intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
