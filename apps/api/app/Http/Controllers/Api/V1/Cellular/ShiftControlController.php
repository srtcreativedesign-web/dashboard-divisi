<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Http\Controllers\Controller;
use App\Services\Cellular\ShiftControlService;
use Illuminate\Http\Request;

class ShiftControlController extends Controller
{
    public function __construct(private ShiftControlService $service) {}
    public function index(Request $request) { $data = $request->validate(['month' => 'required|date_format:Y-m']); return response()->json($this->service->index($data['month'], $request->attributes->get('user'))); }
    public function store(Request $request) { $data = $request->validate(['id' => 'nullable|uuid', 'version' => 'nullable|required_with:id|integer|min:1', 'outlet_id' => 'required|uuid', 'business_date' => 'required|date_format:Y-m-d', 'shift_code' => 'required|string|max:20', 'pic_name' => 'required|string|max:120', 'due_at' => 'required|date', 'priority' => 'required|in:normal,high,critical', 'checklist' => 'required|array', 'checklist.handover_complete' => 'required|boolean', 'checklist.stock_count_complete' => 'required|boolean', 'checklist.payment_channels_ready' => 'required|boolean', 'checklist.closing_matched' => 'required|boolean', 'issue_summary' => 'nullable|string|max:2000']); return response()->json($this->service->save($data, $request->attributes->get('user')), $request->filled('id') ? 200 : 201); }
    public function transition(Request $request, string $id, string $action) { $data = $request->validate(['version' => 'required|integer|min:1', 'note' => 'nullable|string|max:2000']); return response()->json($this->service->transition($id, $action, $data, $request->attributes->get('user'))); }
}
