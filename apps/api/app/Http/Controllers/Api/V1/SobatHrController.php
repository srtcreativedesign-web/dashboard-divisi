<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncTenantsRequest;
use App\Services\Concerns\ResolvesScope;
use App\Services\PolicyService;
use App\Services\Sobat\Contracts\SobatClientInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SobatHrController extends Controller
{
    use ResolvesScope;

    public function __construct(
        protected SobatClientInterface $sobatService,
        protected PolicyService $policy,
    ) {}

    public function syncTenants(SyncTenantsRequest $request): JsonResponse
    {
        $user = $request->attributes->get('user') ?? [];
        $requestedDivision = $request->input('division_code');

        // Divisi efektif: jika user non-BOD tidak mengirim division_code, selesaikan ke divisi user
        $divisionCode = $this->resolveDivisionCode($user, $requestedDivision);

        // Jika bukan BOD, pastikan akses divisi tidak lintas batas
        if (($user['role'] ?? '') !== 'BOD') {
            $userDivision = $user['divisionCode'] ?? $user['division_code'] ?? null;
            $this->policy->assertDivisionScope($user, $divisionCode ?? $userDivision);
            $divisionCode = $userDivision;
        }

        $result = $this->sobatService->fetchTenantSync($divisionCode);

        return response()->json($result);
    }

    public function status(Request $request): JsonResponse
    {
        $status = $this->sobatService->getStatus();

        return response()->json($status);
    }
}
