<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Division;
use App\Models\DivisionConfig;

class DivisionConfigService
{
    public function getConfig(string $divisionCode): ?array
    {
        $division = Division::where('code', $divisionCode)->first();
        if (! $division) {
            return null;
        }

        $config = DivisionConfig::where('division_id', $division->id)->first();
        if (! $config) {
            return [
                'divisionCode' => $divisionCode,
                'divisionName' => $division->name,
                'enabledModules' => [],
                'enabledKpis' => [],
                'isActive' => $division->is_active,
            ];
        }

        return [
            'divisionCode' => $divisionCode,
            'divisionName' => $division->name,
            'enabledModules' => $config->enabled_modules ?? [],
            'enabledKpis' => $config->enabled_kpis ?? [],
            'isActive' => $config->is_active && $division->is_active,
        ];
    }

    public function getAllConfigs(): array
    {
        $configs = DivisionConfig::with('division')->get();

        return $configs->map(fn ($c) => [
            'divisionCode' => $c->division->code,
            'divisionName' => $c->division->name,
            'enabledModules' => $c->enabled_modules,
            'enabledKpis' => $c->enabled_kpis,
            'isActive' => $c->is_active && $c->division->is_active,
        ])->toArray();
    }

    public function upsertConfig(string $divisionCode, array $enabledModules, array $enabledKpis): array
    {
        $division = Division::where('code', $divisionCode)->first();
        if (! $division) {
            throw new ApiException('RESOURCE_NOT_FOUND', "Division {$divisionCode} not found");
        }

        $config = DivisionConfig::updateOrCreate(
            ['division_id' => $division->id],
            [
                'enabled_modules' => $enabledModules,
                'enabled_kpis' => $enabledKpis,
                'is_active' => true,
            ]
        );

        return [
            'divisionCode' => $divisionCode,
            'enabledModules' => $config->enabled_modules,
            'enabledKpis' => $config->enabled_kpis,
        ];
    }

    public function createDivisionWithConfig(string $code, string $name, array $modules, array $kpis): array
    {
        $division = Division::create([
            'code' => $code,
            'name' => $name,
            'is_active' => true,
            'sort_order' => 99,
        ]);

        $config = DivisionConfig::create([
            'division_id' => $division->id,
            'enabled_modules' => $modules,
            'enabled_kpis' => $kpis,
            'is_active' => true,
        ]);

        return [
            'division' => $division->toArray(),
            'config' => $config->toArray(),
        ];
    }
}
