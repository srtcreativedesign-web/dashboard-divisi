<?php

namespace App\Services;

use App\Models\Division;
use App\Models\EmployeeAssignment;
use App\Models\Outlet;
use Throwable;

class OrgReadModelService
{
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

    public function getAssignmentsForUser(array $user): array
    {
        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        try {
            $query = EmployeeAssignment::with(['employee', 'division', 'outlet']);
            if ($role !== 'BOD' && $userDivision) {
                $div = Division::where('code', $userDivision)->first();
                if ($div) {
                    $query->where('division_id', $div->id);
                }
            }

            return $query->orderBy('effective_from', 'desc')->limit(20)->get()->toArray();
        } catch (Throwable) {
            return [];
        }
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
