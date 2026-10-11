<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Cellular\ManualWorkflowService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class ManualWorkflowController extends Controller
{
    public function __construct(private ManualWorkflowService $service) {}

    private function mutate(callable $work, int $status = 201)
    {
        try {
            return response()->json($work(), $status);
        } catch (UniqueConstraintViolationException $e) {
            throw new ApiException('VERSION_CONFLICT', 'SKU atau referensi sudah tercatat.');
        }
    }

    public function products(Request $r)
    {
        return response()->json($this->service->products($r->attributes->get('user')));
    }

    public function stock(Request $r)
    {
        return response()->json($this->service->stock($r->attributes->get('user')));
    }

    public function movements(Request $r)
    {
        $data = $r->validate([
            'month' => 'nullable|date_format:Y-m',
            'outlet_id' => 'nullable|uuid',
            'product_id' => 'nullable|uuid',
            'kind' => 'nullable|in:ADJUSTMENT,SALE,VOID',
            'direction' => 'nullable|in:IN,OUT',
            'q' => 'nullable|string|max:100',
        ]);

        return response()->json($this->service->movements($data, $r->attributes->get('user')));
    }

    public function createProduct(Request $r)
    {
        $data = $r->validate(['sku' => 'required|string|max:50|regex:/^[a-zA-Z0-9_-]+$/', 'name' => 'required|string|max:255', 'kind' => 'required|in:SIM_CARD,ACCESSORY', 'provider' => 'nullable|string|max:100', 'variant' => 'nullable|string|max:255']);

        return $this->mutate(fn () => $this->service->createProduct($data, $r->attributes->get('user')));
    }

    public function adjust(Request $r)
    {
        $data = $r->validate(['product_id' => 'required|uuid', 'outlet_id' => 'required|uuid', 'quantity_delta' => 'required|integer|min:-1000000|max:1000000|not_in:0', 'reference' => 'required|string|max:255', 'reason' => 'required|string|min:10|max:2000']);

        return $this->mutate(fn () => $this->service->adjust($data, $r->attributes->get('user')));
    }

    public function sales(Request $r)
    {
        $data = $r->validate(['month' => 'required|date_format:Y-m']);

        return response()->json($this->service->sales($data['month'], $r->attributes->get('user')));
    }

    public function sell(Request $r)
    {
        $data = $r->validate(['product_id' => 'required|uuid', 'outlet_id' => 'required|uuid', 'business_date' => 'required|date_format:Y-m-d', 'quantity' => 'required|integer|min:1|max:1000000', 'unit_price' => ['required', 'regex:/^\d{1,12}(\.\d{1,2})?$/'], 'reference' => 'required|string|max:255']);

        return $this->mutate(fn () => $this->service->sell($data, $r->attributes->get('user')));
    }

    public function void(Request $r, string $id)
    {
        $data = $r->validate(['version' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:2000']);

        return $this->mutate(fn () => $this->service->void($id, $data, $r->attributes->get('user')), 200);
    }
}
