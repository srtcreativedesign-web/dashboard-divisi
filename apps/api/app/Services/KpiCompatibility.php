<?php

namespace App\Services;

use App\Models\DivisionConfig;

class KpiCompatibility
{
    /**
     * SOP: sumber kebenaran = DivisionConfig (DB), const ini hanya default seed (sinkron dengan DatabaseSeeder::DIVISION_CONFIGS).
     * Saat DB terisi, resolveKpiMap() akan baca dari division_configs.
     */
    public const DIVISION_KPIS = [
        'WRAP' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'target.achievement', 'level' => 'division', 'unit' => 'percent', 'formula' => 'revenue/target*100', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100%'],
        ],
        'CELL' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'target.achievement', 'level' => 'division', 'unit' => 'percent', 'formula' => 'revenue/target*100', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100%'],
        ],
        'REFL' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'performance.score', 'level' => 'division', 'unit' => 'score', 'formula' => 'weighted(score)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-10'],
        ],
        'MINI' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'revenue.net', 'level' => 'division', 'unit' => 'idr', 'formula' => 'gross - discount', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'target.achievement', 'level' => 'division', 'unit' => 'percent', 'formula' => 'revenue/target*100', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100%'],
        ],
        'FNB' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'target.achievement', 'level' => 'division', 'unit' => 'percent', 'formula' => 'revenue/target*100', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100%'],
        ],
        'FIN' => [
            ['code' => 'revenue.gross', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(revenue.daily)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-100'],
            ['code' => 'workforce.count', 'level' => 'division', 'unit' => 'count', 'formula' => 'count(employee)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-1000'],
        ],
        'MC' => [
            ['code' => 'forex.volume', 'level' => 'division', 'unit' => 'idr', 'formula' => 'sum(forex.volume)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-1000000'],
            ['code' => 'forex.spread', 'level' => 'division', 'unit' => 'percent', 'formula' => 'avg(spread)', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '0-5.0%'],
        ],
    ];

    public static function isKpiCompatible(array $a, array $b): bool
    {
        return ($a['level'] ?? '') === ($b['level'] ?? '')
            && ($a['unit'] ?? '') === ($b['unit'] ?? '')
            && ($a['formula'] ?? '') === ($b['formula'] ?? '')
            && ($a['version'] ?? '') === ($b['version'] ?? '');
    }

    public static function areDivisionsCompatible(string $divisionA, string $divisionB, string $kpiCode): bool
    {
        $map = self::resolveKpiMap();
        $kpisA = $map[$divisionA] ?? [];
        $kpisB = $map[$divisionB] ?? [];

        $kpiA = null;
        foreach ($kpisA as $k) {
            if ($k['code'] === $kpiCode) {
                $kpiA = $k;
                break;
            }
        }

        $kpiB = null;
        foreach ($kpisB as $k) {
            if ($k['code'] === $kpiCode) {
                $kpiB = $k;
                break;
            }
        }

        if (! $kpiA || ! $kpiB) {
            return false;
        }

        return self::isKpiCompatible($kpiA, $kpiB);
    }

    private static function resolveKpiMap(): array
    {
        try {
            $configs = DivisionConfig::with('division')->get();
            if ($configs->isNotEmpty()) {
                $map = [];
                foreach ($configs as $c) {
                    $code = $c->division->code;
                    // enabled_kpis adalah array code saja di DB, rebuild ke structure default (dengan bobot/scoring_range)
                    $kpis = [];
                    foreach ($c->enabled_kpis ?? [] as $kpiCode) {
                        $def = null;
                        foreach (self::DIVISION_KPIS[$code] ?? [] as $dk) {
                            if ($dk['code'] === $kpiCode) {
                                $def = $dk;
                                break;
                            }
                        }
                        // Gunakan def dari DB jika ada, else fallback ke constant default
                        $kpis[] = $def ?? ['code' => $kpiCode, 'level' => 'division', 'unit' => 'mixed', 'formula' => 'custom', 'version' => 'v1', 'bobot' => 1.0, 'scoring_range' => '—'];
                    }
                    $map[$code] = $kpis;
                }

                return $map;
            }
        } catch (\Throwable) {
            // fallback ke default saat DB belum siap (migrasi/testing)
        }

        return self::DIVISION_KPIS;
    }

    public static function getCompatibleDivisions(string $kpiCode): array
    {
        $allDivs = array_keys(self::resolveKpiMap());
        $groups = [];
        $visited = [];

        foreach ($allDivs as $div) {
            if (isset($visited[$div])) {
                continue;
            }
            $group = [$div];
            $visited[$div] = true;
            foreach ($allDivs as $other) {
                if (isset($visited[$other])) {
                    continue;
                }
                if (self::areDivisionsCompatible($div, $other, $kpiCode)) {
                    $group[] = $other;
                    $visited[$other] = true;
                }
            }
            if (count($group) > 1) {
                $groups[] = $group;
            }
        }

        foreach ($groups as $group) {
            $hasKpi = false;
            foreach ($group as $d) {
                foreach (self::DIVISION_KPIS[$d] ?? [] as $k) {
                    if ($k['code'] === $kpiCode) {
                        $hasKpi = true;
                        break 2;
                    }
                }
            }
            if ($hasKpi) {
                return $group;
            }
        }

        return array_values(array_filter($allDivs, function ($d) use ($kpiCode) {
            foreach (self::DIVISION_KPIS[$d] ?? [] as $k) {
                if ($k['code'] === $kpiCode) {
                    return true;
                }
            }

            return false;
        }));
    }
}
