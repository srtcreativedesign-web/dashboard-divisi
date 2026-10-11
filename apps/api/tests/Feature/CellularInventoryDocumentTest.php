<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class CellularInventoryDocumentTest extends TestCase
{
    private function fixture(): array
    {
        $this->authenticated('manager.cell@dashboard.test');
        $manager = User::where('email', 'manager.cell@dashboard.test')->firstOrFail();
        User::firstOrCreate(['email' => 'admin-gudang.cell@dashboard.test'], ['id' => (string) Str::uuid(), 'name' => 'Admin Gudang Cellular', 'password_hash' => $manager->password_hash, 'role' => 'ADMIN_GUDANG', 'division_code' => 'CELL', 'is_active' => true]);
        $product = $this->postJson('/api/v1/cellular/products', ['sku' => 'DOC-CELL-1', 'name' => 'Produk Dokumen Cellular', 'kind' => 'SIM_CARD', 'provider' => 'Telkomsel', 'variant' => '12GB'])->assertCreated()->json('data.id');
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();

        return ['product' => $product, 'outlet' => $outlet->id, 'date' => now('Asia/Jakarta')->toDateString()];
    }

    private function payload(array $fixture, string $kind = 'RECEIPT', int $quantity = 5): array
    {
        return [
            'kind' => $kind,
            'source_outlet_id' => $kind === 'RECEIPT' ? null : $fixture['outlet'],
            'destination_outlet_id' => $kind === 'RECEIPT' ? $fixture['outlet'] : null,
            'business_date' => $fixture['date'],
            'reference' => 'SJ-DOC-CELL-001',
            'notes' => 'Penerimaan barang dari pemasok untuk pengujian.',
            'lines' => [['product_id' => $fixture['product'], 'quantity' => $quantity]],
        ];
    }

    public function test_admin_gudang_submits_and_manager_approves_before_stock_changes(): void
    {
        $fixture = $this->fixture();
        $this->authenticated('admin-gudang.cell@dashboard.test');
        $document = $this->postJson('/api/v1/cellular/inventory-documents', $this->payload($fixture))->assertCreated()->assertJsonPath('data.status', 'draft')->json('data');
        $this->assertDatabaseMissing('cel_stock_balances', ['product_id' => $fixture['product']]);
        $document = $this->postJson('/api/v1/cellular/inventory-documents/'.$document['id'].'/submit', ['version' => 1])->assertOk()->assertJsonPath('data.status', 'submitted')->json('data');
        $this->postJson('/api/v1/cellular/inventory-documents/'.$document['id'].'/approve', ['version' => $document['version']])->assertForbidden();
        $this->authenticated('manager.cell@dashboard.test');
        $approved = $this->postJson('/api/v1/cellular/inventory-documents/'.$document['id'].'/approve', ['version' => $document['version']])->assertOk()->assertJsonPath('data.status', 'approved')->json('data');
        $this->assertDatabaseHas('cel_stock_balances', ['product_id' => $fixture['product'], 'outlet_id' => $fixture['outlet'], 'quantity' => 5]);
        $this->assertDatabaseHas('cel_stock_movements', ['inventory_document_id' => $document['id'], 'kind' => 'RECEIPT', 'quantity_delta' => 5]);
        $this->postJson('/api/v1/cellular/inventory-documents/'.$document['id'].'/approve', ['version' => $approved['version'] - 1])->assertStatus(409);
        $this->postJson('/api/v1/cellular/stock', ['product_id' => $fixture['product'], 'outlet_id' => $fixture['outlet'], 'quantity_delta' => 1, 'reference' => 'BYPASS', 'reason' => 'Percobaan melewati workflow'])->assertStatus(405);
    }

    public function test_correction_owner_edit_and_negative_stock_are_enforced(): void
    {
        $fixture = $this->fixture();
        $this->authenticated('admin-gudang.cell@dashboard.test');
        $receipt = $this->postJson('/api/v1/cellular/inventory-documents', $this->payload($fixture))->assertCreated()->json('data');
        $receipt = $this->postJson('/api/v1/cellular/inventory-documents/'.$receipt['id'].'/submit', ['version' => 1])->assertOk()->json('data');
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents/'.$receipt['id'].'/approve', ['version' => $receipt['version']])->assertOk();

        $this->authenticated('admin-gudang.cell@dashboard.test');
        $issuePayload = $this->payload($fixture, 'ISSUE', 8);
        $issuePayload['reference'] = 'KELUAR-DOC-001';
        $issue = $this->postJson('/api/v1/cellular/inventory-documents', $issuePayload)->assertCreated()->json('data');
        $issue = $this->postJson('/api/v1/cellular/inventory-documents/'.$issue['id'].'/submit', ['version' => 1])->assertOk()->json('data');
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents/'.$issue['id'].'/correction', ['version' => $issue['version'], 'note' => 'Jumlah keluar melebihi saldo tersedia.'])->assertOk()->assertJsonPath('data.status', 'correction');
        $this->authenticated('admin-gudang.cell@dashboard.test');
        $issuePayload['version'] = 3;
        $issuePayload['lines'][0]['quantity'] = 2;
        $updated = $this->putJson('/api/v1/cellular/inventory-documents/'.$issue['id'], $issuePayload)->assertOk()->json('data');
        $updated = $this->postJson('/api/v1/cellular/inventory-documents/'.$issue['id'].'/submit', ['version' => $updated['version']])->assertOk()->json('data');
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents/'.$issue['id'].'/approve', ['version' => $updated['version']])->assertOk();
        $this->assertDatabaseHas('cel_stock_balances', ['product_id' => $fixture['product'], 'quantity' => 3]);

        $this->authenticated('admin-gudang.cell@dashboard.test');
        $tooMuch = $this->payload($fixture, 'ISSUE', 9);
        $tooMuch['reference'] = 'KELUAR-DOC-002';
        $tooMuch = $this->postJson('/api/v1/cellular/inventory-documents', $tooMuch)->assertCreated()->json('data');
        $tooMuch = $this->postJson('/api/v1/cellular/inventory-documents/'.$tooMuch['id'].'/submit', ['version' => 1])->assertOk()->json('data');
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents/'.$tooMuch['id'].'/approve', ['version' => $tooMuch['version']])->assertStatus(409);
        $this->assertDatabaseHas('cel_stock_balances', ['product_id' => $fixture['product'], 'quantity' => 3]);

        $this->authenticated('admin-gudang.cell@dashboard.test');
        $stockCount = $this->payload($fixture, 'STOCK_COUNT');
        $stockCount['reference'] = 'OPNAME-DOC-001';
        $stockCount['lines'] = [['product_id' => $fixture['product'], 'counted_quantity' => 1]];
        $stockCount = $this->postJson('/api/v1/cellular/inventory-documents', $stockCount)->assertCreated()->json('data');
        $stockCount = $this->postJson('/api/v1/cellular/inventory-documents/'.$stockCount['id'].'/submit', ['version' => 1])->assertOk()->json('data');
        $this->authenticated('manager.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents/'.$stockCount['id'].'/approve', ['version' => $stockCount['version']])->assertOk();
        $this->assertDatabaseHas('cel_stock_balances', ['product_id' => $fixture['product'], 'quantity' => 1]);
        $this->assertDatabaseHas('cel_stock_movements', ['inventory_document_id' => $stockCount['id'], 'kind' => 'STOCK_COUNT', 'quantity_delta' => -2]);
    }

    public function test_roles_and_input_are_scoped(): void
    {
        $fixture = $this->fixture();
        $this->authenticated('leader.cell@dashboard.test')->getJson('/api/v1/cellular/inventory-documents?month='.substr($fixture['date'], 0, 7))->assertOk();
        $this->postJson('/api/v1/cellular/inventory-documents', $this->payload($fixture))->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/cellular/inventory-documents/catalog')->assertForbidden();
        $this->authenticated('admin-gudang.cell@dashboard.test')->postJson('/api/v1/cellular/inventory-documents', [...$this->payload($fixture), 'business_date' => now('Asia/Jakarta')->addDay()->toDateString()])->assertStatus(400);
    }
}
