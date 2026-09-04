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
        ['email' => 'pic.acc@dashboard.test', 'name' => 'PIC Accounting (View Only)', 'role' => 'USER', 'division_code' => 'ACC'],
        ['email' => 'pic@dashboard.test', 'name' => 'PIC View Only', 'role' => 'USER', 'division_code' => null],
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
                ['name' => $d['name'], 'sort_order' => $d['sort_order'], 'is_active' => true]
            );
            $division->update(['name' => $d['name'], 'sort_order' => $d['sort_order'], 'is_active' => true]);
            $divisionMap[$d['code']] = $division;
        }

        // 2. Seed Outlets
        foreach (self::DIVISIONS as $d) {
            $division = $divisionMap[$d['code']];
            $outletCode = "{$d['code']}-001";
            $outletName = "{$d['name']} Pusat (Anonim)";

            $outlet = Outlet::firstOrCreate(
                ['code' => $outletCode],
                ['name' => $outletName, 'division_id' => $division->id, 'is_active' => true]
            );
            $outlet->update(['name' => $outletName, 'division_id' => $division->id, 'is_active' => true]);
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
    }
}
