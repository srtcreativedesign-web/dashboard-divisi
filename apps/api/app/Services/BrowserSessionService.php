<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

class BrowserSessionService
{
    public function __construct(private JwtService $jwt) {}

    public function csrfToken(array $payload): string
    {
        $key = (string) config('app.key');
        if ($key === '' || ! is_string($payload['jti'] ?? null)) {
            throw new ApiException('INTERNAL_ERROR', 'Konfigurasi sesi tidak tersedia');
        }

        return hash_hmac('sha256', 'csrf|'.$payload['jti'], $key);
    }

    public function assertCsrf(Request $request, array $payload): void
    {
        $header = $request->header('X-CSRF-Token');
        if (! is_string($header) || ! hash_equals($this->csrfToken($payload), $header)) {
            throw new ApiException('CSRF_MISMATCH', 'Permintaan tidak lolos pemeriksaan CSRF; muat ulang halaman');
        }
    }

    public function assertLoginOrigin(Request $request): void
    {
        $origin = $request->header('Origin');
        $allowed = [$request->getSchemeAndHttpHost(), rtrim((string) config('app.url'), '/')];
        if (app()->environment(['local', 'testing'])) {
            $allowed = [...$allowed, 'http://127.0.0.1:5173', 'http://localhost:5173'];
        }
        if ($request->header('Sec-Fetch-Site') === 'cross-site'
            || ($origin !== null && ! in_array($origin, $allowed, true))) {
            throw new ApiException('CSRF_MISMATCH', 'Asal permintaan login tidak diizinkan');
        }
    }

    private function cookie(string $name, string $value, int $expires, bool $httpOnly): Cookie
    {
        return new Cookie($name, $value, $expires, '/', null,
            ! app()->environment(['local', 'testing']), $httpOnly, false, Cookie::SAMESITE_LAX);
    }

    public function attach(JsonResponse $response, string $token): JsonResponse
    {
        $payload = $this->jwt->verify($token);

        return $this->withCsrf($response->withCookie($this->cookie('access_token', $token, $payload['exp'], true)), $payload);
    }

    public function withCsrf(JsonResponse $response, array $payload): JsonResponse
    {
        return $response->withCookie($this->cookie('csrf_token', $this->csrfToken($payload), $payload['exp'], false));
    }

    public function clear(JsonResponse $response): JsonResponse
    {
        return $response->withCookie($this->cookie('access_token', '', time() - 3600, true))
            ->withCookie($this->cookie('csrf_token', '', time() - 3600, false));
    }
}
