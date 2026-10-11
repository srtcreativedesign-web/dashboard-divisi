<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\OmzetRecord;
use App\Services\AuditService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DepositService
{
    public function __construct(private PolicyService $policy, private AuditService $audit) {}

    private function access(array $u, string $cap = 'view:acc_deposits'): void
    {
        $this->policy->assertDivisionScope($u, 'ACC', $cap !== 'view:acc_deposits');
        $this->policy->assertCapability($u, $cap);
    }

    private function cents(string $v): int
    {
        [$w,$f] = array_pad(explode('.', $v), 2, '');

        return (int) $w * 100 + (int) str_pad($f, 2, '0');
    }

    private function money(int $v): string
    {
        return intdiv($v, 100).'.'.str_pad((string) ($v % 100), 2, '0', STR_PAD_LEFT);
    }

    private function key(string $v): string
    {
        return hash('sha256', mb_strtoupper(trim($v)));
    }

    private function dates(string $v, string $min): void
    {
        if ($v < $min || $v > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal harus sesuai urutan sumber dan tidak di masa depan WIB.');
        }
    }

    private function row(string $id, bool $lock = false): object
    {
        $q = DB::table('acc_deposits')->where('id', $id);
        $r = ($lock ? $q->lockForUpdate() : $q)->first();
        if (! $r) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Setoran tidak ditemukan.');
        }

        return $r;
    }

    private function present(object $r): array
    {
        $a = (array) $r;
        unset($a['source_key']);
        $received = (int) DB::table('acc_deposit_receipts')->where('deposit_id', $r->id)->where('status', 'recorded')->sum('amount_cents');
        $a['amount'] = $this->money((int) $r->amount_cents);
        $a['received_amount'] = $this->money($received);
        $a['remaining_amount'] = $this->money($r->status === 'voided' ? 0 : (int) $r->amount_cents - $received);
        unset($a['amount_cents']);
        $o = OmzetRecord::where('division_code', 'ACC')->findOrFail($r->omzet_id);
        $a['outlet_name'] = $o->outlet_name;
        $a['business_date'] = $o->business_date->toDateString();
        $a['shift'] = $o->shift;

        return $a;
    }

    public function sources(array $f, array $u): array
    {
        $this->access($u);
        $start = CarbonImmutable::createFromFormat('!Y-m', $f['month']);
        $q = OmzetRecord::where('division_code', 'ACC')->where('status', 'validated')->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()]);
        $total = (clone $q)->count();
        $page = (int) ($f['page'] ?? 1);

        return ['items' => $q->orderByDesc('business_date')->orderBy('id')->offset(($page - 1) * 50)->limit(50)->get()->map(function ($o) {
            $a = $o->only(['id', 'outlet_name', 'shift', 'source_reference']);
            $a['business_date'] = $o->business_date->toDateString();
            foreach (['cash', 'qris', 'edc', 'transfer', 'other'] as $c) {
                $used = (int) DB::table('acc_deposits')->where('omzet_id', $o->id)->where('channel', $c)->where('status', 'recorded')->sum('amount_cents');
                $a[$c.'_available'] = $this->money($this->cents($o->{$c.'_amount'}) - $used);
            }

            return $a;
        })->all(), 'total' => $total, 'page' => $page];
    }

    public function list(array $f, array $u): array
    {
        $this->access($u);
        $q = DB::table('acc_deposits');
        $source = null;
        if (! empty($f['omzet_id'])) {
            $record = OmzetRecord::where('division_code', 'ACC')->find($f['omzet_id']);
            if (! $record) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Sumber omzet tidak ditemukan.');
            }
            $source = ['id' => $record->id, 'outlet_name' => $record->outlet_name, 'business_date' => $record->business_date->toDateString(),
                'shift' => $record->shift, 'source_reference' => $record->source_reference];
            $q->where('omzet_id', $record->id);
        } else {
            $s = CarbonImmutable::createFromFormat('!Y-m', $f['month']);
            $q->whereBetween('deposit_date', [$s->toDateString(), $s->endOfMonth()->toDateString()]);
        }
        $total = (clone $q)->count();
        $page = (int) ($f['page'] ?? 1);

        return ['items' => $q->orderByDesc('deposit_date')->orderBy('id')->offset(($page - 1) * 50)->limit(50)->get()->map(fn ($r) => $this->present($r))->all(), 'total' => $total, 'page' => $page, 'source' => $source];
    }

    public function reconciliation(array $f, array $u): array
    {
        $this->access($u);
        $start = CarbonImmutable::createFromFormat('!Y-m', $f['month']);
        $sources = OmzetRecord::where('division_code', 'ACC')->where('status', 'validated')
            ->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()]);
        $total = (clone $sources)->count();
        $sourceIds = (clone $sources)->select('acc_omzet_records.id');
        $allocated = DB::table('acc_deposits')->where('status', 'recorded')->whereIn('omzet_id', $sourceIds)->select('omzet_id')->groupBy('omzet_id');
        $received = DB::table('acc_deposit_receipts as r')->join('acc_deposits as d', 'd.id', '=', 'r.deposit_id')
            ->where('r.status', 'recorded')->where('d.status', 'recorded')->whereIn('d.omzet_id', $sourceIds)->select('d.omzet_id')->groupBy('d.omzet_id');
        $channels = ['cash', 'qris', 'edc', 'transfer', 'other'];
        foreach ($channels as $channel) {
            $allocated->selectRaw("SUM(CASE WHEN channel = ? THEN amount_cents ELSE 0 END) as {$channel}_allocated", [$channel]);
            $received->selectRaw("SUM(CASE WHEN d.channel = ? THEN r.amount_cents ELSE 0 END) as {$channel}_received", [$channel]);
        }
        $sources->leftJoinSub($allocated, 'a', 'a.omzet_id', '=', 'acc_omzet_records.id')
            ->leftJoinSub($received, 'r', 'r.omzet_id', '=', 'acc_omzet_records.id')->select('acc_omzet_records.*');
        foreach ($channels as $channel) {
            $sources->selectRaw("COALESCE(a.{$channel}_allocated, 0) as {$channel}_allocated, COALESCE(r.{$channel}_received, 0) as {$channel}_received");
        }
        $page = (int) ($f['page'] ?? 1);
        $items = $sources->orderByDesc('business_date')->orderBy('acc_omzet_records.id')->offset(($page - 1) * 50)->limit(50)->get()->map(function ($source) use ($channels) {
            return [
                'id' => $source->id, 'outlet_name' => $source->outlet_name, 'business_date' => $source->business_date->toDateString(),
                'shift' => $source->shift, 'source_reference' => $source->source_reference,
                'channels' => array_map(function ($channel) use ($source) {
                    $reported = $this->cents($source->{$channel.'_amount'});
                    $allocated = (int) $source->{$channel.'_allocated'};
                    $received = (int) $source->{$channel.'_received'};

                    return ['channel' => $channel, 'reported_amount' => $this->money($reported), 'allocated_amount' => $this->money($allocated),
                        'received_amount' => $this->money($received), 'unallocated_amount' => $this->money($reported - $allocated),
                        'remaining_amount' => $this->money($allocated - $received)];
                }, $channels),
            ];
        })->all();

        return ['month' => $f['month'], 'as_of' => CarbonImmutable::now('Asia/Jakarta')->toIso8601String(), 'items' => $items, 'total' => $total, 'page' => $page];
    }

    public function detail(string $id, array $u): array
    {
        $this->access($u);
        $a = $this->present($this->row($id));
        $a['receipts'] = DB::table('acc_deposit_receipts')->where('deposit_id', $id)->orderBy('created_at')->orderBy('id')->get()->map(function ($r) {
            $a = (array) $r;
            unset($a['source_key'],$a['amount_cents']);
            $a['amount'] = $this->money((int) $r->amount_cents);

            return $a;
        })->all();
        $a['events'] = DB::table('acc_deposit_events')->where('deposit_id', $id)->orderBy('version')->get()->map(function ($r) {
            $r->snapshot = json_decode($r->snapshot, true);

            return $r;
        })->all();

        return $a;
    }

    private function event(string $id, string $action, array $u, ?string $reason = null, ?string $receipt = null): void
    {
        $r = $this->row($id);
        $snapshot = $this->present($r);
        $snapshot['receipt_id'] = $receipt;
        $snapshot['receipts'] = DB::table('acc_deposit_receipts')->where('deposit_id', $id)->orderBy('created_at')->orderBy('id')->get()->map(function ($r) {
            $a = (array) $r;
            unset($a['source_key'],$a['amount_cents']);
            $a['amount'] = $this->money((int) $r->amount_cents);

            return $a;
        })->all();
        DB::table('acc_deposit_events')->insert(['id' => (string) Str::uuid(), 'deposit_id' => $id, 'actor_id' => $u['sub'], 'actor_role' => $u['role'], 'action' => $action, 'version' => $r->version, 'reason' => $reason, 'snapshot' => json_encode($snapshot, JSON_THROW_ON_ERROR), 'created_at' => now()]);
        $this->audit->logRequired(['actorId' => $u['sub'], 'actorRole' => $u['role'], 'entity' => 'AccountingDeposit', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.deposit.'.$action]);
    }

    public function create(array $d, array $u): array
    {
        $this->access($u, 'write:acc_deposits');

        return DB::transaction(function () use ($d, $u) {
            $o = OmzetRecord::where('division_code', 'ACC')->where('id', $d['omzet_id'])->lockForUpdate()->first();
            if (! $o || $o->status !== 'validated') {
                throw new ApiException('VALIDATION_ERROR', 'Pilih omzet Accounting yang telah tervalidasi.');
            }
            $this->dates($d['deposit_date'], $o->business_date->toDateString());
            $amount = $this->cents($d['amount']);
            if ($amount < 1) {
                throw new ApiException('VALIDATION_ERROR', 'Nominal harus positif.');
            }
            $used = (int) DB::table('acc_deposits')->where('omzet_id', $o->id)->where('channel', $d['channel'])->where('status', 'recorded')->sum('amount_cents');
            if ($used + $amount > $this->cents($o->{$d['channel'].'_amount'})) {
                throw new ApiException('VERSION_CONFLICT', 'Alokasi setoran melebihi pembayaran kanal omzet. Muat ulang sumber.');
            }
            $id = (string) Str::uuid();
            DB::table('acc_deposits')->insert(['id' => $id, 'omzet_id' => $o->id, 'channel' => $d['channel'], 'deposit_date' => $d['deposit_date'], 'amount_cents' => $amount, 'destination' => $d['destination'], 'source_reference' => $d['source_reference'], 'source_key' => $this->key($d['source_reference']), 'evidence_reference' => $d['evidence_reference'], 'status' => 'recorded', 'version' => 1, 'created_by' => $u['sub'], 'created_at' => now(), 'updated_at' => now()]);
            $this->event($id, 'created', $u);

            return $this->detail($id, $u);
        });
    }

    public function change(string $id, string $action, array $d, array $u, ?string $receiptId = null): array
    {
        $this->access($u, $action === 'receive' ? 'receive:acc_deposits' : 'view:acc_deposits');

        return DB::transaction(function () use ($id, $action, $d, $u, $receiptId) {
            $base = $this->row($id);
            OmzetRecord::where('division_code', 'ACC')->where('id', $base->omzet_id)->lockForUpdate()->firstOrFail();
            $r = $this->row($id, true);
            if ($r->status !== 'recorded' || (int) $r->version !== (int) $d['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Setoran telah berubah atau dibatalkan. Muat ulang detail.');
            }
            if ($action === 'receive') {
                if ($r->created_by === $u['sub']) {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'Penerima harus berbeda dari pembuat setoran.');
                }
                $this->dates($d['received_date'], $r->deposit_date);
                $amount = $this->cents($d['amount']);
                $received = (int) DB::table('acc_deposit_receipts')->where('deposit_id', $id)->where('status', 'recorded')->sum('amount_cents');
                if ($amount < 1) {
                    throw new ApiException('VALIDATION_ERROR', 'Nominal harus positif.');
                }if ($received + $amount > (int) $r->amount_cents) {
                    throw new ApiException('VERSION_CONFLICT', 'Penerimaan melampaui nominal setoran.');
                }
                $receiptId = (string) Str::uuid();
                DB::table('acc_deposit_receipts')->insert(['id' => $receiptId, 'deposit_id' => $id, 'received_date' => $d['received_date'], 'amount_cents' => $amount, 'evidence_reference' => $d['evidence_reference'], 'source_key' => $this->key($d['evidence_reference']), 'status' => 'recorded', 'created_by' => $u['sub'], 'created_at' => now()]);
            } elseif ($action === 'void_receipt') {
                $receipt = DB::table('acc_deposit_receipts')->where('deposit_id', $id)->where('id', $receiptId)->first();
                if (! $receipt) {
                    throw new ApiException('RESOURCE_NOT_FOUND', 'Penerimaan tidak ditemukan.');
                }
                $manager = $this->policy->hasCapability($u, 'void:acc_deposits');
                if (! $manager) {
                    $this->access($u, 'receive:acc_deposits');
                    if ($receipt->created_by !== $u['sub']) {
                        throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pencatat penerimaan atau Manager dapat membatalkan.');
                    }
                }
                if ($receipt->status !== 'recorded') {
                    throw new ApiException('VERSION_CONFLICT', 'Penerimaan telah dibatalkan.');
                }DB::table('acc_deposit_receipts')->where('id', $receiptId)->update(['status' => 'voided']);
            } else {
                $manager = $this->policy->hasCapability($u, 'void:acc_deposits');
                if (! $manager) {
                    $this->access($u, 'write:acc_deposits');
                    if ($r->created_by !== $u['sub']) {
                        throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat setoran atau Manager dapat membatalkan.');
                    }
                }
                if (DB::table('acc_deposit_receipts')->where('deposit_id', $id)->exists()) {
                    throw new ApiException('VERSION_CONFLICT', 'Setoran yang pernah mempunyai penerimaan tidak dapat dibatalkan.');
                }DB::table('acc_deposits')->where('id', $id)->update(['status' => 'voided']);
            }
            DB::table('acc_deposits')->where('id', $id)->update(['version' => $r->version + 1, 'updated_at' => now()]);
            $this->event($id, $action, $u, $d['reason'] ?? null, $receiptId);

            return $this->detail($id, $u);
        });
    }
}
