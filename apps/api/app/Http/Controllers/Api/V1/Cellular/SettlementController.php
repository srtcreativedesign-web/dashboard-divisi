<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Http\Controllers\Controller;
use App\Services\Cellular\SettlementService;
use Illuminate\Http\Request;

class SettlementController extends Controller
{
    public function __construct(private SettlementService $service) {}
    public function index(Request $request) { $data = $request->validate(['month' => 'required|date_format:Y-m']); return response()->json($this->service->index($data['month'], $request->attributes->get('user'))); }
    public function sources(Request $request) { $data = $request->validate(['month' => 'required|date_format:Y-m']); return response()->json($this->service->sources($data['month'], $request->attributes->get('user'))); }
    public function store(Request $request) { $data = $request->validate(['id' => 'nullable|uuid', 'version' => 'nullable|required_with:id|integer|min:1', 'daily_closing_id' => 'required|uuid', 'channel' => 'required|in:cash,qris,edc,transfer', 'settlement_date' => 'required|date_format:Y-m-d', 'gross' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'fee' => ['required','regex:/^\d{1,12}(\.\d{1,2})?$/'], 'destination' => 'required|string|max:120', 'reference' => 'required|string|max:120']); return response()->json($this->service->save($data, $request->attributes->get('user')), $request->filled('id') ? 200 : 201); }
    public function transition(Request $request, string $id, string $action) { $data = $request->validate(['version' => 'required|integer|min:1', 'note' => 'nullable|string|max:2000']); return response()->json($this->service->transition($id, $action, $data, $request->attributes->get('user'))); }
}
