<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\Accounting\OmzetService;
use App\Services\AuditService;
use App\Services\PolicyService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportStagingService
{
    private const BLOCKING_ISSUES = ['INVALID_VALUE', 'SHIFT_SUM_MISMATCH'];

    public function __construct(
        private OmzetService $omzet,
        private PolicyService $policy,
        private AuditService $audit,
    ) {}

    public function outlet(string $outletId, array $user): array
    {
        $outlet = collect($this->omzet->outlets($user))->firstWhere('id', $outletId);
        if (! $outlet || ($outlet['divisionCode'] ?? null) !== 'CELL') {
            throw new ApiException('VALIDATION_ERROR', 'Pilih outlet aktif dari Divisi Cellular.');
        }

        return $outlet;
    }

    public function stage(array $preview, array $file, string $outletId, array $user): array
    {
        $this->policy->assertCapability($user, 'preview:cellular_report');
        $outlet = $this->outlet($outletId, $user);

        return DB::transaction(function () use ($preview, $file, $outlet, $user) {
            $id = (string) Str::uuid();
            DB::table('acc_cellular_import_batches')->insert([
                'id' => $id, 'division_code' => 'ACC', 'outlet_id' => $outlet['id'], 'outlet_name' => $outlet['name'],
                'source_division_code' => $outlet['divisionCode'], 'profile' => $preview['profile'],
                'profile_version' => $preview['profile_version'], 'period' => $preview['month'],
                'original_name' => $file['name'], 'sha256' => $file['sha256'], 'status' => 'staged',
                'summary' => json_encode($preview['summary']), 'issues' => json_encode($preview['issues']),
                'created_by' => $user['sub'], 'version' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);

            $globalIssues = array_values(array_filter($preview['issues'], fn ($issue) => empty($issue['date'])));
            foreach ($preview['rows'] as $row) {
                $issues = array_values(array_filter($preview['issues'], fn ($issue) => ($issue['date'] ?? null) === $row['date']));
                $allIssues = [...$globalIssues, ...$issues];
                $blocking = array_intersect(self::BLOCKING_ISSUES, array_column($allIssues, 'code'));
                $formula = collect($row['values'])->contains(fn ($value) => (bool) ($value['cached'] ?? false));
                DB::table('acc_cellular_import_rows')->insert([
                    'id' => (string) Str::uuid(), 'batch_id' => $id, 'business_date' => $row['date'],
                    'validation_status' => $blocking ? 'error' : ($allIssues || $formula ? 'warning' : 'valid'),
                    'payload' => json_encode(array_map(fn ($value) => $value['value'], $row['values'])),
                    'lineage' => json_encode(['values' => $row['values'], 'references' => $row['references'] ?? []]),
                    'issues' => json_encode($allIssues), 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
            $this->event($id, 'staged', $user, ['profile' => $preview['profile'], 'period' => $preview['month'], 'sha256' => $file['sha256']]);

            return $this->detail($id, $user);
        });
    }

    public function list(array $filters, array $user): array
    {
        $this->policy->assertCapability($user, 'preview:cellular_report');
        $this->outlet($filters['outlet_id'], $user);
        $query = DB::table('acc_cellular_import_batches')->where('division_code', 'ACC')
            ->where('outlet_id', $filters['outlet_id'])->where('period', $filters['month']);
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderByDesc('created_at')->get()->map(fn ($batch) => $this->presentBatch($batch))->all();
    }

    public function detail(string $id, array $user): array
    {
        $this->policy->assertCapability($user, 'preview:cellular_report');
        $batch = DB::table('acc_cellular_import_batches')->where('division_code', 'ACC')->where('id', $id)->first();
        if (! $batch) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Batch staging tidak ditemukan.');
        }
        $this->outlet($batch->outlet_id, $user);
        $rows = DB::table('acc_cellular_import_rows')->where('batch_id', $id)->orderBy('business_date')->get()->map(function ($row) {
            $row->payload = json_decode($row->payload, true);
            $row->lineage = json_decode($row->lineage, true);
            $row->issues = json_decode($row->issues, true);

            return $row;
        })->all();

        return $this->presentBatch($batch) + ['rows' => $rows];
    }

    public function commit(array $batchIds, bool $acknowledgeWarnings, array $user): array
    {
        $this->policy->assertCapability($user, 'write:omzet');
        if (count($batchIds) !== 2) {
            throw new ApiException('VALIDATION_ERROR', 'Commit membutuhkan tepat satu batch Harian dan satu batch Shift.');
        }
        if (count($batchIds) !== count(array_unique($batchIds))) {
            throw new ApiException('VALIDATION_ERROR', 'Batch staging tidak boleh dipilih lebih dari sekali.');
        }

        return DB::transaction(function () use ($batchIds, $acknowledgeWarnings, $user) {
            $batches = DB::table('acc_cellular_import_batches')->whereIn('id', $batchIds)->lockForUpdate()->get();
            if ($batches->count() !== count($batchIds) || $batches->contains(fn ($batch) => $batch->status !== 'staged')) {
                throw new ApiException('VERSION_CONFLICT', 'Batch tidak ditemukan, sudah dipakai, atau sudah digantikan.');
            }
            if ($batches->pluck('outlet_id')->unique()->count() !== 1 || $batches->pluck('period')->unique()->count() !== 1) {
                throw new ApiException('VALIDATION_ERROR', 'Semua batch harus berasal dari outlet dan periode yang sama.');
            }
            $profiles = $batches->keyBy('profile');
            if (! $profiles->has('daily') || ! $profiles->has('shift')) {
                throw new ApiException('VALIDATION_ERROR', 'Commit membutuhkan profil Harian & stok serta Omzet per shift.');
            }
            if ($profiles->count() !== $batches->count()) {
                throw new ApiException('VALIDATION_ERROR', 'Pilih satu batch untuk setiap jenis laporan.');
            }
            $rowQuery = DB::table('acc_cellular_import_rows')->whereIn('batch_id', $batchIds);
            if ((clone $rowQuery)->where('validation_status', 'error')->exists()) {
                throw new ApiException('IMPORT_ROW_INVALID', 'Perbaiki semua baris error sebelum commit.');
            }
            if (! $acknowledgeWarnings && (clone $rowQuery)->where('validation_status', 'warning')->exists()) {
                throw new ApiException('VALIDATION_ERROR', 'Konfirmasi warning formula dan kelengkapan sumber sebelum commit.');
            }

            $daily = $this->rowsByDate($profiles['daily']->id);
            $shift = $this->rowsByDate($profiles['shift']->id);
            if (array_keys($daily) !== array_keys($shift)) {
                throw new ApiException('IMPORT_ROW_INVALID', 'Cakupan tanggal laporan Harian dan Shift harus sama.');
            }
            $outlet = $this->outlet($batches->first()->outlet_id, $user);
            $dates = array_keys($daily);
            if ($dates === []) {
                throw new ApiException('IMPORT_ROW_INVALID', 'Batch staging tidak memiliki tanggal yang dapat di-commit.');
            }
            if (collect($dates)->contains(fn ($date) => ! str_starts_with($date, $batches->first()->period.'-'))) {
                throw new ApiException('IMPORT_ROW_INVALID', 'Tanggal sumber berada di luar periode batch staging.');
            }
            $duplicates = DB::table('acc_omzet_records')->where('outlet_id', $outlet['id'])->whereIn('business_date', $dates)->where('shift', 'HARIAN')->pluck('business_date');
            if ($duplicates->isNotEmpty()) {
                throw new ApiException('IDEMPOTENCY_CONFLICT', 'Paket H+1 sudah tersedia untuk tanggal: '.$duplicates->take(5)->implode(', '));
            }

            $created = [];
            foreach ($dates as $date) {
                $d = $daily[$date];
                $s = $shift[$date];
                $required = [$d['gross'] ?? null, $d['cash'] ?? null, $d['edc'] ?? null, $d['qris'] ?? null, $d['expense'] ?? null,
                    $d['expected_deposit'] ?? null, $s['gross'] ?? null, $s['shift_1'] ?? null, $s['shift_2'] ?? null, $s['shift_3'] ?? null];
                if (in_array(null, $required, true)) {
                    throw new ApiException('IMPORT_ROW_INVALID', "Nilai wajib belum lengkap pada {$date}.");
                }
                $gross = $this->cents($d['gross']);
                $shiftTotal = $this->cents($s['shift_1']) + $this->cents($s['shift_2']) + $this->cents($s['shift_3']);
                $payments = $this->cents($d['cash']) + $this->cents($d['edc']) + $this->cents($d['qris']);
                $expected = $this->cents($d['cash']) - $this->cents($d['expense']);
                if ($gross !== $this->cents($s['gross']) || $gross !== $shiftTotal || $gross !== $payments || $expected < 0 || $expected !== $this->cents($d['expected_deposit'])) {
                    throw new ApiException('IMPORT_ROW_INVALID', "Rekonsiliasi sumber belum seimbang pada {$date}.");
                }
                $id = (string) Str::uuid();
                DB::table('acc_omzet_records')->insert([
                    'id' => $id, 'division_code' => 'ACC', 'outlet_id' => $outlet['id'], 'outlet_name' => $outlet['name'],
                    'source_division_code' => $outlet['divisionCode'], 'business_date' => $date, 'shift' => 'HARIAN',
                    'outlet_amount' => $this->money($gross), 'cash_amount' => $this->money($this->cents($d['cash'])),
                    'qris_amount' => $this->money($this->cents($d['qris'])), 'edc_amount' => $this->money($this->cents($d['edc'])),
                    'transfer_amount' => '0.00', 'other_amount' => '0.00', 'expense_amount' => $this->money($this->cents($d['expense'])),
                    'expected_deposit_amount' => $this->money($expected), 'requires_ap' => false, 'source_reference' => 'CELL-STAGE/'.$profiles['daily']->id,
                    'notes' => 'Diimpor melalui staging laporan Cellular.', 'status' => 'draft', 'created_by' => $user['sub'],
                    'version' => 1, 'created_at' => now(), 'updated_at' => now(),
                ]);
                foreach ([1 => 'shift_1', 2 => 'shift_2', 3 => 'shift_3'] as $number => $metric) {
                    DB::table('acc_omzet_shift_lines')->insert(['id' => (string) Str::uuid(), 'record_id' => $id, 'shift_no' => $number,
                        'gross_amount' => $this->money($this->cents($s[$metric])), 'created_at' => now(), 'updated_at' => now()]);
                }
                DB::table('acc_omzet_events')->insert(['record_id' => $id, 'actor_id' => $user['sub'], 'actor_role' => $user['role'],
                    'action' => 'imported', 'metadata' => json_encode(['version' => 1, 'status' => 'draft', 'batch_ids' => $batchIds]), 'created_at' => now()]);
                $created[] = $id;
            }

            DB::table('acc_cellular_import_batches')->whereIn('id', $batchIds)->update([
                'status' => 'committed', 'committed_by' => $user['sub'], 'committed_at' => now(), 'version' => DB::raw('version + 1'), 'updated_at' => now(),
            ]);
            DB::table('acc_cellular_import_batches')->where('outlet_id', $outlet['id'])->where('period', $batches->first()->period)
                ->whereNotIn('id', $batchIds)->where('status', 'staged')->whereIn('profile', $batches->pluck('profile'))->update(['status' => 'superseded', 'updated_at' => now()]);
            foreach ($batchIds as $batchId) {
                $this->event($batchId, 'committed', $user, ['created_records' => count($created), 'acknowledged_warnings' => $acknowledgeWarnings]);
            }
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'action' => 'accounting.cellular_import.committed',
                'entity' => 'CellularImportBatch', 'entityId' => $batchIds[0], 'divisionCode' => 'ACC',
                'metadata' => ['batch_ids' => $batchIds, 'created_records' => count($created)]]);

            return ['created_count' => count($created), 'record_ids' => $created, 'period' => $batches->first()->period, 'outlet_id' => $outlet['id']];
        });
    }

    private function rowsByDate(string $batchId): array
    {
        return DB::table('acc_cellular_import_rows')->where('batch_id', $batchId)->orderBy('business_date')->get()
            ->mapWithKeys(fn ($row) => [$row->business_date => json_decode($row->payload, true)])->all();
    }

    private function presentBatch(object $batch): array
    {
        $item = (array) $batch;
        $item['summary'] = json_decode($batch->summary, true);
        $item['issues'] = json_decode($batch->issues, true);

        return $item;
    }

    private function event(string $batchId, string $action, array $user, array $metadata): void
    {
        DB::table('acc_cellular_import_events')->insert(['batch_id' => $batchId, 'actor_id' => $user['sub'], 'actor_role' => $user['role'],
            'action' => $action, 'metadata' => json_encode($metadata), 'created_at' => now()]);
        $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'action' => 'accounting.cellular_import.'.$action,
            'entity' => 'CellularImportBatch', 'entityId' => $batchId, 'divisionCode' => 'ACC', 'metadata' => $metadata]);
    }

    private function cents(int|float|string $value): int
    {
        [$whole, $fraction] = array_pad(explode('.', number_format((float) $value, 2, '.', '')), 2, '');

        return ((int) $whole * 100) + (int) $fraction;
    }

    private function money(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
