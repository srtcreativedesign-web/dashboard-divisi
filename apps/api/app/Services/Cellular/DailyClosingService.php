<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DailyClosingService
{
    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    private function outlets(array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL');
        $this->policy->assertCapability($user, 'view:cellular_daily');
        return $this->org->getOutletsForUser($user, 'CELL');
    }

    private function outlet(array $user, string $id): array
    {
        $outlet = collect($this->outlets($user))->firstWhere('id', $id);
        if (! $outlet) throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet Cellular tidak ditemukan.');
        return $outlet;
    }

    private function cents(string $value): int
    {
        [$whole, $fraction] = array_pad(explode('.', $value), 2, '');
        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string { return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT); }

    private function present(object $row): array
    {
        $result = (array) $row;
        foreach (['system_sales_cents' => 'system_sales', 'cash_cents' => 'cash', 'qris_cents' => 'qris', 'edc_cents' => 'edc', 'transfer_cents' => 'transfer', 'difference_cents' => 'difference'] as $source => $target) {
            $result[$target] = $this->money((int) $result[$source]); unset($result[$source]);
        }
        return $result;
    }

    public function index(string $month, array $user): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        return DB::table('cel_daily_closings')->whereIn('outlet_id', array_column($this->outlets($user), 'id'))
            ->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->orderByDesc('business_date')->orderBy('shift_code')->get()->map(fn ($row) => $this->present($row))->all();
    }

    public function save(array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:cellular_daily');
        $this->outlet($user, $data['outlet_id']);
        $payments = collect(['cash', 'qris', 'edc', 'transfer'])->mapWithKeys(fn ($key) => [$key.'_cents' => $this->cents($data[$key])])->all();
        $system = (int) DB::table('cel_manual_sales')->where('outlet_id', $data['outlet_id'])->whereDate('business_date', $data['business_date'])->where('status', 'posted')->sum('total_cents');
        $difference = array_sum($payments) - $system;
        return DB::transaction(function () use ($data, $user, $payments, $system, $difference) {
            $existing = DB::table('cel_daily_closings')->where('outlet_id', $data['outlet_id'])->whereDate('business_date', $data['business_date'])->where('shift_code', $data['shift_code'])->lockForUpdate()->first();
            if ($existing && ! in_array($existing->status, ['draft', 'correction'], true)) throw new ApiException('INVALID_STATE_TRANSITION', 'Penerimaan yang sudah diajukan tidak dapat diubah.');
            $id = $existing?->id ?? (string) Str::uuid();
            $values = $payments + ['system_sales_cents' => $system, 'difference_cents' => $difference, 'source_reference' => trim($data['source_reference']), 'status' => 'draft', 'review_note' => null, 'updated_at' => now()];
            if ($existing) DB::table('cel_daily_closings')->where('id', $id)->update($values + ['version' => $existing->version + 1]);
            else DB::table('cel_daily_closings')->insert($values + ['id' => $id, 'outlet_id' => $data['outlet_id'], 'business_date' => $data['business_date'], 'shift_code' => strtoupper($data['shift_code']), 'created_by' => $user['sub'], 'version' => 1, 'created_at' => now()]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularDailyClosing', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.daily.saved']);
            return $this->present(DB::table('cel_daily_closings')->where('id', $id)->first());
        });
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $rules = [
            'submit' => ['capability' => 'write:cellular_daily', 'from' => ['draft', 'correction'], 'to' => 'submitted'],
            'validate' => ['capability' => 'validate:cellular_daily', 'from' => ['submitted'], 'to' => 'validated'],
            'approve' => ['capability' => 'approve:cellular_daily', 'from' => ['validated'], 'to' => 'approved'],
            'correction' => ['capability' => 'validate:cellular_daily', 'from' => ['submitted'], 'to' => 'correction'],
        ];
        if (! isset($rules[$action])) throw new ApiException('INVALID_STATE_TRANSITION', 'Tindakan tidak dikenal.');
        $rule = $rules[$action]; $this->policy->assertCapability($user, $rule['capability']);
        return DB::transaction(function () use ($id, $action, $data, $user, $rule) {
            $row = DB::table('cel_daily_closings')->where('id', $id)->whereIn('outlet_id', array_column($this->outlets($user), 'id'))->lockForUpdate()->first();
            if (! $row) throw new ApiException('RESOURCE_NOT_FOUND', 'Penerimaan harian tidak ditemukan.');
            if (! in_array($row->status, $rule['from'], true) || (int) $row->version !== (int) $data['version']) throw new ApiException('VERSION_CONFLICT', 'Status atau versi penerimaan sudah berubah.');
            if ($action === 'submit' && CarbonImmutable::parse($row->business_date, 'Asia/Jakarta')->addDay()->endOfDay()->isPast() && strtoupper($user['role']) !== 'MANAGER') throw new ApiException('INVALID_STATE_TRANSITION', 'Batas pengajuan H+1 pukul 23.59 WIB telah lewat.');
            if ($action === 'correction' && empty(trim($data['note'] ?? ''))) throw new ApiException('VALIDATION_ERROR', 'Alasan koreksi wajib diisi.');
            $updates = ['status' => $rule['to'], 'version' => $row->version + 1, 'review_note' => $data['note'] ?? null, 'updated_at' => now()];
            if (in_array($action, ['validate', 'correction'], true)) $updates['reviewed_by'] = $user['sub'];
            if ($action === 'approve') $updates['approved_by'] = $user['sub'];
            DB::table('cel_daily_closings')->where('id', $id)->update($updates);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularDailyClosing', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.daily.'.$action]);
            return $this->present(DB::table('cel_daily_closings')->where('id', $id)->first());
        });
    }
}
