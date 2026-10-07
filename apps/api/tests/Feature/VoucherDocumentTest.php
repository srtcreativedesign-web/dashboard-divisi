<?php

namespace Tests\Feature;

use App\Models\Accounting\Voucher;
use App\Models\Outlet;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class VoucherDocumentTest extends TestCase
{
    private function payload(): array
    {
        return ['type' => 'OPERATIONAL', 'outlet_id' => Outlet::where('code', 'CELL-001')->firstOrFail()->id,
            'voucher_date' => now('Asia/Jakarta')->toDateString(), 'due_date' => now('Asia/Jakarta')->toDateString(),
            'entity_name' => 'Penerima anonim', 'source_reference' => 'REQ-DOC-001', 'amount' => '360000.25',
            'description' => 'Pembelian perlengkapan outlet anonim', 'company_name' => 'Perusahaan Uji',
            'priority' => 'URGENT', 'payment_method' => 'BANK', 'bank_name' => 'Bank uji',
            'bank_account_holder' => 'Penerima anonim', 'bank_account' => '123456789012',
            'invoice_number' => 'INV-UJI', 'invoice_date' => now('Asia/Jakarta')->toDateString(),
            'billing_period' => now('Asia/Jakarta')->format('Y-m'), 'delivery_reference' => 'SJ-UJI'];
    }

    public function test_document_fields_persist_and_bank_is_encrypted_and_not_in_history_or_list(): void
    {
        $record = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload())->assertCreated()->json('data');
        $this->assertSame('360000.25', $record['amount']);
        $this->assertSame('OPERATIONAL', $record['type']);
        $this->assertSame('123456789012', $record['bank_account']);
        $this->assertSame('••••9012', $record['bank_account_masked']);
        $this->assertArrayNotHasKey('bank_account', $record['events'][0]['metadata']['snapshot']);
        $this->assertNotSame('123456789012', DB::table('acc_vouchers')->where('id', $record['id'])->value('bank_account'));
        foreach (['accounting@dashboard.test', 'manager.acc@dashboard.test', 'bod1@dashboard.test'] as $reader) {
            $detail = $this->authenticated($reader)->getJson('/api/v1/accounting/vouchers/'.$record['id'])->assertOk()->json('data');
            $this->assertArrayNotHasKey('bank_account', $detail);
        }
        $finance = $this->authenticated('finance@dashboard.test')->getJson('/api/v1/accounting/vouchers/'.$record['id'])->assertOk()->json('data');
        $this->assertSame('123456789012', $finance['bank_account']);
        $list = $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/accounting/vouchers?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk()->json('data.items.0');
        $this->assertArrayNotHasKey('bank_account', $list);
    }

    public function test_bank_requires_details_and_cash_clears_previous_account(): void
    {
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', array_replace($this->payload(), ['bank_account' => '']))->assertStatus(400);
        $record = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', $this->payload())->assertCreated()->json('data');
        $updated = $this->authenticated('admin.acc@dashboard.test')->putJson('/api/v1/accounting/vouchers/'.$record['id'], array_replace($this->payload(), ['payment_method' => 'CASH', 'version' => 1]))->assertOk()->json('data');
        $this->assertNull($updated['bank_account']);
        $this->assertNull(Voucher::findOrFail($record['id'])->bank_account);
    }
}
