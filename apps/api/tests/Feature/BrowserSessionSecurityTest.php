<?php

namespace Tests\Feature;

use App\Services\BrowserSessionService;
use App\Services\JwtService;
use App\Services\TokenRevocationService;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BrowserSessionSecurityTest extends TestCase
{
    public function test_cookie_mutation_requires_csrf_bound_to_same_session(): void
    {
        $token = $this->getJwtTokenForUser('bod1@dashboard.test');
        $payload = app(JwtService::class)->verify($token);
        foreach (['', 'invalid', app(BrowserSessionService::class)->csrfToken(['jti' => 'other-session'])] as $header) {
            $this->flushHeaders()->call('POST', '/api/v1/auth/logout', cookies: ['access_token' => $token],
                server: ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_CSRF_TOKEN' => $header])->assertStatus(403)->assertJsonPath('error.code', 'CSRF_MISMATCH');
        }
        $this->call('POST', '/api/v1/auth/logout', cookies: ['access_token' => $token],
            server: ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_CSRF_TOKEN' => app(BrowserSessionService::class)->csrfToken($payload)])
            ->assertOk()->assertCookieExpired('access_token')->assertCookieExpired('csrf_token');
    }

    public function test_cookie_cannot_bypass_csrf_by_adding_x_access_token_header(): void
    {
        $token = $this->getJwtTokenForUser('bod2@dashboard.test');
        $this->call('POST', '/api/v1/auth/logout', cookies: ['access_token' => $token],
            server: ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_ACCESS_TOKEN' => $token])->assertStatus(403);
    }

    public function test_login_sets_cookie_flags_and_me_restores_csrf_after_reload(): void
    {
        $this->app->instance('env', 'production');
        $response = $this->postJson('/api/v1/auth/login', ['email' => 'bod1@dashboard.test', 'password' => 'Password123!'])->assertOk();
        $cookies = collect($response->headers->getCookies())->keyBy(fn ($cookie) => $cookie->getName());
        $this->assertTrue($cookies['access_token']->isHttpOnly());
        $this->assertTrue($cookies['access_token']->isSecure());
        $this->assertFalse($cookies['csrf_token']->isHttpOnly());
        $this->assertSame('lax', $cookies['access_token']->getSameSite());
        $token = $response->json('data.accessToken');
        $this->flushHeaders()->call('GET', '/api/v1/auth/me', cookies: ['access_token' => $token], server: ['HTTP_ACCEPT' => 'application/json'])
            ->assertOk()->assertCookie('csrf_token');
    }

    public function test_login_from_untrusted_origin_is_rejected(): void
    {
        $this->withHeader('Origin', 'https://untrusted.example')->postJson('/api/v1/auth/login',
            ['email' => 'bod1@dashboard.test', 'password' => 'Password123!'])->assertStatus(403)->assertJsonPath('error.code', 'CSRF_MISMATCH');
    }

    public function test_password_reset_invalidates_every_previous_session(): void
    {
        $first = $this->getJwtTokenForUser('bod2@dashboard.test');
        $second = $this->getJwtTokenForUser('bod2@dashboard.test');
        $this->withHeader('Authorization', 'Bearer '.$first)->postJson('/api/v1/auth/reset',
            ['oldPassword' => 'Password123!', 'newPassword' => 'NewSecurePassword123!'])->assertOk();
        foreach ([$first, $second] as $token) {
            $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/auth/me')->assertStatus(401);
        }
        $this->flushHeaders()->postJson('/api/v1/auth/login', ['email' => 'bod2@dashboard.test', 'password' => 'NewSecurePassword123!'])->assertOk();
    }

    public function test_revocation_storage_failure_does_not_allow_access_or_fake_logout_success(): void
    {
        $token = $this->getJwtTokenForUser('bod3@dashboard.test');
        TokenRevocationService::clear();
        Schema::drop('revoked_tokens');
        $this->withHeader('Authorization', 'Bearer '.$token)->getJson('/api/v1/auth/me')
            ->assertStatus(500)->assertJsonPath('error.code', 'INTERNAL_ERROR');
        $this->postJson('/api/v1/auth/logout')->assertStatus(500)->assertJsonPath('error.code', 'INTERNAL_ERROR');
    }
}
