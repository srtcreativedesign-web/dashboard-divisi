<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public const MOCK_PASSWORD_HASH = '$2b$10$z6zu1XrJGU/jiOm4TOsQZem7oJW2XKJ/B1bHJdWXWJDFzNZbsGNam';

    public const MOCK_USERS = [
        ['id' => 'mock-bod1', 'email' => 'bod1@dashboard.test', 'name' => 'BOD 1', 'role' => 'BOD', 'division_code' => null, 'is_active' => true],
        ['id' => 'mock-bod2', 'email' => 'bod2@dashboard.test', 'name' => 'BOD 2', 'role' => 'BOD', 'division_code' => null, 'is_active' => true],
        ['id' => 'mock-bod3', 'email' => 'bod3@dashboard.test', 'name' => 'BOD 3', 'role' => 'BOD', 'division_code' => null, 'is_active' => true],
        ['id' => 'mock-mgr-wrap', 'email' => 'manager.wrap@dashboard.test', 'name' => 'Manager Wrapping', 'role' => 'MANAGER', 'division_code' => 'WRAP', 'is_active' => true],
        ['id' => 'mock-mgr-cell', 'email' => 'manager.cell@dashboard.test', 'name' => 'Manager Cellular', 'role' => 'MANAGER', 'division_code' => 'CELL', 'is_active' => true],
        ['id' => 'mock-mgr-refl', 'email' => 'manager.refl@dashboard.test', 'name' => 'Manager Refleksi', 'role' => 'MANAGER', 'division_code' => 'REFL', 'is_active' => true],
        ['id' => 'mock-mgr-mini', 'email' => 'manager.mini@dashboard.test', 'name' => 'Manager Minimarket', 'role' => 'MANAGER', 'division_code' => 'MINI', 'is_active' => true],
        ['id' => 'mock-mgr-fnb', 'email' => 'manager.fnb@dashboard.test', 'name' => 'Manager FnB', 'role' => 'MANAGER', 'division_code' => 'FNB', 'is_active' => true],
        ['id' => 'mock-mgr-fin', 'email' => 'manager.fin@dashboard.test', 'name' => 'Manager Finance', 'role' => 'MANAGER', 'division_code' => 'FIN', 'is_active' => true],
        ['id' => 'mock-mgr-mc', 'email' => 'manager.mc@dashboard.test', 'name' => 'Manager Money Changer', 'role' => 'MANAGER', 'division_code' => 'MC', 'is_active' => true],
        ['id' => 'mock-mgr-acc', 'email' => 'manager.acc@dashboard.test', 'name' => 'Manager Accounting', 'role' => 'MANAGER', 'division_code' => 'ACC', 'is_active' => true],
        ['id' => 'mock-adm-wrap', 'email' => 'admin.wrap@dashboard.test', 'name' => 'Admin Wrapping', 'role' => 'ADMIN', 'division_code' => 'WRAP', 'is_active' => true],
        ['id' => 'mock-adm-cell', 'email' => 'admin.cell@dashboard.test', 'name' => 'Admin Cellular', 'role' => 'ADMIN', 'division_code' => 'CELL', 'is_active' => true],
        ['id' => 'mock-adm-refl', 'email' => 'admin.refl@dashboard.test', 'name' => 'Admin Refleksi', 'role' => 'ADMIN', 'division_code' => 'REFL', 'is_active' => true],
        ['id' => 'mock-adm-mini', 'email' => 'admin.mini@dashboard.test', 'name' => 'Admin Minimarket', 'role' => 'ADMIN', 'division_code' => 'MINI', 'is_active' => true],
        ['id' => 'mock-adm-fnb', 'email' => 'admin.fnb@dashboard.test', 'name' => 'Admin FnB', 'role' => 'ADMIN', 'division_code' => 'FNB', 'is_active' => true],
        ['id' => 'mock-adm-fin', 'email' => 'admin.fin@dashboard.test', 'name' => 'Admin Finance', 'role' => 'ADMIN', 'division_code' => 'FIN', 'is_active' => true],
        ['id' => 'mock-adm-mc', 'email' => 'admin.mc@dashboard.test', 'name' => 'Admin Money Changer', 'role' => 'ADMIN', 'division_code' => 'MC', 'is_active' => true],
        ['id' => 'mock-adm-acc', 'email' => 'admin.acc@dashboard.test', 'name' => 'Admin Accounting', 'role' => 'ADMIN', 'division_code' => 'ACC', 'is_active' => true],
    ];

    public function __construct(
        protected JwtService $jwtService,
        protected AuditService $audit,
        protected TokenRevocationService $tokenRevocation
    ) {}

    protected function findUserByEmail(string $email): ?array
    {
        $user = User::where('email', $email)->first();
        if ($user) {
            return [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'division_code' => $user->division_code,
                'password_hash' => $user->password_hash,
                'session_version' => (int) $user->session_version,
                'is_active' => $user->is_active,
            ];
        }

        // SOP: mock hanya untuk testing (Seeder), bukan fallback produksi
        if (app()->environment('testing')) {
            foreach (self::MOCK_USERS as $u) {
                if ($u['email'] === $email) {
                    return array_merge($u, ['password_hash' => self::MOCK_PASSWORD_HASH]);
                }
            }
        }

        return null;
    }

    protected function findUserById(string $id): ?array
    {
        $user = User::find($id);
        if ($user) {
            return [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'division_code' => $user->division_code,
                'password_hash' => $user->password_hash,
                'session_version' => (int) $user->session_version,
                'is_active' => $user->is_active,
            ];
        }

        if (app()->environment('testing')) {
            foreach (self::MOCK_USERS as $u) {
                if ($u['id'] === $id) {
                    return array_merge($u, ['password_hash' => self::MOCK_PASSWORD_HASH]);
                }
            }
        }

        return null;
    }

    public function validateUser(string $email, string $password): array
    {
        $user = $this->findUserByEmail($email);
        if (! $user || ! $user['is_active']) {
            throw new ApiException('AUTH_REQUIRED', 'Email atau password salah');
        }

        $ok = Hash::check($password, $user['password_hash']) || password_verify($password, $user['password_hash']);

        if (! $ok) {
            throw new ApiException('AUTH_REQUIRED', 'Email atau password salah');
        }

        return $user;
    }

    public function login(string $email, string $password): array
    {
        $user = $this->validateUser($email, $password);
        $jti = (string) Str::uuid();

        $payload = [
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'divisionCode' => $user['division_code'],
            'jti' => $jti,
            'sessionVersion' => $user['session_version'] ?? 0,
        ];

        $accessToken = $this->jwtService->sign($payload);

        $this->audit->logRequired([
            'actorId' => $user['id'],
            'actorEmail' => $user['email'],
            'actorRole' => $user['role'],
            'action' => 'auth.login',
            'entity' => 'User',
            'entityId' => $user['id'],
            'divisionCode' => $user['division_code'],
            'metadata' => ['email' => $user['email']],
        ]);

        return [
            'accessToken' => $accessToken,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
                'divisionCode' => $user['division_code'],
            ],
        ];
    }

    public function logout(array $userPayload): array
    {
        DB::transaction(function () use ($userPayload) {
            if (! empty($userPayload['jti'])) {
                $expiresAt = isset($userPayload['exp'])
                    ? (new \DateTimeImmutable)->setTimestamp((int) $userPayload['exp'])
                    : null;
                $this->tokenRevocation->revoke($userPayload['jti'], $userPayload['sub'] ?? null, $expiresAt);
            }

            $this->audit->logRequired([
                'actorId' => $userPayload['sub'] ?? null,
                'actorEmail' => $userPayload['email'] ?? null,
                'actorRole' => $userPayload['role'] ?? null,
                'action' => 'auth.logout',
                'entity' => 'User',
                'entityId' => $userPayload['sub'] ?? null,
                'divisionCode' => $userPayload['divisionCode'] ?? null,
            ]);

        });

        return ['message' => 'Logout berhasil'];
    }

    public function getMe(array $userPayload): array
    {
        $userId = $userPayload['sub'] ?? '';
        $user = $this->findUserById($userId);
        if (! $user || ! $user['is_active']) {
            throw new ApiException('AUTH_REQUIRED', 'Sesi tidak valid');
        }

        return [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'divisionCode' => $user['division_code'],
        ];
    }

    public function resetPassword(string $userId, string $oldPassword, string $newPassword): array
    {
        if (strlen($newPassword) < 12 || strlen($newPassword) > 128) {
            throw new ApiException('VALIDATION_ERROR', 'Password baru harus 12 sampai 128 karakter');
        }

        DB::transaction(function () use ($userId, $oldPassword, $newPassword) {
            $account = User::query()->lockForUpdate()->find($userId);
            if (! $account || ! $account->is_active) {
                throw new ApiException('AUTH_REQUIRED', 'Sesi tidak valid');
            }
            if (! Hash::check($oldPassword, $account->password_hash)) {
                throw new ApiException('AUTH_REQUIRED', 'Password lama salah');
            }
            $account->password_hash = Hash::make($newPassword);
            $account->session_version = (int) $account->session_version + 1;
            $account->save();
            $this->audit->logRequired(['actorId' => $account->id, 'actorEmail' => $account->email,
                'actorRole' => $account->role, 'divisionCode' => $account->division_code,
                'action' => 'auth.reset', 'entity' => 'User', 'entityId' => $account->id,
                'metadata' => ['session_version' => $account->session_version]]);
        });

        return ['message' => 'Password berhasil direset; silakan login kembali'];
    }
}
