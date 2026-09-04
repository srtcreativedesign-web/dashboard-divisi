<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\DivisionConfig;
use App\Models\Outlet;
use App\Models\User;
use App\Models\UserScope;
use App\Services\AuditService;
use App\Services\PolicyService;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

class AccountingFoundationTest extends TestCase
{
    public const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    public function test_acc_division_and_seed_is_canonical_and_idempotent(): void
    {
        // 1. Verifikasi divisi ACC adalah divisi ke-8
        $acc = Division::where('code', 'ACC')->first();
        $this->assertNotNull($acc);
        $this->assertEquals('Accounting', $acc->name);
        $this->assertEquals(8, $acc->sort_order);
        $this->assertTrue($acc->is_active);

        // 2. Verifikasi 7 divisi existing tetap utuh dan FIN tetap Finance
        $this->assertCount(8, Division::all());
        $fin = Division::where('code', 'FIN')->first();
        $this->assertNotNull($fin);
        $this->assertEquals('Finance', $fin->name);
        $this->assertEquals(6, $fin->sort_order);

        $expectedCodes = ['WRAP', 'CELL', 'REFL', 'MINI', 'FNB', 'FIN', 'MC', 'ACC'];
        $actualCodes = Division::orderBy('sort_order')->pluck('code')->all();
        $this->assertEquals($expectedCodes, $actualCodes);

        // 3. Verifikasi seed user anonim ACC
        $mgrAcc = User::where('email', 'manager.acc@dashboard.test')->first();
        $this->assertNotNull($mgrAcc);
        $this->assertEquals('Manager Accounting', $mgrAcc->name);
        $this->assertEquals('MANAGER', $mgrAcc->role);
        $this->assertEquals('ACC', $mgrAcc->division_code);

        $admAcc = User::where('email', 'admin.acc@dashboard.test')->first();
        $this->assertNotNull($admAcc);
        $this->assertEquals('Admin Accounting', $admAcc->name);
        $this->assertEquals('ADMIN', $admAcc->role);
        $this->assertEquals('ACC', $admAcc->division_code);

        // Verifikasi outlet anonim ACC
        $outletAcc = Outlet::where('code', 'ACC-001')->first();
        $this->assertNotNull($outletAcc);
        $this->assertEquals('Accounting Pusat (Anonim)', $outletAcc->name);
        $this->assertEquals($acc->id, $outletAcc->division_id);

        // Verifikasi user scopes
        $this->assertTrue(UserScope::where('user_id', $mgrAcc->id)->where('division_id', $acc->id)->exists());
        $this->assertTrue(UserScope::where('user_id', $admAcc->id)->where('division_id', $acc->id)->exists());

        // 4. Uji idempotency seeder: jalankan seeder ulang tidak menggandakan data
        $seeder = new DatabaseSeeder();
        $seeder->run();
        $seeder->run();

        $this->assertCount(8, Division::all());
        $this->assertEquals(1, Division::where('code', 'ACC')->count());
        $this->assertEquals(1, User::where('email', 'manager.acc@dashboard.test')->count());
        $this->assertEquals(1, User::where('email', 'admin.acc@dashboard.test')->count());
        $this->assertEquals(1, Outlet::where('code', 'ACC-001')->count());
        $this->assertEquals(1, DivisionConfig::where('division_id', $acc->id)->count());
        $this->assertEquals(1, UserScope::where('user_id', $mgrAcc->id)->where('division_id', $acc->id)->count());
    }

    public function test_admin_acc_capabilities_and_scope(): void
    {
        $policy = app(PolicyService::class);
        $adminAcc = ['role' => 'ADMIN', 'division_code' => 'ACC', 'divisionCode' => 'ACC'];

        // Capability positif Admin ACC
        $this->assertTrue($policy->hasCapability($adminAcc, 'view:division'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'view:acc_report'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'view:acc_journal'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'view:acc_master'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'write:acc_transaction'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'import:acc_transaction'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'write:acc_outstanding'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'write:acc_bank'));
        $this->assertTrue($policy->hasCapability($adminAcc, 'submit:acc_period'));

        // Admin ACC tidak memiliki wewenang approval atau manajemen periode (segregation of duties)
        $this->assertFalse($policy->hasCapability($adminAcc, 'approve:acc_period'));
        $this->assertFalse($policy->hasCapability($adminAcc, 'manage:acc_period'));
        $this->assertFalse($policy->hasCapability($adminAcc, 'manage:acc_master'));
        // Admin ACC tidak memiliki akses modul revenue retail
        $this->assertFalse($policy->hasCapability($adminAcc, 'write:revenue'));

        // Uji HTTP: Admin ACC sukses membuat transaksi
        $response = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [
                'date' => '2026-09-04',
                'amount' => 5000000,
                'type' => 'DEBIT',
                'description' => 'Penerimaan dana operasional',
                'referenceNo' => 'REF-20260904-001',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('RECORDED', $response->json('data.status'));
        $this->assertEquals('ACC', $response->json('data.divisionCode'));

        // Uji HTTP: Admin ACC ditolak saat mencoba approve periode (403 FORBIDDEN_CAPABILITY)
        $denyRes = $this->authenticated('admin.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods/approve', [
                'period' => '2026-08',
                'action' => 'APPROVE',
            ]);

        $denyRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $denyRes->json('error.code'));
    }

    public function test_manager_acc_capabilities_and_scope(): void
    {
        $policy = app(PolicyService::class);
        $managerAcc = ['role' => 'MANAGER', 'division_code' => 'ACC', 'divisionCode' => 'ACC'];

        // Capability positif Manager ACC
        $this->assertTrue($policy->hasCapability($managerAcc, 'view:division'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'manage:division'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'view:acc_report'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'view:acc_journal'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'view:acc_master'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'manage:acc_master'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'manage:acc_period'));
        $this->assertTrue($policy->hasCapability($managerAcc, 'approve:acc_period'));

        // Manager ACC tidak melakukan input transaksi langsung (segregation of duties)
        $this->assertFalse($policy->hasCapability($managerAcc, 'write:acc_transaction'));
        $this->assertFalse($policy->hasCapability($managerAcc, 'import:acc_transaction'));
        $this->assertFalse($policy->hasCapability($managerAcc, 'submit:acc_period'));

        // Uji HTTP: Manager ACC sukses menyetujui periode
        $response = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/periods/approve', [
                'period' => '2026-08',
                'action' => 'APPROVE',
                'notes' => 'Periode Agustus 2026 disetujui setelah rekonsiliasi',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('Disetujui', $response->json('data.status'));
        $this->assertEquals('2026-08', $response->json('data.period'));

        // Uji HTTP: Manager ACC ditolak saat mencoba mutasi transaksi (403 FORBIDDEN_CAPABILITY)
        $denyRes = $this->authenticated('manager.acc@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [
                'date' => '2026-09-04',
                'amount' => 1000000,
                'type' => 'CREDIT',
                'description' => 'Biaya listrik',
            ]);

        $denyRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $denyRes->json('error.code'));
    }

    public function test_bod_acc_capabilities_read_only_and_mutation_denied(): void
    {
        $policy = app(PolicyService::class);
        $bodUser = ['role' => 'BOD', 'division_code' => null, 'divisionCode' => null];

        // BOD hanya memiliki capability baca laporan ACC
        $this->assertTrue($policy->hasCapability($bodUser, 'view:acc_report'));

        // Seluruh capability mutasi, master, dan approval Accounting ditolak untuk BOD
        $this->assertFalse($policy->hasCapability($bodUser, 'write:acc_transaction'));
        $this->assertFalse($policy->hasCapability($bodUser, 'import:acc_transaction'));
        $this->assertFalse($policy->hasCapability($bodUser, 'write:acc_outstanding'));
        $this->assertFalse($policy->hasCapability($bodUser, 'write:acc_bank'));
        $this->assertFalse($policy->hasCapability($bodUser, 'submit:acc_period'));
        $this->assertFalse($policy->hasCapability($bodUser, 'approve:acc_period'));
        $this->assertFalse($policy->hasCapability($bodUser, 'manage:acc_period'));
        $this->assertFalse($policy->hasCapability($bodUser, 'manage:acc_master'));

        // Uji HTTP: BOD sukses membaca laporan ACC yang disetujui / ditutup
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/reports');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $rep) {
            $this->assertContains($rep['status'], ['Disetujui', 'Ditutup']);
        }

        // Uji HTTP: BOD ditolak saat mencoba mengakses laporan berstatus Draft
        $denyDraftRes = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/accounting/reports?status=Draft');

        $denyDraftRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $denyDraftRes->json('error.code'));

        // Uji HTTP: BOD ditolak saat mencoba mutasi transaksi (403 FORBIDDEN_CAPABILITY)
        $denyMutasiRes = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [
                'date' => '2026-09-04',
                'amount' => 1000000,
                'type' => 'DEBIT',
                'description' => 'Upaya mutasi oleh BOD',
            ]);

        $denyMutasiRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $denyMutasiRes->json('error.code'));

        // Uji HTTP: BOD ditolak saat mencoba approve periode Accounting (403 FORBIDDEN_CAPABILITY)
        $denyApproveRes = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/accounting/periods/approve', [
                'period' => '2026-08',
                'action' => 'APPROVE',
            ]);

        $denyApproveRes->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $denyApproveRes->json('error.code'));
    }

    public function test_cross_division_access_denied_with_scope_violation_and_audited(): void
    {
        AuditService::clearMemory();

        // Manager WRAP mencoba akses status Accounting
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/accounting/status');

        $response->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $response->json('error.code'));

        // Admin CELL mencoba membuat transaksi di Accounting
        $txRes = $this->authenticated('admin.cell@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [
                'date' => '2026-09-04',
                'amount' => 500000,
                'type' => 'DEBIT',
                'description' => 'Upaya lintas divisi',
            ]);

        $txRes->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $txRes->json('error.code'));

        // Verifikasi audit log tersanitasi mencatat penolakan scope
        $logs = AuditService::getMemoryLogs();
        $this->assertNotEmpty($logs);
        $scopeViolation = collect($logs)->firstWhere('action', 'policy.scope_violation');
        $this->assertNotNull($scopeViolation);
        $this->assertEquals('Division', $scopeViolation['entity']);
        $this->assertEquals('ACC', $scopeViolation['division_code']);
    }

    public function test_anonymous_and_no_capability_users_rejected(): void
    {
        // 1. Anonymous ditolak 401 AUTH_REQUIRED
        $anonStatus = $this->getJson('/api/v1/accounting/status');
        $anonStatus->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $anonStatus->json('error.code'));

        $anonReports = $this->getJson('/api/v1/accounting/reports');
        $anonReports->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $anonReports->json('error.code'));

        // 2. User tanpa capability (role USER) dalam divisi ACC ditolak 403 FORBIDDEN_CAPABILITY
        $acc = Division::where('code', 'ACC')->first();
        $userNoCap = User::create([
            'email' => 'user.nocap@dashboard.test',
            'name' => 'User No Cap',
            'role' => 'USER',
            'division_code' => 'ACC',
            'password_hash' => 'hash',
            'is_active' => true,
        ]);
        UserScope::create(['user_id' => $userNoCap->id, 'division_id' => $acc->id]);

        $noCapReports = $this->authenticated('user.nocap@dashboard.test')
            ->getJson('/api/v1/accounting/reports');
        $noCapReports->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $noCapReports->json('error.code'));

        $noCapTx = $this->authenticated('user.nocap@dashboard.test')
            ->postJson('/api/v1/accounting/transactions', [
                'date' => '2026-09-04',
                'amount' => 10000,
                'type' => 'DEBIT',
                'description' => 'Unauthorized transaction attempt',
            ]);
        $noCapTx->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $noCapTx->json('error.code'));
    }

    public function test_api_contract_envelope_and_sanitization(): void
    {
        // 1. Kontrak respon sukses
        $response = $this->authenticated('admin.acc@dashboard.test')
            ->getJson('/api/v1/accounting/status');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'divisionCode',
                'divisionName',
                'status',
                'phase',
                'enabledModules',
                'enabledKpis',
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $traceId = $response->json('meta.trace_id');
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, $traceId);
        $this->assertEquals('/api/v1/accounting/status', $response->json('links.self'));

        // 2. Kontrak respon error
        $errorRes = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/accounting/status');

        $errorRes->assertStatus(403);
        $errorRes->assertJsonStructure([
            'error' => [
                'code',
                'message',
                'trace_id',
            ],
        ]);
        $this->assertEquals('SCOPE_VIOLATION', $errorRes->json('error.code'));
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, $errorRes->json('error.trace_id'));

        // 3. Verifikasi sanitasi: tidak ada kebocoran stack trace, password, atau credential
        $bodyString = $errorRes->getContent();
        $this->assertStringNotContainsString('password', strtolower($bodyString));
        $this->assertStringNotContainsString('trace#', strtolower($bodyString));
        $this->assertStringNotContainsString('exception in', strtolower($bodyString));
    }
}
