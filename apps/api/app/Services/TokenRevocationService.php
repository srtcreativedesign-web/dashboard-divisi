<?php

namespace App\Services;

use App\Models\RevokedToken;
use DateTimeInterface;
use Throwable;

/**
 * Revokasi token (jti) secara PERSISTEN ke tabel revoked_tokens.
 * Bertahan dari restart proses & worker — tidak lagi static array per-proses.
 * Static array dipertahankan sebagai cache kecepatan + fallback DB-less (test).
 */
class TokenRevocationService
{
    /** @var array<string, bool> */
    protected static array $revokedTokenIds = [];

    public function revoke(?string $tokenId, ?string $userId = null, ?DateTimeInterface $expiresAt = null): void
    {
        if (! $tokenId) {
            return;
        }

        self::$revokedTokenIds[$tokenId] = true;

        try {
            RevokedToken::updateOrCreate(
                ['token_id' => $tokenId],
                ['user_id' => $userId, 'expires_at' => $expiresAt]
            );
        } catch (Throwable $e) {
            if (app()->environment() !== 'testing') {
                report($e);
            }
        }
    }

    public function isRevoked(?string $tokenId): bool
    {
        if (! $tokenId) {
            return false;
        }

        if (isset(self::$revokedTokenIds[$tokenId])) {
            return true;
        }

        try {
            if (RevokedToken::whereKey($tokenId)->exists()) {
                self::$revokedTokenIds[$tokenId] = true;

                return true;
            }
        } catch (Throwable) {
            return false;
        }

        return false;
    }

    public function pruneExpired(): int
    {
        try {
            return RevokedToken::where('expires_at', '<', now())
                ->orWhereNull('expires_at')
                ->where('created_at', '<', now()->subDays(30))
                ->delete();
        } catch (Throwable) {
            return 0;
        }
    }

    public static function clear(): void
    {
        self::$revokedTokenIds = [];
    }
}
