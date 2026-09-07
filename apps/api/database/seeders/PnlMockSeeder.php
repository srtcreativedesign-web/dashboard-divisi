<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Outlet;
use App\Models\RevenueDaily;
use App\Models\BudgetEntry;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PnlMockSeeder extends Seeder
{
    public function run(): void
    {
        $year = 2026;
        $divisions = Division::all();
        $outlets = Outlet::all();

        $lineTypes = ['COGS', 'OPEX', 'OTHER_INCOME', 'DEPRECIATION', 'INTEREST', 'TAX'];

        foreach ($outlets as $outlet) {
            $divisionCode = $outlet->division->code ?? 'WRAP';
            
            // Seed BudgetEntries (Monthly)
            for ($month = 1; $month <= 12; $month++) {
                $period = Carbon::create($year, $month, 1)->format('Y-m-d');
                
                foreach ($lineTypes as $type) {
                    BudgetEntry::create([
                        'id' => (string) Str::uuid(),
                        'statement' => 'PNL',
                        'division_code' => $divisionCode,
                        'outlet_id' => $outlet->id,
                        'period_month' => $period,
                        'line_type' => $type,
                        'line_code' => $type . '_01',
                        'amount' => rand(1000000, 50000000), // Random amount between 1M and 50M
                        'label' => "Mock $type budget",
                    ]);
                }
            }

            // Seed RevenueDaily (Daily)
            for ($month = 1; $month <= 12; $month++) {
                $daysInMonth = Carbon::create($year, $month)->daysInMonth;
                for ($day = 1; $day <= $daysInMonth; $day++) {
                    $date = Carbon::create($year, $month, $day)->format('Y-m-d');
                    RevenueDaily::create([
                        'id' => (string) Str::uuid(),
                        'outlet_id' => $outlet->id,
                        'division_code' => $divisionCode,
                        'business_date' => $date,
                        'gross_revenue' => rand(1500000, 10000000), // 1.5M to 10M daily
                        'net_revenue' => rand(1000000, 8000000), // 1M to 8M daily
                        'transaction_count' => rand(10, 100),
                        'is_active' => true,
                        'version' => 1,
                    ]);
                }
            }
        }
    }
}
