<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CellularManualWorkflowTest extends TestCase
{
    private function setupStock(): array
    {
        $this->authenticated('manager.cell@dashboard.test');
        $product = $this->postJson('/api/v1/cellular/products', ['sku' => 'sim-001', 'name' => 'Kartu uji', 'kind' => 'SIM_CARD', 'provider' => 'Provider uji', 'variant' => '10GB'])->assertCreated()->json('data.id');
        $outlet = Outlet::whereHas('division', fn ($q) => $q->where('code', 'CELL'))->where('is_active', true)->firstOrFail()->id;
        $this->postJson('/api/v1/cellular/stock', ['product_id' => $product, 'outlet_id' => $outlet, 'quantity_delta' => 10, 'reference' => 'MASUK-1', 'reason' => 'Penerimaan barang uji'])->assertCreated();

        return ['product_id' => $product, 'outlet_id' => $outlet, 'business_date' => now('Asia/Jakarta')->toDateString(), 'quantity' => 3, 'unit_price' => '0.10', 'reference' => 'JUAL-1'];
    }

    public function test_sale_reduces_quantity_exactly_once_and_manager_void_restores_once(): void
    {
        $sale = $this->setupStock();
        $this->authenticated('admin.cell@dashboard.test');
        $result = $this->postJson('/api/v1/cellular/sales', $sale)->assertCreated()->assertJsonPath('data.0.total_amount', '0.30');
        $id = $result->json('data.0.id');
        $this->assertDatabaseHas('cel_stock_balances', ['quantity' => 7]);
        $this->postJson('/api/v1/cellular/sales', $sale)->assertStatus(409);
        $this->postJson('/api/v1/cellular/sales', array_replace($sale, ['quantity' => 8, 'reference' => 'JUAL-2']))->assertStatus(409);
        $this->postJson('/api/v1/cellular/sales/'.$id.'/void', ['version' => 1, 'reason' => 'Salah pencatatan uji'])->assertForbidden();
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/sales/'.$id.'/void', ['version' => 1, 'reason' => 'Salah pencatatan uji'])->assertOk()->assertJsonPath('data.0.status', 'voided');
        $this->assertDatabaseHas('cel_stock_balances', ['quantity' => 10]);
        $this->postJson('/api/v1/cellular/sales/'.$id.'/void', ['version' => 2, 'reason' => 'Pembatalan ulang uji'])->assertStatus(409);
        $this->assertDatabaseCount('cel_manual_sales', 1);
        $this->assertDatabaseCount('cel_stock_movements', 3);
    }

    public function test_catalog_and_sales_privacy_and_mutations_are_role_scoped(): void
    {
        $sale = $this->setupStock();
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE'] as $role) {
            User::where('email', 'manager.cell@dashboard.test')->update(['role' => $role]);
            $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/products')->assertOk();
            $this->getJson('/api/v1/cellular/stock')->assertOk();
            $this->postJson('/api/v1/cellular/sales', $sale)->assertForbidden();
            $response = $this->getJson('/api/v1/cellular/sales?month='.substr($sale['business_date'], 0, 7));
            in_array($role, ['ACCOUNTING', 'FINANCE']) ? $response->assertOk() : $response->assertForbidden();
        }
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/cellular/sales?month='.substr($sale['business_date'], 0, 7))->assertOk();
        $this->postJson('/api/v1/cellular/products', ['sku' => 'BOD', 'name' => 'Tidak boleh', 'kind' => 'ACCESSORY'])->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/cellular/products')->assertForbidden();
    }

    public function test_invalid_input_cross_division_and_duplicate_stock_are_rejected(): void
    {
        $sale = $this->setupStock();
        $this->postJson('/api/v1/cellular/products', ['sku' => 'SIM-001', 'name' => 'Duplikat', 'kind' => 'SIM_CARD'])->assertStatus(409);
        $stock = ['product_id' => $sale['product_id'], 'outlet_id' => $sale['outlet_id'], 'quantity_delta' => 10, 'reference' => 'masuk-1', 'reason' => 'Penerimaan ulang uji'];
        $this->postJson('/api/v1/cellular/stock', $stock)->assertStatus(409);
        $this->postJson('/api/v1/cellular/stock', array_replace($stock, ['quantity_delta' => 0]))->assertStatus(400);
        $this->postJson('/api/v1/cellular/stock', array_replace($stock, ['quantity_delta' => -11, 'reference' => 'KOREKSI-1']))->assertStatus(409);
        $this->authenticated('admin.cell@dashboard.test');
        foreach ([['unit_price' => '0.123'], ['unit_price' => '-1'], ['quantity' => 0], ['quantity' => 1.5], ['business_date' => now('Asia/Jakarta')->addDay()->toDateString()]] as $bad) {
            $this->postJson('/api/v1/cellular/sales', array_replace($sale, $bad))->assertStatus(400);
        }
        $foreign = Outlet::whereHas('division', fn ($q) => $q->where('code', 'WRAP'))->firstOrFail();
        $this->postJson('/api/v1/cellular/sales', array_replace($sale, ['outlet_id' => $foreign->id]))->assertForbidden();
        $this->assertDatabaseCount('cel_manual_sales', 0);
        $this->assertDatabaseHas('cel_stock_balances', ['quantity' => 10]);
        $this->getJson('/api/v1/cellular/sales?month=2026-13')->assertStatus(400);
    }

    public function test_required_audit_failure_rolls_back_sale_and_stock(): void
    {
        $sale = $this->setupStock();
        Schema::drop('audit_events');
        $this->authenticated('admin.cell@dashboard.test')->postJson('/api/v1/cellular/sales', $sale)->assertStatus(500);
        $this->assertDatabaseHas('cel_stock_balances', ['quantity' => 10]);
        $this->assertDatabaseCount('cel_stock_movements', 1);
        $this->assertDatabaseCount('cel_manual_sales', 0);
    }

    public function test_gudang_can_adjust_stock_and_legacy_cellular_alias_can_read(): void
    {
        $sale = $this->setupStock();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ADMIN_GUDANG', 'division_code' => 'CELLULAR']);
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/products')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson('/api/v1/cellular/stock', ['product_id' => $sale['product_id'], 'outlet_id' => $sale['outlet_id'], 'quantity_delta' => -1, 'reference' => 'KOREKSI-2', 'reason' => 'Koreksi jumlah barang'])->assertCreated();
        $this->assertDatabaseHas('cel_stock_balances', ['quantity' => 9]);
        $this->postJson('/api/v1/cellular/products', ['sku' => 'BARU', 'name' => 'Tidak boleh', 'kind' => 'ACCESSORY'])->assertForbidden();
    }
}
