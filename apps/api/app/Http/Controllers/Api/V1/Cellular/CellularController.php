<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Http\Controllers\Controller;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CellularController extends Controller
{
    public function outlets(Request $request, PolicyService $policy, OrgReadModelService $org): JsonResponse
    {
        $user = $request->attributes->get('user', []);
        $policy->assertDivisionScope($user, 'CELL');
        if (($user['divisionCode'] ?? $user['division_code'] ?? null) === 'CELLULAR') {
            $user['divisionCode'] = 'CELL';
            $user['division_code'] = 'CELL';
        }

        return response()->json($org->getOutletsForUser($user, 'CELL'));
    }
}
