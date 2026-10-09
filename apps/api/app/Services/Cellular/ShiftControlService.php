<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShiftControlService
{
    private const CHECKS = ['handover_complete', 'stock_count_complete', 'payment_channels_ready', 'closing_matched'];
    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}
    private function outlets(array $user): array { $this->policy->assertDivisionScope($user, 'CELL'); $this->policy->assertCapability($user, 'view:cellular_shift'); return $this->org->getOutletsForUser($user, 'CELL'); }
    private function names(array $user): array { return collect($this->outlets($user))->pluck('name', 'id')->all(); }
    private function present(object $row, array $names): array { $result = (array) $row; $result['outlet_name'] = $names[$result['outlet_id']] ?? 'Outlet'; $result['checklist'] = is_string($result['checklist']) ? json_decode($result['checklist'], true, flags: JSON_THROW_ON_ERROR) : (array) $result['checklist']; $result['completed_checks'] = count(array_filter($result['checklist'])); $result['total_checks'] = count(self::CHECKS); $result['is_overdue'] = ! in_array($result['status'], ['resolved'], true) && CarbonImmutable::parse($result['due_at'])->isPast(); return $result; }

    public function index(string $month, array $user): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month); $names = $this->names($user);
        return DB::table('cel_shift_controls')->whereIn('outlet_id', array_keys($names))->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])->orderByDesc('business_date')->orderBy('shift_code')->get()->map(fn ($row) => $this->present($row, $names))->all();
    }

    public function save(array $data, array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL', true); $this->policy->assertCapability($user, 'write:cellular_shift');
        $outlets = $this->names($user); if (! isset($outlets[$data['outlet_id']])) throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet Cellular tidak ditemukan.');
        $checklist = collect(self::CHECKS)->mapWithKeys(fn ($key) => [$key => (bool) ($data['checklist'][$key] ?? false)])->all();
        $due = CarbonImmutable::parse($data['due_at'], 'Asia/Jakarta'); $business = CarbonImmutable::parse($data['business_date'], 'Asia/Jakarta');
        if ($due->lt($business->startOfDay()) || $due->gt($business->addDays(2)->endOfDay())) throw new ApiException('VALIDATION_ERROR', 'Tenggat harus berada pada hari bisnis sampai H+2.');
        return DB::transaction(function () use ($data, $user, $outlets, $checklist, $due) {
            $existing = isset($data['id']) ? DB::table('cel_shift_controls')->where('id', $data['id'])->lockForUpdate()->first() : null;
            if ($existing && ($existing->created_by !== $user['sub'] || ! in_array($existing->status, ['draft', 'correction'], true) || (int) $existing->version !== (int) $data['version'])) throw new ApiException('VERSION_CONFLICT', 'Kontrol shift sudah berubah atau bukan milik Anda.');
            $duplicate = DB::table('cel_shift_controls')->where('outlet_id', $data['outlet_id'])->whereDate('business_date', $data['business_date'])->where('shift_code', strtoupper($data['shift_code']))->when($existing, fn ($query) => $query->where('id', '!=', $existing->id))->exists();
            if ($duplicate) throw new ApiException('VERSION_CONFLICT', 'Kontrol untuk outlet, tanggal, dan shift ini sudah ada.');
            $id = $existing?->id ?? (string) Str::uuid(); $values = ['outlet_id' => $data['outlet_id'], 'business_date' => $data['business_date'], 'shift_code' => strtoupper($data['shift_code']), 'pic_name' => trim($data['pic_name']), 'due_at' => $due->utc(), 'priority' => $data['priority'], 'checklist' => json_encode($checklist, JSON_THROW_ON_ERROR), 'issue_summary' => filled($data['issue_summary'] ?? null) ? trim($data['issue_summary']) : null, 'status' => 'draft', 'review_note' => null, 'updated_at' => now()];
            if ($existing) DB::table('cel_shift_controls')->where('id', $id)->update($values + ['version' => $existing->version + 1]); else DB::table('cel_shift_controls')->insert($values + ['id' => $id, 'created_by' => $user['sub'], 'version' => 1, 'created_at' => now()]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularShiftControl', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.shift.saved']);
            return $this->present(DB::table('cel_shift_controls')->where('id', $id)->first(), $outlets);
        });
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $rules = [
            'submit' => ['write:cellular_shift', ['draft','correction'], 'submitted'], 'review' => ['review:cellular_shift', ['submitted'], 'reviewed'],
            'correction' => ['review:cellular_shift', ['submitted'], 'correction'], 'escalate' => ['manage:cellular_shift', ['reviewed'], 'escalated'],
            'resolve' => ['manage:cellular_shift', ['reviewed'], 'resolved'], 'decide' => ['approve:cellular_shift', ['escalated'], 'resolved'],
        ];
        if (! isset($rules[$action])) throw new ApiException('INVALID_STATE_TRANSITION', 'Tindakan kontrol shift tidak dikenal.');
        [$capability, $from, $to] = $rules[$action]; $this->policy->assertDivisionScope($user, 'CELL', true); $this->policy->assertCapability($user, $capability);
        return DB::transaction(function () use ($id, $action, $data, $user, $from, $to) {
            $names = $this->names($user); $row = DB::table('cel_shift_controls')->where('id', $id)->whereIn('outlet_id', array_keys($names))->lockForUpdate()->first();
            if (! $row) throw new ApiException('RESOURCE_NOT_FOUND', 'Kontrol shift tidak ditemukan.');
            if (! in_array($row->status, $from, true) || (int) $row->version !== (int) $data['version']) throw new ApiException('VERSION_CONFLICT', 'Status atau versi kontrol shift sudah berubah.');
            if ($action === 'submit' && $row->created_by !== $user['sub']) throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat yang dapat mengajukan kontrol shift.');
            if ($action === 'submit' && count(array_filter(json_decode($row->checklist, true, flags: JSON_THROW_ON_ERROR))) < count(self::CHECKS) && empty($row->issue_summary)) throw new ApiException('VALIDATION_ERROR', 'Checklist belum lengkap; ringkasan temuan wajib diisi.');
            if ($row->created_by === $user['sub'] && $action !== 'submit') throw new ApiException('MAKER_CHECKER_VIOLATION', 'Pembuat tidak boleh memeriksa pekerjaannya sendiri.');
            if (in_array($action, ['correction','escalate','decide'], true) && mb_strlen(trim($data['note'] ?? '')) < 10) throw new ApiException('VALIDATION_ERROR', 'Catatan tindakan minimal 10 karakter.');
            $updates = ['status' => $to, 'review_note' => $data['note'] ?? null, 'version' => $row->version + 1, 'updated_at' => now()];
            if (in_array($action, ['review','correction'], true)) $updates['reviewed_by'] = $user['sub']; if (in_array($action, ['resolve','escalate'], true)) $updates['supervised_by'] = $user['sub']; if ($action === 'decide') $updates['resolved_by'] = $user['sub'];
            DB::table('cel_shift_controls')->where('id', $id)->update($updates); $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularShiftControl', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.shift.'.$action]);
            return $this->present(DB::table('cel_shift_controls')->where('id', $id)->first(), $names);
        });
    }
}
