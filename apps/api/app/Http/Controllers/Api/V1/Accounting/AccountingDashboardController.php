<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\DashboardService;
use Illuminate\Http\Request;

class AccountingDashboardController extends Controller
{
    public function operations(Request $request, DashboardService $service)
    {
        $data = $request->validate(['month' => 'required|date_format:Y-m', 'divisionCode' => 'prohibited', 'division_code' => 'prohibited']);

        return response()->json($service->operations($data['month'], $request->attributes->get('user')));
    }
}
