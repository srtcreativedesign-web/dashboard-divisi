<?php

namespace App\Services;

class BodReadModelService
{
    public function __construct(private MvpDivisionReadService $divisions, private DivisionConfigService $configuration) {}

    public function getExecutiveReadModel(array $user): array
    {
        return array_map(function ($division) {
            $config = $this->configuration->getConfig($division['code']);
            $kpis = ($config['isActive'] ?? false) ? ($config['enabledKpis'] ?? []) : [];

            return [
                'divisionCode' => $division['code'],
                'divisionName' => $division['name'],
                'metrics' => array_map(fn ($code) => ['kpiCode' => $code, 'value' => null, 'compatible' => false], $kpis),
                'compatibleDivisions' => [],
                'dataStatus' => 'not_available',
            ];
        }, $this->divisions->list($user));
    }

    public function isComparable(string $divisionA, string $divisionB, string $kpiCode): bool
    {
        if (! in_array($divisionA, MvpDivisionReadService::CODES, true)
            || ! in_array($divisionB, MvpDivisionReadService::CODES, true)) {
            return false;
        }

        return KpiCompatibility::areDivisionsCompatible($divisionA, $divisionB, $kpiCode);
    }
}
