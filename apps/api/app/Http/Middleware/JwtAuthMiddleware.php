<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Services\BrowserSessionService;
use App\Services\JwtService;
use App\Services\TokenRevocationService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function __construct(
        protected JwtService $jwtService,
        protected TokenRevocationService $tokenRevocation
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);
        if (! $token) {
            throw new ApiException('AUTH_REQUIRED', 'Token tidak ditemukan');
        }

        $payload = $this->jwtService->verify($token);
        if (! is_string($payload['sub'] ?? null) || $payload['sub'] === ''
            || ! is_string($payload['jti'] ?? null) || $payload['jti'] === '') {
            throw new ApiException('AUTH_REQUIRED', 'Sesi tidak valid; silakan login kembali');
        }

        if (! empty($payload['jti']) && $this->tokenRevocation->isRevoked($payload['jti'])) {
            throw new ApiException('AUTH_REQUIRED', 'Sesi sudah logout');
        }

        $account = User::find($payload['sub']);
        $division = $payload['divisionCode'] ?? $payload['division_code'] ?? null;
        if (! $account || ! $account->is_active
            || ($payload['role'] ?? null) !== $account->role
            || $division !== $account->division_code
            || ($payload['email'] ?? null) !== $account->email
            || ($payload['sessionVersion'] ?? 0) !== (int) $account->session_version) {
            throw new ApiException('AUTH_REQUIRED', 'Sesi tidak valid; silakan login kembali');
        }

        if ($request->attributes->get('auth_transport') === 'cookie'
            && ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            app(BrowserSessionService::class)->assertCsrf($request, $payload);
        }

        $request->attributes->set('user', $payload);

        return $next($request);
    }

    protected function extractToken(Request $request): ?string
    {
        // 1. Authorization: Bearer <token>
        $header = $request->header('Authorization');
        if ($header && str_starts_with($header, 'Bearer ')) {
            $request->attributes->set('auth_transport', 'bearer');

            return substr($header, 7);
        }

        // 2. httpOnly cookie: access_token
        $cookie = $request->cookie('access_token') ?: $request->cookies->get('access_token');
        if ($cookie) {
            $request->attributes->set('auth_transport', 'cookie');

            return $cookie;
        }

        // 3. x-access-token header
        $xToken = $request->header('x-access-token');
        if ($xToken) {
            $request->attributes->set('auth_transport', 'bearer');

            return $xToken;
        }

        return null;
    }
}
