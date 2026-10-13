<?php

namespace App\Services;

use App\Models\AccountingOutstanding;
use App\Models\AccountingOutstandingPayment;
use App\Models\AccountingPeriod;
use App\Models\AccountingAccount;
use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use App\Exceptions\ApiException;

class AccOutstandingService
{
    public function getOutstandings(Division $division, array $filters = []): array
    {
        $periodId = $filters['period_id'] ?? null;
        if (! $periodId) {
            $period = AccountingPeriod::where('division_id', $division->id)
                ->latest('period_month')
                ->first();
            $periodId = $period?->id;
        }

        $query = AccountingOutstanding::with(['account', 'outlet', 'payments'])
            ->where('division_id', $division->id);

        if ($periodId) {
            $query->where('period_id', $periodId);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['direction']) && in_array($filters['direction'], ['PAYABLE', 'RECEIVABLE'], true)) {
            $query->where('direction', $filters['direction']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.strtolower($filters['search']).'%';
            $query->where(function (Builder $q) use ($search) {
                $q->whereRaw('LOWER(code) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(description) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(category_name) LIKE ?', [$search]);
            });
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        // Calculate KPIs
        $allItems = AccountingOutstanding::where('division_id', $division->id)
            ->when($periodId, fn ($q) => $q->where('period_id', $periodId))
            ->get();

        $activeItems = $allItems->whereNotIn('status', ['paid', 'cancelled']);
        $activePayables = $activeItems->where('direction', 'PAYABLE');
        $activeReceivables = $activeItems->where('direction', 'RECEIVABLE');
        $totalActivePayable = (int) $activePayables->sum('remaining_amount');
        $totalActiveReceivable = (int) $activeReceivables->sum('remaining_amount');
        $totalSettled = (int) $allItems->sum('paid_amount');

        $period = AccountingPeriod::where('division_id', $division->id)->find($periodId);
        $actualCashBalance = $period ? app(AccCashflowReportService::class)->getCashflowReport($division, $period->period_month->format('Y-m-d'))['kpis']['ending_cash_balance'] : 0;

        $projectedBalance = $actualCashBalance - $totalActivePayable + $totalActiveReceivable;

        return [
            'kpis' => [
                'total_active_outstanding' => $totalActivePayable,
                'total_active_payable' => $totalActivePayable,
                'total_active_receivable' => $totalActiveReceivable,
                'total_paid' => $totalSettled,
                'total_items_count' => $allItems->count(),
                'active_items_count' => $activeItems->count(),
                'actual_cash_balance' => $actualCashBalance,
                'projected_ending_balance' => $projectedBalance,
            ],
            'items' => $items->map(function ($it) {
                return [
                    'id' => $it->id,
                    'code' => $it->code,
                    'period_id' => $it->period_id,
                    'direction' => $it->direction,
                    'counterparty_name' => $it->counterparty_name,
                    'document_number' => $it->document_number,
                    'description' => $it->description,
                    'amount' => $it->amount,
                    'paid_amount' => $it->paid_amount,
                    'remaining_amount' => $it->remaining_amount,
                    'due_date' => $it->due_date?->format('Y-m-d'),
                    'status' => $it->status,
                    'version' => $it->version,
                    'category_name' => $it->category_name,
                    'account_name' => $it->account?->display_name ?? '-',
                    'outlet_name' => $it->outlet?->name ?? '-',
                    'cancelled_at' => $it->cancelled_at?->toIso8601String(),
                    'cancellation_reason' => $it->cancellation_reason,
                    'created_at' => $it->created_at?->toIso8601String(),
                    'payments' => $it->payments->map(fn ($p) => [
                        'id' => $p->id,
                        'payment_date' => $p->payment_date?->format('Y-m-d'),
                        'amount' => $p->amount,
                        'notes' => $p->notes,
                    ]),
                ];
            }),
        ];
    }

    public function create(Division $division, array $data, User $user): AccountingOutstanding
    {
        $period = AccountingPeriod::where('division_id', $division->id)->find($data['period_id']);
        if (! $period) {
            throw new InvalidArgumentException('Periode Accounting tidak ditemukan pada divisi ini.');
        }
        if (! in_array(strtolower($period->status), ['draft', 'reopened', 'needs_correction'], true)) {
            throw new InvalidArgumentException('Periode Accounting terkunci untuk pencatatan hutang-piutang.');
        }

        $amount = (int) $data['amount'];
        if ($amount <= 0) {
            throw new InvalidArgumentException('Nominal kewajiban harus lebih besar dari 0.');
        }

        if (! empty($data['account_id']) && ! AccountingAccount::where('division_id', $division->id)->whereKey($data['account_id'])->exists()) {
            throw new InvalidArgumentException('Rekening Accounting tidak tersedia pada divisi ini.');
        }

        $direction = $data['direction'];
        $prefix = $direction === 'RECEIVABLE' ? 'AR' : 'AP';
        $code = sprintf('%s-%s-%s', $prefix, $period->period_month->format('Ym'), strtoupper(substr(str_replace('-', '', (string) Str::uuid()), 0, 6)));

        return AccountingOutstanding::create([
            'id' => (string) Str::uuid(),
            'division_id' => $division->id,
            'period_id' => $period->id,
            'account_id' => $data['account_id'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'outlet_id' => $data['outlet_id'] ?? null,
            'code' => $code,
            'direction' => $direction,
            'counterparty_name' => trim($data['counterparty_name']),
            'document_number' => isset($data['document_number']) ? trim($data['document_number']) : null,
            'description' => trim($data['description']),
            'amount' => $amount,
            'paid_amount' => 0,
            'remaining_amount' => $amount,
            'due_date' => $data['due_date'],
            'status' => 'unpaid',
            'version' => 1,
            'category_name' => $data['category_name'] ?? null,
            'created_by_id' => $user->id,
        ]);
    }

    public function recordPayment(Division $division, string $id, array $data, User $user): array
    {
        return DB::transaction(function () use ($division, $id, $data, $user) {
            /** @var AccountingOutstanding $item */
            $item = AccountingOutstanding::where('division_id', $division->id)->lockForUpdate()->findOrFail($id);

            if ((int) $item->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Data hutang-piutang sudah berubah. Muat ulang sebelum mencatat realisasi.', null, 409);
            }

            if (! empty($data['account_id']) && ! AccountingAccount::where('division_id', $division->id)->whereKey($data['account_id'])->exists()) {
                throw new InvalidArgumentException('Rekening realisasi tidak tersedia pada Divisi Accounting.');
            }

            if (in_array($item->status, ['paid', 'cancelled'])) {
                throw new InvalidArgumentException("Kewajiban dengan status '{$item->status}' tidak dapat dibayar.");
            }

            $payAmount = (int) $data['amount'];
            if ($payAmount <= 0) {
                throw new InvalidArgumentException('Nominal pembayaran harus lebih besar dari 0.');
            }

            if ($payAmount > $item->remaining_amount) {
                throw new InvalidArgumentException('Nominal pembayaran melebihi sisa tagihan ('.$item->remaining_amount.').');
            }

            $newPaid = $item->paid_amount + $payAmount;
            $newRemaining = $item->remaining_amount - $payAmount;
            $newStatus = $newRemaining <= 0 ? 'paid' : 'partial';

            $item->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $newStatus,
                'updated_by_id' => $user->id,
                'version' => $item->version + 1,
            ]);

            $payment = AccountingOutstandingPayment::create([
                'id' => (string) Str::uuid(),
                'outstanding_id' => $item->id,
                'account_id' => $data['account_id'] ?? $item->account_id,
                'payment_date' => $data['payment_date'] ?? now()->format('Y-m-d'),
                'amount' => $payAmount,
                'notes' => trim($data['notes']),
                'created_by_id' => $user->id,
            ]);

            return [
                'outstanding' => $item->fresh(['payments', 'account']),
                'payment' => $payment,
            ];
        });
    }

    public function cancel(Division $division, string $id, string $reason, int $version, User $user): AccountingOutstanding
    {
        return DB::transaction(function () use ($division, $id, $reason, $version, $user) {
            /** @var AccountingOutstanding $item */
            $item = AccountingOutstanding::where('division_id', $division->id)->lockForUpdate()->findOrFail($id);
            if ((int) $item->version !== $version) {
                throw new ApiException('VERSION_CONFLICT', 'Data hutang-piutang sudah berubah. Muat ulang sebelum membatalkan.', null, 409);
            }
            if ($item->status === 'paid' || $item->paid_amount > 0) {
                throw new InvalidArgumentException('Dokumen yang sudah memiliki realisasi tidak dapat dibatalkan. Gunakan proses pembalikan yang terpisah.');
            }
            $item->update(['status' => 'cancelled', 'cancelled_at' => now(), 'cancelled_by_id' => $user->id,
                'cancellation_reason' => trim($reason), 'updated_by_id' => $user->id, 'version' => $item->version + 1]);

            return $item->fresh();
        });
    }
}
