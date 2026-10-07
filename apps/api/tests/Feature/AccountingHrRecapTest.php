<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AccountingHrRecapTest extends TestCase
{
    private function leave(): array
    {
        $employee = Employee::create(['code' => 'HR-ANONIM', 'name' => 'Pegawai anonim', 'is_active' => true]);
        $this->authenticated('admin.acc@dashboard.test');

        return ['kind' => 'leave', 'employee_id' => $employee->id, 'start_date' => '2026-10-06', 'end_date' => '2026-10-07',
            'leave_type' => 'Tahunan sesuai sumber', 'source_days' => '1.50', 'source_reference' => 'CUTI-UJI-1', 'approval_reference' => 'PERSETUJUAN-UJI-1'];
    }

    public function test_manual_leave_correction_version_and_void_preserve_history(): void
    {
        $data = $this->leave();
        $response = $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertCreated()->assertJsonPath('data.source_days', '1.50');
        $id = $response->json('data.id');
        $correction = $data;
        unset($correction['employee_id'],$correction['source_reference']);
        $correction += ['version' => 1, 'reason' => 'Jumlah hari sesuai sumber koreksi'];
        $correction['source_days'] = '1.25';
        $this->putJson('/api/v1/accounting/hr/recaps/'.$id, $correction)->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.events.1.before.source_days', '1.50')->assertJsonPath('data.events.1.after.source_days', '1.25');
        $this->putJson('/api/v1/accounting/hr/recaps/'.$id, $correction)->assertStatus(409);
        $this->putJson('/api/v1/accounting/hr/recaps/'.$id, array_replace($correction, ['version' => 2, 'employee_id' => $data['employee_id']]))->assertStatus(400);
        $this->putJson('/api/v1/accounting/hr/recaps/'.$id, array_replace($correction, ['version' => 2, 'source_reference' => 'GANTI']))->assertStatus(400);
        $this->postJson('/api/v1/accounting/hr/recaps/'.$id.'/void', ['version' => 2, 'reason' => 'Sumber dibatalkan oleh pihak terkait'])->assertOk()->assertJsonPath('data.status', 'voided')->assertJsonCount(3, 'data.events');
        $this->postJson('/api/v1/accounting/hr/recaps/'.$id.'/void', ['version' => 3, 'reason' => 'Pembatalan ulang sumber'])->assertStatus(409);
        $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertStatus(409);
        $this->assertDatabaseCount('acc_hr_recaps', 1);
        $this->assertDatabaseCount('acc_hr_events', 3);
    }

    public function test_leave_overlap_range_and_days_are_checked_without_calendar_inference(): void
    {
        $data = $this->leave();
        $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertCreated();
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['source_reference' => 'CUTI-UJI-2', 'start_date' => '2026-10-07', 'end_date' => '2026-10-08']))->assertStatus(409);
        foreach ([['end_date' => '2026-10-01'], ['source_days' => '0'], ['source_days' => '1.123'], ['approval_reference' => '']] as $bad) {
            $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, $bad))->assertStatus(400);
        }
        $this->getJson('/api/v1/accounting/hr/recaps?kind=leave&month=2026-10')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/v1/accounting/hr/recaps?kind=leave&month=2026-13')->assertStatus(400);
        $this->getJson('/api/v1/accounting/hr/recaps?kind=leave&month=2026-10&page=0')->assertStatus(400);
    }

    public function test_attendance_unique_date_and_future_validation(): void
    {
        $base = $this->leave();
        $data = ['kind' => 'attendance', 'employee_id' => $base['employee_id'], 'start_date' => now('Asia/Jakarta')->toDateString(),
            'attendance_status' => 'PRESENT', 'schedule_reference' => 'JADWAL-UJI', 'late_minutes' => 5, 'source_reference' => 'ABSEN-UJI-1'];
        $id = $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertCreated()->assertJsonPath('data.late_minutes', 5)->json('data.id');
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['source_reference' => 'ABSEN-UJI-2']))->assertStatus(409);
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['start_date' => now('Asia/Jakarta')->addDay()->toDateString()]))->assertStatus(400);
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['late_minutes' => 1441]))->assertStatus(400);
        $this->postJson('/api/v1/accounting/hr/recaps/'.$id.'/void', ['version' => 1, 'reason' => 'Catatan keliru pada sumber'])->assertOk();
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['source_reference' => 'ABSEN-UJI-2', 'attendance_status' => 'OFF', 'late_minutes' => 0]))->assertCreated();
        $this->assertDatabaseCount('acc_hr_recaps', 2);
    }

    public function test_personal_data_routes_are_separately_guarded_and_manager_cannot_edit_recaps(): void
    {
        $data = $this->leave();
        $id = $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertCreated()->json('data.id');
        foreach (['FINANCE', 'HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG'] as $role) {
            User::where('email', 'manager.acc@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.acc@dashboard.test');
            foreach (['/employees', '/recaps?kind=leave&month=2026-10', '/recaps/'.$id] as $path) {
                $this->getJson('/api/v1/accounting/hr'.$path)->assertForbidden()->assertDontSee('Pegawai anonim');
            }
            $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertForbidden();
        }
        foreach (['bod1@dashboard.test', 'manager.cell@dashboard.test', 'manager.project@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/hr/employees')->assertForbidden();
        }
        User::where('email', 'manager.acc@dashboard.test')->update(['role' => 'MANAGER']);
        foreach (['manager.acc@dashboard.test', 'accounting@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/hr/recaps/'.$id)->assertOk();
            $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertForbidden();
        }
    }

    public function test_master_registration_minimal_and_required_audit_failure_rolls_back(): void
    {
        $this->authenticated('manager.acc@dashboard.test');
        $employee = ['code' => 'hr-test', 'name' => 'Pegawai sumber anonim', 'source_reference' => 'MASTER-UJI'];
        $this->postJson('/api/v1/accounting/hr/employees', $employee)->assertCreated()->assertJsonPath('data.code', 'HR-TEST')->assertJsonMissingPath('data.source_reference');
        $this->postJson('/api/v1/accounting/hr/employees', $employee)->assertStatus(409);
        Schema::drop('audit_events');
        $this->postJson('/api/v1/accounting/hr/employees', array_replace($employee, ['code' => 'HR-ROLLBACK']))->assertStatus(500);
        $this->assertDatabaseMissing('employees', ['code' => 'HR-ROLLBACK']);
    }

    public function test_audit_failure_rolls_back_recap_and_events_and_inactive_employee_can_be_voided(): void
    {
        $data = $this->leave();
        $id = $this->postJson('/api/v1/accounting/hr/recaps', $data)->assertCreated()->json('data.id');
        Employee::whereKey($data['employee_id'])->update(['is_active' => false]);
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['source_reference' => 'LAIN', 'start_date' => '2026-11-01', 'end_date' => '2026-11-02']))->assertNotFound();
        Schema::drop('audit_events');
        $this->postJson('/api/v1/accounting/hr/recaps/'.$id.'/void', ['version' => 1, 'reason' => 'Pembatalan saat pegawai tidak aktif'])->assertStatus(500);
        $this->assertDatabaseHas('acc_hr_recaps', ['id' => $id, 'status' => 'recorded', 'version' => 1]);
        $this->assertDatabaseCount('acc_hr_events', 1);
        Employee::whereKey($data['employee_id'])->update(['is_active' => true]);
        $this->postJson('/api/v1/accounting/hr/recaps', array_replace($data, ['source_reference' => 'SUMBER-AUDIT-GAGAL', 'start_date' => '2026-11-01', 'end_date' => '2026-11-02']))->assertStatus(500);
        $this->assertDatabaseCount('acc_hr_recaps', 1);
        $this->assertDatabaseCount('acc_hr_events', 1);
    }
}
