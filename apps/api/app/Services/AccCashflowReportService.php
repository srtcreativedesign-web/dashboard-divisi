<?php

namespace App\Services;

use App\Models\AccountingBankReconciliation;
use App\Models\AccountingCategory;
use App\Models\AccountingOutstanding;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;

class AccCashflowReportService
{
    public function getCashflowReport(Division $division, ?string $periodMonth = null): array
    {
        if ($periodMonth && preg_match('/^\d{4}-\d{2}$/D', $periodMonth)) {
            $periodMonth .= '-01';
        }
        $period = AccountingPeriod::where('division_id', $division->id)
            ->when($periodMonth, fn ($query) => $query->whereDate('period_month', $periodMonth))
            ->latest('period_month')->firstOrFail();

        // Opening balance is recorded per bank account and accounting period.
        $initialBalance = (float) AccountingBankReconciliation::where('division_id', $division->id)
            ->where('period_id', $period->id)->sum('jul_balance');

        // 2. Query transactions grouped by category
        $categories = AccountingCategory::all();
        $trxGrouped = AccountingTransaction::where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->whereNull('cancelled_at')->where('is_draft', false)
            ->selectRaw('category_id, SUM(credit_amount) as total_credit, SUM(debit_amount) as total_debit')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $breakdown = ['revenue' => [], 'operational' => [], 'backoffice' => []];
        foreach ($categories as $category) {
            $totals = $trxGrouped->get($category->id);
            if (! $totals) {
                continue;
            }
            $group = match (strtoupper(substr($category->code, 0, 1))) {
                'B' => 'revenue', 'C' => 'operational', 'D' => 'backoffice',
                default => (float) $totals->total_debit >= (float) $totals->total_credit ? 'revenue' : 'operational',
            };
            $amount = $group === 'revenue'
                ? (float) $totals->total_debit - (float) $totals->total_credit
                : (float) $totals->total_credit - (float) $totals->total_debit;
            $breakdown[$group][] = ['code' => $category->code, 'name' => $category->name, 'amount' => $amount];
        }
        $totalRevenue = array_sum(array_column($breakdown['revenue'], 'amount'));
        $totalOperational = array_sum(array_column($breakdown['operational'], 'amount'));
        $totalBackoffice = array_sum(array_column($breakdown['backoffice'], 'amount'));

        $totalAvailable = $initialBalance + $totalRevenue;
        $totalExpenses = $totalOperational + $totalBackoffice;
        $endingCashBalance = $totalAvailable - $totalExpenses;

        // 3. Bank reconciliations
        $totalBankAug = (float) AccountingBankReconciliation::where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->sum('aug_balance');

        $variance = abs($totalBankAug - $endingCashBalance);

        // 4. Outstandings
        $totalOutstanding = (int) AccountingOutstanding::where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->sum('remaining_amount');

        $projectedEndingBalance = $endingCashBalance - $totalOutstanding;

        return [
            'period' => [
                'period_month' => $period->period_month->format('Y-m-d'),
                'status' => $period?->status ?? 'draft',
            ],
            'kpis' => [
                'initial_cash_balance' => $initialBalance,
                'total_revenue' => $totalRevenue,
                'total_available' => $totalAvailable,
                'total_operational_expenses' => $totalOperational,
                'total_backoffice_expenses' => $totalBackoffice,
                'total_expenses' => $totalExpenses,
                'ending_cash_balance' => $endingCashBalance,
                'total_bank_ending_balance' => $totalBankAug,
                'reconciliation_variance' => round($variance, 2),
                'is_reconciled' => AccountingBankReconciliation::where('period_id', $period->id)->exists() && $variance <= 1.0,
                'total_active_outstanding' => $totalOutstanding,
                'projected_ending_balance' => $projectedEndingBalance,
            ],
            'breakdown' => $breakdown,
        ];
    }
}
