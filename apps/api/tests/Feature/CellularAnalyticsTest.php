<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CellularAnalyticsTest extends TestCase
{
    public function test_report_combines_sales_closing_settlement_and_latest_ecsys_batch(): void
    {
        $manager = User::where('email', 'manager.cell@dashboard.test')->firstOrFail();
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $product = (string) Str::uuid();
        DB::table('cel_products')->insert(['id' => $product, 'sku' => 'ANL-001', 'name' => 'Produk Analitik', 'kind' => 'SIM_CARD', 'provider' => 'Telkomsel', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('cel_manual_sales')->insert(['id' => (string) Str::uuid(), 'product_id' => $product, 'outlet_id' => $outlet->id, 'product_name' => 'Produk Analitik', 'outlet_name' => $outlet->name, 'business_date' => '2026-10-10', 'quantity' => 2, 'unit_price_cents' => 7500000, 'total_cents' => 15000000, 'source_reference' => 'SALE-ANL-1', 'source_key' => hash('sha256', 'sale-analytics'), 'created_by' => $manager->id, 'status' => 'posted', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $closing = (string) Str::uuid();
        DB::table('cel_daily_closings')->insert(['id' => $closing, 'outlet_id' => $outlet->id, 'business_date' => '2026-10-10', 'shift_code' => 'HARIAN', 'system_sales_cents' => 15000000, 'cash_cents' => 15000000, 'qris_cents' => 0, 'edc_cents' => 0, 'transfer_cents' => 0, 'difference_cents' => 0, 'source_reference' => 'CLOSE-ANL-1', 'status' => 'approved', 'created_by' => $manager->id, 'approved_by' => $manager->id, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('cel_settlements')->insert(['id' => (string) Str::uuid(), 'daily_closing_id' => $closing, 'channel' => 'cash', 'settlement_date' => '2026-10-10', 'gross_cents' => 15000000, 'fee_cents' => 100000, 'net_cents' => 14900000, 'destination' => 'Kas pusat', 'reference' => 'SETTLE-ANL-1', 'source_key' => hash('sha256', 'settle-analytics'), 'status' => 'reconciled', 'created_by' => $manager->id, 'reviewed_by' => $manager->id, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $batch = (string) Str::uuid();
        DB::table('acc_cellular_import_batches')->insert(['id' => $batch, 'division_code' => 'ACC', 'outlet_id' => $outlet->id, 'outlet_name' => $outlet->name, 'source_division_code' => 'CELL', 'profile' => 'ecsys', 'profile_version' => 1, 'period' => '2026-10', 'original_name' => 'ecsys-oktober.xlsx', 'sha256' => hash('sha256', 'ecsys-analytics'), 'status' => 'staged', 'summary' => json_encode(['days' => 1]), 'issues' => '[]', 'created_by' => $manager->id, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('acc_cellular_import_rows')->insert(['id' => (string) Str::uuid(), 'batch_id' => $batch, 'business_date' => '2026-10-10', 'validation_status' => 'valid', 'payload' => json_encode(['gross' => 150000, 'source_net' => 136363.64, 'ecsys_realization' => 140000, 'ecsys_net' => 127272.73, 'ecsys_entered' => 140000]), 'lineage' => '{}', 'issues' => '[]', 'created_at' => now(), 'updated_at' => now()]);

        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/analytics?month=2026-10')->assertOk()
            ->assertJsonPath('data.kpis.sales', '150000.00')->assertJsonPath('data.kpis.ecsys_entered', '140000.00')
            ->assertJsonPath('data.kpis.variance', '10000.00')->assertJsonPath('data.kpis.exception_days', 1)
            ->assertJsonPath('data.coverage.ecsys_batches', 1)->assertJsonPath('data.daily.0.settled_net', '149000.00')
            ->assertJsonPath('data.daily.0.reconciliation_status', 'variance')->assertJsonPath('data.providers.0.provider', 'Telkomsel');
    }

    public function test_report_rejects_roles_without_financial_visibility_and_foreign_outlets(): void
    {
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'LEADER']);
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/analytics?month=2026-10')->assertForbidden();
        $foreign = Outlet::whereHas('division', fn ($query) => $query->where('code', 'PROJECT'))->firstOrFail();
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/cellular/analytics?month=2026-10&outlet_id='.$foreign->id)->assertStatus(404);
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/cellular/analytics?month=not-a-month')->assertForbidden();
    }
}
