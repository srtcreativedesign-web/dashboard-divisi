<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LegacyEndpointBoundaryTest extends TestCase
{
    public static function endpoints(): array
    {
        return [
            ['GET', '/revenue/daily'], ['POST', '/revenue/daily'], ['GET', '/revenue/mtd'],
            ['GET', '/revenue/tenants'], ['POST', '/revenue/batch-upload'],
            ['GET', '/targets/current-month'], ['GET', '/targets/run-rate'], ['POST', '/targets/tenant'],
            ['POST', '/targets/legacy/approve'], ['POST', '/targets/legacy/return'],
            ['GET', '/budgeting/cashflow'], ['GET', '/budgeting/pnl'],
            ['GET', '/reports/transactions'], ['GET', '/reports/reconciliation'],
            ['GET', '/sobathr/status'], ['POST', '/sobathr/sync-tenants'],
        ];
    }

    #[DataProvider('endpoints')]
    public function test_retired_endpoint_is_unavailable_even_to_bod(string $method, string $path): void
    {
        $this->authenticated('bod1@dashboard.test')->json($method, '/api/v1'.$path, [])
            ->assertStatus(404)->assertJsonPath('error.code', 'RESOURCE_NOT_FOUND');
    }
}
