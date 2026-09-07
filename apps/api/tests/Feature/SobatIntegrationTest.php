<?php

namespace Tests\Feature;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SobatIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Default: integrasi Sobat belum dikonfigurasi
        Config::set('services.sobathr.base_url', null);
        Config::set('services.sobathr.api_key', null);
        Config::set('services.sobathr.company_id', null);
        Config::set('services.sobathr.timeout', 5);
    }

    public function test_unauthenticated_request_to_status_returns_401(): void
    {
        $response = $this->getJson('/api/v1/sobathr/status');

        $response->assertStatus(401);
        $response->assertJsonPath('error.code', 'AUTH_REQUIRED');
    }

    public function test_unauthenticated_request_to_sync_returns_401(): void
    {
        $response = $this->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertStatus(401);
        $response->assertJsonPath('error.code', 'AUTH_REQUIRED');
    }

    public function test_status_endpoint_returns_unconfigured_when_no_credentials(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/sobathr/status');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'provider',
                'configured',
                'status',
                'base_url',
                'has_api_key',
                'has_company_id',
                'last_sync',
                'scheduler',
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $data = $response->json('data');
        $this->assertFalse($data['configured']);
        $this->assertSame('UNCONFIGURED', $data['status']);
        $this->assertNull($data['base_url']);
        $this->assertFalse($data['has_api_key']);
        $this->assertFalse($data['has_company_id']);
        $this->assertNull($data['last_sync']);
        $this->assertNotSame('ONLINE', $data['status']);
        $this->assertNotSame('EVERY_HOUR_CRON', $data['scheduler']);
    }

    public function test_status_endpoint_does_not_leak_api_key_or_claim_fake_online_when_configured(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'super_secret_sobat_key_123');
        Config::set('services.sobathr.company_id', 'DIVISI_CMP_01');

        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/sobathr/status');

        $response->assertOk();
        $data = $response->json('data');

        $this->assertTrue($data['configured']);
        $this->assertSame('CONFIGURED', $data['status']);
        $this->assertSame('https://api.sobat.test/v1', $data['base_url']);
        $this->assertTrue($data['has_api_key']);
        $this->assertTrue($data['has_company_id']);
        $this->assertNull($data['last_sync']);
        $this->assertSame('MANUAL_ONLY', $data['scheduler']);

        // Pastikan API key rahasia TIDAK pernah bocor di response body
        $rawContent = (string) $response->getContent();
        $this->assertStringNotContainsString('super_secret_sobat_key_123', $rawContent);
    }

    public function test_sync_endpoint_fails_closed_when_unconfigured_without_fake_data(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'SOURCE_DATA_UNAVAILABLE');
        // Tidak mengembalikan data demo
        $this->assertNull($response->json('data'));
    }

    public function test_sync_endpoint_fails_with_validation_error_on_invalid_division_code(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', [
                'division_code' => 'INVALID_DIVISION',
            ]);

        $response->assertStatus(400);
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_sync_endpoint_forbidden_for_user_without_write_revenue_capability(): void
    {
        // pic.wrap has role USER which lacks write:revenue capability
        $response = $this->authenticated('pic.wrap@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', [
                'division_code' => 'WRAP',
            ]);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'FORBIDDEN_CAPABILITY');
    }

    public function test_sync_endpoint_rejects_cross_division_access_for_manager_with_scope_violation(): void
    {
        // manager.wrap attempts to sync CELL
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', [
                'division_code' => 'CELL',
            ]);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'SCOPE_VIOLATION');
    }

    public function test_sync_endpoint_succeeds_with_upstream_http_fake_and_normalizes_data(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'secret_token_abc');
        Config::set('services.sobathr.company_id', 'CMP_001');

        Http::fake([
            'https://api.sobat.test/v1/*' => Http::response([
                'data' => [
                    [
                        'id' => 'TNT-001',
                        'name' => 'Wrapping Master Outlet 1',
                        'division' => 'WRAP',
                        'category' => 'Wrapping',
                        'location' => 'Lantai 1 - A01',
                        'monthlyRevenue' => 125000000,
                        'monthlyTarget' => 100000000,
                        'status' => 'Over Target',
                        'growth' => 14.2,
                        'synced_at' => '2026-09-03T07:00:00Z',
                    ],
                    [
                        'id' => 'TNT-002',
                        'name' => 'Cellular Flagship Store',
                        'division' => 'CELL',
                        'category' => 'Cellular',
                        'location' => 'Lantai 1 - A05',
                        'monthlyRevenue' => 310000000,
                        'monthlyTarget' => 280000000,
                        'status' => 'Over Target',
                        'growth' => 11.1,
                        'synced_at' => '2026-09-03T07:00:00Z',
                    ],
                ],
            ], 200),
        ]);

        // BOD syncs all
        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'provider',
                'source',
                'total_tenants',
                'synced_at',
                'tenants' => [
                    '*' => [
                        'id',
                        'name',
                        'division',
                        'category',
                        'location',
                        'monthlyRevenue',
                        'monthlyTarget',
                        'status',
                        'growth',
                        'synced_at',
                    ],
                ],
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $data = $response->json('data');
        $this->assertSame(2, $data['total_tenants']);
        $this->assertSame('LIVE_SOBAT_API', $data['source']);
        $this->assertCount(2, $data['tenants']);

        // Verifikasi request HTTP terkirim dengan header yang benar
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Bearer secret_token_abc')
                && $request->hasHeader('X-Company-ID', 'CMP_001')
                && str_starts_with($request->url(), 'https://api.sobat.test/v1/');
        });
    }

    public function test_manager_sync_scopes_to_own_division(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'secret_token_abc');
        Config::set('services.sobathr.company_id', 'CMP_001');

        Http::fake([
            'https://api.sobat.test/v1/*' => Http::response([
                'data' => [
                    [
                        'id' => 'TNT-001',
                        'name' => 'Wrapping Outlet 1',
                        'division' => 'WRAP',
                        'monthlyRevenue' => 10000000,
                        'monthlyTarget' => 9000000,
                    ],
                    [
                        'id' => 'TNT-002',
                        'name' => 'Cellular Store',
                        'division' => 'CELL',
                        'monthlyRevenue' => 20000000,
                        'monthlyTarget' => 19000000,
                    ],
                ],
            ], 200),
        ]);

        // Manager WRAP syncs without explicit division_code
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertOk();
        $tenants = $response->json('data.tenants');
        // Hanya tenant divisi WRAP yang diikutsertakan
        $this->assertCount(1, $tenants);
        $this->assertSame('TNT-001', $tenants[0]['id']);
        $this->assertSame('WRAP', $tenants[0]['division']);
    }

    public function test_sync_endpoint_fails_closed_on_upstream_500_error_response(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'secret_token_abc');
        Config::set('services.sobathr.company_id', 'CMP_001');

        Http::fake([
            'https://api.sobat.test/v1/*' => Http::response([
                'error' => 'Internal Server Error on Sobat HR',
            ], 500),
        ]);

        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'SOURCE_DATA_UNAVAILABLE');
        $this->assertNull($response->json('data'));
    }

    public function test_sync_endpoint_fails_closed_on_upstream_timeout(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'secret_token_abc');
        Config::set('services.sobathr.company_id', 'CMP_001');

        Http::fake([
            'https://api.sobat.test/v1/*' => function () {
                throw new ConnectionException('Connection timed out');
            },
        ]);

        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'SOURCE_DATA_UNAVAILABLE');
        $this->assertNull($response->json('data'));
    }

    public function test_sync_endpoint_fails_closed_on_malformed_upstream_response(): void
    {
        Config::set('services.sobathr.base_url', 'https://api.sobat.test/v1');
        Config::set('services.sobathr.api_key', 'secret_token_abc');
        Config::set('services.sobathr.company_id', 'CMP_001');

        // Upstream mengembalikan response tanpa ID atau missing numeric target/revenue
        Http::fake([
            'https://api.sobat.test/v1/*' => Http::response([
                'data' => [
                    [
                        'id' => '',
                        'name' => 'Malformed Tenant',
                        'division' => 'WRAP',
                        'monthlyRevenue' => 'invalid_number',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->authenticated('bod1@dashboard.test')
            ->postJson('/api/v1/sobathr/sync-tenants', []);

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'SOURCE_DATA_UNAVAILABLE');
        $this->assertNull($response->json('data'));
    }
}
