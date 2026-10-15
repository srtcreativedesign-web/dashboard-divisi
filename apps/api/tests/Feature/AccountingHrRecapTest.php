<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingHrRecapTest extends TestCase
{
    private function record(string $kind = 'attendance', array $overrides = []): array
    {
        $employee = Employee::create(['code' => 'HR-ANONIM-'.Str::random(5), 'name' => 'Pegawai anonim', 'is_active' => true]);
        $id = (string) Str::uuid();
        $date = '2026-10-06';
        $base = [
            'id' => $id,
            'employee_id' => $employee->id,
            'employee_code' => $employee->code,
            'employee_name' => $employee->name,
            'kind' => $kind,
            'start_date' => $date,
            'end_date' => $kind === 'leave' ? '2026-10-07' : $date,
            'leave_type' => $kind === 'leave' ? 'Tahunan dari sumber' : null,
            'source_days_hundredths' => $kind === 'leave' ? 150 : null,
            'approval_reference' => $kind === 'leave' ? 'LEAVE-SOURCE-001' : null,
            'attendance_status' => $kind === 'attendance' ? 'SICK' : null,
            'schedule_reference' => $kind === 'attendance' ? 'SHIFT-SOURCE-001' : null,
            'late_minutes' => $kind === 'attendance' ? 0 : null,
            'source_reference' => strtoupper($kind).'-SOURCE-'.$id,
            'source_key' => hash('sha256', $id),
            'status' => 'recorded',
            'version' => 1,
            'created_by' => User::where('email', 'admin.acc@dashboard.test')->value('id'),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        DB::table('acc_hr_recaps')->insert(array_replace($base, $overrides));

        return array_replace($base, $overrides);
    }

    public function test_register_is_read_only_and_exposes_attendance_source_contract(): void
    {
        $attendance = $this->record();
        $this->record('leave');
        $this->authenticated('admin.acc@dashboard.test');

        $response = $this->getJson('/api/v1/accounting/hr/recaps?kind=attendance&month=2026-10')->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.items.0.id', $attendance['id'])
            ->assertJsonPath('data.items.0.attendance_status', 'SICK')
            ->assertJsonPath('data.source.mode', 'read_only')
            ->assertJsonPath('data.source.system', 'attendance_api');
        $item = $response->json('data.items.0');
        $this->assertArrayNotHasKey('source_key', $item);
        $this->assertArrayNotHasKey('created_by', $item);
        $this->assertArrayNotHasKey('workflow', $item);
        $this->assertArrayNotHasKey('events', $item);
    }

    public function test_detail_contains_source_values_without_internal_hr_workflow(): void
    {
        $leave = $this->record('leave');
        $this->authenticated('accounting@dashboard.test');

        $response = $this->getJson('/api/v1/accounting/hr/recaps/'.$leave['id'])->assertOk()
            ->assertJsonPath('data.leave_type', 'Tahunan dari sumber')
            ->assertJsonPath('data.source_days', '1.50')
            ->assertJsonPath('data.approval_reference', 'LEAVE-SOURCE-001')
            ->assertJsonPath('data.source.mode', 'read_only');
        $data = $response->json('data');
        foreach (['source_key', 'created_by', 'workflow', 'events'] as $field) {
            $this->assertArrayNotHasKey($field, $data);
        }
    }

    public function test_public_hr_write_routes_and_manual_employee_route_are_closed(): void
    {
        $record = $this->record();
        $this->authenticated('admin.acc@dashboard.test');

        $this->postJson('/api/v1/accounting/hr/recaps', [])->assertStatus(405);
        $this->putJson('/api/v1/accounting/hr/recaps/'.$record['id'], [])->assertStatus(405);
        $this->postJson('/api/v1/accounting/hr/recaps/'.$record['id'].'/void', [])->assertNotFound();
        $this->getJson('/api/v1/accounting/hr/employees')->assertNotFound();
        $this->postJson('/api/v1/accounting/hr/employees', [])->assertNotFound();
        $this->assertDatabaseHas('acc_hr_recaps', ['id' => $record['id'], 'version' => 1, 'status' => 'recorded']);
    }

    public function test_personal_attendance_data_remains_scoped_to_authorized_accounting_roles(): void
    {
        $record = $this->record();
        foreach (['FINANCE', 'HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.acc@dashboard.test')
                ->getJson('/api/v1/accounting/hr/recaps?kind=attendance&month=2026-10')
                ->assertForbidden()->assertDontSee('Pegawai anonim');
        }
        foreach (['bod1@dashboard.test', 'manager.cell@dashboard.test', 'manager.project@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/hr/recaps/'.$record['id'])->assertForbidden()->assertDontSee('Pegawai anonim');
        }
        User::where('email', 'manager.acc@dashboard.test')->update(['role' => 'MANAGER']);
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/accounting/hr/recaps/'.$record['id'])->assertOk();
    }

    public function test_filters_validate_kind_month_and_page(): void
    {
        $this->authenticated('admin.acc@dashboard.test');
        $this->getJson('/api/v1/accounting/hr/recaps?kind=other&month=2026-10')->assertStatus(400);
        $this->getJson('/api/v1/accounting/hr/recaps?kind=attendance&month=2026-13')->assertStatus(400);
        $this->getJson('/api/v1/accounting/hr/recaps?kind=attendance&month=2026-10&page=0')->assertStatus(400);
    }
}
