<?php

namespace Tests\Feature;

use App\Services\AuditService;
use App\Services\PolicyService;
use Tests\TestCase;

class PolicyTest extends TestCase
{
    public function test_policy_service_capabilities_matrix(): void
    {
        $policy = app(PolicyService::class);

        $bodUser = ['role' => 'BOD', 'divisionCode' => null];
        $managerUser = ['role' => 'MANAGER', 'divisionCode' => 'ACC'];
        $adminUser = ['role' => 'ADMIN', 'divisionCode' => 'ACC'];

        $this->assertTrue($policy->hasCapability($bodUser, 'view:report'));
        foreach (['any:capability', 'manage:division', 'approve:acc_period', 'write:revenue'] as $capability) {
            $this->assertFalse($policy->hasCapability($bodUser, $capability));
        }
        $this->assertTrue($policy->hasCapability($managerUser, 'manage:acc_master'));
        $this->assertTrue($policy->hasCapability($managerUser, 'approve:acc_period'));
        $this->assertFalse($policy->hasCapability($managerUser, 'write:acc_transaction'));
        $this->assertTrue($policy->hasCapability($adminUser, 'write:acc_transaction'));
        $this->assertFalse($policy->hasCapability($adminUser, 'approve:acc_period'));
        $this->assertFalse($policy->hasCapability(['role' => 'MANAGER', 'divisionCode' => 'WRAP'], 'write:revenue'));
    }

    public function test_forbidden_capability_returns_403_and_audits(): void
    {
        AuditService::clearMemory();

        // Admin does not have manage:division capability
        $response = $this->authenticated('admin.wrap@dashboard.test')
            ->postJson('/api/v1/division-configs/WRAP', [
                'enabledModules' => ['dashboard'],
                'enabledKpis' => ['revenue.gross'],
            ]);

        $response->assertStatus(403);
        $this->assertEquals('FORBIDDEN_CAPABILITY', $response->json('error.code'));

        $logs = AuditService::getMemoryLogs();
        $this->assertNotEmpty($logs);
        $lastLog = end($logs);
        $this->assertEquals('policy.forbidden_capability', $lastLog['action']);
        $this->assertEquals('ADMIN', $lastLog['actor_role']);
    }
}
