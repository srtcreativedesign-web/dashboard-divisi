<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Http\Controllers\Controller;
use App\Services\Cellular\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $service) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['month' => 'required|date_format:Y-m', 'outlet_id' => 'nullable|uuid']);

        return response()->json($this->service->report($data['month'], $data['outlet_id'] ?? null, $request->attributes->get('user')));
    }
}
