<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    // SOP 4 / keamanan: flag Secure hanya aktif di luar local/testing (HTTPS); override via COOKIE_SECURE.
    protected function cookieIsSecure(): bool
    {
        if (($v = env('COOKIE_SECURE')) !== null) {
            return (bool) $v;
        }

        return ! app()->environment(['local', 'testing']);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->authService->login($validated['email'], $validated['password']);

        // Set httpOnly cookie access_token for browser session tests (UAT-ACC-08)
        $cookie = new Cookie(
            name: 'access_token',
            value: $result['accessToken'],
            expire: time() + (8 * 3600),
            path: '/',
            domain: null,
            secure: $this->cookieIsSecure(),
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX
        );

        return response()->json($result)->withCookie($cookie);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user');
        $result = $this->authService->logout($user ?? []);

        $cookie = new Cookie(
            name: 'access_token',
            value: '',
            expire: time() - 3600,
            path: '/',
            domain: null,
            secure: $this->cookieIsSecure(),
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX
        );

        return response()->json($result)->withCookie($cookie);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user');
        $result = $this->authService->getMe($user ?? []);

        return response()->json($result);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $user = $request->attributes->get('user');
        $userId = $user['sub'] ?? '';
        $validated = $request->validated();

        $result = $this->authService->resetPassword($userId, $validated['oldPassword'], $validated['newPassword']);

        return response()->json($result);
    }
}
