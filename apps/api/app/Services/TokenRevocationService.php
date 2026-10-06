<?php

namespace App\Services;

use App\Models\RevokedToken;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

class TokenRevocationService
{
    private static array $revokedTokenIds = [];

    public function revoke(?string $tokenId, ?string $userId = null, ?DateTimeInterface $expiresAt = null): void
    {
        if (! $tokenId) {
            return;
        }
        RevokedToken::updateOrCreate(['token_id' => $tokenId], ['user_id' => $userId, 'expires_at' => $expiresAt]);
        DB::afterCommit(function () use ($tokenId) {
            self::$revokedTokenIds[$tokenId] = true;
        });
    }

    public function isRevoked(?string $tokenId): bool
    {
        if (! $tokenId) {
            return false;
        }
        if (isset(self::$revokedTokenIds[$tokenId])) {
            return true;
        }
        if (RevokedToken::whereKey($tokenId)->exists()) {
            self::$revokedTokenIds[$tokenId] = true;

            return true;
        }

        return false;
    }

    public function pruneExpired(): int
    {
        return RevokedToken::where('expires_at', '<', now())
            ->orWhere(fn ($query) => $query->whereNull('expires_at')->where('created_at', '<', now()->subDays(30)))
            ->delete();
    }

    public static function clear(): void
    {
        self::$revokedTokenIds = [];
    }
}
