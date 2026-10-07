<?php

namespace App\Console\Commands;

use App\Models\Division;
use App\Models\User;
use App\Models\UserScope;
use App\Services\AuditService;
use Database\Seeders\MvpMasterSeeder;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CreateMvpUser extends Command
{
    protected $signature = 'erp:create-user {email} {--name=} {--division=} {--role=}';

    protected $description = 'Membuat akun ERP untuk salah satu dari delapan role di tiga divisi MVP.';

    public const ROLES = ['MANAGER', 'HEAD_OPS', 'SPV', 'LEADER', 'ADMIN', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE'];

    public function handle(AuditService $audit): int
    {
        $data = [
            'email' => strtolower(trim((string) $this->argument('email'))),
            'name' => trim((string) $this->option('name')),
            'division' => strtoupper(trim((string) $this->option('division'))),
            'role' => strtoupper(trim((string) $this->option('role'))),
        ];
        $validator = Validator::make($data, [
            'email' => ['required', 'email', 'max:254'],
            'name' => ['required', 'string', 'max:100'],
            'division' => ['required', Rule::in(array_keys(MvpMasterSeeder::DIVISIONS))],
            'role' => ['required', Rule::in(self::ROLES)],
        ]);
        if ($validator->fails()) {
            $this->error('Email/nama tidak valid, atau divisi/role berada di luar MVP.');

            return self::FAILURE;
        }
        $division = Division::where('code', $data['division'])->where('is_active', true)->first();
        if (! $division) {
            $this->error('Divisi MVP belum tersedia atau tidak aktif. Siapkan master terlebih dahulu.');

            return self::FAILURE;
        }
        if (User::whereRaw('LOWER(email) = ?', [$data['email']])->exists()) {
            $this->error('Email sudah terdaftar. Akun yang ada tidak diubah.');

            return self::FAILURE;
        }
        if (! $this->input->isInteractive()) {
            $this->error('Pembuatan akun memerlukan terminal interaktif untuk password tersembunyi.');

            return self::FAILURE;
        }
        $password = $this->secret('Password baru (minimal 12 karakter, huruf besar/kecil, angka dan simbol)', false);
        $confirmation = $this->secret('Ulangi password baru', false);
        $passwordValidator = Validator::make([
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], ['password' => ['required', 'string', 'max:128', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()]]);
        if ($passwordValidator->fails()) {
            $this->error('Password tidak memenuhi persyaratan atau konfirmasinya berbeda.');

            return self::FAILURE;
        }
        try {
            DB::transaction(function () use ($data, $division, $password, $audit) {
                $user = User::create([
                    'email' => $data['email'],
                    'name' => $data['name'],
                    'role' => $data['role'],
                    'division_code' => $data['division'],
                    'password_hash' => Hash::make($password),
                    'is_active' => true,
                ]);
                UserScope::create(['user_id' => $user->id, 'division_id' => $division->id]);
                $audit->log([
                    'action' => 'user.bootstrap_created',
                    'entity' => 'User',
                    'entityId' => $user->id,
                    'divisionCode' => $data['division'],
                    'metadata' => ['source' => 'artisan', 'role' => $data['role']],
                ]);
            });
        } catch (QueryException) {
            $this->error('Pembuatan akun gagal; transaksi dibatalkan. Akun yang ada tidak diubah.');

            return self::FAILURE;
        }
        $this->info('Akun MVP dan scope divisi berhasil dibuat. Password tidak ditampilkan.');

        return self::SUCCESS;
    }
}
