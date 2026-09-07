<?php

namespace App\Services;

use App\Models\BudgetEntry;
use App\Models\RevenueDaily;
use App\Models\Outlet;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PnlComparisonService
{
    public function getComparison(array $user, array $filters): array
    {
        $year = $filters['year'] ?? (new Carbon())->year;
        $periodType = $filters['periodType'] ?? 'monthly';
        $monthFilter = (int) ($filters['month'] ?? (new Carbon())->month);
        
        $divisions = $filters['divisions'] ?? [];
        $outlets = $filters['outlets'] ?? [];
        
        $isComparingOutlets = !empty($outlets);

        // Fetch Revenues
        $revenueQuery = RevenueDaily::query()
            ->where('is_active', true)
            ->whereYear('business_date', $year);
            
        if ($periodType === 'daily') {
            $revenueQuery->whereMonth('business_date', $monthFilter);
        }
            
        if ($isComparingOutlets) {
            $revenueQuery->whereIn('outlet_id', $outlets);
        } elseif (!empty($divisions)) {
            $revenueQuery->whereIn('division_code', $divisions);
        }
        
        $revenues = $revenueQuery->get();

        // Fetch Budget Entries
        $budgetQuery = BudgetEntry::query()
            ->where('statement', 'PNL')
            ->whereYear('period_month', $year);
            
        if ($periodType === 'daily') {
            $budgetQuery->whereMonth('period_month', $monthFilter);
        }
            
        if ($isComparingOutlets) {
            $budgetQuery->whereIn('outlet_id', $outlets);
        } elseif (!empty($divisions)) {
            $budgetQuery->whereIn('division_code', $divisions);
        }
        
        $budgetEntries = $budgetQuery->get();
        
        // Outlet metadata if comparing outlets
        $outletNames = [];
        if ($isComparingOutlets) {
            $outletModels = Outlet::whereIn('id', $outlets)->get();
            foreach ($outletModels as $outlet) {
                $outletNames[$outlet->id] = $outlet->name;
            }
        }

        // Determine entities
        $entitiesToProcess = $isComparingOutlets ? $outlets : $divisions;
        
        if (empty($entitiesToProcess)) {
            $entitiesToProcess = $revenues->pluck('division_code')
                ->merge($budgetEntries->pluck('division_code'))
                ->unique()
                ->filter()
                ->values()
                ->toArray();
                
            // Fallback if empty database
            if (empty($entitiesToProcess)) {
                $entitiesToProcess = \App\Models\Division::pluck('code')->toArray();
            }
        }

        $data = [];
        
        if ($periodType === 'daily') {
            $daysInMonth = Carbon::create($year, $monthFilter)->daysInMonth;
            
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $periodStr = sprintf('%04d-%02d-%02d', $year, $monthFilter, $day);
                
                $monthData = [
                    'period' => $periodStr,
                    'entities' => $this->processEntities(
                        $entitiesToProcess, $isComparingOutlets, $revenues, $budgetEntries,
                        $outletNames, null, $day, $daysInMonth
                    )
                ];
                $data[] = $monthData;
            }
        } else {
            for ($month = 1; $month <= 12; $month++) {
                $periodStr = sprintf('%04d-%02d', $year, $month);
                
                $monthData = [
                    'period' => $periodStr,
                    'entities' => $this->processEntities(
                        $entitiesToProcess, $isComparingOutlets, $revenues, $budgetEntries,
                        $outletNames, $month, null, 1
                    )
                ];
                $data[] = $monthData;
            }
        }

        return $data;
    }

    private function processEntities($entitiesToProcess, $isComparingOutlets, $revenues, $budgetEntries, $outletNames, $month = null, $day = null, $budgetDivisor = 1)
    {
        $entitiesResult = [];
        
        foreach ($entitiesToProcess as $entityId) {
            $entityRevenues = $revenues->filter(function($r) use ($month, $day, $isComparingOutlets, $entityId) {
                $isCorrectTime = true;
                if ($month !== null) {
                    $isCorrectTime = $r->business_date->month === $month;
                } elseif ($day !== null) {
                    $isCorrectTime = $r->business_date->day === $day;
                }
                
                $isCorrectEntity = $isComparingOutlets ? $r->outlet_id == $entityId : $r->division_code === $entityId;
                return $isCorrectTime && $isCorrectEntity;
            });
            
            $entityBudgets = $budgetEntries->filter(function($b) use ($month, $isComparingOutlets, $entityId) {
                $isCorrectTime = true;
                if ($month !== null) {
                    $isCorrectTime = $b->period_month->month === $month;
                }
                // For daily, we've already filtered budgetEntries by month in the DB query
                
                $isCorrectEntity = $isComparingOutlets ? $b->outlet_id == $entityId : $b->division_code === $entityId;
                return $isCorrectTime && $isCorrectEntity;
            });

            $netRevenue = $entityRevenues->sum('net_revenue');
            $sum = fn (string $type) => ((float) $entityBudgets->where('line_type', $type)->sum('amount')) / $budgetDivisor;

            $cogs = $sum('COGS');
            $opex = $sum('OPEX');
            $otherIncome = $sum('OTHER_INCOME');
            $depreciation = $sum('DEPRECIATION');
            $interest = $sum('INTEREST');
            $tax = $sum('TAX');

            $grossProfit = $netRevenue - $cogs;
            $ebitda = $grossProfit + $otherIncome - $opex;
            $netProfit = $ebitda - $depreciation - $interest - $tax;

            $entityName = $isComparingOutlets ? ($outletNames[$entityId] ?? $entityId) : $entityId;

            $entitiesResult[] = [
                'id' => $entityId,
                'name' => $entityName,
                'netProfit' => $netProfit,
                'grossProfit' => $grossProfit,
                'netRevenue' => $netRevenue,
            ];
        }
        
        return $entitiesResult;
    }
}
