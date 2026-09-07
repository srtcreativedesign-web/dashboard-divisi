<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    public const UUID_PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    public const SECRET_MARKER = 'RAHASIA_DB_TIDAK_BOLEH_BOCOR';

    public function test_health_returns_success_envelope_matching_contract(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);

        $traceId = $response->headers->get('X-Trace-Id');
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, (string) $traceId);

        $response->assertJsonStructure([
            'data' => ['status', 'service'],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $json = $response->json();
        $this->assertEquals(['status' => 'ok', 'service' => 'dashboard-divisi-api'], $json['data']);
        $this->assertEquals($traceId, $json['meta']['trace_id']);
        $this->assertEquals('/api/v1/health', $json['links']['self']);
    }

    public function test_header_x_trace_id_matches_meta_trace_id(): void
    {
        $response = $this->getJson('/api/v1/health');
        $this->assertEquals($response->headers->get('X-Trace-Id'), $response->json('meta.trace_id'));
    }

    public function test_unknown_route_returns_resource_not_found_error_envelope(): void
    {
        $response = $this->getJson('/api/v1/pasti-tidak-ada-route-ini');

        $response->assertStatus(404);
        $response->assertJsonStructure([
            'error' => ['code', 'message', 'trace_id'],
        ]);

        $this->assertEquals('RESOURCE_NOT_FOUND', $response->json('error.code'));
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, (string) $response->json('error.trace_id'));
    }

    public function test_unexpected_error_returns_generic_internal_error_without_leaking_secrets(): void
    {
        Route::get('/api/v1/boom-test', function () {
            throw new \RuntimeException('koneksi gagal: '.ApiContractTest::SECRET_MARKER);
        });

        $response = $this->getJson('/api/v1/boom-test');

        $response->assertStatus(500);
        $this->assertEquals('INTERNAL_ERROR', $response->json('error.code'));
        $this->assertEquals('Terjadi kesalahan internal. Silakan coba lagi.', $response->json('error.message'));
        $this->assertStringNotContainsString(self::SECRET_MARKER, (string) $response->getContent());
        $this->assertMatchesRegularExpression(self::UUID_PATTERN, (string) $response->json('error.trace_id'));
    }
}
