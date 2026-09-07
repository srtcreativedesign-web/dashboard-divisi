<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
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

        if (! empty($payload['jti']) && $this->tokenRevocation->isRevoked($payload['jti'])) {
            throw new ApiException('AUTH_REQUIRED', 'Sesi sudah logout');
        }

        $request->attributes->set('user', $payload);

        return $next($request);
    }

    protected function extractToken(Request $request): ?string
    {
        // 1. Authorization: Bearer <token>
        $header = $request->header('Authorization');
        if ($header && str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        // 2. httpOnly cookie: access_token
        $cookie = $request->cookie('access_token') ?: $request->cookies->get('access_token');
        if ($cookie) {
            return $cookie;
        }

        // 3. x-access-token header
        $xToken = $request->header('x-access-token');
        if ($xToken) {
            return $xToken;
        }

        return null;
    }
}
