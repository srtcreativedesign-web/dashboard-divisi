<?php

namespace App\Services;

use App\Models\AccountingBankReconciliation;
use App\Models\AccountingCategory;
use App\Models\AccountingOutstanding;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use Illuminate\Database\Eloquent\Builder;

class AccCashflowReportService
{
    public function getCashflowReport(Division $division, ?string $periodMonth = null, bool $includeComparison = true): array
    {
        $period = $this->resolvePeriod($division, $periodMonth);
        $initialBalance = (float) AccountingBankReconciliation::where('division_id', $division->id)
            ->where('period_id', $period->id)->sum('jul_balance');

        $categories = AccountingCategory::all();
        $trxGrouped = AccountingTransaction::where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->whereNull('cancelled_at')->where('is_draft', false)
            ->selectRaw('category_id, SUM(credit_amount) as total_credit, SUM(debit_amount) as total_debit, COUNT(*) as transaction_count')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $breakdown = ['revenue' => [], 'operational' => [], 'backoffice' => []];
        foreach ($categories as $category) {
            $totals = $trxGrouped->get($category->id);
            if (! $totals) {
                continue;
            }
            $group = $this->resolveGroup($category->code, (float) $totals->total_debit, (float) $totals->total_credit);
            $amount = $this->resolveAmount($group, (float) $totals->total_debit, (float) $totals->total_credit);
            $breakdown[$group][] = [
                'code' => $category->code,
                'name' => $category->name,
                'amount' => $amount,
                'transaction_count' => (int) $totals->transaction_count,
            ];
        }

        $totalRevenue = array_sum(array_column($breakdown['revenue'], 'amount'));
        $totalOperational = array_sum(array_column($breakdown['operational'], 'amount'));
        $totalBackoffice = array_sum(array_column($breakdown['backoffice'], 'amount'));
        $totalAvailable = $initialBalance + $totalRevenue;
        $totalExpenses = $totalOperational + $totalBackoffice;
        $endingCashBalance = $totalAvailable - $totalExpenses;

        $bankQuery = AccountingBankReconciliation::where('division_id', $division->id)->where('period_id', $period->id);
        $bankAccountCount = (clone $bankQuery)->count();
        $unverifiedBankCount = (clone $bankQuery)->where('is_verified', false)->count();
        $totalBankEnding = (float) (clone $bankQuery)->sum('aug_balance');
        $variance = abs($totalBankEnding - $endingCashBalance);

        $activeOutstanding = AccountingOutstanding::where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->get();
        $totalOutstanding = (int) $activeOutstanding->where('direction', 'PAYABLE')->sum('remaining_amount');
        $totalReceivable = (int) $activeOutstanding->where('direction', 'RECEIVABLE')->sum('remaining_amount');

        $transactionBase = AccountingTransaction::where('division_id', $division->id)
            ->where('period_id', $period->id)->whereNull('cancelled_at');
        $postedTransactionCount = (clone $transactionBase)->where('is_draft', false)->count();
        $draftTransactionCount = (clone $transactionBase)->where('is_draft', true)->count();
        $missingAttachmentCount = (clone $transactionBase)->where('is_draft', false)->doesntHave('attachments')->count();
        $exceptionCount = $draftTransactionCount + $missingAttachmentCount + $unverifiedBankCount + ($bankAccountCount === 0 || $variance > 1.0 ? 1 : 0);

        $result = [
            'period' => [
                'id' => $period->id,
                'period_month' => $period->period_month->format('Y-m-d'),
                'status' => $period->status,
            ],
            'kpis' => [
                'initial_cash_balance' => $initialBalance,
                'total_revenue' => $totalRevenue,
                'total_available' => $totalAvailable,
                'total_operational_expenses' => $totalOperational,
                'total_backoffice_expenses' => $totalBackoffice,
                'total_expenses' => $totalExpenses,
                'ending_cash_balance' => $endingCashBalance,
                'total_bank_ending_balance' => $totalBankEnding,
                'reconciliation_variance' => round($variance, 2),
                'is_reconciled' => $bankAccountCount > 0 && $unverifiedBankCount === 0 && $variance <= 1.0,
                'total_active_outstanding' => $totalOutstanding,
                'total_active_receivable' => $totalReceivable,
                'projected_ending_balance' => $endingCashBalance - $totalOutstanding + $totalReceivable,
            ],
            'quality' => [
                'posted_transaction_count' => $postedTransactionCount,
                'draft_transaction_count' => $draftTransactionCount,
                'missing_attachment_count' => $missingAttachmentCount,
                'bank_account_count' => $bankAccountCount,
                'unverified_bank_count' => $unverifiedBankCount,
                'exception_count' => $exceptionCount,
                'is_complete' => $exceptionCount === 0,
            ],
            'breakdown' => $breakdown,
            'comparison' => null,
        ];

        if ($includeComparison) {
            $previousPeriod = AccountingPeriod::where('division_id', $division->id)
                ->where('period_month', '<', $period->period_month)
                ->latest('period_month')->first();
            if ($previousPeriod) {
                $previous = $this->getCashflowReport($division, $previousPeriod->period_month->format('Y-m-d'), false);
                $result['comparison'] = $this->buildComparison($result, $previous);
            }
        }

        return $result;
    }

    public function getCashflowDetails(Division $division, array $filters): array
    {
        $period = $this->resolvePeriod($division, $filters['period_month'] ?? null);
        $query = AccountingTransaction::with(['category', 'account', 'outlet'])
            ->withCount('attachments')
            ->where('division_id', $division->id)
            ->where('period_id', $period->id)
            ->whereNull('cancelled_at')
            ->where('is_draft', false);

        if (! empty($filters['group'])) {
            $prefix = match ($filters['group']) {
                'revenue' => 'B', 'operational' => 'C', 'backoffice' => 'D', default => null,
            };
            if ($prefix) {
                $query->whereHas('category', fn (Builder $builder) => $builder->where('code', 'like', $prefix.'%'));
            }
        }
        if (! empty($filters['category_code'])) {
            $query->whereHas('category', fn (Builder $builder) => $builder->where('code', $filters['category_code']));
        }
        if (! empty($filters['search'])) {
            $search = '%'.strtolower(trim($filters['search'])).'%';
            $query->where(function (Builder $builder) use ($search) {
                $builder->whereRaw('LOWER(description) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(reference_no) LIKE ?', [$search])
                    ->orWhereHas('category', fn (Builder $category) => $category->whereRaw('LOWER(code) LIKE ?', [$search])->orWhereRaw('LOWER(name) LIKE ?', [$search]))
                    ->orWhereHas('account', fn (Builder $account) => $account->whereRaw('LOWER(code) LIKE ?', [$search])->orWhereRaw('LOWER(display_name) LIKE ?', [$search]))
                    ->orWhereHas('outlet', fn (Builder $outlet) => $outlet->whereRaw('LOWER(name) LIKE ?', [$search]));
            });
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $total = (clone $query)->count();
        $items = $query->orderByDesc('transaction_date')->orderByDesc('created_at')->forPage($page, $perPage)->get();

        return [
            'period' => ['id' => $period->id, 'period_month' => $period->period_month->format('Y-m-d'), 'status' => $period->status],
            'items' => $items->map(function (AccountingTransaction $transaction) {
                $debit = (float) $transaction->debit_amount;
                $credit = (float) $transaction->credit_amount;
                $group = $this->resolveGroup((string) $transaction->category?->code, $debit, $credit);

                return [
                    'id' => $transaction->id,
                    'transaction_date' => $transaction->transaction_date?->toDateString(),
                    'reference_no' => $transaction->reference_no,
                    'description' => $transaction->description,
                    'category_code' => $transaction->category?->code,
                    'category_name' => $transaction->category?->name,
                    'account_code' => $transaction->account?->code,
                    'account_name' => $transaction->account?->display_name,
                    'outlet_name' => $transaction->outlet?->name,
                    'group' => $group,
                    'debit_amount' => $debit,
                    'credit_amount' => $credit,
                    'cashflow_amount' => $this->resolveAmount($group, $debit, $credit),
                    'has_attachment' => $transaction->attachments_count > 0,
                ];
            })->values()->all(),
            'meta' => ['total' => $total, 'per_page' => $perPage, 'current_page' => $page, 'last_page' => max((int) ceil($total / $perPage), 1)],
        ];
    }

    private function resolvePeriod(Division $division, ?string $periodMonth): AccountingPeriod
    {
        if ($periodMonth && preg_match('/^\d{4}-\d{2}$/D', $periodMonth)) {
            $periodMonth .= '-01';
        }

        return AccountingPeriod::where('division_id', $division->id)
            ->when($periodMonth, fn ($query) => $query->whereDate('period_month', $periodMonth))
            ->latest('period_month')->firstOrFail();
    }

    private function resolveGroup(string $categoryCode, float $debit, float $credit): string
    {
        return match (strtoupper(substr($categoryCode, 0, 1))) {
            'B' => 'revenue', 'C' => 'operational', 'D' => 'backoffice',
            default => $debit >= $credit ? 'revenue' : 'operational',
        };
    }

    private function resolveAmount(string $group, float $debit, float $credit): float
    {
        return $group === 'revenue' ? $debit - $credit : $credit - $debit;
    }

    private function buildComparison(array $current, array $previous): array
    {
        $metrics = [];
        foreach (['total_revenue', 'total_expenses', 'ending_cash_balance', 'projected_ending_balance'] as $key) {
            $currentValue = (float) $current['kpis'][$key];
            $previousValue = (float) $previous['kpis'][$key];
            $delta = $currentValue - $previousValue;
            $metrics[$key] = [
                'current' => $currentValue,
                'previous' => $previousValue,
                'delta' => $delta,
                'delta_percentage' => abs($previousValue) > 0.00001 ? round(($delta / abs($previousValue)) * 100, 2) : null,
            ];
        }

        $currentCategories = collect(array_merge(...array_values($current['breakdown'])))->keyBy('code');
        $previousCategories = collect(array_merge(...array_values($previous['breakdown'])))->keyBy('code');
        $movements = $currentCategories->keys()->merge($previousCategories->keys())->unique()->map(function ($code) use ($currentCategories, $previousCategories) {
            $currentItem = $currentCategories->get($code);
            $previousItem = $previousCategories->get($code);
            $currentAmount = (float) ($currentItem['amount'] ?? 0);
            $previousAmount = (float) ($previousItem['amount'] ?? 0);

            return [
                'code' => $code,
                'name' => $currentItem['name'] ?? $previousItem['name'] ?? $code,
                'current' => $currentAmount,
                'previous' => $previousAmount,
                'delta' => $currentAmount - $previousAmount,
            ];
        })->sortByDesc(fn (array $item) => abs($item['delta']))->take(5)->values()->all();

        return [
            'previous_period_month' => $previous['period']['period_month'],
            'metrics' => $metrics,
            'top_category_movements' => $movements,
        ];
    }
}
