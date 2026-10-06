<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\JwtService;
use Tests\TestCase;

class SessionSecurityTest extends TestCase
{
    public function test_inactive_account_cannot_use_an_existing_token_on_operational_endpoint(): void
    {
        $token = $this->getJwtTokenForUser('manager.acc@dashboard.test');
        User::where('email', 'manager.acc@dashboard.test')->update(['is_active' => false]);
        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/accounting/reports')
            ->assertStatus(401)->assertJsonPath('error.code', 'AUTH_REQUIRED');
    }

    public function test_role_change_requires_login_again_instead_of_retaining_manager_permissions(): void
    {
        $token = $this->getJwtTokenForUser('manager.acc@dashboard.test');
        User::where('email', 'manager.acc@dashboard.test')->update(['role' => 'ADMIN']);
        $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/v1/accounting/periods/approve', [])
            ->assertStatus(401)->assertJsonPath('error.code', 'AUTH_REQUIRED');
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/periods/approve', [])
            ->assertStatus(403)->assertJsonPath('error.code', 'FORBIDDEN_CAPABILITY');
    }

    public function test_division_and_email_changes_invalidate_existing_session(): void
    {
        $token = $this->getJwtTokenForUser('admin.acc@dashboard.test');
        User::where('email', 'admin.acc@dashboard.test')->update(['division_code' => 'CELL']);
        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/accounting/reports')->assertStatus(401);
        $token = $this->getJwtTokenForUser('admin.cell@dashboard.test');
        User::where('email', 'admin.cell@dashboard.test')->update(['email' => 'renamed@example.test']);
        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/cellular/outlets')->assertStatus(401);
    }

    public function test_missing_subject_or_token_identifier_is_rejected(): void
    {
        $user = User::where('email', 'manager.acc@dashboard.test')->firstOrFail();
        $claims = ['sub' => $user->id, 'jti' => 'security-case', 'role' => $user->role, 'divisionCode' => 'ACC', 'email' => $user->email];
        foreach (['sub', 'jti'] as $key) {
            $invalid = $claims;
            unset($invalid[$key]);
            $token = app(JwtService::class)->sign($invalid);
            $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/accounting/reports')
                ->assertStatus(401)->assertJsonPath('error.code', 'AUTH_REQUIRED');
        }
    }
}
