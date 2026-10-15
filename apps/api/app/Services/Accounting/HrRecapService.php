<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class HrRecapService
{
    public function __construct(private PolicyService $policy) {}

    private function access(array $user): void
    {
        $this->policy->assertDivisionScope($user, 'ACC');
        $this->policy->assertCapability($user, 'view:acc_hr');
    }

    private function present(object $record): array
    {
        $data = (array) $record;
        unset($data['source_key'], $data['created_by']);
        $days = $data['source_days_hundredths'];
        $data['source_days'] = $days === null ? null : intdiv($days, 100).'.'.str_pad((string) ($days % 100), 2, '0', STR_PAD_LEFT);
        unset($data['source_days_hundredths']);

        return $data;
    }

    public function list(array $filters, array $user): array
    {
        $this->access($user);
        $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month'], 'Asia/Jakarta');
        $query = DB::table('acc_hr_recaps')->where('kind', $filters['kind'])
            ->where('start_date', '<=', $start->endOfMonth()->toDateString())
            ->where('end_date', '>=', $start->toDateString());
        $total = (clone $query)->count();
        $page = (int) ($filters['page'] ?? 1);
        $rows = $query->orderByDesc('start_date')->orderBy('id')->offset(($page - 1) * 50)->limit(50)->get();

        return [
            'items' => $rows->map(fn ($row) => $this->present($row))->all(),
            'total' => $total,
            'page' => $page,
            'per_page' => 50,
            'source' => ['mode' => 'read_only', 'system' => 'attendance_api'],
        ];
    }

    public function get(string $id, array $user): array
    {
        $this->access($user);
        $row = DB::table('acc_hr_recaps')->where('id', $id)->first();
        if (! $row) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Rekap kehadiran tidak ditemukan.');
        }

        return $this->present($row) + ['source' => ['mode' => 'read_only', 'system' => 'attendance_api']];
    }
}
