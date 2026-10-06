<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeAssignment;
use App\Services\OrgReadModelService;
use Tests\TestCase;

class OrgScopeSecurityTest extends TestCase
{
    private function makeAssignment(string $division): EmployeeAssignment
    {
        $employee = Employee::create(['code' => 'SEC-'.$division, 'name' => 'Pegawai uji '.$division, 'is_active' => true]);

        return EmployeeAssignment::create(['employee_id' => $employee->id,
            'division_id' => Division::where('code', $division)->firstOrFail()->id, 'effective_from' => '2026-10-01']);
    }

    public function test_invalid_or_missing_division_never_returns_all_employee_assignments(): void
    {
        $this->makeAssignment('CELL');
        $service = app(OrgReadModelService::class);
        foreach ([null, 'UNKNOWN'] as $division) {
            $user = ['role' => 'ADMIN', 'divisionCode' => $division];
            $this->assertSame([], $service->getAssignmentsForUser($user));
            $this->assertSame([], $service->getOutletsForUser($user));
        }
    }

    public function test_assignment_api_is_scoped_and_global_bod_remains_authorized(): void
    {
        $own = $this->makeAssignment('CELL');
        $this->makeAssignment('ACC');
        $this->authenticated('admin.cell@dashboard.test')->getJson('/api/v1/org/assignments')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $own->id);
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/assignments')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_scoped_bod_and_inactive_division_do_not_bypass_scope(): void
    {
        $this->makeAssignment('ACC');
        $this->makeAssignment('CELL');
        $service = app(OrgReadModelService::class);
        $this->assertCount(1, $service->getAssignmentsForUser(['role' => 'BOD', 'divisionCode' => 'ACC']));
        $this->assertSame([], $service->getOutletsForUser(['role' => 'BOD', 'divisionCode' => 'ACC'], 'CELL'));
        Division::where('code', 'CELL')->update(['is_active' => false]);
        $this->assertSame([], $service->getAssignmentsForUser(['role' => 'ADMIN', 'divisionCode' => 'CELL']));
    }
}
