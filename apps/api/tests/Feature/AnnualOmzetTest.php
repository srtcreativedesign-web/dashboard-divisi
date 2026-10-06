<?php

namespace Tests\Feature;

use App\Models\Accounting\OmzetRecord;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class AnnualOmzetTest extends TestCase
{
    private function source(string $date, string $amount, string $status = 'validated', string $division = 'ACC'): void
    {
        $outlet = Outlet::where('is_active', true)->firstOrFail();
        OmzetRecord::create(['id' => (string) Str::uuid(), 'division_code' => $division, 'outlet_id' => $outlet->id,
            'outlet_name' => 'Outlet anonim', 'source_division_code' => 'CELL', 'business_date' => $date,
            'shift' => substr((string) Str::uuid(), 0, 20), 'outlet_amount' => $amount, 'cash_amount' => $amount,
            'qris_amount' => '0', 'edc_amount' => '0', 'transfer_amount' => '0', 'other_amount' => '0',
            'requires_ap' => false, 'source_reference' => 'Sumber anonim', 'status' => $status,
            'created_by' => (string) Str::uuid(), 'version' => 1]);
    }

    public function test_annual_amount_is_exact_validated_scoped_and_distinguishes_zero_from_missing(): void
    {
        $this->source('2026-01-01', '0.10');
        $this->source('2026-01-31', '0.20');
        $this->source('2026-02-01', '0.00');
        $this->source('2026-01-20', '999.00', 'submitted');
        $this->source('2025-12-31', '700.00');
        $this->source('2027-01-01', '800.00');
        $this->source('2026-01-01', '900.00', 'validated', 'CELL');
        $response = $this->authenticated('accounting@dashboard.test')->getJson('/api/v1/accounting/omzet/annual?year=2026')->assertOk();
        $response->assertJsonPath('data.amount', '0.30')->assertJsonPath('data.validated_count', 3)
            ->assertJsonPath('data.pending_count', 1)->assertJsonCount(12, 'data.months')
            ->assertJsonPath('data.months.0.amount', '0.30')->assertJsonPath('data.months.1.amount', '0.00')
            ->assertJsonPath('data.months.2.amount', null)->assertJsonPath('data.outlets.0.amount', '0.30')
            ->assertJsonPath('data.outlets.0.months_with_data', 2);
    }

    public function test_empty_year_has_null_total_and_invalid_year_is_rejected(): void
    {
        $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/omzet/annual?year=2026')->assertOk()->assertJsonPath('data.amount', null)->assertJsonCount(0, 'data.outlets');
        foreach (['', '?year=abc', '?year=10000', '?year[]=2026'] as $query) {
            $this->getJson('/api/v1/accounting/omzet/annual'.$query)->assertStatus(400);
        }
    }

    public function test_detail_rights_apply_to_report_and_bod_remains_readonly(): void
    {
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/accounting/omzet/annual?year=2026')->assertOk();
        foreach (['manager.cell@dashboard.test', 'manager.project@dashboard.test'] as $email) {
            $this->authenticated($email)->getJson('/api/v1/accounting/omzet/annual?year=2026')->assertForbidden();
        }
        $user = User::where('email', 'manager.acc@dashboard.test')->firstOrFail();
        $user->update(['role' => 'HEAD_OPS']);
        $this->authenticated($user->email)->getJson('/api/v1/accounting/omzet/annual?year=2026')->assertForbidden();
    }
}
