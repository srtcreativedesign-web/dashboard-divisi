<?php

namespace Tests\Feature;

use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Models\Accounting\VoucherPayment;
use App\Models\Outlet;
use App\Models\User;
use App\Services\Accounting\DashboardService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingDashboardTest extends TestCase
{
    private function voucher(string $status = 'approved', string $date = '2026-10-07', string $amount = '1000.25', string $division = 'ACC'): Voucher
    {
        return Voucher::unguarded(fn () => Voucher::create(['id' => (string) Str::uuid(), 'division_code' => $division, 'voucher_no' => (string) Str::uuid(), 'type' => 'OPERATIONAL', 'outlet_id' => Outlet::where('code', 'CELL-001')->firstOrFail()->id,
            'outlet_name' => 'Outlet anonim', 'source_division_code' => 'CELL', 'voucher_date' => $date, 'due_date' => '2026-10-06', 'entity_name' => 'Penerima anonim',
            'source_reference' => (string) Str::uuid(), 'source_key' => (string) Str::uuid(), 'amount' => $amount, 'description' => 'Keperluan pengujian anonim', 'status' => $status, 'created_by' => (string) Str::uuid()]));
    }

    public function test_totals_cover_all_rows_filter_month_scope_and_exclude_voided_payments(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-07 12:00:00', 'Asia/Jakarta'));
        for ($i = 0; $i < 27; $i++) {
            $this->voucher('draft');
        }
        $v = $this->voucher();
        foreach ([['recorded', 10025], ['voided', 50000]] as [$status, $amount]) {
            VoucherPayment::create(['id' => (string) Str::uuid(), 'voucher_id' => $v->id, 'paid_date' => '2026-10-07', 'amount_cents' => $amount, 'method' => 'CASH', 'reference' => (string) Str::uuid(), 'source_key' => (string) Str::uuid(), 'notes' => 'Uji anonim', 'status' => $status, 'created_by' => (string) Str::uuid(), 'original_name' => 'anonim.pdf', 'file_path' => 'privat', 'mime_type' => 'application/pdf', 'size_bytes' => 100, 'sha256' => str_repeat('a', 64)]);
        }
        $this->voucher('approved', '2026-09-07');
        $this->voucher('approved', '2026-10-07', '99999.00', 'PROJECT');
        $data = $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/dashboard/operations?month=2026-10')->assertOk()
            ->assertJsonPath('data.total', 28)->assertJsonPath('data.counts.draft', 27)->assertJsonPath('data.approved_amount', '1000.25')
            ->assertJsonPath('data.paid_amount', '100.25')->assertJsonPath('data.remaining_amount', '900.00')->assertJsonPath('data.partial_count', 1)->assertJsonPath('data.overdue_count', 1)->json('data');
        $this->assertSame(['id', 'source_reference', 'outlet_name', 'source_division_code', 'due_date', 'remaining_amount'], array_keys($data['due_vouchers'][0]));
        $this->assertDatabaseCount('audit_events', 0);
    }

    public function test_roles_filters_empty_state_and_service_guard(): void
    {
        $this->getJson('/api/v1/accounting/dashboard/operations?month=2026-10')->assertUnauthorized();
        User::create(['id' => (string) Str::uuid(), 'email' => 'head-ops.acc@dashboard.test', 'name' => 'Anonim', 'password_hash' => 'unused', 'role' => 'HEAD_OPS', 'division_code' => 'ACC', 'is_active' => true]);
        foreach (['head-ops.acc@dashboard.test', 'admin.project@dashboard.test', 'manager.cell@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/dashboard/operations?month=2026-10')->assertForbidden();
        }
        foreach (['admin.acc@dashboard.test', 'manager.acc@dashboard.test', 'accounting@dashboard.test', 'finance@dashboard.test', 'bod1@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/dashboard/operations?month=2026-10')->assertOk()->assertJsonPath('data.total', 0)->assertJsonPath('data.due_vouchers', []);
        }
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/dashboard/operations?month=2026-13')->assertStatus(400);
        $this->getJson('/api/v1/accounting/dashboard/operations?month=2026-10&divisionCode=PROJECT')->assertForbidden();
        $this->expectException(ApiException::class);
        app(DashboardService::class)->operations('2026-10', ['role' => 'HEAD_OPS', 'divisionCode' => 'ACC']);
    }
}
