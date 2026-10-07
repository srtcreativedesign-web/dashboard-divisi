<?php

namespace Tests\Feature;

use App\Services\PolicyService;
use Tests\TestCase;

class AdminAccPolicyTest extends TestCase
{
    public function test_admin_acc_cannot_manage_master_or_approve_period()
    {
        $policy = app(PolicyService::class);
        $user = ['role' => 'ADMIN', 'divisionCode' => 'ACC'];

        $this->assertFalse($policy->hasCapability($user, 'manage:acc_master', 'ACC'));
        $this->assertFalse($policy->hasCapability($user, 'approve:acc_period', 'ACC'));
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
