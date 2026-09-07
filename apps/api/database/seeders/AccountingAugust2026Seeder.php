<?php

namespace Database\Seeders;

use App\Models\AccountingAccount;
use App\Models\AccountingCategory;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AccountingAugust2026Seeder extends Seeder
{
    public function run(): void
    {
        AccountingTransaction::unguard();
        AccountingPeriod::unguard();

        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            $this->command?->error('Divisi ACC tidak ditemukan.');

            return;
        }

        $admin = User::where('email', 'admin.acc@dashboard.test')->first();
        $outlet = Outlet::where('code', 'ACC-001')->first();

        // 1. Create or update August 2026 Period
        $period = AccountingPeriod::firstOrCreate(
            [
                'division_id' => $acc->id,
                'period_month' => '2026-08-01',
            ],
            [
                'id' => (string) Str::uuid(),
                'status' => 'draft',
                'created_by_id' => $admin?->id,
                'version' => 1,
                'notes' => 'Periode Agustus 2026 (Data resmi workbook divisi)',
            ]
        );

        // 2. Fetch categories and accounts
        $categoryMap = AccountingCategory::pluck('id', 'code')->toArray();
        $accounts = AccountingAccount::where('division_id', $acc->id)->get();
        $defaultDebitAccount = $accounts->where('code', 'ACC-1001')->first() ?? $accounts->first();
        $bankAccount = $accounts->where('code', 'ACC-5002')->first() ?? $defaultDebitAccount;

        // 3. Load json
        $jsonPath = __DIR__.'/august_2026_transactions.json';
        if (! file_exists($jsonPath)) {
            $this->command?->error('File august_2026_transactions.json tidak ditemukan.');

            return;
        }

        $txs = json_decode(file_get_contents($jsonPath), true);
        $count = 0;

        foreach ($txs as $tx) {
            $catId = $categoryMap[$tx['code']] ?? null;
            if (! $catId) {
                $catId = reset($categoryMap);
            }

            $accountId = $defaultDebitAccount->id;
            if (str_starts_with($tx['code'], 'C30')) {
                $accountId = $bankAccount->id;
            }

            AccountingTransaction::updateOrCreate(
                [
                    'division_id' => $acc->id,
                    'period_id' => $period->id,
                    'reference_no' => 'AUG26-'.str_pad((string) $tx['row'], 4, '0', STR_PAD_LEFT),
                ],
                [
                    'id' => (string) Str::uuid(),
                    'account_id' => $accountId,
                    'category_id' => $catId,
                    'outlet_id' => $outlet?->id,
                    'transaction_date' => $tx['date'],
                    'description' => $tx['desc'],
                    'debit_amount' => $tx['debit'],
                    'credit_amount' => $tx['credit'],
                    'is_draft' => false,
                    'version' => 1,
                    'created_by_id' => $admin?->id,
                ]
            );
            $count++;
        }

        $this->command?->info("Berhasil mengimpor {$count} transaksi Agustus 2026 untuk divisi ACC.");
    }
}
