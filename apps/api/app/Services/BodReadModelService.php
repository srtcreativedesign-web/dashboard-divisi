<?php

namespace App\Services;

use App\Models\Division;

class BodReadModelService
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

    public function getExecutiveReadModel(array $user): array
    {
        // SOP: KPI compatibility read model adalah model perbandingan lintas 7 divisi operasional existing.
        $divisions = Division::where('code', '!=', 'ACC')->orderBy('sort_order', 'asc')->get()
            ->filter(fn ($d) => $this->canAccessDivision($user, (string) $d->code));
        $divs = $divisions->map(fn ($d) => ['code' => $d->code, 'name' => $d->name])->toArray();

        $result = [];
        foreach ($divs as $div) {
            $kpis = KpiCompatibility::DIVISION_KPIS[$div['code']] ?? [];
            $metrics = array_map(fn ($k) => [
                'kpiCode' => $k['code'],
                'value' => null,
                'compatible' => true,
            ], $kpis);

            $compatibleDivisions = [];
            foreach ($kpis as $k) {
                $comp = [];
                foreach ($divs as $other) {
                    if ($other['code'] !== $div['code'] && KpiCompatibility::areDivisionsCompatible($div['code'], $other['code'], $k['code'])) {
                        $comp[] = $other['code'];
                    }
                }
                $compatibleDivisions[$k['code']] = $comp;
            }

            $result[] = [
                'divisionCode' => $div['code'],
                'divisionName' => $div['name'],
                'metrics' => $metrics,
                'compatibleDivisions' => $compatibleDivisions,
            ];
        }

        return $result;
    }

    public function isComparable(string $divisionA, string $divisionB, string $kpiCode): bool
    {
        return KpiCompatibility::areDivisionsCompatible($divisionA, $divisionB, $kpiCode);
    }
}
