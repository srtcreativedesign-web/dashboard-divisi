<?php

namespace App\Services;

use App\Models\Division;
use App\Models\User;
use App\Models\UserScope;
use Throwable;

class UserScopeService
{
    public function getScopesForUser(string $userId): array
    {
        try {
            return UserScope::with('division')->where('user_id', $userId)->get()->toArray();
        } catch (Throwable) {
            return [];
        }
    }

    public function hasScope(string $userId, string $divisionCode): bool
    {
        try {
            $user = User::find($userId);
            if (! $user) {
                return false;
            }

            // BOD lintas 7 divisi (division_code null) = all
            if ($user->role === 'BOD' && ! $user->division_code) {
                return true;
            }

            $scopes = UserScope::where('user_id', $userId)->get();
            if ($scopes->isEmpty()) {
                return $user->division_code === $divisionCode;
            }

            $division = Division::where('code', $divisionCode)->first();
            if (! $division) {
                return false;
            }

            return $scopes->contains('division_id', $division->id);
        } catch (Throwable) {
            return false;
        }
    }

    public static function hasScopeInMemory(array $user, string $divisionCode): bool
    {
        $role = $user['role'] ?? '';
        $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;

        if ($role === 'BOD' && ! $userDivision) {
            return true;
        }

        return $userDivision === $divisionCode;
    }
}
