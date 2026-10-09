<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AccountingInventoryTest extends TestCase
{
    private function admin(): static
    {
        User::where('email', 'admin.acc@dashboard.test')->update(['role' => 'ADMIN_GUDANG', 'division_code' => 'ACC']);
        return $this->authenticated('admin.acc@dashboard.test');
    }

    private function master(): array
    {
        $this->admin();
        $item=$this->postJson('/api/v1/accounting/inventory/items',['sku'=>'UAT-ITEM','name'=>'Barang UAT','unit'=>'Pcs','minimum_stock'=>'1'])->assertCreated()->json('data');
        $location=$this->postJson('/api/v1/accounting/inventory/locations',['code'=>'UAT-GDG','name'=>'Gudang UAT','kind'=>'WAREHOUSE'])->assertCreated()->json('data');
        return [$item,$location];
    }

    private function document(array $item, array $location, string $kind='RECEIPT', string $quantity='2.000'): array
    {
        return $this->postJson('/api/v1/accounting/inventory/documents',[
            'kind'=>$kind, 'source_location_id'=>$kind==='RECEIPT'?null:$location['id'], 'destination_location_id'=>$kind==='RECEIPT'?$location['id']:null,
            'business_date'=>now('Asia/Jakarta')->toDateString(), 'reference'=>'REF-'.$kind, 'notes'=>'Dokumen pengujian persediaan',
            'lines'=>[['item_id'=>$item['id'],'quantity'=>$quantity]],
        ])->assertCreated()->json('data');
    }

    public function test_maker_checker_posts_balance_and_blocks_stale_version(): void
    {
        [$item,$location]=$this->master(); $doc=$this->document($item,$location);
        $doc=$this->postJson('/api/v1/accounting/inventory/documents/'.$doc['id'].'/submit',['version'=>1])->assertOk()->assertJsonPath('data.status','submitted')->json('data');
        $this->postJson('/api/v1/accounting/inventory/documents/'.$doc['id'].'/approve',['version'=>$doc['version']])->assertForbidden();
        $approved=$this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/inventory/documents/'.$doc['id'].'/approve',['version'=>$doc['version']])->assertOk()->assertJsonPath('data.status','approved')->json('data');
        $this->assertDatabaseHas('acc_inventory_balances',['item_id'=>$item['id'],'location_id'=>$location['id'],'quantity'=>'2.000']);
        $this->assertDatabaseCount('acc_inventory_movements',1);
        $this->postJson('/api/v1/accounting/inventory/documents/'.$doc['id'].'/approve',['version'=>$approved['version']-1])->assertStatus(409);
    }

    public function test_correction_can_be_edited_by_owner_and_negative_stock_rolls_back(): void
    {
        [$item,$location]=$this->master(); $receipt=$this->document($item,$location);
        $receipt=$this->postJson('/api/v1/accounting/inventory/documents/'.$receipt['id'].'/submit',['version'=>1])->assertOk()->json('data');
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/inventory/documents/'.$receipt['id'].'/approve',['version'=>$receipt['version']])->assertOk();
        $this->admin(); $issue=$this->document($item,$location,'ISSUE','3.000');
        $issue=$this->postJson('/api/v1/accounting/inventory/documents/'.$issue['id'].'/submit',['version'=>1])->assertOk()->json('data');
        $issue=$this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/inventory/documents/'.$issue['id'].'/correction',['version'=>$issue['version'],'note'=>'Jumlah melebihi saldo yang tersedia'])->assertOk()->assertJsonPath('data.status','correction')->json('data');
        $this->admin()->putJson('/api/v1/accounting/inventory/documents/'.$issue['id'],[
            'version'=>$issue['version'],'kind'=>'ISSUE','source_location_id'=>$location['id'],'business_date'=>now('Asia/Jakarta')->toDateString(),
            'reference'=>'REF-ISSUE-CORRECTED','notes'=>'Jumlah sudah disesuaikan','lines'=>[['item_id'=>$item['id'],'quantity'=>'1.000']],
        ])->assertOk()->assertJsonPath('data.version',4)->assertJsonPath('data.review_note',null);
        $tooMuch=$this->document($item,$location,'ISSUE','3.000');
        $tooMuch=$this->postJson('/api/v1/accounting/inventory/documents/'.$tooMuch['id'].'/submit',['version'=>1])->assertOk()->json('data');
        $before=DB::table('acc_inventory_movements')->count();
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/inventory/documents/'.$tooMuch['id'].'/approve',['version'=>$tooMuch['version']])->assertStatus(409);
        $this->assertSame($before,DB::table('acc_inventory_movements')->count());
        $this->assertDatabaseHas('acc_inventory_balances',['item_id'=>$item['id'],'quantity'=>'2.000']);
    }

    public function test_scope_and_role_boundaries(): void
    {
        [$item,$location]=$this->master();
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/accounting/inventory/catalog')->assertForbidden();
        $this->authenticated('accounting@dashboard.test')->getJson('/api/v1/accounting/inventory/catalog')->assertOk();
        $this->postJson('/api/v1/accounting/inventory/documents',['kind'=>'RECEIPT'])->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/inventory/items',['sku'=>'DENIED'])->assertForbidden();
        $this->assertDatabaseHas('acc_inventory_items',['id'=>$item['id']]);
        $this->assertDatabaseHas('acc_inventory_locations',['id'=>$location['id']]);
    }
}
