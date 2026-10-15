<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Controller;
use App\Services\Accounting\HrRecapService;
use Illuminate\Http\Request;

class HrRecapController extends Controller
{
    public function __construct(private HrRecapService $service) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'kind' => 'required|in:leave,attendance',
            'month' => 'required|date_format:Y-m',
            'page' => 'nullable|integer|min:1|max:1000000',
        ]);

        return response()->json($this->service->list($filters, $request->attributes->get('user')));
    }

    public function show(Request $request, string $id)
    {
        return response()->json($this->service->get($id, $request->attributes->get('user')));
    }
}
