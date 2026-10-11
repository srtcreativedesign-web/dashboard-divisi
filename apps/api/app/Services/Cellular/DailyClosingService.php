<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
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
        if (! $outlet) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet Cellular tidak ditemukan.');
        }

        return $outlet;
    }

    private function cents(string $value): int
    {
        [$whole, $fraction] = array_pad(explode('.', $value), 2, '');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        $negative = $cents < 0;
        $cents = abs($cents);

        return ($negative ? '-' : '').intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public function index(string $month, array $user): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $month, 'Asia/Jakarta');
        $rows = DB::table('cel_daily_closings')->whereIn('outlet_id', array_column($this->outlets($user), 'id'))
            ->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->orderByDesc('business_date')->orderBy('shift_code')->get();

        return $this->presentRows($rows);
    }

    public function save(array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:cellular_daily');
        $this->outlet($user, $data['outlet_id']);
        $payments = collect(['cash', 'qris', 'edc', 'transfer'])->mapWithKeys(fn ($key) => [$key.'_cents' => $this->cents($data[$key])])->all();
        $system = (int) DB::table('cel_manual_sales')->where('outlet_id', $data['outlet_id'])->whereDate('business_date', $data['business_date'])->where('status', 'posted')->sum('total_cents');
        $difference = array_sum($payments) - $system;

        return DB::transaction(function () use ($data, $user, $payments, $system, $difference) {
            $shift = strtoupper(trim($data['shift_code']));
            $existing = DB::table('cel_daily_closings')->where('outlet_id', $data['outlet_id'])->whereDate('business_date', $data['business_date'])->where('shift_code', $shift)->lockForUpdate()->first();
            if ($existing && ! in_array($existing->status, ['draft', 'correction'], true)) {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Penerimaan yang sudah diajukan tidak dapat diubah.');
            }
            if ($existing && (int) $existing->version !== (int) ($data['version'] ?? 0)) {
                throw new ApiException('VERSION_CONFLICT', 'Versi penerimaan sudah berubah. Muat ulang sebelum menyimpan.');
            }

            $id = $existing?->id ?? (string) Str::uuid();
            $values = $payments + [
                'system_sales_cents' => $system,
                'difference_cents' => $difference,
                'source_reference' => trim($data['source_reference']),
                'status' => 'draft',
                'review_note' => null,
                'late_submission_requested_at' => null,
                'late_submission_requested_by' => null,
                'late_submission_reason' => null,
                'late_submission_approved_at' => null,
                'late_submission_approved_by' => null,
                'updated_at' => now(),
            ];
            if ($existing) {
                DB::table('cel_daily_closings')->where('id', $id)->update($values + ['version' => $existing->version + 1]);
            } else {
                DB::table('cel_daily_closings')->insert($values + ['id' => $id, 'outlet_id' => $data['outlet_id'], 'business_date' => $data['business_date'], 'shift_code' => $shift, 'created_by' => $user['sub'], 'version' => 1, 'created_at' => now()]);
            }
            $this->audit->logRequired([
                'actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularDailyClosing', 'entityId' => $id,
                'divisionCode' => 'CELL', 'action' => 'cellular.daily.saved',
                'metadata' => ['status_to' => 'draft', 'difference' => $this->money($difference), 'source_reference' => trim($data['source_reference'])],
            ]);

            return $this->presentOne($id);
        });
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $rules = [
            'submit' => ['capability' => 'write:cellular_daily', 'from' => ['draft', 'correction'], 'to' => 'submitted'],
            'request-late' => ['capability' => 'write:cellular_daily', 'from' => ['draft', 'correction'], 'to' => null],
            'approve-late' => ['capability' => 'approve:cellular_daily', 'from' => ['draft', 'correction'], 'to' => null],
            'validate' => ['capability' => 'validate:cellular_daily', 'from' => ['submitted'], 'to' => 'validated'],
            'approve' => ['capability' => 'approve:cellular_daily', 'from' => ['validated'], 'to' => 'approved'],
            'correction' => ['capability' => 'validate:cellular_daily', 'from' => ['submitted'], 'to' => 'correction'],
        ];
        if (! isset($rules[$action])) {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Tindakan tidak dikenal.');
        }
        $rule = $rules[$action];
        $this->policy->assertCapability($user, $rule['capability']);

        return DB::transaction(function () use ($id, $action, $data, $user, $rule) {
            $row = DB::table('cel_daily_closings')->where('id', $id)->whereIn('outlet_id', array_column($this->outlets($user), 'id'))->lockForUpdate()->first();
            if (! $row) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Penerimaan harian tidak ditemukan.');
            }
            if (! in_array($row->status, $rule['from'], true) || (int) $row->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Status atau versi penerimaan sudah berubah.');
            }

            $deadline = $this->deadline($row->business_date);
            $isLate = now('Asia/Jakarta')->isAfter($deadline);
            $note = trim($data['note'] ?? '');
            if (in_array($action, ['correction', 'request-late'], true) && mb_strlen($note) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Alasan wajib diisi minimal 10 karakter.');
            }
            if ($action === 'request-late' && ! $isLate) {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Izin terlambat hanya dapat diminta setelah batas H+1 pukul 23.59 WIB.');
            }
            if ($action === 'approve-late') {
                if (! $row->late_submission_requested_at) {
                    throw new ApiException('INVALID_STATE_TRANSITION', 'Belum ada permintaan izin pengajuan terlambat.');
                }
                if ($row->late_submission_requested_by === $user['sub'] || $row->created_by === $user['sub']) {
                    throw new ApiException('SEGREGATION_OF_DUTIES', 'Pembuat atau pemohon tidak boleh menyetujui izin terlambatnya sendiri.');
                }
            }
            if ($action === 'submit' && $isLate && ! $row->late_submission_approved_at) {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Batas H+1 pukul 23.59 WIB telah lewat. Minta persetujuan Manager sebelum mengajukan.');
            }

            $updates = ['version' => $row->version + 1, 'updated_at' => now()];
            if ($rule['to']) {
                $updates['status'] = $rule['to'];
                $updates['review_note'] = $action === 'correction' ? $note : null;
            }
            if ($action === 'request-late') {
                $updates += ['late_submission_requested_at' => now(), 'late_submission_requested_by' => $user['sub'], 'late_submission_reason' => $note, 'late_submission_approved_at' => null, 'late_submission_approved_by' => null];
            }
            if ($action === 'approve-late') {
                $updates += ['late_submission_approved_at' => now(), 'late_submission_approved_by' => $user['sub']];
            }
            if (in_array($action, ['validate', 'correction'], true)) {
                $updates['reviewed_by'] = $user['sub'];
            }
            if ($action === 'approve') {
                if ($row->created_by === $user['sub']) {
                    throw new ApiException('SEGREGATION_OF_DUTIES', 'Pembuat tidak boleh menyetujui closing miliknya sendiri.');
                }
                $updates['approved_by'] = $user['sub'];
            }
            if ($action === 'correction') {
                $updates += ['late_submission_requested_at' => null, 'late_submission_requested_by' => null, 'late_submission_reason' => null, 'late_submission_approved_at' => null, 'late_submission_approved_by' => null];
            }

            DB::table('cel_daily_closings')->where('id', $id)->update($updates);
            $this->audit->logRequired([
                'actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularDailyClosing', 'entityId' => $id,
                'divisionCode' => 'CELL', 'action' => 'cellular.daily.'.$action,
                'metadata' => ['status_from' => $row->status, 'status_to' => $updates['status'] ?? $row->status, 'note' => $note ?: null, 'deadline_at' => $deadline->toIso8601String(), 'late' => $isLate],
            ]);

            return $this->presentOne($id);
        });
    }

    private function presentOne(string $id): array
    {
        return $this->presentRows(collect([DB::table('cel_daily_closings')->where('id', $id)->first()]))[0];
    }

    private function presentRows(Collection $rows): array
    {
        if ($rows->isEmpty()) {
            return [];
        }
        $ids = $rows->pluck('id')->all();
        $actorIds = $rows->flatMap(fn ($row) => [$row->created_by, $row->reviewed_by, $row->approved_by, $row->late_submission_requested_by, $row->late_submission_approved_by])->filter()->unique()->all();
        $users = DB::table('users')->whereIn('id', $actorIds)->pluck('name', 'id');
        $outletNames = DB::table('outlets')->whereIn('id', $rows->pluck('outlet_id')->unique()->all())->pluck('name', 'id');
        $events = DB::table('audit_events')->where('entity', 'CellularDailyClosing')->whereIn('entity_id', $ids)->orderBy('created_at')->get()->groupBy('entity_id');

        return $rows->map(function ($row) use ($users, $outletNames, $events) {
            $result = (array) $row;
            foreach (['system_sales_cents' => 'system_sales', 'cash_cents' => 'cash', 'qris_cents' => 'qris', 'edc_cents' => 'edc', 'transfer_cents' => 'transfer', 'difference_cents' => 'difference'] as $source => $target) {
                $result[$target] = $this->money((int) $result[$source]);
                unset($result[$source]);
            }
            $deadline = $this->deadline($row->business_date);
            $awaitingSubmission = in_array($row->status, ['draft', 'correction'], true);
            $lateState = ! $awaitingSubmission || ! now('Asia/Jakarta')->isAfter($deadline) ? 'not_required' : ($row->late_submission_approved_at ? 'approved' : ($row->late_submission_requested_at ? 'requested' : 'required'));
            $result += [
                'outlet_name' => $outletNames[$row->outlet_id] ?? 'Outlet',
                'maker_name' => $users[$row->created_by] ?? 'Pengguna',
                'reviewer_name' => $row->reviewed_by ? ($users[$row->reviewed_by] ?? 'Pengguna') : null,
                'approver_name' => $row->approved_by ? ($users[$row->approved_by] ?? 'Pengguna') : null,
                'deadline_at' => $deadline->toIso8601String(),
                'is_overdue' => now('Asia/Jakarta')->isAfter($deadline) && $awaitingSubmission,
                'current_pic' => $this->currentPic($row, $users),
                'late_submission' => [
                    'state' => $lateState,
                    'reason' => $row->late_submission_reason,
                    'requested_at' => $row->late_submission_requested_at,
                    'requested_by_name' => $row->late_submission_requested_by ? ($users[$row->late_submission_requested_by] ?? 'Pengguna') : null,
                    'approved_at' => $row->late_submission_approved_at,
                    'approved_by_name' => $row->late_submission_approved_by ? ($users[$row->late_submission_approved_by] ?? 'Pengguna') : null,
                ],
                'timeline' => collect($events[$row->id] ?? [])->map(function ($event) use ($users) {
                    $metadata = json_decode($event->metadata ?? '{}', true) ?: [];

                    return ['id' => $event->id, 'action' => str_replace('cellular.daily.', '', $event->action), 'actor_name' => $event->actor_id ? ($users[$event->actor_id] ?? 'Pengguna') : 'Sistem', 'actor_role' => $event->actor_role, 'note' => $metadata['note'] ?? null, 'created_at' => $event->created_at];
                })->all(),
            ];

            return $result;
        })->all();
    }

    private function deadline(string $businessDate): CarbonImmutable
    {
        return CarbonImmutable::parse($businessDate, 'Asia/Jakarta')->addDay()->endOfDay();
    }

    private function currentPic(object $row, Collection $users): array
    {
        return match ($row->status) {
            'submitted' => ['role' => 'ACCOUNTING', 'name' => 'Staff Accounting Cellular'],
            'validated' => ['role' => 'MANAGER', 'name' => 'Manager Cellular'],
            'approved' => ['role' => 'SELESAI', 'name' => $row->approved_by ? ($users[$row->approved_by] ?? 'Manager Cellular') : 'Manager Cellular'],
            default => ['role' => 'ADMIN', 'name' => $users[$row->created_by] ?? 'Admin Cellular'],
        };
    }
}
