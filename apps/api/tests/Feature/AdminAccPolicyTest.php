<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PolicyService;
use Tests\TestCase;

class AdminAccPolicyTest extends TestCase
{
    public function test_admin_acc_can_manage_master_and_approve_period()
    {
        $policy = app(PolicyService::class);
        $user = ['role' => 'ADMIN', 'divisionCode' => 'ACC'];

        $this->assertTrue($policy->hasCapability($user, 'manage:acc_master', 'ACC'));
        $this->assertTrue($policy->hasCapability($user, 'approve:acc_period', 'ACC'));
        $this->assertFalse($policy->hasCapability($user, 'delete:acc_master', 'ACC'));
    }

    public function test_accounting_role_capabilities()
    {
        $policy = app(PolicyService::class);
        $user = ['role' => 'ACCOUNTING', 'divisionCode' => 'ACC'];

        $this->assertTrue($policy->hasCapability($user, 'view:acc_pnl', 'ACC'));
        $this->assertTrue($policy->hasCapability($user, 'view:acc_balance_sheet', 'ACC'));
        $this->assertTrue($policy->hasCapability($user, 'write:acc_outstanding', 'ACC'));
        $this->assertFalse($policy->hasCapability($user, 'approve:acc_period', 'ACC'));
    }

    public function test_finance_role_capabilities()
    {
        $policy = app(PolicyService::class);
        $user = ['role' => 'FINANCE', 'divisionCode' => 'FIN'];
        
        $this->assertTrue($policy->hasCapability($user, 'write:acc_transaction', 'FIN'));
        $this->assertFalse($policy->hasCapability($user, 'approve:acc_period', 'FIN'));
    }
}
