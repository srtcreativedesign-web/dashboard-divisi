<?php

namespace Database\Seeders;

use App\Models\AccountingAccount;
use App\Models\AccountingBankReconciliation;
use App\Models\AccountingPeriod;
use App\Models\Division;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AccountingBankReconciliationSeeder extends Seeder
{
    public function run(): void
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            return;
        }

        $admin = User::where('email', 'admin.acc@dashboard.test')->first();
        $period = AccountingPeriod::where('division_id', $acc->id)
            ->where('period_month', '2026-08-01')
            ->first();

        if (! $period) {
            return;
        }

        $accountsData = [
            [
                'outlet' => 'STARWRAPP T2D',
                'account_number' => '155-00-1241716-1',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 8390487.43,
                'aug_balance' => 2505042,
                'mutation' => -5885445.43,
            ],
            [
                'outlet' => 'STARWRAPP T2D',
                'account_number' => '551-0490071',
                'bank_name' => 'BCA',
                'jul_balance' => 0,
                'aug_balance' => 1000000,
                'mutation' => 1000000,
            ],
            [
                'outlet' => 'GALAXYPORT T2E',
                'account_number' => '155-00-1243142-8',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 15108542.11,
                'aug_balance' => 23824835,
                'mutation' => 8716292.89,
            ],
            [
                'outlet' => 'ROBUSTPACK T2F',
                'account_number' => '155-00-1268016-4',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 7621614.65,
                'aug_balance' => 49961293,
                'mutation' => 42339678.35,
            ],
            [
                'outlet' => 'ROBUSTPACK T2F',
                'account_number' => '551-0436492',
                'bank_name' => 'BCA',
                'jul_balance' => 1718494,
                'aug_balance' => 3922744,
                'mutation' => 2204250,
            ],
            [
                'outlet' => 'ROBUSTPACK T3B',
                'account_number' => '155-00-1511537-4',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 11411668.27,
                'aug_balance' => 160978129,
                'mutation' => 149566460.73,
            ],
            [
                'outlet' => 'ROBUSTPACK T3B',
                'account_number' => '551-0489308',
                'bank_name' => 'BCA',
                'jul_balance' => 1000000,
                'aug_balance' => 970000,
                'mutation' => -30000,
            ],
            [
                'outlet' => 'PIONER WRAPPP T1C',
                'account_number' => '155-00-1485895-8',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 1031147.67,
                'aug_balance' => 109252940,
                'mutation' => 108221792.33,
            ],
            [
                'outlet' => 'PIONER WRAPPP T1C',
                'account_number' => '551-0480491',
                'bank_name' => 'BCA',
                'jul_balance' => 450069152.94,
                'aug_balance' => 590372082,
                'mutation' => 140302929.06,
            ],
            [
                'outlet' => 'PIONER BANDUNG',
                'account_number' => '551-0489588',
                'bank_name' => 'BCA',
                'jul_balance' => 0,
                'aug_balance' => 1000000,
                'mutation' => 1000000,
            ],
            [
                'outlet' => 'FIRST SECURE T2E',
                'account_number' => '155-00-1302784-5',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 12230220.48,
                'aug_balance' => 24234752,
                'mutation' => 12004531.52,
            ],
            [
                'outlet' => 'FIRST SECURE T2E',
                'account_number' => '155-00-1302782-9',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 80442918.24,
                'aug_balance' => 22285544,
                'mutation' => -58157374.239999995,
            ],
            [
                'outlet' => 'FIRST SECURE T2E',
                'account_number' => '114401001199306',
                'bank_name' => 'BRI',
                'jul_balance' => 435689,
                'aug_balance' => 400689,
                'mutation' => -35000,
            ],
            [
                'outlet' => 'FIRST SECURE T2E',
                'account_number' => '551-0489944',
                'bank_name' => 'BCA',
                'jul_balance' => 0,
                'aug_balance' => 1000000,
                'mutation' => 1000000,
            ],
            [
                'outlet' => 'KINGTECH T2F',
                'account_number' => '155-00-1240932-5',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 48130040.45,
                'aug_balance' => 14711162,
                'mutation' => -33418878.450000003,
            ],
            [
                'outlet' => 'KINGTECH T2F',
                'account_number' => '114401001202303',
                'bank_name' => 'BRI',
                'jul_balance' => 1577867,
                'aug_balance' => 1542867,
                'mutation' => -35000,
            ],
            [
                'outlet' => 'KINGTECH T2F',
                'account_number' => '551-0489952',
                'bank_name' => 'BCA',
                'jul_balance' => 0,
                'aug_balance' => 1000000,
                'mutation' => 1000000,
            ],
            [
                'outlet' => 'KINGTECH T2D',
                'account_number' => '155-00-1240934-1',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 25243652.95,
                'aug_balance' => 24823314,
                'mutation' => -420338.94999999925,
            ],
            [
                'outlet' => 'KINGTECH T2D',
                'account_number' => '551-0489570',
                'bank_name' => 'BCA',
                'jul_balance' => 0,
                'aug_balance' => 1000000,
                'mutation' => 1000000,
            ],
            [
                'outlet' => 'KINGTECH HLP',
                'account_number' => '155-00-1302783-7',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 11922712.4,
                'aug_balance' => 22106936,
                'mutation' => 10184223.6,
            ],
            [
                'outlet' => 'KINGTECH HLP',
                'account_number' => '114401001200301',
                'bank_name' => 'BRI',
                'jul_balance' => 9194749,
                'aug_balance' => 4477235,
                'mutation' => -4717514,
            ],
            [
                'outlet' => 'FIRST SECURE T3E',
                'account_number' => '155-00-1302788-6',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 55517120.71,
                'aug_balance' => 46734075,
                'mutation' => -8783045.71,
            ],
            [
                'outlet' => 'FIRST SECURE T3E',
                'account_number' => '551-0460784',
                'bank_name' => 'BCA',
                'jul_balance' => 29012486.38,
                'aug_balance' => 34754724,
                'mutation' => 5742237.620000001,
            ],
            [
                'outlet' => 'FIRST SECURE T3A',
                'account_number' => '155-00-1371298-2',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 47207026.11,
                'aug_balance' => 41071002,
                'mutation' => -6136024.109999999,
            ],
            [
                'outlet' => 'FIRST SECURE T3A',
                'account_number' => '551-0461217',
                'bank_name' => 'BCA',
                'jul_balance' => 4182479.92,
                'aug_balance' => 15632240,
                'mutation' => 11449760.08,
            ],
            [
                'outlet' => 'KINGTECH T1A SUB',
                'account_number' => '155-00-1496044-0',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 8930771.43,
                'aug_balance' => 49851787,
                'mutation' => 40921015.57,
            ],
            [
                'outlet' => 'KINGTECH YIA INTER',
                'account_number' => '155-00-1354438-5',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 14417617.1,
                'aug_balance' => 22881226,
                'mutation' => 8463608.9,
            ],
            [
                'outlet' => 'KINGTECH YIA INTER',
                'account_number' => '551-0461233',
                'bank_name' => 'BCA',
                'jul_balance' => 16841554.25,
                'aug_balance' => 31190114,
                'mutation' => 14348559.75,
            ],
            [
                'outlet' => 'KINGTECH YIA DOMES',
                'account_number' => '155-00-1560805-5',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 17602009.95,
                'aug_balance' => 5906760,
                'mutation' => -11695249.95,
            ],
            [
                'outlet' => 'KINGTECH BALI',
                'account_number' => '155-00-1492058-4',
                'bank_name' => 'MANDIRI',
                'jul_balance' => 56549233.86,
                'aug_balance' => 73651544,
                'mutation' => 17102310.14,
            ],
            [
                'outlet' => 'KINGTECH BALI',
                'account_number' => '551-1677999',
                'bank_name' => 'BCA',
                'jul_balance' => 5997422.46,
                'aug_balance' => 28114631,
                'mutation' => 22117208.54,
            ],
        ];

        foreach ($accountsData as $item) {
            // Find or create accounting account for this bank
            $accAccount = AccountingAccount::firstOrCreate(
                [
                    'division_id' => $acc->id,
                    'code' => 'BANK-'.preg_replace('/[^0-9A-Za-z]/', '', $item['account_number']),
                ],
                [
                    'id' => (string) Str::uuid(),
                    'display_name' => $item['bank_name'].' '.$item['outlet'].' ('.$item['account_number'].')',
                    'type' => 'ASSET',
                    'description' => 'Rekening '.$item['bank_name'].' '.$item['account_number'],
                    'is_active' => true,
                    'created_by_id' => $admin?->id,
                ]
            );

            // Find outlet if matches
            $outlet = Outlet::where('division_id', $acc->id)
                ->where('name', 'LIKE', '%'.$item['outlet'].'%')
                ->first();

            AccountingBankReconciliation::updateOrCreate(
                [
                    'period_id' => $period->id,
                    'account_id' => $accAccount->id,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'division_id' => $acc->id,
                    'outlet_id' => $outlet?->id,
                    'jul_balance' => $item['jul_balance'],
                    'aug_balance' => $item['aug_balance'],
                    'mutation' => $item['mutation'],
                    'notes' => 'Rekonsiliasi resmi sheet SALDO AKHIR BANK per 31 Agustus 2026',
                    'is_verified' => true,
                    'verified_at' => now(),
                    'verified_by_id' => $admin?->id,
                ]
            );
        }
    }
}
