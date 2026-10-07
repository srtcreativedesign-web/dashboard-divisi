<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Models\Outlet;

class OrgReadModelService
{
    public function accountingEmployees(array $user): array
    {
        app(PolicyService::class)->assertDivisionScope($user, 'ACC');
        app(PolicyService::class)->assertCapability($user, 'view:acc_hr');

        return Employee::orderBy('code')->limit(500)->get(['id', 'code', 'name', 'is_active'])->toArray();
    }

    public function createAccountingEmployee(array $data, array $user): array
    {
        app(PolicyService::class)->assertDivisionScope($user, 'ACC', true);
        app(PolicyService::class)->assertCapability($user, 'manage:acc_employees');
        $data['code'] = strtoupper(trim($data['code']));
        if (Employee::whereRaw('LOWER(code) = ?', [strtolower($data['code'])])->exists()) {
            throw new ApiException('VERSION_CONFLICT', 'Kode pegawai sudah terdaftar.');
        }
        $employee = Employee::create($data + ['is_active' => true]);
        app(AuditService::class)->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'Employee', 'entityId' => $employee->id, 'divisionCode' => 'ACC', 'action' => 'accounting.employee.created']);

        return $employee->only(['id', 'code', 'name', 'is_active']);
    }

    public function lockAccountingEmployee(string $id, array $user, bool $activeOnly = true): Employee
    {
        app(PolicyService::class)->assertDivisionScope($user, 'ACC', true);
        app(PolicyService::class)->assertCapability($user, 'view:acc_hr');
        $query = Employee::whereKey($id);
        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query->lockForUpdate()->firstOrFail();
    }

    public function getDivisionsForUser(array $user): array
    {
        $divisions = Division::where('is_active', true)->orderBy('sort_order', 'asc')->get();
        $all = $divisions->map(fn ($d) => [
            'id' => $d->id,
            'code' => $d->code,
            'name' => $d->name,
            'isActive' => $d->is_active,
            'sortOrder' => $d->sort_order,
        ])->toArray();

        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        if ($role === 'BOD' && ! $userDivision) {
            return array_values(array_filter($all, fn ($d) => $d['isActive']));
        }

        return array_values(array_filter($all, fn ($d) => $d['code'] === $userDivision && $d['isActive']));
    }

    public function getOutletsForUser(array $user, ?string $divisionCode = null): array
    {
        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        // If specific divisionCode requested, check access first
        if ($divisionCode && $role !== 'BOD' && $userDivision !== $divisionCode) {
            return [];
        }

        if ($role !== 'BOD' && ! $userDivision) {
            return [];
        }
        if ($role === 'BOD' && $userDivision && $divisionCode && $divisionCode !== $userDivision) {
            return [];
        }
        $divisionCode = $divisionCode ?? ($role === 'BOD' && $userDivision ? $userDivision : null);

        $query = Outlet::where('is_active', true);
        if ($divisionCode) {
            $div = Division::where('code', $divisionCode)->first();
            if (! $div) {
                return [];
            }
            $query->where('division_id', $div->id);
        } elseif ($role !== 'BOD' && $userDivision) {
            $div = Division::where('code', $userDivision)->first();
            if (! $div) {
                return [];
            }
            $query->where('division_id', $div->id);
        }

        $outlets = $query->orderBy('code', 'asc')->get();

        return $outlets->map(fn ($o) => [
            'id' => $o->id,
            'code' => $o->code,
            'name' => $o->name,
            'divisionId' => $o->division_id,
            'isActive' => $o->is_active,
        ])->toArray();
    }

    public function getAccountingOutlets(array $user): array
    {
        $policy = app(PolicyService::class);
        $policy->assertCapability($user, 'view:acc_report');
        $policy->assertDivisionScope($user, 'ACC');

        return Outlet::with('division')->where('is_active', true)->whereHas('division', fn ($query) => $query->where('is_active', true))
            ->orderBy('code')->get()->map(fn ($outlet) => [
                'id' => $outlet->id, 'code' => $outlet->code, 'name' => $outlet->name,
                'divisionCode' => $outlet->division->code,
            ])->all();
    }

    public function getAssignmentsForUser(array $user): array
    {
        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        $query = EmployeeAssignment::with(['employee', 'division', 'outlet']);
        if (! ($role === 'BOD' && ! $userDivision)) {
            if (! $userDivision) {
                return [];
            }
            $division = Division::where('code', $userDivision)->where('is_active', true)->first();
            if (! $division) {
                return [];
            }
            $query->where('division_id', $division->id);
        }

        return $query->orderBy('effective_from', 'desc')->limit(20)->get()->toArray();
    }

    public function getUserContext(array $user): array
    {
        $divisions = $this->getDivisionsForUser($user);
        $outlets = $this->getOutletsForUser($user);
        $assignments = $this->getAssignmentsForUser($user);

        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        return [
            'user' => [
                'id' => $user['sub'] ?? $user['id'] ?? null,
                'email' => $user['email'] ?? null,
                'role' => $role,
                'divisionCode' => $userDivision,
            ],
            'divisions' => array_map(fn ($d) => ['code' => $d['code'], 'name' => $d['name']], $divisions),
            'outlets' => array_map(fn ($o) => [
                'code' => $o['code'],
                'name' => $o['name'],
                'divisionCode' => $o['divisionCode'] ?? ($o['divisionId'] ?? null),
            ], $outlets),
            'assignments' => array_slice($assignments, 0, 5),
            'scope' => ($role === 'BOD' && ! $userDivision) ? 'ALL_7_DIVISI' : $userDivision,
        ];
    }
}
