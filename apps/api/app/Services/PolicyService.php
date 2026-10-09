<?php

namespace App\Services;

use App\Exceptions\ApiException;

class PolicyService
{
    public const BOD_CAPABILITIES = ['view:division', 'view:report', 'view:acc_report', 'view:acc_detail', 'view:projects', 'view:cellular', 'view:cellular_sales'];

    public const DOMAIN_CAPABILITIES = [
        'ACC' => [
            'MANAGER' => ['preview:cellular_report', 'view:division', 'view:acc_report', 'view:acc_detail', 'view:acc_journal', 'view:acc_master', 'manage:acc_master', 'manage:acc_period', 'approve:acc_period', 'approve:pnl', 'approve:voucher', 'approve:omzet', 'manage:omzet_unlock', 'view:acc_hr', 'manage:acc_employees', 'view:acc_deposits', 'void:acc_deposits'],
            'HEAD_OPS' => ['view:division', 'view:acc_report'],
            'SPV' => ['view:division', 'view:acc_report'],
            'LEADER' => ['view:division', 'view:acc_report'],
            'ADMIN' => ['preview:cellular_report', 'view:division', 'view:acc_report', 'view:acc_detail', 'view:acc_journal', 'view:acc_master', 'write:acc_transaction', 'import:acc_transaction', 'write:acc_outstanding', 'write:acc_bank', 'submit:acc_period', 'write:leave_records', 'write:attendance', 'write:omzet', 'write:voucher', 'attach:voucher', 'write:stock', 'view:bonus', 'view:acc_hr', 'manage:acc_employees', 'write:acc_hr', 'view:acc_deposits', 'write:acc_deposits'],
            'ADMIN_GUDANG' => ['view:division', 'view:acc_report', 'write:inventory', 'view:inventory'],
            'ACCOUNTING' => ['preview:cellular_report', 'view:division', 'view:acc_report', 'view:acc_detail', 'view:acc_journal', 'view:acc_master', 'view:acc_pnl', 'view:acc_balance_sheet', 'write:acc_outstanding', 'write:acc_bank', 'submit:acc_period', 'view:omzet', 'validate:omzet', 'validate:voucher', 'attach:voucher', 'write:pnl', 'view:pnl', 'write:tax', 'write:contract', 'view:debt', 'write:ecsys', 'view:acc_hr', 'view:acc_deposits'],
            'FINANCE' => ['view:division', 'view:acc_report', 'view:acc_detail', 'view:acc_journal', 'view:acc_master', 'write:acc_transaction', 'import:acc_transaction', 'write:acc_outstanding', 'submit:acc_period', 'write:cashflow', 'view:cashflow', 'execute:payment', 'view:acc_deposits', 'receive:acc_deposits'],
        ],
        'PROJECT' => [
            'MANAGER' => ['view:division', 'view:projects', 'manage:projects'],
            'HEAD_OPS' => ['view:division', 'view:projects'],
            'SPV' => ['view:division', 'view:projects'],
            'LEADER' => ['view:division', 'view:projects'],
            'ADMIN' => ['view:division', 'view:projects', 'manage:projects'],
            'ADMIN_GUDANG' => ['view:division', 'view:projects'],
            'ACCOUNTING' => ['view:division', 'view:projects'],
            'FINANCE' => ['view:division', 'view:projects'],
        ],
        'CELL' => [
            'MANAGER' => ['view:division', 'view:cellular', 'manage:cellular_catalog', 'write:cellular_stock', 'view:cellular_sales', 'void:cellular_sale', 'view:cellular_daily', 'approve:cellular_daily'],
            'HEAD_OPS' => ['view:division', 'view:cellular', 'view:cellular_daily'],
            'SPV' => ['view:division', 'view:cellular', 'view:cellular_daily'],
            'LEADER' => ['view:division', 'view:cellular', 'view:cellular_daily'],
            'ADMIN' => ['view:division', 'view:cellular', 'manage:cellular_catalog', 'view:cellular_sales', 'write:cellular_sale', 'view:cellular_daily', 'write:cellular_daily'],
            'ADMIN_GUDANG' => ['view:division', 'view:cellular', 'write:cellular_stock', 'view:cellular_daily'],
            'ACCOUNTING' => ['view:division', 'view:cellular', 'view:cellular_sales', 'view:cellular_daily', 'validate:cellular_daily'],
            'FINANCE' => ['view:division', 'view:cellular', 'view:cellular_sales', 'view:cellular_daily'],
        ],
    ];

    public function __construct(
        protected AuditService $audit
    ) {}

    public function isWriteOrMutationCapability(string $capability): bool
    {
        return str_starts_with($capability, 'write:')
            || str_starts_with($capability, 'manage:')
            || str_starts_with($capability, 'approve:')
            || str_starts_with($capability, 'review:')
            || str_starts_with($capability, 'validate:')
            || str_starts_with($capability, 'execute:');
    }

    public function hasCapability(array $user, string $capability, ?string $divisionCode = null): bool
    {
        $role = strtoupper($user['role'] ?? '');
        if ($role === 'BOD') {
            return in_array($capability, self::BOD_CAPABILITIES, true);
        }
        // Hak akses berasal dari identitas pengguna, bukan divisi pada payload.
        $division = $this->normalizeDivisionCode($user['divisionCode'] ?? $user['division_code'] ?? null);
        if ($role === 'FINANCE' && $division === 'FIN') {
            $division = 'ACC';
        }

        return in_array($capability, self::DOMAIN_CAPABILITIES[$division][$role] ?? [], true);
    }

    private function normalizeDivisionCode(?string $division): ?string
    {
        return $division === 'CELLULAR' ? 'CELL' : $division;
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

        $role = strtoupper($user['role'] ?? '');
        $userDivision = $this->normalizeDivisionCode($user['divisionCode'] ?? $user['division_code'] ?? null);
        $divisionCode = $this->normalizeDivisionCode($divisionCode);

        // BOD lintas divisi (divisionCode null = all)
        if ($role === 'BOD' && $userDivision === null) {
            return ! $forWrite;
        }

        if ($role === 'BOD' && $forWrite) {
            return false;
        }
        if ($role === 'FINANCE' && $userDivision === 'FIN' && $divisionCode === 'ACC') {
            return true;
        }

        return $userDivision === $divisionCode;
    }

    public function assertDivisionScope(array $user, ?string $divisionCode, bool $forWrite = false): void
    {
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
