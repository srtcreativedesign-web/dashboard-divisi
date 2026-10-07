<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;

class DashboardService
{
    public function __construct(private PolicyService $policy) {}

    public function operations(string $month, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'ACC');
        $this->policy->assertCapability($user, 'view:acc_detail');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month, 'Asia/Jakarta');
        $query = Voucher::where('division_code', 'ACC')->whereBetween('voucher_date', [$start->toDateString(), $start->endOfMonth()->toDateString()]);
        $counts = array_fill_keys(['draft', 'correction', 'submitted', 'pending_approval', 'approved'], 0);
        foreach ((clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->get() as $row) {
            $counts[$row->status] = (int) $row->total;
        }
        $approved = 0;
        $paid = 0;
        $remaining = 0;
        $unpaidCount = 0;
        $partialCount = 0;
        $paidCount = 0;
        $overdue = 0;
        $due = [];
        $today = CarbonImmutable::now('Asia/Jakarta')->toDateString();
        $records = (clone $query)->where('status', 'approved')->withSum(['payments' => fn ($q) => $q->where('status', 'recorded')], 'amount_cents')
            ->orderBy('due_date')->orderBy('id')->cursor();
        foreach ($records as $v) {
            $v->payments_sum_amount_cents ??= 0;
            $summary = VoucherPaymentService::summary($v);
            $amount = VoucherPaymentService::cents($v->amount);
            $recorded = VoucherPaymentService::cents($summary['paid_amount']);
            $balance = $amount - $recorded;
            if ($balance < 0 || $approved > PHP_INT_MAX - $amount) {
                throw new ApiException('SOURCE_DATA_UNAVAILABLE', 'Total voucher belum dapat dihitung.');
            }
            $approved += $amount;
            $paid += $recorded;
            $remaining += $balance;
            if ($balance === 0) {
                $paidCount++;

                continue;
            }
            $unpaidCount++;
            if ($recorded > 0) {
                $partialCount++;
            }
            if ($v->due_date < $today) {
                $overdue++;
            }
            if (count($due) < 5) {
                $due[] = ['id' => $v->id, 'source_reference' => $v->source_reference, 'outlet_name' => $v->outlet_name,
                    'source_division_code' => $v->source_division_code, 'due_date' => $v->due_date, 'remaining_amount' => $summary['remaining_amount']];
            }
        }

        return ['month' => $month, 'as_of' => CarbonImmutable::now('Asia/Jakarta')->toIso8601String(), 'counts' => $counts,
            'total' => array_sum($counts), 'approved_amount' => VoucherPaymentService::money($approved),
            'paid_amount' => VoucherPaymentService::money($paid), 'remaining_amount' => VoucherPaymentService::money($remaining),
            'unpaid_count' => $unpaidCount, 'partial_count' => $partialCount, 'paid_count' => $paidCount, 'overdue_count' => $overdue, 'due_vouchers' => $due];
    }
}
