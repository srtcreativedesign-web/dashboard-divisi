<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\OmzetRecord;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OmzetService
{
    public const AMOUNTS = ['outlet_amount', 'cash_amount', 'qris_amount', 'edc_amount', 'transfer_amount', 'other_amount'];

    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    public function outlets(array $user): array
    {
        return $this->org->getAccountingOutlets($user);
    }

    private function query()
    {
        return OmzetRecord::where('division_code', 'ACC');
    }

    private function cents(string|int|float $value): int
    {
        [$whole, $fraction] = array_pad(explode('.', (string) $value, 2), 2, '');

        return ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        return ($cents < 0 ? '-' : '').intdiv(abs($cents), 100).'.'.str_pad((string) (abs($cents) % 100), 2, '0', STR_PAD_LEFT);
    }

    private function differences(OmzetRecord $record, ?array $shiftLines = null): array
    {
        $received = 0;
        foreach (array_slice(self::AMOUNTS, 1) as $field) {
            $received += $this->cents($record->$field);
        }

        $shiftLines ??= DB::table('acc_omzet_shift_lines')->where('record_id', $record->id)->orderBy('shift_no')->get()->map(fn ($line) => (array) $line)->all();
        $shiftTotal = $shiftLines ? array_sum(array_map(fn ($line) => $this->cents($line['gross_amount']), $shiftLines)) : null;

        return [
            'received_amount' => $this->money($received),
            'payment_difference' => $this->money($this->cents($record->outlet_amount) - $received),
            'ap_difference' => $record->ap_amount === null ? null : $this->money($this->cents($record->outlet_amount) - $this->cents($record->ap_amount)),
            'shift_total' => $shiftTotal === null ? null : $this->money($shiftTotal),
            'shift_difference' => $shiftTotal === null ? null : $this->money($this->cents($record->outlet_amount) - $shiftTotal),
            'shift_breakdown' => array_map(fn ($line) => ['shift_no' => (int) $line['shift_no'], 'gross_amount' => $this->money($this->cents($line['gross_amount']))], $shiftLines),
        ];
    }

    private function window(OmzetRecord $record): array
    {
        $opens = CarbonImmutable::parse($record->business_date->toDateString(), 'Asia/Jakarta')->addDay()->startOfDay();
        $deadline = $opens->endOfDay();
        $now = CarbonImmutable::now('Asia/Jakarta');
        $normal = $now->betweenIncluded($opens, $deadline);
        $permit = DB::table('acc_omzet_unlock_requests')->where('record_id', $record->id)
            ->where('status', 'approved')->whereNull('used_at')->where('expires_at', '>', now())->exists();

        return ['opens_at' => $opens->toIso8601String(), 'deadline' => $deadline->toIso8601String(),
            'can_submit' => $normal || $permit, 'can_request_unlock' => $now->greaterThan($deadline), 'has_permit' => $permit];
    }

    private function present(OmzetRecord $record, ?array $shiftLines = null): array
    {
        return array_merge($record->toArray(), $this->differences($record, $shiftLines), ['submission_window' => $this->window($record)]);
    }

    public function list(array $filters): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month'])->startOfMonth()->toDateString();
        $end = CarbonImmutable::parse($start)->endOfMonth()->toDateString();
        $query = $this->query()->whereBetween('business_date', [$start, $end]);
        if (! empty($filters['outlet_id'])) {
            $query->where('outlet_id', $filters['outlet_id']);
        }
        $validated = (clone $query)->where('status', 'validated')->get();
        $total = $payments = $apDifference = 0;
        foreach ($validated as $record) {
            $total += $this->cents($record->outlet_amount);
            $differences = $this->differences($record);
            $payments += $this->cents($record->outlet_amount) - $this->centsSigned($differences['payment_difference']);
            $apDifference += $this->centsSigned($differences['ap_difference'] ?? '0');
        }
        $summary = ['validated_count' => $validated->count(), 'outlet_amount' => $this->money($total),
            'received_amount' => $this->money($payments), 'ap_difference' => $this->money($apDifference)];
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        $page = $query->orderByDesc('business_date')->orderBy('outlet_name')->orderBy('shift')->paginate(25);

        $recordIds = $page->getCollection()->pluck('id')->all();
        $shiftLines = DB::table('acc_omzet_shift_lines')->whereIn('record_id', $recordIds)->orderBy('shift_no')->get()
            ->groupBy('record_id')->map(fn ($lines) => $lines->map(fn ($line) => (array) $line)->all());

        return ['items' => $page->getCollection()->map(fn ($record) => $this->present($record, $shiftLines->get($record->id, [])))->all(),
            'total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'summary' => $summary];
    }

    private function centsSigned(string $value): int
    {
        return str_starts_with($value, '-') ? -$this->cents(substr($value, 1)) : $this->cents($value);
    }

    public function detail(string $id): array
    {
        $record = $this->query()->findOrFail($id);
        $events = DB::table('acc_omzet_events')->where('record_id', $id)->orderBy('id')->get()->map(function ($event) {
            $event->metadata = json_decode($event->metadata, true);

            return $event;
        });

        return $this->present($record) + ['events' => $events,
            'unlock_requests' => DB::table('acc_omzet_unlock_requests')->where('record_id', $id)->orderByDesc('created_at')->get()];
    }

    private function assertVersion(OmzetRecord $record, int $version): void
    {
        if ($record->version !== $version) {
            throw new ApiException('VERSION_CONFLICT', 'Rekap sudah berubah. Muat ulang sebelum melanjutkan.');
        }
    }

    private function editable(OmzetRecord $record): void
    {
        if (! in_array($record->status, ['draft', 'correction'], true)) {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Hanya draf atau rekap yang dikembalikan yang dapat diubah.');
        }
    }

    private function event(OmzetRecord $record, string $action, array $user, array $metadata = []): void
    {
        $metadata = ['version' => $record->version, 'status' => $record->status] + $metadata;
        DB::table('acc_omzet_events')->insert(['record_id' => $record->id, 'actor_id' => $user['sub'],
            'actor_role' => $user['role'], 'action' => $action, 'metadata' => json_encode($metadata), 'created_at' => now()]);
        $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'action' => 'accounting.omzet.'.$action,
            'entity' => 'OmzetRecord', 'entityId' => $record->id, 'divisionCode' => 'ACC', 'metadata' => $metadata]);
    }

    public function save(?string $id, array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:omzet');
        $outlet = collect($this->outlets($user))->firstWhere('id', $data['outlet_id']);
        if (! $outlet) {
            throw new ApiException('VALIDATION_ERROR', 'Outlet aktif tidak ditemukan dalam direktori Accounting.');
        }
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal omzet tidak boleh berada di masa depan.');
        }
        $result = DB::transaction(function () use ($id, $data, $user, $outlet) {
            $record = $id ? $this->query()->lockForUpdate()->findOrFail($id) : new OmzetRecord;
            if ($id) {
                $this->assertVersion($record, $data['version']);
                $this->editable($record);
            }
            $payload = array_intersect_key($data, array_flip(array_merge(self::AMOUNTS, ['outlet_id', 'business_date', 'shift', 'requires_ap', 'source_reference', 'notes', 'expense_amount'])));
            $shiftBreakdown = $data['shift_breakdown'] ?? [];
            if ($shiftBreakdown) {
                $payload['shift'] = 'HARIAN';
                $payload['outlet_amount'] = $this->money(array_sum(array_map(fn ($line) => $this->cents($line['gross_amount']), $shiftBreakdown)));
            }
            $payload['expense_amount'] ??= '0';
            $payload['shift'] = mb_strtoupper(trim($payload['shift']));
            foreach (array_merge(self::AMOUNTS, ['expense_amount']) as $field) {
                $payload[$field] = $this->money($this->cents($payload[$field]));
            }
            $expectedDeposit = $this->cents($payload['cash_amount']) - $this->cents($payload['expense_amount']);
            if ($expectedDeposit < 0) {
                throw new ApiException('VALIDATION_ERROR', 'Pengeluaran harian tidak boleh melebihi penerimaan tunai.');
            }
            $payload['expected_deposit_amount'] = $this->money($expectedDeposit);
            $record->fill($payload + ['outlet_name' => $outlet['name'], 'source_division_code' => $outlet['divisionCode']]);
            if (! $id) {
                $record->id = (string) Str::uuid();
                $record->created_by = $user['sub'];
                $record->division_code = 'ACC';
                $record->status = 'draft';
                $record->version = 1;
            } else {
                // Izin terlambat mengikat outlet, tanggal, dan shift yang disetujui.
                if ($record->isDirty(['outlet_id', 'business_date', 'shift'])) {
                    DB::table('acc_omzet_unlock_requests')->where('record_id', $id)->whereIn('status', ['approved', 'pending'])
                        ->whereNull('used_at')->update(['status' => 'revoked', 'expires_at' => now(), 'decision_notes' => 'Outlet, tanggal, atau shift rekap berubah.', 'updated_at' => now()]);
                }
                $record->version++;
                $record->ap_amount = null;
                $record->reviewed_by = null;
                $record->approved_by = null;
            }
            $record->save();
            if ($shiftBreakdown) {
                DB::table('acc_omzet_shift_lines')->where('record_id', $record->id)->delete();
                DB::table('acc_omzet_shift_lines')->insert(array_map(fn ($line) => [
                    'id' => (string) Str::uuid(), 'record_id' => $record->id, 'shift_no' => $line['shift_no'],
                    'gross_amount' => $this->money($this->cents($line['gross_amount'])), 'created_at' => now(), 'updated_at' => now(),
                ], $shiftBreakdown));
            }
            $this->event($record, $id ? 'updated' : 'created', $user, ['input' => $payload]);

            return $record->id;
        });

        return $this->detail($result);
    }

    private function reason(array $data): string
    {
        $reason = trim($data['reason'] ?? '');
        if (mb_strlen($reason) < 10) {
            throw new ApiException('VALIDATION_ERROR', 'Isi alasan atau catatan minimal 10 karakter.');
        }

        return $reason;
    }

    public function act(string $id, string $action, array $data, array $user): array
    {
        $capabilities = ['submit' => 'write:omzet', 'request-unlock' => 'write:omzet', 'review' => 'validate:omzet',
            'decide' => 'approve:omzet', 'decide-unlock' => 'manage:omzet_unlock'];
        if (! isset($capabilities[$action])) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Aksi omzet tidak tersedia.');
        }
        $this->policy->assertCapability($user, $capabilities[$action]);
        DB::transaction(function () use ($id, $action, $data, $user) {
            $record = $this->query()->lockForUpdate()->findOrFail($id);
            $this->assertVersion($record, $data['version']);
            $metadata = [];
            if ($action === 'submit') {
                $this->editable($record);
                if (! $this->window($record)['can_submit']) {
                    throw new ApiException('STAGE_LOCKED', 'Pengajuan tersedia pada H+1. Setelah batas tersebut, minta izin Manager.');
                }
                DB::table('acc_omzet_unlock_requests')->where('record_id', $id)->where('status', 'approved')
                    ->whereNull('used_at')->where('expires_at', '>', now())->update(['used_at' => now(), 'updated_at' => now()]);
                $record->status = 'submitted';
                $record->submitted_at = now();
            } elseif ($action === 'request-unlock') {
                $this->editable($record);
                if (! $this->window($record)['can_request_unlock']) {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Izin terlambat hanya dapat diminta setelah akhir H+1.');
                }
                if (DB::table('acc_omzet_unlock_requests')->where('record_id', $id)->where('status', 'pending')->exists()) {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Permintaan izin masih menunggu Manager.');
                }
                $reason = $this->reason($data);
                $metadata = ['reason' => $reason];
                DB::table('acc_omzet_unlock_requests')->insert(['id' => (string) Str::uuid(), 'record_id' => $id,
                    'requested_by' => $user['sub'], 'reason' => $reason, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
            } elseif ($action === 'decide-unlock') {
                $this->editable($record);
                $permit = DB::table('acc_omzet_unlock_requests')->where('record_id', $id)->where('id', $data['unlock_id'] ?? '')->where('status', 'pending')->first();
                if (! $permit) {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Permintaan izin tidak ditemukan atau sudah diputuskan.');
                }
                if ($permit->requested_by === $user['sub']) {
                    throw new ApiException('APPROVAL_SELF_ACTION_DENIED', 'Pemohon tidak dapat menyetujui permintaannya sendiri.');
                }
                if (! in_array($data['decision'] ?? '', ['approve', 'reject'], true)) {
                    throw new ApiException('VALIDATION_ERROR', 'Pilih persetujuan atau penolakan izin.');
                }
                $reason = $this->reason($data);
                DB::table('acc_omzet_unlock_requests')->where('id', $permit->id)->update([
                    'status' => $data['decision'] === 'approve' ? 'approved' : 'rejected', 'decided_by' => $user['sub'],
                    'decision_notes' => $reason, 'expires_at' => $data['decision'] === 'approve' ? now()->addHours(24) : null, 'updated_at' => now()]);
                $metadata = ['unlock_id' => $permit->id, 'decision' => $data['decision'], 'reason' => $reason];
            } elseif ($action === 'review') {
                if ($record->status !== 'submitted') {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Hanya rekap yang diajukan yang dapat diperiksa.');
                }
                if ($record->created_by === $user['sub']) {
                    throw new ApiException('APPROVAL_SELF_ACTION_DENIED', 'Pembuat rekap tidak boleh memvalidasi rekapnya sendiri.');
                }
                if (! in_array($data['decision'] ?? '', ['return', 'validate'], true)) {
                    throw new ApiException('VALIDATION_ERROR', 'Pilih kembalikan atau validasi rekap.');
                }
                $record->reviewed_by = $user['sub'];
                if ($data['decision'] === 'return') {
                    $record->review_notes = $this->reason($data);
                    $record->status = 'correction';
                } else {
                    if ($record->requires_ap && ! isset($data['ap_amount'])) {
                        throw new ApiException('VALIDATION_ERROR', 'Isi nilai laporan Angkasa Pura untuk rekap yang memerlukan pencocokan AP.');
                    }
                    $record->ap_amount = $record->requires_ap ? $this->money($this->cents($data['ap_amount'])) : null;
                    $differences = $this->differences($record);
                    $mismatch = $this->centsSigned($differences['payment_difference']) !== 0
                        || $this->centsSigned($differences['ap_difference'] ?? '0') !== 0
                        || ($differences['shift_difference'] !== null && $this->centsSigned($differences['shift_difference']) !== 0);
                    $record->review_notes = $mismatch ? $this->reason($data) : ($data['reason'] ?? null);
                    $record->status = $mismatch ? 'pending_approval' : 'validated';
                    $record->validated_at = $mismatch ? null : now();
                }
                $metadata = ['decision' => $data['decision'], 'reason' => $record->review_notes, 'ap_amount' => $record->ap_amount] + $this->differences($record);
            } elseif ($action === 'decide') {
                if ($record->status !== 'pending_approval') {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Rekap belum menunggu persetujuan selisih.');
                }
                if (in_array($user['sub'], [$record->created_by, $record->reviewed_by], true)) {
                    throw new ApiException('APPROVAL_SELF_ACTION_DENIED', 'Persetujuan harus dilakukan oleh pihak yang berbeda dari pembuat dan pemeriksa.');
                }
                if (! in_array($data['decision'] ?? '', ['approve', 'reject'], true)) {
                    throw new ApiException('VALIDATION_ERROR', 'Pilih setujui atau kembalikan selisih.');
                }
                $record->decision_notes = $this->reason($data);
                $record->status = $data['decision'] === 'approve' ? 'validated' : 'correction';
                $record->approved_by = $user['sub'];
                $record->validated_at = $data['decision'] === 'approve' ? now() : null;
                $metadata = ['decision' => $data['decision'], 'reason' => $record->decision_notes];
            }
            $record->version++;
            $record->save();
            $this->event($record, $action, $user, $metadata);
        });

        return $this->detail($id);
    }
}
