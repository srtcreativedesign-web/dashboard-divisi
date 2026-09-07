<?php

namespace Tests\Feature;

use App\Services\JwtService;
use App\Services\TokenRevocationService;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_success_returns_jwt_and_sets_cookie(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bod1@dashboard.test',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'accessToken',
                'user' => ['id', 'email', 'name', 'role', 'divisionCode'],
            ],
            'meta' => ['trace_id'],
            'links' => ['self'],
        ]);

        $this->assertEquals('bod1@dashboard.test', $response->json('data.user.email'));
        $this->assertEquals('BOD', $response->json('data.user.role'));
        $this->assertNull($response->json('data.user.divisionCode'));
        $this->assertNotEmpty($response->json('data.accessToken'));
        $response->assertCookie('access_token');
    }

    public function test_login_with_invalid_credentials_returns_auth_required(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bod1@dashboard.test',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $response->json('error.code'));
        $this->assertEquals('Email atau password salah', $response->json('error.message'));
    }

    public function test_login_with_missing_credentials_returns_validation_error(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => '',
            'password' => '',
        ]);

        $response->assertStatus(400);
        $this->assertEquals('VALIDATION_ERROR', $response->json('error.code'));
    }

    public function test_me_with_bearer_token_and_cookie(): void
    {
        // 1. Bearer token
        $response = $this->authenticated('manager.wrap@dashboard.test')->getJson('/api/v1/auth/me');
        $response->assertStatus(200);
        $this->assertEquals('manager.wrap@dashboard.test', $response->json('data.email'));
        $this->assertEquals('MANAGER', $response->json('data.role'));
        $this->assertEquals('WRAP', $response->json('data.divisionCode'));

        // 2. Cookie authentication
        $token = $this->getJwtTokenForUser('admin.mini@dashboard.test');
        $cookieResponse = $this->flushHeaders()->call('GET', '/api/v1/auth/me', cookies: ['access_token' => $token]);
        $cookieResponse->assertStatus(200);
        $this->assertEquals('admin.mini@dashboard.test', $cookieResponse->json('data.email'));
        $this->assertEquals('ADMIN', $cookieResponse->json('data.role'));
        $this->assertEquals('MINI', $cookieResponse->json('data.divisionCode'));
    }

    public function test_me_without_auth_returns_401(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $response->json('error.code'));
    }

    public function test_logout_revokes_token_and_clears_cookie(): void
    {
        $token = $this->getJwtTokenForUser('bod1@dashboard.test');

        $logoutRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $logoutRes->assertStatus(200);
        $this->assertEquals('Logout berhasil', $logoutRes->json('data.message'));

        // Subsequent access with revoked token should fail with 401
        $meRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $meRes->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $meRes->json('error.code'));
        $this->assertEquals('Sesi sudah logout', $meRes->json('error.message'));
    }

    public function test_reset_password_validates_and_updates_credentials(): void
    {
        $token = $this->getJwtTokenForUser('bod2@dashboard.test');

        // Short password fails with 400 VALIDATION_ERROR
        $shortRes = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/reset', [
                'oldPassword' => 'Password123!',
                'newPassword' => 'short',
            ]);
        $shortRes->assertStatus(400);
        $this->assertEquals('VALIDATION_ERROR', $shortRes->json('error.code'));

        // Wrong old password fails with 401 AUTH_REQUIRED
        $wrongOld = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/reset', [
                'oldPassword' => 'WrongOldPassword',
                'newPassword' => 'NewValidPassword123!',
            ]);
        $wrongOld->assertStatus(401);
        $this->assertEquals('AUTH_REQUIRED', $wrongOld->json('error.code'));

        // Valid reset succeeds
        $success = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/reset', [
                'oldPassword' => 'Password123!',
                'newPassword' => 'NewValidPassword123!',
            ]);
        $success->assertStatus(200);
        $this->assertEquals('Password berhasil direset', $success->json('data.message'));

        // Login with new password succeeds
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'bod2@dashboard.test',
            'password' => 'NewValidPassword123!',
        ]);
        $loginRes->assertStatus(200);
    }

    public function test_login_is_rate_limited_after_exceeding_attempts(): void
    {
        // throttle:login — 10/menit per email+IP, percobaan ke-11 ditolak 429 (anti brute-force)
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'bod1@dashboard.test',
                'password' => 'WrongPassword',
            ]);
        }

        $blocked = $this->postJson('/api/v1/auth/login', [
            'email' => 'bod1@dashboard.test',
            'password' => 'WrongPassword',
        ]);

        $blocked->assertStatus(429);

        // Akun lain dari IP yang sama tidak ikut terblokir (kantor di balik satu IP/NAT)
        $other = $this->postJson('/api/v1/auth/login', [
            'email' => 'bod2@dashboard.test',
            'password' => 'WrongPassword',
        ]);
        $other->assertStatus(401);
    }

    public function test_revoked_token_is_persisted_and_survives_cache_clear(): void
    {
        $token = $this->getJwtTokenForUser('bod3@dashboard.test');

        $logout = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');
        $logout->assertStatus(200);

        // Simulasi restart multi-proses: buang cache static, hanya andalkan DB
        TokenRevocationService::clear();

        $revocation = app(TokenRevocationService::class);
        $decoded = app(JwtService::class)->verify($token);
        $this->assertNotEmpty($decoded['jti'] ?? null);
        $this->assertTrue($revocation->isRevoked($decoded['jti']));

        // Pastikan tercatat di DB juga
        $this->assertDatabaseHas('revoked_tokens', ['token_id' => $decoded['jti']]);
    }
}
