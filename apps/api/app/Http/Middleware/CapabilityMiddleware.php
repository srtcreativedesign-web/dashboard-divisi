<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\Outlet;
use App\Services\PolicyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CapabilityMiddleware
{
    public function __construct(
        protected PolicyService $policy
    ) {}

    public function handle(Request $request, Closure $next, string $capability): Response
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
            $outlet = Outlet::with('division')->find($outletId);
            $divisionCode = $outlet?->division?->code;
        }

        if (! $divisionCode && $request->is('api/v1/accounting*')) {
            $divisionCode = 'ACC';
        }

        if (str_contains($capability, '|')) {
            $capabilities = explode('|', $capability);
            $hasAny = false;
            foreach ($capabilities as $cap) {
                if ($this->policy->hasCapability($user, trim($cap), $divisionCode ? (string) $divisionCode : null)) {
                    $hasAny = true;
                    break;
                }
            }
            if (! $hasAny) {
                $this->policy->assertCapability($user, trim($capabilities[0]), $divisionCode ? (string) $divisionCode : null);
            }
        } else {
            $this->policy->assertCapability($user, $capability, $divisionCode ? (string) $divisionCode : null);
        }

        return $next($request);
    }
}
