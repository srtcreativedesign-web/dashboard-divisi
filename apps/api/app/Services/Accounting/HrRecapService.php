<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HrRecapService
{
    public function __construct(private PolicyService $policy, private OrgReadModelService $org, private AuditService $audit) {}

    private function access(array $user, bool $write = false): void
    {
        $this->policy->assertDivisionScope($user, 'ACC', $write);
        $this->policy->assertCapability($user, $write ? 'write:acc_hr' : 'view:acc_hr');
    }

    private function present(object $record): array
    {
        $data = (array) $record;
        unset($data['source_key']);
        $days = $data['source_days_hundredths'];
        $data['source_days'] = $days === null ? null : intdiv($days, 100).'.'.str_pad((string) ($days % 100), 2, '0', STR_PAD_LEFT);
        unset($data['source_days_hundredths']);

        return $data;
    }

    public function list(array $filters, array $user): array
    {
        $this->access($user);
        $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month']);
        $query = DB::table('acc_hr_recaps')->where('kind', $filters['kind'])
            ->where('start_date', '<=', $start->endOfMonth()->toDateString())->where('end_date', '>=', $start->toDateString());
        $total = (clone $query)->count();
        $page = (int) ($filters['page'] ?? 1);

        return ['items' => $query->orderByDesc('start_date')->orderBy('id')->offset(($page - 1) * 50)->limit(50)->get()->map(fn ($r) => $this->present($r))->all(), 'total' => $total, 'page' => $page, 'per_page' => 50];
    }

    public function get(string $id, array $user): array
    {
        $this->access($user);
        $row = DB::table('acc_hr_recaps')->where('id', $id)->first();
        if (! $row) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Rekap tidak ditemukan.');
        }
        $data = $this->present($row);
        $data['events'] = DB::table('acc_hr_events')->where('record_id', $id)->orderBy('version')->get()->map(function ($event) {
            $event->before = $event->before === null ? null : json_decode($event->before, true);
            $event->after = json_decode($event->after, true);

            return $event;
        })->all();

        return $data;
    }

    private function values(array $data): array
    {
        if ($data['kind'] === 'attendance') {
            if ($data['start_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
                throw new ApiException('VALIDATION_ERROR', 'Tanggal realisasi absensi tidak boleh di masa depan.');
            }

            return ['start_date' => $data['start_date'], 'end_date' => $data['start_date'], 'attendance_status' => $data['attendance_status'],
                'schedule_reference' => $data['schedule_reference'], 'late_minutes' => $data['late_minutes'],
                'leave_type' => null, 'source_days_hundredths' => null, 'approval_reference' => null];
        }
        [$whole,$fraction] = array_pad(explode('.', $data['source_days']), 2, '');
        $days = (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
        if ($days < 1 || $days > 36600) {
            throw new ApiException('VALIDATION_ERROR', 'Jumlah hari sumber harus lebih dari nol dan maksimal 366.');
        }

        return ['start_date' => $data['start_date'], 'end_date' => $data['end_date'], 'leave_type' => $data['leave_type'],
            'source_days_hundredths' => $days, 'approval_reference' => $data['approval_reference'], 'attendance_status' => null, 'schedule_reference' => null, 'late_minutes' => null];
    }

    private function checkOverlap(string $employee, string $kind, array $values, ?string $except = null): void
    {
        $q = DB::table('acc_hr_recaps')->where('employee_id', $employee)->where('kind', $kind)->where('status', 'recorded')
            ->where('start_date', '<=', $values['end_date'])->where('end_date', '>=', $values['start_date']);
        if ($except) {
            $q->where('id', '<>', $except);
        }
        if ($q->exists()) {
            throw new ApiException('VERSION_CONFLICT', $kind === 'leave' ? 'Rentang cuti bertumpang tindih dengan rekap aktif.' : 'Absensi pegawai pada tanggal ini sudah dicatat.');
        }
    }

    private function event(string $id, string $action, ?array $before, array $after, ?string $reason, array $user): void
    {
        DB::table('acc_hr_events')->insert(['id' => (string) Str::uuid(), 'record_id' => $id, 'actor_id' => $user['sub'], 'actor_role' => $user['role'],
            'action' => $action, 'version' => $after['version'], 'reason' => $reason, 'before' => $before === null ? null : json_encode($before, JSON_THROW_ON_ERROR),
            'after' => json_encode($after, JSON_THROW_ON_ERROR), 'created_at' => now()]);
        $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingHrRecap', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.hr.'.$action]);
    }

    public function create(array $data, array $user): array
    {
        $this->access($user, true);

        return DB::transaction(function () use ($data, $user) {
            $employee = $this->org->lockAccountingEmployee($data['employee_id'], $user);
            $values = $this->values($data);
            $this->checkOverlap($employee->id, $data['kind'], $values);
            $key = hash('sha256', $data['kind'].'|'.$employee->id.'|'.strtoupper(trim($data['source_reference'])));
            if (DB::table('acc_hr_recaps')->where('source_key', $key)->exists()) {
                throw new ApiException('VERSION_CONFLICT', 'Referensi sumber sudah tercatat untuk pegawai ini.');
            }
            $id = (string) Str::uuid();
            DB::table('acc_hr_recaps')->insert($values + ['id' => $id, 'employee_id' => $employee->id, 'employee_code' => $employee->code, 'employee_name' => $employee->name,
                'kind' => $data['kind'], 'source_reference' => $data['source_reference'], 'source_key' => $key, 'status' => 'recorded', 'version' => 1, 'created_by' => $user['sub'], 'created_at' => now(), 'updated_at' => now()]);
            $after = $this->present(DB::table('acc_hr_recaps')->where('id', $id)->first());
            $this->event($id, 'created', null, $after, null, $user);

            return $this->get($id, $user);
        });
    }

    public function change(string $id, array $data, array $user, bool $void = false): array
    {
        $this->access($user, true);

        return DB::transaction(function () use ($id, $data, $user, $void) {
            $base = DB::table('acc_hr_recaps')->where('id', $id)->first();
            if (! $base) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Rekap tidak ditemukan.');
            }
            $this->org->lockAccountingEmployee($base->employee_id, $user, false);
            $row = DB::table('acc_hr_recaps')->where('id', $id)->lockForUpdate()->first();
            if ($row->status !== 'recorded' || (int) $row->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Rekap telah berubah atau dibatalkan. Muat ulang data.');
            }
            if (! $void && $data['kind'] !== $row->kind) {
                throw new ApiException('VALIDATION_ERROR', 'Jenis rekap tidak dapat diganti.');
            }
            $values = $void ? ['status' => 'voided'] : $this->values($data);
            if (! $void) {
                $this->checkOverlap($row->employee_id, $row->kind, $values, $id);
            }
            DB::table('acc_hr_recaps')->where('id', $id)->update($values + ['version' => $row->version + 1, 'updated_at' => now()]);
            $after = $this->present(DB::table('acc_hr_recaps')->where('id', $id)->first());
            $this->event($id, $void ? 'voided' : 'corrected', $this->present($row), $after, $data['reason'], $user);

            return $this->get($id, $user);
        });
    }
}
