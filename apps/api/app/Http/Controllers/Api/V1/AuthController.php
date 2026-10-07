<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\AuthService;
use App\Services\BrowserSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService, private BrowserSessionService $browser) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $this->browser->assertLoginOrigin($request);
        $validated = $request->validated();
        $result = $this->authService->login($validated['email'], $validated['password']);

        return $this->browser->attach(response()->json($result), $result['accessToken']);
    }

    public function logout(Request $request): JsonResponse
    {
        $result = $this->authService->logout($request->attributes->get('user') ?? []);

        return $this->browser->clear(response()->json($result));
    }

    public function me(Request $request): JsonResponse
    {
        $payload = $request->attributes->get('user');

        return $this->browser->withCsrf(response()->json($this->authService->getMe($payload)), $payload);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->authService->resetPassword($request->attributes->get('user')['sub'], $validated['oldPassword'], $validated['newPassword']);

        return $this->browser->clear(response()->json($result));
    }
}
