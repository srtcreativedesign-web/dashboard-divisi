<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Services\PolicyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ScopeMiddleware
{
    public function __construct(
        protected PolicyService $policy
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('user');
        if (! $user) {
            throw new ApiException('AUTH_REQUIRED', 'Autentikasi diperlukan');
        }

        $divisionCode = $request->route('divisionCode')
            ?? $request->query('divisionCode')
            ?? $request->input('divisionCode')
            ?? $request->input('division_code');

        if (! $divisionCode && $request->is('api/v1/accounting*')) {
            $divisionCode = 'ACC';
        }

        if ($divisionCode) {
            $this->policy->assertDivisionScope($user, (string) $divisionCode);
        }

        return $next($request);
    }
}
