<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\DivisionConfig;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MvpMasterSeeder extends Seeder
{
    public const DIVISIONS = [
        'ACC' => ['name' => 'Accounting', 'modules' => ['dashboard', 'accounting']],
        'PROJECT' => ['name' => 'Project', 'modules' => ['dashboard', 'projects']],
        'CELL' => ['name' => 'Cellular', 'modules' => ['dashboard', 'cellular']],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $order = 1;
            foreach (self::DIVISIONS as $code => $definition) {
                $division = Division::firstOrCreate(['code' => $code], [
                    'name' => $definition['name'],
                    'sort_order' => $order++,
                    'is_active' => true,
                ]);
                DivisionConfig::firstOrCreate(['division_id' => $division->id], [
                    'enabled_modules' => $definition['modules'],
                    'enabled_kpis' => [],
                    'is_active' => true,
                ]);
            }
        });
    }
}
