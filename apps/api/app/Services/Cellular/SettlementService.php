<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\MutationFileRollback;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class SettlementService
{
    private const CHANNELS = ['cash', 'qris', 'edc', 'transfer'];

    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    private function outlets(array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL');
        $this->policy->assertCapability($user, 'view:cellular_settlement');

        return $this->org->getOutletsForUser($user, 'CELL');
    }

    private function cents(string $value): int
    {
        [$whole, $fraction] = array_pad(explode('.', $value), 2, '');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    private function names(array $user): array
    {
        return collect($this->outlets($user))->pluck('name', 'id')->all();
    }

    private function attachmentMap(array $settlementIds): array
    {
        if ($settlementIds === []) {
            return [];
        }

        return DB::table('cel_settlement_attachments')->whereIn('settlement_id', $settlementIds)->orderBy('created_at')
            ->get(['id', 'settlement_id', 'uploaded_by', 'original_name', 'mime_type', 'size_bytes', 'sha256', 'created_at'])
            ->map(function ($attachment) {
                $item = (array) $attachment;
                $item['size_bytes'] = (int) $item['size_bytes'];

                return $item;
            })
            ->groupBy('settlement_id')->map(fn ($items) => $items->values()->all())->all();
    }

    private function present(object $row, array $names, ?array $attachments = null): array
    {
        $result = (array) $row;
        $result['outlet_name'] = $names[$result['outlet_id']] ?? 'Outlet';
        foreach (['gross_cents' => 'gross', 'fee_cents' => 'fee', 'net_cents' => 'net'] as $source => $target) {
            $result[$target] = $this->money((int) $result[$source]);
            unset($result[$source]);
        }
        $result['attachments'] = $attachments ?? ($this->attachmentMap([$row->id])[$row->id] ?? []);

        return $result;
    }

    private function scopedRow(string $id, array $user, bool $lock = false): ?object
    {
        $query = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')
            ->where('s.id', $id)->whereIn('c.outlet_id', array_column($this->outlets($user), 'id'))
            ->select('s.*', 'c.outlet_id', 'c.business_date', 'c.shift_code');
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    public function index(string $month, array $user): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $names = $this->names($user);
        $rows = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')
            ->whereIn('c.outlet_id', array_keys($names))->whereBetween('s.settlement_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->select('s.*', 'c.outlet_id', 'c.business_date', 'c.shift_code')->orderByDesc('s.settlement_date')->orderByDesc('s.created_at')
            ->get();
        $attachments = $this->attachmentMap($rows->pluck('id')->all());

        return $rows->map(fn ($row) => $this->present($row, $names, $attachments[$row->id] ?? []))->all();
    }

    public function sources(string $month, array $user): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $names = $this->names($user);
        $rows = DB::table('cel_daily_closings')->whereIn('outlet_id', array_keys($names))->where('status', 'approved')
            ->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])->orderByDesc('business_date')->get();
        $totals = DB::table('cel_settlements')->whereIn('daily_closing_id', $rows->pluck('id'))->whereIn('status', ['submitted', 'reconciled'])
            ->selectRaw('daily_closing_id, channel, SUM(gross_cents) gross_cents, SUM(CASE WHEN status = ? THEN gross_cents ELSE 0 END) reconciled_cents', ['reconciled'])
            ->groupBy('daily_closing_id', 'channel')->get()->keyBy(fn ($row) => $row->daily_closing_id.'|'.$row->channel);

        return $rows->flatMap(function ($row) use ($names, $totals) {
            return collect(self::CHANNELS)->map(function ($channel) use ($row, $names, $totals) {
                $expected = (int) $row->{$channel.'_cents'};
                $sum = $totals->get($row->id.'|'.$channel);
                $submitted = (int) ($sum->gross_cents ?? 0);
                $reconciled = (int) ($sum->reconciled_cents ?? 0);

                return ['daily_closing_id' => $row->id, 'outlet_id' => $row->outlet_id, 'outlet_name' => $names[$row->outlet_id] ?? 'Outlet', 'business_date' => $row->business_date, 'shift_code' => $row->shift_code, 'channel' => $channel, 'expected' => $this->money($expected), 'submitted' => $this->money($submitted), 'reconciled' => $this->money($reconciled), 'remaining' => $this->money(max(0, $expected - $reconciled))];
            })->filter(fn ($item) => (float) $item['expected'] > 0)->values();
        })->values()->all();
    }

    public function save(array $data, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL', true);
        $this->policy->assertCapability($user, 'write:cellular_settlement');

        return DB::transaction(function () use ($data, $user) {
            $closing = DB::table('cel_daily_closings')->where('id', $data['daily_closing_id'])->whereIn('outlet_id', array_column($this->outlets($user), 'id'))->lockForUpdate()->first();
            if (! $closing || $closing->status !== 'approved') {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Closing harus berstatus disetujui sebelum settlement dicatat.');
            }
            $expected = (int) $closing->{$data['channel'].'_cents'};
            if ($expected <= 0) {
                throw new ApiException('VALIDATION_ERROR', 'Kanal yang dipilih tidak memiliki nilai pada closing.');
            }
            if (CarbonImmutable::parse($data['settlement_date'], 'Asia/Jakarta')->lt(CarbonImmutable::parse($closing->business_date, 'Asia/Jakarta')) || CarbonImmutable::parse($data['settlement_date'], 'Asia/Jakarta')->isFuture()) {
                throw new ApiException('VALIDATION_ERROR', 'Tanggal settlement harus antara tanggal bisnis dan hari ini.');
            }
            $gross = $this->cents($data['gross']);
            $fee = $this->cents($data['fee']);
            if ($fee > $gross) {
                throw new ApiException('VALIDATION_ERROR', 'Biaya kanal tidak boleh melebihi nilai bruto.');
            }
            $reference = strtoupper(trim($data['reference']));
            $sourceKey = hash('sha256', $closing->id.'|'.$data['channel'].'|'.$reference);
            $existing = isset($data['id']) ? DB::table('cel_settlements')->where('id', $data['id'])->lockForUpdate()->first() : null;
            if ($existing && ($existing->created_by !== $user['sub'] || ! in_array($existing->status, ['draft', 'correction'], true) || (int) $existing->version !== (int) $data['version'])) {
                throw new ApiException('VERSION_CONFLICT', 'Settlement sudah berubah atau bukan milik Anda.');
            }
            if (DB::table('cel_settlements')->where('source_key', $sourceKey)->when($existing, fn ($query) => $query->where('id', '!=', $existing->id))->exists()) {
                throw new ApiException('VERSION_CONFLICT', 'Referensi settlement sudah digunakan untuk kanal ini.');
            }
            $id = $existing?->id ?? (string) Str::uuid();
            $values = ['daily_closing_id' => $closing->id, 'channel' => $data['channel'], 'settlement_date' => $data['settlement_date'], 'gross_cents' => $gross, 'fee_cents' => $fee, 'net_cents' => $gross - $fee, 'destination' => trim($data['destination']), 'reference' => $reference, 'source_key' => $sourceKey, 'status' => 'draft', 'review_note' => null, 'updated_at' => now()];
            if ($existing) {
                DB::table('cel_settlements')->where('id', $id)->update($values + ['version' => $existing->version + 1]);
            } else {
                DB::table('cel_settlements')->insert($values + ['id' => $id, 'created_by' => $user['sub'], 'version' => 1, 'created_at' => now()]);
            }
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularSettlement', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.settlement.saved']);
            $row = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')->where('s.id', $id)->select('s.*', 'c.outlet_id', 'c.business_date', 'c.shift_code')->first();

            return $this->present($row, $this->names($user));
        });
    }

    public function attach(string $id, int $version, UploadedFile $file, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL', true);
        $this->policy->assertCapability($user, 'write:cellular_settlement');

        return DB::transaction(function () use ($id, $version, $file, $user) {
            $row = $this->scopedRow($id, $user, true);
            if (! $row) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Settlement tidak ditemukan.');
            }
            if ($row->created_by !== $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Finance pembuat yang dapat menambah bukti settlement.');
            }
            if (! in_array($row->status, ['draft', 'correction'], true) || (int) $row->version !== $version) {
                throw new ApiException('VERSION_CONFLICT', 'Settlement sudah berubah atau tidak dapat menerima bukti.');
            }
            if (DB::table('cel_settlement_attachments')->where('settlement_id', $id)->count() >= 5) {
                throw new ApiException('VALIDATION_ERROR', 'Maksimal lima bukti untuk satu settlement.');
            }

            $attachmentId = (string) Str::uuid();
            $extension = strtolower($file->extension());
            $path = $file->storeAs('cellular_settlement_attachments/'.$id, $attachmentId.'.'.$extension, 'local');
            if (! is_string($path)) {
                throw new RuntimeException('Penyimpanan bukti settlement gagal.');
            }
            MutationFileRollback::register(fn () => Storage::disk('local')->delete($path));
            $fullPath = Storage::disk('local')->path($path);
            $sha256 = hash_file('sha256', $fullPath);
            if (! is_string($sha256)) {
                throw new RuntimeException('Hash bukti settlement gagal dibuat.');
            }
            if (DB::table('cel_settlement_attachments')->where('settlement_id', $id)->where('sha256', $sha256)->exists()) {
                throw new ApiException('IDEMPOTENCY_CONFLICT', 'Bukti yang sama sudah terpasang pada settlement.');
            }
            $name = mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $file->getClientOriginalName()))), 0, 240);
            DB::table('cel_settlement_attachments')->insert([
                'id' => $attachmentId, 'settlement_id' => $id, 'uploaded_by' => $user['sub'], 'original_name' => $name ?: 'bukti-settlement',
                'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize(), 'sha256' => $sha256, 'file_path' => $path,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('cel_settlements')->where('id', $id)->update(['version' => $row->version + 1, 'updated_at' => now()]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularSettlement', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.settlement.attachment_uploaded']);

            return $this->present($this->scopedRow($id, $user), $this->names($user));
        });
    }

    public function attachment(string $id, string $attachmentId, array $user): object
    {
        if (! $this->scopedRow($id, $user)) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Settlement tidak ditemukan.');
        }
        $attachment = DB::table('cel_settlement_attachments')->where('settlement_id', $id)->where('id', $attachmentId)->first();
        if (! $attachment) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Bukti settlement tidak ditemukan.');
        }
        $expected = 'cellular_settlement_attachments/'.$id.'/'.$attachment->id.'.';
        $disk = Storage::disk('local');
        abort_unless(str_starts_with($attachment->file_path, $expected)
            && preg_match('/^[a-z0-9]+$/D', substr($attachment->file_path, strlen($expected)))
            && $disk->exists($attachment->file_path)
            && ! is_link($disk->path($attachment->file_path))
            && ! is_link($disk->path('cellular_settlement_attachments/'.$id)), 404);
        $actualHash = hash_file('sha256', $disk->path($attachment->file_path));
        abort_unless(is_string($actualHash) && hash_equals($attachment->sha256, $actualHash), 404);

        return $attachment;
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $rules = ['submit' => ['write:cellular_settlement', ['draft', 'correction'], 'submitted'], 'reconcile' => ['reconcile:cellular_settlement', ['submitted'], 'reconciled'], 'correction' => ['reconcile:cellular_settlement', ['submitted'], 'correction']];
        if (! isset($rules[$action])) {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Tindakan settlement tidak dikenal.');
        }
        [$capability, $from, $to] = $rules[$action];
        $this->policy->assertDivisionScope($user, 'CELL', true);
        $this->policy->assertCapability($user, $capability);

        return DB::transaction(function () use ($id, $action, $data, $user, $from, $to) {
            $row = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')->where('s.id', $id)->whereIn('c.outlet_id', array_column($this->outlets($user), 'id'))->select('s.*', 'c.outlet_id', 'c.business_date', 'c.shift_code')->lockForUpdate()->first();
            if (! $row) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Settlement tidak ditemukan.');
            }
            if (! in_array($row->status, $from, true) || (int) $row->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Status atau versi settlement sudah berubah.');
            }
            if ($action === 'submit' && $row->created_by !== $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat yang dapat mengajukan settlement.');
            }
            if ($action === 'submit' && ! DB::table('cel_settlement_attachments')->where('settlement_id', $id)->exists()) {
                throw new ApiException('VALIDATION_ERROR', 'Unggah minimal satu bukti penerimaan dana sebelum mengajukan settlement.');
            }
            if (in_array($action, ['reconcile', 'correction'], true) && $row->created_by === $user['sub']) {
                throw new ApiException('MAKER_CHECKER_VIOLATION', 'Pembuat settlement tidak boleh memeriksa dokumen yang sama.');
            }
            if ($action === 'correction' && mb_strlen(trim($data['note'] ?? '')) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Alasan koreksi minimal 10 karakter.');
            }
            if ($action === 'reconcile') {
                $closing = DB::table('cel_daily_closings')->where('id', $row->daily_closing_id)->lockForUpdate()->first();
                $expected = (int) $closing->{$row->channel.'_cents'};
                $reconciled = (int) DB::table('cel_settlements')->where('daily_closing_id', $row->daily_closing_id)->where('channel', $row->channel)->where('status', 'reconciled')->where('id', '!=', $id)->sum('gross_cents');
                if ($reconciled + (int) $row->gross_cents > $expected) {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Nilai settlement terverifikasi melebihi nilai kanal pada closing.');
                }
            }
            $updates = ['status' => $to, 'version' => $row->version + 1, 'review_note' => $data['note'] ?? null, 'updated_at' => now()];
            if (in_array($action, ['reconcile', 'correction'], true)) {
                $updates['reviewed_by'] = $user['sub'];
            }
            DB::table('cel_settlements')->where('id', $id)->update($updates);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularSettlement', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.settlement.'.$action]);
            $result = DB::table('cel_settlements as s')->join('cel_daily_closings as c', 'c.id', '=', 's.daily_closing_id')->where('s.id', $id)->select('s.*', 'c.outlet_id', 'c.business_date', 'c.shift_code')->first();

            return $this->present($result, $this->names($user));
        });
    }
}
