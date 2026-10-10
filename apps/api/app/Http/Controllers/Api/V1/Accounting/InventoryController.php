<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\InventoryService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $service) {}

    private function mutate(callable $work, int $status = 200)
    {
        try {
            return response()->json($work(), $status);
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('VERSION_CONFLICT', 'Kode, referensi, atau dokumen tersebut sudah tercatat.');
        }
    }

    public function catalog(Request $r)
    {
        return response()->json($this->service->catalog($r->attributes->get('user')));
    }

    public function documents(Request $r)
    {
        $d = $r->validate(['month' => 'required|date_format:Y-m']);

        return response()->json($this->service->documents($d['month'], $r->attributes->get('user')));
    }

    public function purchaseVouchers(Request $r)
    {
        $d = $r->validate(['month' => 'required|date_format:Y-m']);

        return response()->json($this->service->purchaseVouchers($d['month'], $r->attributes->get('user')));
    }

    public function item(Request $r)
    {
        $d = $r->validate(['sku' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9._-]+$/'], 'name' => 'required|string|max:255', 'unit' => 'required|string|max:30', 'minimum_stock' => 'required|numeric|min:0|max:9999999999999', 'active' => 'sometimes|boolean']);

        return $this->mutate(fn () => $this->service->createItem($d, $r->attributes->get('user')), 201);
    }

    public function location(Request $r)
    {
        $d = $r->validate(['code' => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9._-]+$/'], 'name' => 'required|string|max:255', 'kind' => 'required|in:WAREHOUSE,OUTLET', 'active' => 'sometimes|boolean']);

        return $this->mutate(fn () => $this->service->createLocation($d, $r->attributes->get('user')), 201);
    }

    public function store(Request $r)
    {
        $d = $r->validate(['kind' => 'required|in:RECEIPT,ISSUE,TRANSFER,STOCK_COUNT', 'source_location_id' => 'nullable|uuid', 'destination_location_id' => 'nullable|uuid', 'voucher_id' => 'nullable|uuid', 'business_date' => 'required|date_format:Y-m-d', 'reference' => 'required|string|max:255', 'notes' => 'nullable|string|max:2000', 'lines' => 'required|array|min:1|max:100', 'lines.*.item_id' => 'required|uuid', 'lines.*.quantity' => 'nullable|numeric|min:0.001|max:9999999999999', 'lines.*.counted_quantity' => 'nullable|numeric|min:0|max:9999999999999']);

        return $this->mutate(fn () => $this->service->createDocument($d, $r->attributes->get('user')), 201);
    }

    public function update(Request $r, string $id)
    {
        $d = $r->validate(['version' => 'required|integer|min:1', 'kind' => 'required|in:RECEIPT,ISSUE,TRANSFER,STOCK_COUNT', 'source_location_id' => 'nullable|uuid', 'destination_location_id' => 'nullable|uuid', 'voucher_id' => 'nullable|uuid', 'business_date' => 'required|date_format:Y-m-d', 'reference' => 'required|string|max:255', 'notes' => 'nullable|string|max:2000', 'lines' => 'required|array|min:1|max:100', 'lines.*.item_id' => 'required|uuid', 'lines.*.quantity' => 'nullable|numeric|min:0.001|max:9999999999999', 'lines.*.counted_quantity' => 'nullable|numeric|min:0|max:9999999999999']);

        return $this->mutate(fn () => $this->service->updateDocument($id, $d, $r->attributes->get('user')));
    }

    public function transition(Request $r, string $id, string $action)
    {
        if (! in_array($action, ['submit', 'approve', 'correction'], true)) {
            throw new ApiException('VALIDATION_ERROR', 'Aksi persediaan tidak dikenali.');
        }
        $d = $r->validate(['version' => 'required|integer|min:1', 'note' => 'nullable|string|max:2000']);

        return $this->mutate(fn () => $this->service->transition($id, $action, $d, $r->attributes->get('user')));
    }
}
