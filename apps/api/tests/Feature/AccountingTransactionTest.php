<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingAccountOutlet;
use App\Models\AccountingCategory;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use App\Models\Outlet;
use Database\Seeders\AccMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingTransactionTest extends TestCase
{
    use RefreshDatabase;

    protected AccountingPeriod $draftPeriod;

    protected AccountingPeriod $approvedPeriod;

    protected AccountingCategory $categoryB;

    protected AccountingCategory $categoryC25;

    protected AccountingAccount $accountBank;

    protected Outlet $outletA;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->seed(AccMasterSeeder::class);

        $acc = Division::where('code', 'ACC')->first();

        $this->outletA = Outlet::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'code' => 'OUT-TEST',
            'name' => 'Outlet Test Pusat',
            'is_active' => true,
        ]);

        $this->draftPeriod = AccountingPeriod::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_month' => '2026-08-01',
            'status' => 'draft',
            'version' => 1,
        ]);

        $this->approvedPeriod = AccountingPeriod::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_month' => '2026-07-01',
            'status' => 'approved',
            'version' => 1,
        ]);

        $this->categoryB = AccountingCategory::where('code', 'B1')->first();
        $this->categoryC25 = AccountingCategory::where('code', 'C25')->first();
        $this->accountBank = AccountingAccount::where('code', 'ACC-1001')->first();
        AccountingAccountOutlet::create([
            'division_id' => $acc->id,
            'account_id' => $this->accountBank->id,
            'outlet_id' => $this->outletA->id,
        ]);
    }

    public function test_admin_can_create_valid_debit_transaction()
    {
        $payload = [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-05',
            'description' => 'Penerimaan modal awal kas',
            'reference_no' => 'REF-001',
            'debit_amount' => 5000000,
            'credit_amount' => 0,
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payload);

        $response->assertStatus(201);
        $this->assertEquals('5000000.00', $response->json('data.debitAmount'));
        $this->assertEquals('0.00', $response->json('data.creditAmount'));
        $this->assertEquals('Penerimaan modal awal kas', $response->json('data.description'));

        $this->assertDatabaseHas('accounting_transactions', [
            'period_id' => $this->draftPeriod->id,
            'debit_amount' => 5000000,
            'credit_amount' => 0,
        ]);
    }

    public function test_transaction_creation_fails_if_both_debit_and_credit_are_provided()
    {
        $payload = [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-05',
            'description' => 'Transaksi invalid dua sisi',
            'debit_amount' => 1000000,
            'credit_amount' => 500000,
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payload);

        $response->assertStatus(422);
        $this->assertEquals('VALIDATION_ERROR', $response->json('error.code'));
    }

    public function test_transaction_creation_fails_if_both_debit_and_credit_are_zero()
    {
        $payload = [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-05',
            'description' => 'Transaksi nominal nol',
            'debit_amount' => 0,
            'credit_amount' => 0,
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payload);

        $response->assertStatus(422);
        $this->assertEquals('VALIDATION_ERROR', $response->json('error.code'));
    }

    public function test_transaction_creation_fails_if_period_is_locked()
    {
        $payload = [
            'period_id' => $this->approvedPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-07-15',
            'description' => 'Percobaan transaksi di periode terkunci',
            'debit_amount' => 200000,
            'credit_amount' => 0,
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payload);

        $response->assertStatus(422);
        $this->assertEquals('PERIOD_LOCKED', $response->json('error.code'));
    }

    public function test_transaction_requires_outlet_when_category_demands_it()
    {
        $payloadWithoutOutlet = [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryC25->id,
            'transaction_date' => '2026-08-10',
            'description' => 'Biaya outlet tanpa outlet',
            'debit_amount' => 0,
            'credit_amount' => 350000,
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payloadWithoutOutlet);

        $response->assertStatus(422);
        $this->assertEquals('VALIDATION_ERROR', $response->json('error.code'));

        $payloadWithOutlet = array_merge($payloadWithoutOutlet, ['outlet_id' => $this->outletA->id]);

        $successResponse = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', $payloadWithOutlet);

        $successResponse->assertStatus(201);
        $this->assertEquals($this->outletA->id, $successResponse->json('data.outletId'));
    }

    public function test_soft_cancel_transaction_updates_audit_and_excludes_from_active_list()
    {
        $acc = Division::where('code', 'ACC')->first();
        $tx = AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-12',
            'description' => 'Transaksi untuk dibatalkan',
            'debit_amount' => 750000,
            'credit_amount' => 0,
            'is_draft' => false,
            'version' => 1,
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions/'.$tx->id.'/cancel', [
                'cancellation_reason' => 'Salah input rekening bank',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Salah input rekening bank', $response->json('data.cancellationReason'));

        $this->assertDatabaseHas('accounting_transactions', [
            'id' => $tx->id,
            'cancellation_reason' => 'Salah input rekening bank',
        ]);

        $listResponse = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/transactions?period_id='.$this->draftPeriod->id);

        $listResponse->assertStatus(200);
        $this->assertCount(0, $listResponse->json('data'));

        $allResponse = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/transactions?period_id='.$this->draftPeriod->id.'&include_cancelled=true');

        $allResponse->assertStatus(200);
        $this->assertCount(1, $allResponse->json('data'));
    }

    public function test_running_balance_is_calculated_deterministically()
    {
        $acc = Division::where('code', 'ACC')->first();

        AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-01',
            'description' => 'Saldo Awal',
            'debit_amount' => 10000000,
            'credit_amount' => 0,
            'version' => 1,
        ]);

        AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-02',
            'description' => 'Biaya Operasional',
            'debit_amount' => 0,
            'credit_amount' => 3000000,
            'version' => 1,
        ]);

        AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-03',
            'description' => 'Penerimaan Pendapatan',
            'debit_amount' => 1500000,
            'credit_amount' => 0,
            'version' => 1,
        ]);

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/transactions?period_id='.$this->draftPeriod->id);

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals('10000000.00', $data[0]['runningBalance']);
        $this->assertEquals('7000000.00', $data[1]['runningBalance']);
        $this->assertEquals('8500000.00', $data[2]['runningBalance']);
    }

    public function test_attachment_upload_and_download()
    {
        $acc = Division::where('code', 'ACC')->first();

        $tx = AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-05',
            'description' => 'Transaksi dengan bukti nota',
            'debit_amount' => 500000,
            'credit_amount' => 0,
            'version' => 1,
        ]);

        $file = UploadedFile::fake()->create('nota_bca.pdf', 500, 'application/pdf');

        $uploadResponse = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions/'.$tx->id.'/attachments', [
                'file' => $file,
            ]);

        $uploadResponse->assertStatus(201);
        $this->assertEquals('nota_bca.pdf', $uploadResponse->json('data.fileName'));

        $attachmentId = $uploadResponse->json('data.id');

        $downloadResponse = $this->authenticated('admin.acc@dashboard.test')
            ->get('/api/v1/accounting/transactions/'.$tx->id.'/attachments/'.$attachmentId.'/download');

        $downloadResponse->assertStatus(200);
        $downloadResponse->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_bod_is_forbidden_from_accessing_transactions()
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/transactions');

        $response->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $response->json('error.code'));
    }

    public function test_cross_division_user_is_rejected()
    {
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/accounting/transactions');

        $response->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $response->json('error.code'));
    }

    public function test_transaction_summary_and_validation_status()
    {
        $acc = Division::where('code', 'ACC')->first();

        $tx = AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-01',
            'description' => 'Transaksi tanpa bukti',
            'debit_amount' => 2000000,
            'credit_amount' => 0,
            'version' => 1,
        ]);

        $summaryRes = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/transactions/summary?period_id='.$this->draftPeriod->id);

        $summaryRes->assertStatus(200);
        $this->assertEquals('2000000.00', $summaryRes->json('data.totalDebit'));
        $this->assertEquals(1, $summaryRes->json('data.missingAttachmentCount'));
        $this->assertFalse($summaryRes->json('data.isReadyForSubmission'));

        // Upload attachment
        $file = UploadedFile::fake()->create('nota.pdf', 200, 'application/pdf');
        $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions/'.$tx->id.'/attachments', ['file' => $file]);

        $summaryRes2 = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/transactions/summary?period_id='.$this->draftPeriod->id);

        $this->assertEquals(0, $summaryRes2->json('data.missingAttachmentCount'));
        $this->assertTrue($summaryRes2->json('data.isReadyForSubmission'));
    }

    public function test_create_is_idempotent_and_rejects_fractional_rupiah(): void
    {
        $payload = [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-20',
            'description' => 'Idempotent create',
            'debit_amount' => 125000,
            'credit_amount' => 0,
        ];

        $first = $this->authenticated('admin.acc@dashboard.test')
            ->withHeader('Idempotency-Key', 'issue-7-create-1')
            ->postJson('/api/v1/accounting/transactions', $payload);
        $second = $this->authenticated('admin.acc@dashboard.test')
            ->withHeader('Idempotency-Key', 'issue-7-create-1')
            ->postJson('/api/v1/accounting/transactions', $payload);

        $first->assertCreated();
        $second->assertCreated();
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertDatabaseCount('accounting_transactions', 1);

        $this->authenticated('admin.acc@dashboard.test')
            ->withHeader('Idempotency-Key', 'issue-7-create-1')
            ->postJson('/api/v1/accounting/transactions', [...$payload, 'description' => 'Payload berbeda'])
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'IDEMPOTENCY_CONFLICT');

        $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [...$payload, 'debit_amount' => 12.5])
            ->assertStatus(400)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_update_detects_version_conflict_and_unlinked_outlet_is_rejected(): void
    {
        $transaction = AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => Division::where('code', 'ACC')->value('id'),
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-21',
            'description' => 'Optimistic lock',
            'debit_amount' => 1000,
            'credit_amount' => 0,
            'version' => 2,
        ]);

        $this->authenticated('admin.acc@dashboard.test')
            ->putJson('/api/v1/accounting/transactions/'.$transaction->id, ['description' => 'Stale', 'version' => 1])
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'VERSION_CONFLICT');

        $unlinked = Outlet::create([
            'id' => (string) Str::uuid(),
            'division_id' => Division::where('code', 'ACC')->value('id'),
            'code' => 'OUT-UNLINKED',
            'name' => 'Outlet tidak terhubung',
            'is_active' => true,
        ]);

        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/transactions', [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryC25->id,
            'outlet_id' => $unlinked->id,
            'transaction_date' => '2026-08-22',
            'description' => 'IDOR outlet-account',
            'debit_amount' => 1000,
            'credit_amount' => 0,
        ])->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_create_rolls_back_atomically_when_audit_write_fails(): void
    {
        Schema::drop('accounting_master_history');

        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/transactions', [
            'period_id' => $this->draftPeriod->id,
            'account_id' => $this->accountBank->id,
            'category_id' => $this->categoryB->id,
            'transaction_date' => '2026-08-23',
            'description' => 'Harus rollback',
            'debit_amount' => 1000,
            'credit_amount' => 0,
        ])->assertStatus(500);

        $this->assertDatabaseCount('accounting_transactions', 0);
    }
}
