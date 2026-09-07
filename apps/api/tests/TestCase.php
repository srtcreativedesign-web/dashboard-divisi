<?php

namespace Tests;

use App\Models\User;
use App\Services\AuditService;
use App\Services\JwtService;
use App\Services\TokenRevocationService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        TokenRevocationService::clear();
        AuditService::clearMemory();
        $this->seed(DatabaseSeeder::class);
    }

    protected function getJwtTokenForUser(string $email): string
    {
        $user = User::where('email', $email)->first();
        if (! $user) {
            $user = User::create([
                'id' => (string) Str::uuid(),
                'email' => $email,
                'name' => 'Test User',
                'password_hash' => '$2b$10$z6zu1XrJGU/jiOm4TOsQZem7oJW2XKJ/B1bHJdWXWJDFzNZbsGNam',
                'role' => 'BOD',
                'division_code' => null,
                'is_active' => true,
            ]);
        }

        $jwtService = app(JwtService::class);

        return $jwtService->sign([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'divisionCode' => $user->division_code,
            'jti' => (string) Str::uuid(),
        ]);
    }

    protected function authenticated(string $email = 'bod1@dashboard.test'): static
    {
        $token = $this->getJwtTokenForUser($email);

        return $this->withHeader('Authorization', 'Bearer '.$token);
    }
}
