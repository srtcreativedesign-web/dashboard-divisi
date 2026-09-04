<?php

namespace App\Services;

use App\Exceptions\ApiException;

class PolicyService
{
    public const ROLE_CAPABILITIES = [
        'BOD' => ['*'],
        'MANAGER' => ['view:division', 'manage:division', 'view:report', 'write:revenue', 'write:target', 'write:assessment'],
        'ADMIN' => ['view:division', 'write:revenue', 'write:target', 'view:report'],
    ];

    public const ACC_MANAGER_CAPABILITIES = [
        'view:division',
        'manage:division',
        'view:acc_report',
        'view:acc_journal',
        'view:acc_master',
        'manage:acc_master',
        'manage:acc_period',
        'approve:acc_period',
    ];

    public const ACC_ADMIN_CAPABILITIES = [
        'view:division',
        'view:acc_report',
        'view:acc_journal',
        'view:acc_master',
        'write:acc_transaction',
        'import:acc_transaction',
        'write:acc_outstanding',
        'write:acc_bank',
        'submit:acc_period',
    ];

    public function __construct(
        protected AuditService $audit
    ) {}

    public function isAccountingCapability(string $capability): bool
    {
        return str_starts_with($capability, 'acc:') || str_contains($capability, ':acc_');
    }

    public function isWriteOrMutationCapability(string $capability): bool
    {
        return str_starts_with($capability, 'write:')
            || str_starts_with($capability, 'manage:')
            || str_starts_with($capability, 'approve:')
            || str_starts_with($capability, 'reject:')
            || str_starts_with($capability, 'input:')
            || str_starts_with($capability, 'upload:')
            || str_starts_with($capability, 'lock:')
            || str_starts_with($capability, 'delete:');
    }

    public function hasCapability(array $user, string $capability, ?string $divisionCode = null): bool
    {
        $role = $user['role'] ?? '';
        $division = $divisionCode ?? $user['divisionCode'] ?? $user['division_code'] ?? null;

        // Domain Accounting (ACC)
        if ($this->isAccountingCapability($capability)) {
            // BOD hanya memiliki capability baca laporan ACC
            if ($role === 'BOD') {
                return $capability === 'view:acc_report';
            }

            // Scope ACC: Admin dan Manager ACC memiliki capability khusus masing-masing
            if ($division === 'ACC') {
                if ($role === 'MANAGER') {
                    return in_array($capability, self::ACC_MANAGER_CAPABILITIES, true);
                }
                if ($role === 'ADMIN') {
                    return in_array($capability, self::ACC_ADMIN_CAPABILITIES, true);
                }
            }

            return false;
        }

        // Pengguna atau konteks divisi ACC
        if ($division === 'ACC') {
            // BOD strictly read-only untuk Accounting
            if ($role === 'BOD') {
                return in_array($capability, ['view:acc_report', 'view:division'], true);
            }

            return in_array($capability, ['view:division'], true)
                && ($role === 'MANAGER' || $role === 'ADMIN');
        }

        $caps = self::ROLE_CAPABILITIES[$role] ?? [];

        if (in_array('*', $caps, true)) {
            // Wildcard '*' BOD tidak boleh mengizinkan mutasi data pada divisi ACC
            if ($division === 'ACC' && $this->isWriteOrMutationCapability($capability)) {
                return false;
            }

            return true;
        }

        return in_array($capability, $caps, true);
    }

    public function assertCapability(array $user, string $capability, ?string $divisionCode = null): void
    {
        if (! $this->hasCapability($user, $capability, $divisionCode)) {
            $role = $user['role'] ?? 'UNKNOWN';
            $this->audit->log([
                'actorId' => $user['sub'] ?? $user['id'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => $role,
                'action' => 'policy.forbidden_capability',
                'entity' => 'Policy',
                'divisionCode' => $divisionCode ?? $user['divisionCode'] ?? $user['division_code'] ?? null,
                'metadata' => ['capability' => $capability, 'role' => $role, 'divisionCode' => $divisionCode],
            ]);

            throw new ApiException('FORBIDDEN_CAPABILITY', "Role {$role} tidak memiliki capability {$capability}");
        }
    }

    public function canAccessDivision(array $user, ?string $divisionCode, bool $forWrite = false): bool
    {
        if (empty($divisionCode)) {
            return true;
        }

        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        // BOD tidak boleh melakukan operasi write pada divisi ACC (BOD strictly read-only)
        if ($divisionCode === 'ACC' && $forWrite && $role === 'BOD') {
            return false;
        }

        // BOD lintas 7 divisi (divisionCode null = all)
        if ($role === 'BOD' && $userDivision === null) {
            return true;
        }

        // Manager / Admin strict 1:1
        return $userDivision === $divisionCode;
    }

    public function assertDivisionScope(array $user, ?string $divisionCode, bool $forWrite = false): void
    {
        if ($divisionCode === 'ACC' && $forWrite && ($user['role'] ?? '') === 'BOD') {
            $this->audit->log([
                'actorId' => $user['sub'] ?? $user['id'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => 'BOD',
                'action' => 'policy.scope_violation',
                'entity' => 'Division',
                'divisionCode' => 'ACC',
                'metadata' => ['requested' => 'ACC', 'reason' => 'BOD read-only on ACC'],
            ]);

            throw new ApiException('SCOPE_VIOLATION', 'BOD hanya memiliki akses read-only untuk divisi Accounting (ACC)');
        }

        if (! $this->canAccessDivision($user, $divisionCode, $forWrite)) {
            $role = $user['role'] ?? 'UNKNOWN';
            $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

            $this->audit->log([
                'actorId' => $user['sub'] ?? $user['id'] ?? null,
                'actorEmail' => $user['email'] ?? null,
                'actorRole' => $role,
                'action' => 'policy.scope_violation',
                'entity' => 'Division',
                'divisionCode' => $divisionCode,
                'metadata' => ['requested' => $divisionCode, 'userDivision' => $userDivision, 'forWrite' => $forWrite],
            ]);

            throw new ApiException(
                'SCOPE_VIOLATION',
                "Akses ditolak untuk divisi {$divisionCode} (user {$role}/".($userDivision ?? 'ALL').')'
            );
        }
    }

    public function assertScopeForRequest(array $user, ?string $requestedDivisionCode = null): void
    {
        if ($requestedDivisionCode) {
            $this->assertDivisionScope($user, $requestedDivisionCode);
        }
    }
}
