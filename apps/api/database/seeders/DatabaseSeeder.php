<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\DivisionConfig;
use App\Models\Outlet;
use App\Models\User;
use App\Models\UserScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public const DIVISIONS = [
        ['code' => 'WRAP', 'name' => 'Wrapping', 'sort_order' => 1],
        ['code' => 'CELL', 'name' => 'Cellular', 'sort_order' => 2],
        ['code' => 'REFL', 'name' => 'Refleksi', 'sort_order' => 3],
        ['code' => 'MINI', 'name' => 'Minimarket', 'sort_order' => 4],
        ['code' => 'FNB', 'name' => 'FnB', 'sort_order' => 5],
        ['code' => 'FIN', 'name' => 'Finance', 'sort_order' => 6],
        ['code' => 'MC', 'name' => 'Money Changer', 'sort_order' => 7],
        ['code' => 'ACC', 'name' => 'Accounting', 'sort_order' => 8],
    ];

    public const DIVISION_CONFIGS = [
        'WRAP' => ['modules' => ['dashboard', 'revenue', 'target', 'performance'], 'kpis' => ['revenue.gross', 'target.achievement']],
        'CELL' => ['modules' => ['dashboard', 'revenue', 'target', 'performance'], 'kpis' => ['revenue.gross', 'target.achievement']],
        'REFL' => ['modules' => ['dashboard', 'revenue', 'performance'], 'kpis' => ['revenue.gross', 'performance.score']],
        'MINI' => ['modules' => ['dashboard', 'revenue', 'target', 'performance', 'workforce'], 'kpis' => ['revenue.gross', 'revenue.net', 'target.achievement']],
        'FNB' => ['modules' => ['dashboard', 'revenue', 'target'], 'kpis' => ['revenue.gross', 'target.achievement']],
        'FIN' => ['modules' => ['dashboard', 'revenue', 'workforce'], 'kpis' => ['revenue.gross', 'workforce.count']],
        'MC' => ['modules' => ['dashboard', 'forex'], 'kpis' => ['forex.volume', 'forex.spread']],
        'ACC' => ['modules' => ['dashboard', 'accounting'], 'kpis' => ['accounting.balance']],
    ];

    public const USERS = [
        // BOD 3 lintas 7 divisi
        ['email' => 'bod1@dashboard.test', 'name' => 'BOD 1', 'role' => 'BOD', 'division_code' => null],
        ['email' => 'bod2@dashboard.test', 'name' => 'BOD 2', 'role' => 'BOD', 'division_code' => null],
        ['email' => 'bod3@dashboard.test', 'name' => 'BOD 3', 'role' => 'BOD', 'division_code' => null],
        // Manager 8
        ['email' => 'manager.wrap@dashboard.test', 'name' => 'Manager Wrapping', 'role' => 'MANAGER', 'division_code' => 'WRAP'],
        ['email' => 'manager.cell@dashboard.test', 'name' => 'Manager Cellular', 'role' => 'MANAGER', 'division_code' => 'CELL'],
        ['email' => 'manager.refl@dashboard.test', 'name' => 'Manager Refleksi', 'role' => 'MANAGER', 'division_code' => 'REFL'],
        ['email' => 'manager.mini@dashboard.test', 'name' => 'Manager Minimarket', 'role' => 'MANAGER', 'division_code' => 'MINI'],
        ['email' => 'manager.fnb@dashboard.test', 'name' => 'Manager FnB', 'role' => 'MANAGER', 'division_code' => 'FNB'],
        ['email' => 'manager.fin@dashboard.test', 'name' => 'Manager Finance', 'role' => 'MANAGER', 'division_code' => 'FIN'],
        ['email' => 'manager.mc@dashboard.test', 'name' => 'Manager Money Changer', 'role' => 'MANAGER', 'division_code' => 'MC'],
        ['email' => 'manager.acc@dashboard.test', 'name' => 'Manager Accounting', 'role' => 'MANAGER', 'division_code' => 'ACC'],
        // Admin 8
        ['email' => 'admin.wrap@dashboard.test', 'name' => 'Admin Wrapping', 'role' => 'ADMIN', 'division_code' => 'WRAP'],
        ['email' => 'admin.cell@dashboard.test', 'name' => 'Admin Cellular', 'role' => 'ADMIN', 'division_code' => 'CELL'],
        ['email' => 'admin.refl@dashboard.test', 'name' => 'Admin Refleksi', 'role' => 'ADMIN', 'division_code' => 'REFL'],
        ['email' => 'admin.mini@dashboard.test', 'name' => 'Admin Minimarket', 'role' => 'ADMIN', 'division_code' => 'MINI'],
        ['email' => 'admin.fnb@dashboard.test', 'name' => 'Admin FnB', 'role' => 'ADMIN', 'division_code' => 'FNB'],
        ['email' => 'admin.fin@dashboard.test', 'name' => 'Admin Finance', 'role' => 'ADMIN', 'division_code' => 'FIN'],
        ['email' => 'admin.mc@dashboard.test', 'name' => 'Admin Money Changer', 'role' => 'ADMIN', 'division_code' => 'MC'],
        ['email' => 'admin.acc@dashboard.test', 'name' => 'Admin Accounting', 'role' => 'ADMIN', 'division_code' => 'ACC'],
        // PIC (View Only)
        ['email' => 'pic.wrap@dashboard.test', 'name' => 'PIC Wrapping (View Only)', 'role' => 'USER', 'division_code' => 'WRAP'],
        ['email' => 'pic.cell@dashboard.test', 'name' => 'PIC Cellular (View Only)', 'role' => 'USER', 'division_code' => 'CELL'],
        ['email' => 'pic.refl@dashboard.test', 'name' => 'PIC Refleksi (View Only)', 'role' => 'USER', 'division_code' => 'REFL'],
        ['email' => 'pic.mini@dashboard.test', 'name' => 'PIC Minimarket (View Only)', 'role' => 'USER', 'division_code' => 'MINI'],
        ['email' => 'pic.fnb@dashboard.test', 'name' => 'PIC FnB (View Only)', 'role' => 'USER', 'division_code' => 'FNB'],
        ['email' => 'pic.fin@dashboard.test', 'name' => 'PIC Finance (View Only)', 'role' => 'USER', 'division_code' => 'FIN'],
        ['email' => 'pic.mc@dashboard.test', 'name' => 'PIC Money Changer (View Only)', 'role' => 'USER', 'division_code' => 'MC'],
        ['email' => 'pic@dashboard.test', 'name' => 'PIC View Only', 'role' => 'USER', 'division_code' => null],
    ];

    public const SOBAT_REAL_OUTLETS = [
        // WRAP (19 real outlets)
        ['code' => 'T3-A', 'name' => 'FIRST SECURE-T3-A', 'division_code' => 'WRAP'],
        ['code' => 'T3 B', 'name' => 'ROBUSTPACK-T3 B', 'division_code' => 'WRAP'],
        ['code' => 'T3E', 'name' => 'FIRST SECURE-T3E', 'division_code' => 'WRAP'],
        ['code' => 'T2D', 'name' => 'KINGTECH-T2D', 'division_code' => 'WRAP'],
        ['code' => 'T2D1', 'name' => 'STAR WRAP-T2D1', 'division_code' => 'WRAP'],
        ['code' => 'T2E', 'name' => 'GALAXY PORT-T2E', 'division_code' => 'WRAP'],
        ['code' => 'T2E4', 'name' => 'FIRST SECURE-T2E4', 'division_code' => 'WRAP'],
        ['code' => 'T2F', 'name' => 'KINGTECH-T2F', 'division_code' => 'WRAP'],
        ['code' => 'T2F5', 'name' => 'ROBUST PACK-T2F5', 'division_code' => 'WRAP'],
        ['code' => 'T2F2', 'name' => 'KINGCELL-T2F2', 'division_code' => 'WRAP'],
        ['code' => 'T1C', 'name' => 'PIONER WRAP-T1C', 'division_code' => 'WRAP'],
        ['code' => 'YIA', 'name' => 'KINGTECH-YIA', 'division_code' => 'WRAP'],
        ['code' => 'SUB', 'name' => 'KINGTECH-SUB', 'division_code' => 'WRAP'],
        ['code' => 'DPS', 'name' => 'KINGTECH-DPS', 'division_code' => 'WRAP'],
        ['code' => 'HLP', 'name' => 'KINGTECH-HLP', 'division_code' => 'WRAP'],
        ['code' => 'BDG', 'name' => 'PIONEER WRAP-BDG', 'division_code' => 'WRAP'],
        ['code' => 'YIA-B', 'name' => 'KINGTECH-YIA-B', 'division_code' => 'WRAP'],
        ['code' => 'PN-BDG', 'name' => 'PIONEER-PN-BDG', 'division_code' => 'WRAP'],
        ['code' => 'HO', 'name' => 'KINGTECH-HO', 'division_code' => 'WRAP'],

        // MINI (20 real outlets)
        ['code' => 'T3I', 'name' => 'M-MART-T3I', 'division_code' => 'MINI'],
        ['code' => '2D1', 'name' => 'POINT ONE -2D1', 'division_code' => 'MINI'],
        ['code' => 'T2D2', 'name' => 'AMBIL BEKAL YUK-T2D2', 'division_code' => 'MINI'],
        ['code' => 'T2D3', 'name' => 'POINT ONE-T2D3', 'division_code' => 'MINI'],
        ['code' => 'T2D5', 'name' => 'POINT ONE-T2D5', 'division_code' => 'MINI'],
        ['code' => 'T2D6', 'name' => 'AMBIL BEKAL YUK-T2D6', 'division_code' => 'MINI'],
        ['code' => 'T2D7', 'name' => 'POINT ONE-T2D7', 'division_code' => 'MINI'],
        ['code' => 'T1E3', 'name' => 'PAPIMART-T1E3', 'division_code' => 'MINI'],
        ['code' => 'T2E7', 'name' => 'LATTE STORY-T2E7', 'division_code' => 'MINI'],
        ['code' => 'T2E41', 'name' => 'PAPIMART-T2E41', 'division_code' => 'MINI'],
        ['code' => 'T2E51', 'name' => 'PAPIMART-T2E51', 'division_code' => 'MINI'],
        ['code' => 'T2FB', 'name' => 'LATTE STORY-T2FB', 'division_code' => 'MINI'],
        ['code' => 'LST1C', 'name' => 'LATTE STORY-LST1C', 'division_code' => 'MINI'],
        ['code' => 'T1B6', 'name' => 'URBAN-T1B6', 'division_code' => 'MINI'],
        ['code' => 'T1B4', 'name' => 'URBAN-T1B4', 'division_code' => 'MINI'],
        ['code' => 'T1B7', 'name' => 'URBAN-T1B7', 'division_code' => 'MINI'],
        ['code' => 'T1B5', 'name' => 'PAPI COFFEE-T1B5', 'division_code' => 'MINI'],
        ['code' => 'T3G18', 'name' => 'PAPIMART-T3G18', 'division_code' => 'MINI'],
        ['code' => 'BIM', 'name' => 'PAPIMART-BIM', 'division_code' => 'MINI'],
        ['code' => 'PDG', 'name' => 'PAPAMAXX COFFEE-PDG', 'division_code' => 'MINI'],

        // FNB (8 real outlets)
        ['code' => 'T3INT', 'name' => 'BAKSO ZURO-T3INT', 'division_code' => 'FNB'],
        ['code' => 'T3ICGK', 'name' => 'MASSURO-T3ICGK', 'division_code' => 'FNB'],
        ['code' => 'MAX-3I', 'name' => 'MAXIMUM T3-MAX-3I', 'division_code' => 'FNB'],
        ['code' => '600', 'name' => 'MAXIMUM -600', 'division_code' => 'FNB'],
        ['code' => 'T1B', 'name' => 'BAKSO ZURO-T1B', 'division_code' => 'FNB'],
        ['code' => 'BM', 'name' => 'CENTRAL KITCHEN-BM', 'division_code' => 'FNB'],
        ['code' => 'TUNG', 'name' => 'WAROENG KOPI TUNGTAU-TUNG', 'division_code' => 'FNB'],
        ['code' => 'TUNG TAU', 'name' => 'CK PAPAMAX-TUNG TAU', 'division_code' => 'FNB'],

        // REFL (6 real outlets)
        ['code' => 'T2FA', 'name' => 'SERENITY BLOSSOMS-T2FA', 'division_code' => 'REFL'],
        ['code' => 'REFT3', 'name' => 'SERENITY BLOSSOM-REFT3', 'division_code' => 'REFL'],
        ['code' => 'T3CGK', 'name' => 'SERENITY BLOSSOMS-T3CGK', 'division_code' => 'REFL'],
        ['code' => 'HLP-G8', 'name' => 'SERENITY BLOSSOM-HLP-G8', 'division_code' => 'REFL'],
        ['code' => 'HLP-G4', 'name' => 'SERENITY BLOSSOM-HLP-G4', 'division_code' => 'REFL'],
        ['code' => 'HLP2', 'name' => 'HANS-HLP2', 'division_code' => 'REFL'],

        // CELL (4 real outlets)
        ['code' => 'T3IOUT', 'name' => 'POINT CELLULLER-T3IOUT', 'division_code' => 'CELL'],
        ['code' => '3I', 'name' => 'TSEL-3I', 'division_code' => 'CELL'],
        ['code' => 'DC3I', 'name' => 'DATA CELL-DC3I', 'division_code' => 'CELL'],
        ['code' => 'T2F1', 'name' => 'DATA CELLULLER-T2F1', 'division_code' => 'CELL'],

        // MC (1 real outlet)
        ['code' => 'MCT3-I', 'name' => 'MONEY CHANGER-MCT3-I', 'division_code' => 'MC'],

        // ACC (1 entity)
        ['code' => 'ACC-001', 'name' => 'Accounting Pusat (Anonim)', 'division_code' => 'ACC'],
    ];

    public function run(): void
    {
        // SOP: Zero Hardcoded Secrets — default password hanya dibolehkan untuk testing.
        // Non-testing WAJIB menyetel SEED_DEFAULT_PASSWORD eksplisit; tanpa itu seeder gagal keras
        // (mencegah akun produksi memakai password publik yang sudah diketahui).
        $defaultPassword = env('SEED_DEFAULT_PASSWORD', app()->environment('testing') ? 'Password123!' : null);
        if ($defaultPassword === null || $defaultPassword === '') {
            throw new \RuntimeException('SEED_DEFAULT_PASSWORD wajib disetel di lingkungan non-testing (SOP: Zero Hardcoded Secrets).');
        }
        $passwordHash = Hash::make($defaultPassword, ['rounds' => 10]);

        // 1. Seed Divisions
        $divisionMap = [];
        foreach (self::DIVISIONS as $d) {
            $division = Division::firstOrCreate(
                ['code' => $d['code']],
                ['name' => $d['name'], 'sort_order' => $d['sort_order'], 'is_active' => $d['code'] !== 'FIN']
            );
            $division->update(['name' => $d['name'], 'sort_order' => $d['sort_order'], 'is_active' => $d['code'] !== 'FIN']);
            $divisionMap[$d['code']] = $division;
        }

        // 2. Seed Outlets (58 Real Outlets dari Sobat API + ACC Head Office)
        foreach (self::SOBAT_REAL_OUTLETS as $o) {
            $division = $divisionMap[$o['division_code']] ?? null;
            if (! $division) continue;

            $outlet = Outlet::firstOrCreate(
                ['code' => $o['code']],
                ['name' => $o['name'], 'division_id' => $division->id, 'is_active' => true]
            );
            $outlet->update(['name' => $o['name'], 'division_id' => $division->id, 'is_active' => true]);
        }

        // Fallback untuk backward-compatibility test legacy (WRAP-001, dsb)
        foreach (self::DIVISIONS as $d) {
            $division = $divisionMap[$d['code']];
            $outletCode = "{$d['code']}-001";
            if (! Outlet::where('code', $outletCode)->exists()) {
                Outlet::create([
                    'code' => $outletCode,
                    'name' => "{$d['name']} Pusat",
                    'division_id' => $division->id,
                    'is_active' => $d['code'] !== 'FIN',
                ]);
            }
        }

        // 3. Seed Users
        $userMap = [];
        foreach (self::USERS as $u) {
            $user = User::firstOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password_hash' => $passwordHash,
                    'role' => $u['role'],
                    'division_code' => $u['division_code'],
                    'is_active' => true,
                ]
            );
            $user->update([
                'name' => $u['name'],
                'role' => $u['role'],
                'division_code' => $u['division_code'],
                'is_active' => true,
            ]);
            $userMap[$u['email']] = $user;
        }

        // 4. Seed UserScopes (14 users: Manager & Admin)
        foreach (self::USERS as $u) {
            if (! $u['division_code']) {
                continue;
            }
            $user = $userMap[$u['email']];
            $division = $divisionMap[$u['division_code']];

            UserScope::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'division_id' => $division->id,
                ],
                [
                    'created_at' => now(),
                ]
            );
        }

        // 5. Seed DivisionConfigs (7)
        foreach (self::DIVISIONS as $d) {
            $division = $divisionMap[$d['code']];
            $cfg = self::DIVISION_CONFIGS[$d['code']];

            DivisionConfig::updateOrCreate(
                ['division_id' => $division->id],
                [
                    'enabled_modules' => $cfg['modules'],
                    'enabled_kpis' => $cfg['kpis'],
                    'is_active' => true,
                ]
            );
        }

        // 6. Seed Accounting Suite Data (Master COA, August 2026 Transactions, Bank Reconciliations, and Outstanding AR/AP)
        $this->call([
            AccMasterSeeder::class,
            AccountingAugust2026Seeder::class,
            AccountingBankReconciliationSeeder::class,
            AccountingOutstandingSeeder::class,
        ]);
    }
}
