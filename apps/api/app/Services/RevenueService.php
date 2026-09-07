<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Outlet;
use App\Models\RevenueDaily;
use App\Models\RevenueImport;
use App\Models\RevenuePayment;
use App\Models\RevenueStagingRow;
use App\Models\RevenueTarget;
use App\Services\Concerns\ResolvesScope;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class RevenueService
{
    use ResolvesScope;

    /** Header Excel yang diterima -> kolom kanonik */
    private const COLUMN_ALIASES = [
        'businessDate' => ['tanggal', 'tanggaltransaksi', 'businessdate', 'date', 'transactiondate'],
        'outletCode' => ['kodeoutlet', 'outlet', 'outletcode', 'kode'],
        'grossRevenue' => ['gross', 'grosssales', 'grossrevenue', 'omzetgross', 'omsetgross'],
        'netRevenue' => ['net', 'netsales', 'netrevenue', 'omzetnet', 'omsetnet'],
        'discountAmount' => ['diskon', 'discount', 'discountamount'],
        'returnAmount' => ['retur', 'return', 'returnamount'],
        'transactionCount' => ['transaksi', 'jumlahtransaksi', 'transactioncount', 'trx'],
    ];

    private const REQUIRED_COLUMNS = ['businessDate', 'outletCode', 'grossRevenue', 'netRevenue'];

    public function __construct(
        protected PolicyService $policy,
        protected AuditService $audit,
        protected XlsxReader $xlsx,
    ) {}

    // ---------------------------------------------------------------- read

    public function daily(array $user, array $filters): array
    {
        $date = $this->parseDate($filters['date'] ?? null, 'date');
        $divisionCode = $this->resolveDivisionCode($user, $filters['divisionCode'] ?? null);
        $outletId = $filters['outletId'] ?? null;

        $current = $this->aggregate($divisionCode, $outletId, $date, $date);
        $previous = $this->aggregate($divisionCode, $outletId, $date->subDays(7), $date->subDays(7));

        return [
            'date' => $date->format('Y-m-d'),
            'divisionCode' => $divisionCode,
            'outletId' => $outletId,
            'gross' => $this->money($current['gross']),
            'net' => $this->money($current['net']),
            'discount' => $this->money($current['discount']),
            'returns' => $this->money($current['returned']),
            'transactionCount' => (int) $current['trx'],
            'wow' => [
                'comparedTo' => $date->subDays(7)->format('Y-m-d'),
                'gross' => $this->money($previous['gross']),
                'net' => $this->money($previous['net']),
                'grossDeltaPercent' => $this->deltaPercent($current['gross'], $previous['gross']),
                'netDeltaPercent' => $this->deltaPercent($current['net'], $previous['net']),
            ],
        ];
    }

    public function mtd(array $user, array $filters): array
    {
        [$start, $endOfMonth] = $this->resolvePeriod($filters['period'] ?? null);
        $divisionCode = $this->resolveDivisionCode($user, $filters['divisionCode'] ?? null);
        $outletId = $filters['outletId'] ?? null;

        $today = CarbonImmutable::now()->startOfDay();
        $asOf = isset($filters['asOf'])
            ? $this->parseDate($filters['asOf'], 'asOf')
            : ($today->greaterThan($endOfMonth) ? $endOfMonth : ($today->lessThan($start) ? $start : $today));

        $current = $this->aggregate($divisionCode, $outletId, $start, $asOf);
        $thisWeek = $this->aggregate($divisionCode, $outletId, $asOf->subDays(6), $asOf);
        $lastWeek = $this->aggregate($divisionCode, $outletId, $asOf->subDays(13), $asOf->subDays(7));

        return [
            'period' => $start->format('Y-m'),
            'asOf' => $asOf->format('Y-m-d'),
            'divisionCode' => $divisionCode,
            'outletId' => $outletId,
            'gross' => $this->money($current['gross']),
            'net' => $this->money($current['net']),
            'discount' => $this->money($current['discount']),
            'returns' => $this->money($current['returned']),
            'transactionCount' => (int) $current['trx'],
            'wow' => [
                'currentWeek' => [
                    'from' => $asOf->subDays(6)->format('Y-m-d'),
                    'to' => $asOf->format('Y-m-d'),
                    'gross' => $this->money($thisWeek['gross']),
                    'net' => $this->money($thisWeek['net']),
                ],
                'previousWeek' => [
                    'from' => $asOf->subDays(13)->format('Y-m-d'),
                    'to' => $asOf->subDays(7)->format('Y-m-d'),
                    'gross' => $this->money($lastWeek['gross']),
                    'net' => $this->money($lastWeek['net']),
                ],
                'grossDeltaPercent' => $this->deltaPercent($thisWeek['gross'], $lastWeek['gross']),
                'netDeltaPercent' => $this->deltaPercent($thisWeek['net'], $lastWeek['net']),
            ],
        ];
    }

    /**
     * Rincian omzet per tenant/outlet + target dan statusnya.
     */
    public function tenants(array $user, array $filters): array
    {
        $divisionCode = $this->resolveDivisionCode($user, $filters['divisionCode'] ?? null);
        $from = $this->parseDate($filters['from'] ?? CarbonImmutable::now()->format('Y-m-01'), 'from');
        $to = $this->parseDate($filters['to'] ?? CarbonImmutable::now()->format('Y-m-d'), 'to');

        if ($to->lessThan($from)) {
            throw new ApiException('VALIDATION_ERROR', 'Rentang tanggal tidak valid: to lebih kecil dari from');
        }

        $facts = RevenueDaily::query()
            ->where('is_active', true)
            ->whereBetween('business_date', [$from->format('Y-m-d'), $to->format('Y-m-d')])
            ->when($divisionCode, fn ($q) => $q->where('division_code', $divisionCode))
            ->when($filters['outletId'] ?? null, fn ($q, $id) => $q->where('outlet_id', $id))
            ->groupBy('outlet_id')
            ->selectRaw('outlet_id, COALESCE(SUM(gross_revenue),0) as gross, COALESCE(SUM(net_revenue),0) as net, COALESCE(SUM(transaction_count),0) as trx')
            ->get()
            ->keyBy('outlet_id');

        // Target aktif (APPROVED) periode bulan `from` — target divisi = penjumlahan outlet
        $targets = RevenueTarget::query()
            ->where('status', 'APPROVED')
            ->where('period_month', $from->format('Y-m-01'))
            ->when($divisionCode, fn ($q) => $q->where('division_code', $divisionCode))
            ->get()
            ->keyBy('outlet_id');

        $outlets = Outlet::query()
            ->with('division')
            ->where('is_active', true)
            ->when($filters['outletId'] ?? null, fn ($q, $id) => $q->where('id', $id))
            ->get()
            ->filter(function (Outlet $outlet) use ($divisionCode, $user) {
                if ($divisionCode && $outlet->division?->code !== $divisionCode) {
                    return false;
                }

                // Lapis kedua anti-IDOR: outlet di luar scope user tidak pernah muncul
                return $this->policy->canAccessDivision($user, $outlet->division?->code);
            });

        $rows = [];
        foreach ($outlets as $outlet) {
            $fact = $facts->get($outlet->id);
            $target = $targets->get($outlet->id);
            $net = (float) ($fact->net ?? 0);
            $targetAmount = $target ? (float) $target->amount : null;
            $achievement = $targetAmount ? $this->percent($net, $targetAmount) : null;

            $rows[] = [
                'outletId' => $outlet->id,
                'outletCode' => $outlet->code,
                'outletName' => $outlet->name,
                'divisionCode' => $outlet->division?->code,
                'gross' => $this->money($fact->gross ?? 0),
                'net' => $this->money($net),
                'transactionCount' => (int) ($fact->trx ?? 0),
                'target' => $targetAmount === null ? null : $this->money($targetAmount),
                'achievementPercent' => $achievement,
                'status' => $this->tenantStatus($achievement),
            ];
        }

        usort($rows, fn ($a, $b) => (float) $b['net'] <=> (float) $a['net']);

        return [
            'period' => ['from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d')],
            'divisionCode' => $divisionCode,
            'tenants' => $rows,
            'totals' => [
                'gross' => $this->money(array_sum(array_map(fn ($r) => (float) $r['gross'], $rows))),
                'net' => $this->money(array_sum(array_map(fn ($r) => (float) $r['net'], $rows))),
                'target' => $this->money(array_sum(array_map(fn ($r) => (float) ($r['target'] ?? 0), $rows))),
            ],
        ];
    }

    // --------------------------------------------------------------- write

    /**
     * Input/edit omzet harian. Append-only: baris lama tidak pernah ditimpa,
     * koreksi membuat versi baru dan menandai versi lama superseded.
     */
    public function createDaily(array $user, array $payload): array
    {
        $outlet = $this->assertOutletInScope($user, $payload['outletId']);
        $date = $this->parseDate($payload['businessDate'], 'businessDate');

        $gross = (float) $payload['grossRevenue'];
        $net = (float) $payload['netRevenue'];
        $discount = (float) ($payload['discountAmount'] ?? 0);
        $return = (float) ($payload['returnAmount'] ?? 0);

        if ($net > $gross) {
            throw new ApiException('VALIDATION_ERROR', 'netRevenue tidak boleh melebihi grossRevenue', [
                ['field' => 'netRevenue', 'code' => 'GT_GROSS', 'message' => 'Net harus <= gross'],
            ]);
        }

        $payments = $this->normalizePayments($payload['payments'] ?? [], $net);

        return DB::transaction(function () use ($user, $outlet, $date, $gross, $net, $discount, $return, $payload, $payments) {
            $existing = RevenueDaily::query()
                ->where('outlet_id', $outlet->id)
                ->where('business_date', $date->format('Y-m-d'))
                ->where('is_active', true)
                ->first();

            $entry = RevenueDaily::create([
                'outlet_id' => $outlet->id,
                'division_code' => $outlet->division?->code,
                'business_date' => $date->format('Y-m-d'),
                'gross_revenue' => $gross,
                'net_revenue' => $net,
                'discount_amount' => $discount,
                'return_amount' => $return,
                'transaction_count' => (int) ($payload['transactionCount'] ?? 0),
                'version' => $existing ? $existing->version + 1 : 1,
                'is_active' => true,
                'entry_type' => $existing ? 'CORRECTION' : 'ENTRY',
                'source_import_id' => $payload['sourceImportId'] ?? null,
                'created_by_id' => $user['sub'] ?? null,
                'note' => $payload['note'] ?? null,
            ]);

            foreach ($payments as $method => $payment) {
                RevenuePayment::create([
                    'revenue_daily_id' => $entry->id,
                    'method' => $method,
                    'amount' => $payment['amount'],
                    'transaction_count' => $payment['transactionCount'],
                ]);
            }

            if ($existing) {
                $existing->update(['is_active' => false, 'superseded_by_id' => $entry->id]);
            }

            $this->audit->log([
                'actorId' => $user['sub'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => $user['role'] ?? null,
                'action' => $existing ? 'revenue.daily_corrected' : 'revenue.daily_created',
                'entity' => 'RevenueDaily',
                'entityId' => $entry->id,
                'divisionCode' => $entry->division_code,
                'metadata' => [
                    'outletCode' => $outlet->code,
                    'businessDate' => $date->format('Y-m-d'),
                    'version' => $entry->version,
                    'supersededId' => $existing?->id,
                ],
            ]);

            return $this->presentEntry($entry->fresh('payments'), $outlet, $existing?->id);
        });
    }

    /**
     * Batch upload .xlsx: parse -> validasi per baris -> post append-only.
     * Baris invalid membatalkan posting seluruh batch (atomic post).
     */
    public function batchUpload(array $user, UploadedFile $file, array $payload): array
    {
        $divisionCode = $this->resolveDivisionCode($user, $payload['divisionCode'] ?? null);
        if (! $divisionCode) {
            throw new ApiException('VALIDATION_ERROR', 'divisionCode wajib diisi untuk batch upload', [
                ['field' => 'divisionCode', 'code' => 'REQUIRED', 'message' => 'Pilih divisi tujuan'],
            ]);
        }
        $this->policy->assertDivisionScope($user, $divisionCode);

        $checksum = hash_file('sha256', $file->getRealPath());
        $duplicate = RevenueImport::query()
            ->where('checksum_sha256', $checksum)
            ->where('status', 'POSTED')
            ->first();
        if ($duplicate) {
            throw new ApiException(
                'IDEMPOTENCY_CONFLICT',
                "File dengan checksum sama sudah diposting (import {$duplicate->id})"
            );
        }

        $rows = $this->xlsx->read($file->getRealPath());
        if (count($rows) < 2) {
            throw new ApiException('IMPORT_ROW_INVALID', 'File tidak memiliki baris data');
        }

        $mapping = $this->mapHeader(array_shift($rows));
        $outlets = Outlet::with('division')->get()
            ->filter(fn (Outlet $o) => $o->division?->code === $divisionCode)
            ->keyBy(fn (Outlet $o) => strtoupper($o->code));

        $parsed = [];
        foreach ($rows as $index => $row) {
            $parsed[] = $this->validateRow($index + 2, $row, $mapping, $outlets);
        }

        $invalid = array_values(array_filter($parsed, fn ($r) => $r['validationStatus'] === 'INVALID'));

        return DB::transaction(function () use ($user, $file, $checksum, $divisionCode, $parsed, $invalid, $payload) {
            $import = RevenueImport::create([
                'division_code' => $divisionCode,
                'import_type' => 'DAILY',
                'source_type' => 'EXCEL',
                'file_name' => $file->getClientOriginalName(),
                'checksum_sha256' => $checksum,
                'period_month' => isset($payload['period'])
                    ? $this->resolvePeriod($payload['period'])[0]->format('Y-m-d')
                    : null,
                'status' => $invalid ? 'VALIDATED' : 'POSTED',
                'total_rows' => count($parsed),
                'valid_rows' => count($parsed) - count($invalid),
                'invalid_rows' => count($invalid),
                'uploaded_by_id' => $user['sub'] ?? null,
                'posted_at' => $invalid ? null : now(),
            ]);

            foreach ($parsed as $row) {
                RevenueStagingRow::create([
                    'revenue_import_id' => $import->id,
                    'row_number' => $row['rowNumber'],
                    'raw_data' => $row['raw'],
                    'outlet_code' => $row['outletCode'],
                    'business_date' => $row['businessDate'],
                    'gross_revenue' => $row['grossRevenue'],
                    'net_revenue' => $row['netRevenue'],
                    'validation_status' => $row['validationStatus'],
                    'errors' => $row['errors'] ?: null,
                ]);
            }

            $posted = 0;
            if (! $invalid) {
                foreach ($parsed as $row) {
                    $this->createDaily($user, [
                        'outletId' => $row['outletId'],
                        'businessDate' => $row['businessDate'],
                        'grossRevenue' => $row['grossRevenue'],
                        'netRevenue' => $row['netRevenue'],
                        'discountAmount' => $row['discountAmount'],
                        'returnAmount' => $row['returnAmount'],
                        'transactionCount' => $row['transactionCount'],
                        'sourceImportId' => $import->id,
                        'note' => 'Batch import '.$import->id,
                    ]);
                    $posted++;
                }
            }

            $this->audit->log([
                'actorId' => $user['sub'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => $user['role'] ?? null,
                'action' => $invalid ? 'revenue.batch_validated' : 'revenue.batch_posted',
                'entity' => 'RevenueImport',
                'entityId' => $import->id,
                'divisionCode' => $divisionCode,
                'metadata' => [
                    'fileName' => $import->file_name,
                    'totalRows' => $import->total_rows,
                    'invalidRows' => $import->invalid_rows,
                ],
            ]);

            return [
                'importId' => $import->id,
                'status' => $import->status,
                'divisionCode' => $divisionCode,
                'fileName' => $import->file_name,
                'checksum' => 'sha256:'.$import->checksum_sha256,
                'rowCounts' => [
                    'total' => $import->total_rows,
                    'valid' => $import->valid_rows,
                    'invalid' => $import->invalid_rows,
                    'posted' => $posted,
                ],
                'errors' => array_map(fn ($r) => [
                    'rowNumber' => $r['rowNumber'],
                    'outletCode' => $r['outletCode'],
                    'errors' => $r['errors'],
                ], $invalid),
            ];
        });
    }

    // -------------------------------------------------------------- helpers

    /** @return array{gross: float, net: float, discount: float, returned: float, trx: int} */
    protected function aggregate(?string $divisionCode, ?string $outletId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $row = RevenueDaily::query()
            ->where('is_active', true)
            ->whereBetween('business_date', [$from->format('Y-m-d'), $to->format('Y-m-d')])
            ->when($divisionCode, fn ($q) => $q->where('division_code', $divisionCode))
            ->when($outletId, fn ($q) => $q->where('outlet_id', $outletId))
            ->selectRaw('COALESCE(SUM(gross_revenue),0) as gross, COALESCE(SUM(net_revenue),0) as net, COALESCE(SUM(discount_amount),0) as discount, COALESCE(SUM(return_amount),0) as returned, COALESCE(SUM(transaction_count),0) as trx')
            ->first();

        return [
            'gross' => (float) ($row->gross ?? 0),
            'net' => (float) ($row->net ?? 0),
            'discount' => (float) ($row->discount ?? 0),
            'returned' => (float) ($row->returned ?? 0),
            'trx' => (int) ($row->trx ?? 0),
        ];
    }

    protected function deltaPercent(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }

    protected function tenantStatus(?float $achievement): string
    {
        if ($achievement === null) {
            return 'NO_TARGET';
        }
        if ($achievement >= 100) {
            return 'OVER_TARGET';
        }
        if ($achievement >= 85) {
            return 'ON_TRACK';
        }

        return 'MONITOR';
    }

    protected function assertOutletInScope(array $user, string $outletId): Outlet
    {
        $outlet = Outlet::with('division')->find($outletId);
        if (! $outlet || ! $outlet->is_active) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet tidak ditemukan atau tidak aktif');
        }

        if ($outlet->division?->code === 'ACC') {
            throw new ApiException('SCOPE_VIOLATION', 'Divisi Accounting (ACC) bukan divisi operasional retail omzet');
        }

        $this->policy->assertDivisionScope($user, $outlet->division?->code, true);

        return $outlet;
    }

    /**
     * @param  array<int, array{method: string, amount: float|string, transactionCount?: int}>  $payments
     * @return array<string, array{amount: float, transactionCount: int}>
     */
    protected function normalizePayments(array $payments, float $net): array
    {
        if ($payments === []) {
            return [];
        }

        $result = [];
        foreach ($payments as $payment) {
            $method = strtoupper((string) ($payment['method'] ?? ''));
            if (! in_array($method, RevenuePayment::METHODS, true)) {
                throw new ApiException('VALIDATION_ERROR', "Metode bayar {$method} tidak dikenal", [
                    ['field' => 'payments.method', 'code' => 'INVALID', 'message' => 'Gunakan CASH/QRIS/EDC/TRANSFER'],
                ]);
            }

            $amount = (float) ($payment['amount'] ?? 0);
            if ($amount < 0) {
                throw new ApiException('VALIDATION_ERROR', 'Nominal metode bayar tidak boleh negatif');
            }

            $result[$method] = [
                'amount' => ($result[$method]['amount'] ?? 0) + $amount,
                'transactionCount' => ($result[$method]['transactionCount'] ?? 0) + (int) ($payment['transactionCount'] ?? 0),
            ];
        }

        $sum = array_sum(array_column($result, 'amount'));
        if (abs($sum - $net) > 0.01) {
            throw new ApiException('VALIDATION_ERROR', 'Total metode bayar harus sama dengan netRevenue', [
                ['field' => 'payments', 'code' => 'SUM_MISMATCH', 'message' => 'Selisih '.$this->money($sum - $net)],
            ]);
        }

        return $result;
    }

    protected function presentEntry(RevenueDaily $entry, Outlet $outlet, ?string $supersededId): array
    {
        return [
            'id' => $entry->id,
            'outletId' => $outlet->id,
            'outletCode' => $outlet->code,
            'divisionCode' => $entry->division_code,
            'businessDate' => $entry->business_date->format('Y-m-d'),
            'gross' => $this->money($entry->gross_revenue),
            'net' => $this->money($entry->net_revenue),
            'discount' => $this->money($entry->discount_amount),
            'returns' => $this->money($entry->return_amount),
            'transactionCount' => $entry->transaction_count,
            'version' => $entry->version,
            'entryType' => $entry->entry_type,
            'supersededId' => $supersededId,
            'payments' => $entry->payments->map(fn ($p) => [
                'method' => $p->method,
                'amount' => $this->money($p->amount),
                'transactionCount' => $p->transaction_count,
            ])->values()->all(),
        ];
    }

    /**
     * @param  array<int, string>  $header
     * @return array<string, int> kolom kanonik -> index
     */
    protected function mapHeader(array $header): array
    {
        $mapping = [];
        foreach ($header as $index => $label) {
            $normalized = preg_replace('/[^a-z0-9]/', '', strtolower((string) $label));
            foreach (self::COLUMN_ALIASES as $canonical => $aliases) {
                if (in_array($normalized, $aliases, true) && ! isset($mapping[$canonical])) {
                    $mapping[$canonical] = $index;
                }
            }
        }

        $missing = array_values(array_diff(self::REQUIRED_COLUMNS, array_keys($mapping)));
        if ($missing) {
            throw new ApiException(
                'VALIDATION_ERROR',
                'Kolom wajib tidak ditemukan pada file: '.implode(', ', $missing),
                array_map(fn ($c) => ['field' => $c, 'code' => 'MISSING_COLUMN', 'message' => 'Kolom tidak ada di header'], $missing)
            );
        }

        return $mapping;
    }

    /**
     * @param  array<int, string>  $row
     * @param  array<string, int>  $mapping
     */
    protected function validateRow(int $rowNumber, array $row, array $mapping, $outlets): array
    {
        $value = fn (string $key) => isset($mapping[$key]) ? trim((string) ($row[$mapping[$key]] ?? '')) : '';
        $errors = [];

        $outletCode = strtoupper($value('outletCode'));
        $outlet = $outlets->get($outletCode);
        if (! $outlet) {
            $errors[] = ['field' => 'outletCode', 'code' => 'OUTLET_NOT_IN_SCOPE', 'message' => "Outlet {$outletCode} tidak ada pada divisi ini"];
        }

        $businessDate = $this->parseSheetDate($value('businessDate'));
        if (! $businessDate) {
            $errors[] = ['field' => 'businessDate', 'code' => 'INVALID_DATE', 'message' => 'Gunakan format YYYY-MM-DD'];
        }

        $gross = $this->parseNumber($value('grossRevenue'));
        $net = $this->parseNumber($value('netRevenue'));

        if ($gross === null || $gross < 0) {
            $errors[] = ['field' => 'grossRevenue', 'code' => 'INVALID_AMOUNT', 'message' => 'Gross harus angka >= 0'];
        }
        if ($net === null || $net < 0) {
            $errors[] = ['field' => 'netRevenue', 'code' => 'INVALID_AMOUNT', 'message' => 'Net harus angka >= 0'];
        }
        if ($gross !== null && $net !== null && $net > $gross) {
            $errors[] = ['field' => 'netRevenue', 'code' => 'GT_GROSS', 'message' => 'Net tidak boleh melebihi gross'];
        }

        return [
            'rowNumber' => $rowNumber,
            'raw' => $row,
            'outletId' => $outlet?->id,
            'outletCode' => $outletCode ?: null,
            'businessDate' => $businessDate,
            'grossRevenue' => $gross,
            'netRevenue' => $net,
            'discountAmount' => $this->parseNumber($value('discountAmount')) ?? 0,
            'returnAmount' => $this->parseNumber($value('returnAmount')) ?? 0,
            'transactionCount' => (int) ($this->parseNumber($value('transactionCount')) ?? 0),
            'validationStatus' => $errors ? 'INVALID' : 'VALID',
            'errors' => $errors,
        ];
    }

    protected function parseNumber(string $raw): ?float
    {
        if ($raw === '') {
            return null;
        }

        $clean = str_replace([' ', 'Rp', 'rp', ','], '', $raw);

        return is_numeric($clean) ? (float) $clean : null;
    }

    /** Excel bisa menyimpan tanggal sebagai serial number (epoch 1899-12-30). */
    protected function parseSheetDate(string $raw): ?string
    {
        if ($raw === '') {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $raw)) {
            return substr($raw, 0, 10);
        }

        if (is_numeric($raw)) {
            return CarbonImmutable::create(1899, 12, 30)->addDays((int) $raw)->format('Y-m-d');
        }

        return null;
    }
}
