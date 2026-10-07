<?php

namespace Tests\Feature;

use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Tests\TestCase;

class MvpAccessTest extends TestCase
{
    public function test_cellular_outlets_require_authentication(): void
    {
        $this->getJson('/api/v1/cellular/outlets')->assertStatus(401);
    }

    public function test_cellular_manager_only_receives_cellular_outlets(): void
    {
        $response = $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/outlets')->assertOk();
        $expected = app(OrgReadModelService::class)->getOutletsForUser(['role' => 'MANAGER', 'divisionCode' => 'CELL'], 'CELL');
        $this->assertEquals($expected, $response->json('data'));
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_other_division_cannot_read_cellular_by_forging_filter(): void
    {
        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/cellular/outlets?divisionCode=PROJECT')->assertStatus(403);
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/cellular/outlets')->assertStatus(403);
    }

    public function test_report_reader_cannot_save_operational_accounting_data(): void
    {
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/transactions', [])->assertStatus(403);
        $this->authenticated('bod1@dashboard.test')->postJson('/api/v1/accounting/transactions', [])->assertStatus(403);
    }

    public function test_capabilities_use_account_assignment_not_request_context(): void
    {
        $policy = app(PolicyService::class);
        $user = ['role' => 'MANAGER', 'divisionCode' => 'CELL'];
        $this->assertFalse($policy->hasCapability($user, 'manage:projects', 'PROJECT'));
        $this->assertFalse($policy->hasCapability($user, 'manage:acc_master', 'ACC'));
        $this->assertTrue($policy->hasCapability($user, 'view:cellular'));
    }
}
