<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Http\Controllers\Controller;
use App\Services\Cellular\DailyClosingService;
use Illuminate\Http\Request;

class DailyClosingController extends Controller
{
    public function __construct(private DailyClosingService $service) {}
    public function index(Request $request) { $data = $request->validate(['month' => 'required|date_format:Y-m']); return response()->json($this->service->index($data['month'], $request->attributes->get('user'))); }
    public function store(Request $request) { $data = $request->validate(['outlet_id' => 'required|uuid', 'business_date' => 'required|date_format:Y-m-d', 'shift_code' => 'required|string|max:20', 'cash' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'qris' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'edc' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'transfer' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'source_reference' => 'required|string|max:255']); return response()->json($this->service->save($data, $request->attributes->get('user')), 201); }
    public function transition(Request $request, string $id, string $action) { $data = $request->validate(['version' => 'required|integer|min:1', 'note' => 'nullable|string|max:2000']); return response()->json($this->service->transition($id, $action, $data, $request->attributes->get('user'))); }
}
