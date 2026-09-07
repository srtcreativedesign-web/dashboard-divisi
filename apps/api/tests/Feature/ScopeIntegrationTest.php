<?php

namespace Tests\Feature;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\PolicyService;
use Tests\TestCase;

class ScopeIntegrationTest extends TestCase
{
    public function test_bod_has_unrestricted_division_scope_access(): void
    {
        $policy = app(PolicyService::class);
        $bod = ['role' => 'BOD', 'divisionCode' => null];

        $this->assertTrue($policy->canAccessDivision($bod, 'WRAP'));
        $this->assertTrue($policy->canAccessDivision($bod, 'CELL'));
        $this->assertTrue($policy->canAccessDivision($bod, 'MINI'));
        $this->assertTrue($policy->canAccessDivision($bod, 'MC'));
        $this->assertTrue($policy->canAccessDivision($bod, 'ACC'));

        // BOD can query outlets across all divisions (all real outlets from Sobat API + ACC)
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/org/outlets');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(58, count($response->json('data')));
        $this->assertContains('ACC-001', collect($response->json('data'))->pluck('code')->all());
        $this->assertContains('T3-A', collect($response->json('data'))->pluck('code')->all());
    }

    public function test_manager_and_admin_strict_1_to_1_division_scope(): void
    {
        $policy = app(PolicyService::class);
        $managerWrap = ['role' => 'MANAGER', 'divisionCode' => 'WRAP'];

        $this->assertTrue($policy->canAccessDivision($managerWrap, 'WRAP'));
        $this->assertFalse($policy->canAccessDivision($managerWrap, 'CELL'));
        $this->assertFalse($policy->canAccessDivision($managerWrap, 'MINI'));

        // Manager WRAP querying outlets for own division succeeds (sees real WRAP outlets)
        $ownRes = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/org/outlets?divisionCode=WRAP');
        $ownRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(19, count($ownRes->json('data')));
        $this->assertContains('T3-A', collect($ownRes->json('data'))->pluck('code')->all());
        $this->assertContains('T2D', collect($ownRes->json('data'))->pluck('code')->all());

        // Manager WRAP querying other division returns empty or scope error
        $otherRes = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/org/outlets?divisionCode=CELL');
        $otherRes->assertStatus(200);
        $this->assertEmpty($otherRes->json('data'));
    }

    public function test_scope_violation_triggers_audit_log_and_exception(): void
    {
        AuditService::clearMemory();
        $policy = app(PolicyService::class);
        $managerWrap = ['id' => 'u1', 'sub' => 'u1', 'email' => 'manager.wrap@dashboard.test', 'role' => 'MANAGER', 'divisionCode' => 'WRAP'];

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Akses ditolak untuk divisi CELL');

        try {
            $policy->assertDivisionScope($managerWrap, 'CELL');
        } finally {
            $logs = AuditService::getMemoryLogs();
            $this->assertNotEmpty($logs);
            $this->assertEquals('policy.scope_violation', $logs[0]['action']);
            $this->assertEquals('CELL', $logs[0]['division_code']);
        }
    }
}
