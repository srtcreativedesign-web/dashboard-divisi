<?php

namespace Tests\Feature;

use App\Models\AccountingAccount;
use App\Models\AccountingCategory;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use Database\Seeders\AccMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountingImportTest extends TestCase
{
    use RefreshDatabase;

    protected AccountingPeriod $period;

    protected AccountingAccount $account;

    protected AccountingCategory $categoryB2a;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(AccMasterSeeder::class);

        $acc = Division::where('code', 'ACC')->first();

        $this->period = AccountingPeriod::create([
            'id' => (string) Str::uuid(),
            'division_id' => $acc->id,
            'period_month' => '2026-08-01',
            'status' => 'draft',
            'version' => 1,
        ]);

        $this->account = AccountingAccount::where('code', 'ACC-1001')->first();
        $this->categoryB2a = AccountingCategory::where('code', 'B2a')->first()
            ?? AccountingCategory::first();
    }

    public function test_preview_canonicalizes_alias_category_code_2a_to_b2a()
    {
        $payload = [
            'period_id' => $this->period->id,
            'rows' => [
                [
                    'tanggal' => '2026-08-01',
                    'ref' => 'REF-IMP-01',
                    'rekening' => $this->account->code,
                    'kategori' => '2a', // Should normalize to B2a
                    'debit' => 15000000,
                    'kredit' => 0,
                    'keterangan' => 'Penerimaan omset store',
                ],
            ],
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/import/preview', $payload);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'summary' => ['total_rows', 'valid_rows', 'error_rows', 'can_commit'],
                'rows',
            ],
        ]);

        $this->assertEquals(1, $response->json('data.summary.total_rows'));
        $this->assertEquals('B2a', $response->json('data.rows.0.category_code'));
    }

    public function test_preview_flags_unknown_category_as_error()
    {
        $payload = [
            'period_id' => $this->period->id,
            'rows' => [
                [
                    'tanggal' => '2026-08-01',
                    'ref' => 'REF-IMP-02',
                    'rekening' => $this->account->code,
                    'kategori' => 'ZZ_UNKNOWN_999', // Unknown category
                    'debit' => 5000000,
                    'kredit' => 0,
                    'keterangan' => 'Kategori siluman',
                ],
            ],
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/import/preview', $payload);

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('data.summary.error_rows'));
        $this->assertEquals('ERROR', $response->json('data.rows.0.status'));
        $this->assertFalse($response->json('data.summary.can_commit'));
    }

    public function test_preview_flags_duplicate_rows()
    {
        // Pre-create transaction in database
        AccountingTransaction::create([
            'id' => (string) Str::uuid(),
            'division_id' => $this->period->division_id,
            'period_id' => $this->period->id,
            'account_id' => $this->account->id,
            'category_id' => $this->categoryB2a->id,
            'transaction_date' => '2026-08-02',
            'reference_no' => 'DUP-100',
            'debit_amount' => 10000000,
            'credit_amount' => 0,
            'description' => 'Transaksi eksisting',
            'is_draft' => false,
        ]);

        $payload = [
            'period_id' => $this->period->id,
            'rows' => [
                [
                    'tanggal' => '2026-08-02',
                    'ref' => 'DUP-100',
                    'rekening' => $this->account->code,
                    'kategori' => $this->categoryB2a->code,
                    'debit' => 10000000,
                    'kredit' => 0,
                    'keterangan' => 'Transaksi duplicate upload',
                ],
            ],
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/import/preview', $payload);

        $response->assertStatus(200);
        $this->assertEquals('DUPLICATE', $response->json('data.rows.0.status'));
        $this->assertEquals(1, $response->json('data.summary.duplicate_candidates'));
    }

    public function test_commit_batch_inserts_transactions_atomically()
    {
        $payload = [
            'period_id' => $this->period->id,
            'rows' => [
                [
                    'status' => 'VALID',
                    'date' => '2026-08-10',
                    'category_id' => $this->categoryB2a->id,
                    'account_id' => $this->account->id,
                    'reference_no' => 'COMMIT-01',
                    'description' => 'Impor transaksi valid 1',
                    'debit' => 8000000,
                    'credit' => 0,
                ],
                [
                    'status' => 'VALID',
                    'date' => '2026-08-10',
                    'category_id' => $this->categoryB2a->id,
                    'account_id' => $this->account->id,
                    'reference_no' => 'COMMIT-02',
                    'description' => 'Impor transaksi valid 2',
                    'debit' => 12000000,
                    'credit' => 0,
                ],
            ],
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/import/commit', $payload);

        $response->assertStatus(201);
        $this->assertEquals(2, $response->json('data.inserted_count'));

        $this->assertDatabaseHas('accounting_transactions', [
            'reference_no' => 'COMMIT-01',
            'debit_amount' => 8000000,
        ]);
        $this->assertDatabaseHas('accounting_transactions', [
            'reference_no' => 'COMMIT-02',
            'debit_amount' => 12000000,
        ]);
    }

    public function test_commit_batch_fails_and_rolls_back_if_any_row_has_error()
    {
        $payload = [
            'period_id' => $this->period->id,
            'rows' => [
                [
                    'status' => 'VALID',
                    'date' => '2026-08-10',
                    'category_id' => $this->categoryB2a->id,
                    'account_id' => $this->account->id,
                    'reference_no' => 'ROLLBACK-01',
                    'debit' => 5000000,
                    'credit' => 0,
                ],
                [
                    'status' => 'ERROR',
                    'date' => '2026-08-10',
                    'errors' => ['Kategori tidak valid'],
                ],
            ],
        ];

        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/import/commit', $payload);

        $response->assertStatus(422);

        // Verify all-or-nothing rollback (ROLLBACK-01 must not be created)
        $this->assertDatabaseMissing('accounting_transactions', [
            'reference_no' => 'ROLLBACK-01',
        ]);
    }
}
