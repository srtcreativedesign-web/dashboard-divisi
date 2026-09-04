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

        if (! $divisionCode && ($request->input('outletId') || $request->input('outlet_id'))) {
            $outletId = $request->input('outletId') ?: $request->input('outlet_id');
            $outlet = \App\Models\Outlet::with('division')->find($outletId);
            $divisionCode = $outlet?->division?->code;
        }

        if (! $divisionCode && $request->is('api/v1/accounting*')) {
            $divisionCode = 'ACC';
        }

        if ($divisionCode) {
            $isWrite = in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true);
            $this->policy->assertDivisionScope($user, (string) $divisionCode, $isWrite);
        }

        return $next($request);
    }
}
