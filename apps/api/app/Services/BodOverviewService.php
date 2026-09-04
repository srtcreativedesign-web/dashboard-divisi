<?php

namespace App\Services;

use App\Models\Division;

class BodOverviewService
{
    // SOP 4 / anti IDOR: non-BOD hanya melihat divisinya sendiri; BOD lintas 7 divisi.
    protected function canAccessDivision(array $user, string $divisionCode): bool
    {
        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        if ($role === 'BOD' && $userDivision === null) {
            return true;
        }

        return $userDivision === $divisionCode;
    }

    public function getOverview(array $user, ?string $periodFrom = null, ?string $periodTo = null): array
    {
        // SOP: BOD Overview adalah ringkasan operasional retail 7 divisi existing (ACC memiliki domain laporan khusus).
        $divisions = Division::where('code', '!=', 'ACC')->orderBy('sort_order', 'asc')->get()
            ->filter(fn ($d) => $this->canAccessDivision($user, (string) $d->code));
        $divs = $divisions->map(fn ($d) => [
            'code' => $d->code,
            'name' => $d->name,
            'updated_at' => $d->updated_at?->toISOString() ?? now()->toISOString(),
        ])->toArray();

        $now = now();
        $from = $periodFrom ?? $now->format('Y-m-01');
        $to = $periodTo ?? $now->format('Y-m-d');

        return array_map(function ($div) use ($from, $to) {
            $isMC = ($div['code'] === 'MC');

            // --- SEEDER / MOCK DATA ---
            // Membuat data acak tapi realistis berdasarkan division code untuk demo
            $baseRevenues = [
                'WRAP' => 2200000000,
                'CELL' => 1800000000,
                'MINI' => 3500000000,
                'FNB' => 1200000000,
                'REFL' => 450000000,
                'MC' => 5000000000,
                'FIN' => 800000000,
            ];

            $baseTargets = [
                'WRAP' => 2500000000,
                'CELL' => 1600000000,
                'MINI' => 3400000000,
                'FNB' => 1500000000,
                'REFL' => 400000000,
                'MC' => 5000000000,
                'FIN' => 750000000,
            ];

            $baseRevenue = $baseRevenues[$div['code']] ?? 1000000000;
            $targetValue = $baseTargets[$div['code']] ?? 1000000000;

            // Tambahkan sedikit variasi acak +- 5% agar terlihat dinamis tiap request
            $variance = rand(-5, 5) / 100;
            $revenue = $baseRevenue + ($baseRevenue * $variance);
            $achievement = round(($revenue / $targetValue) * 100, 1);

            $score = min(100, round($achievement));
            $level = $score >= 100 ? 'A' : ($score >= 80 ? 'B' : 'C');
            $workforceCounts = ['WRAP' => 45, 'CELL' => 20, 'MINI' => 30, 'FNB' => 60, 'REFL' => 15, 'MC' => 8, 'FIN' => 5];

            return [
                'divisionCode' => $div['code'],
                'divisionName' => $div['name'],
                'revenue' => [
                    'gross' => $isMC ? null : $revenue,
                    'source' => $isMC ? 'forex.volume' : 'revenue.daily',
                    'freshness' => $div['updated_at'] ?? now()->toISOString(),
                ],
                'target' => [
                    'value' => $targetValue,
                    'achievement' => $achievement,
                    'source' => 'target.monthly',
                ],
                'performance' => [
                    'score' => $score,
                    'level' => $level,
                    'source' => 'performance.score',
                ],
                'workforce' => [
                    'count' => $workforceCounts[$div['code']] ?? 10,
                    'risk' => $level === 'A' ? 'low' : ($level === 'B' ? 'medium' : 'high'),
                    'source' => 'workforce.count',
                ],
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'drillDown' => [
                    'href' => "/dashboard?divisionCode={$div['code']}&from={$from}&to={$to}",
                ],
            ];
        }, $divs);
    }
}
