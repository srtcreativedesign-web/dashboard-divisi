<?php

namespace Database\Seeders;

use App\Models\AccountingAccount;
use App\Models\AccountingOutstanding;
use App\Models\AccountingPeriod;
use App\Models\Division;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AccountingOutstandingSeeder extends Seeder
{
    public function run(): void
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            return;
        }

        $admin = User::where('email', 'admin.acc@dashboard.test')->first();
        $outlet = Outlet::where('division_id', $acc->id)->first();
        $account = AccountingAccount::where('division_id', $acc->id)->first();

        $period = AccountingPeriod::where('division_id', $acc->id)
            ->where('period_month', '2026-08-01')
            ->first();

        if (! $period) {
            return;
        }

        $items = [
            [
                'code' => 'OTS-2026-08-01',
                'description' => 'GAJI LAPANGAN',
                'amount' => 500000000,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-02',
                'description' => 'TAGIHAN KSO',
                'amount' => 27267432,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-03',
                'description' => 'DC WRAPPING',
                'amount' => 258208006,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-04',
                'description' => 'TAGIHAN API FIRST SECURE T3E/T3A PERIODE MEI',
                'amount' => 193411267,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-05',
                'description' => 'TAGIHAN API KINGTECH T2F & FIRST SECURE PERIODE JUNI',
                'amount' => 76104000,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-06',
                'description' => 'TAGIHAN API KINGTECH T2D PERIODE JULI',
                'amount' => 117087568,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-07',
                'description' => 'TAGIHAN API FIRST SECURE T2D PERIODE JULI',
                'amount' => 121782112,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-08',
                'description' => 'SEWA GUDANG PERIODE 1 AGUSTUS 2026 - 31 JULI 2027',
                'amount' => 144600000,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
            [
                'code' => 'OTS-2026-08-09',
                'description' => 'SEWA GUDANG PERIODE 15 AGUSTUS 2026 - 14 AGUSTUS 2027',
                'amount' => 108243784,
                'due_date' => '2026-09-15',
                'category_name' => 'Operasional Wrapping',
            ],
        ];

        foreach ($items as $it) {
            AccountingOutstanding::updateOrCreate(
                [
                    'division_id' => $acc->id,
                    'code' => $it['code'],
                ],
                [
                    'id' => (string) Str::uuid(),
                    'period_id' => $period->id,
                    'account_id' => $account?->id,
                    'outlet_id' => $outlet?->id,
                    'description' => $it['description'],
                    'amount' => $it['amount'],
                    'paid_amount' => 0,
                    'remaining_amount' => $it['amount'],
                    'due_date' => $it['due_date'],
                    'status' => 'unpaid',
                    'category_name' => $it['category_name'],
                    'created_by_id' => $admin?->id,
                ]
            );
        }
    }
}
