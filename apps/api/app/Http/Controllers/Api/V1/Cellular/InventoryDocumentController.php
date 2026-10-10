<?php

namespace App\Http\Controllers\Api\V1\Cellular;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Cellular\InventoryDocumentService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class InventoryDocumentController extends Controller
{
    public function __construct(private InventoryDocumentService $service) {}

    private function mutate(callable $work, int $status = 200)
    {
        try {
            return response()->json($work(), $status);
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('VERSION_CONFLICT', 'Produk atau referensi sudah tercatat pada dokumen ini.');
        }
    }

    public function catalog(Request $request)
    {
        return response()->json($this->service->catalog($request->attributes->get('user')));
    }

    public function index(Request $request)
    {
        $data = $request->validate(['month' => 'required|date_format:Y-m']);

        return response()->json($this->service->documents($data['month'], $request->attributes->get('user')));
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        return $this->mutate(fn () => $this->service->create($data, $request->attributes->get('user')), 201);
    }

    public function update(Request $request, string $id)
    {
        $data = $request->validate(['version' => 'required|integer|min:1'] + $this->rules());

        return $this->mutate(fn () => $this->service->update($id, $data, $request->attributes->get('user')));
    }

    public function transition(Request $request, string $id, string $action)
    {
        if (! in_array($action, ['submit', 'approve', 'correction'], true)) {
            throw new ApiException('VALIDATION_ERROR', 'Aksi dokumen persediaan tidak dikenali.');
        }
        $data = $request->validate(['version' => 'required|integer|min:1', 'note' => 'nullable|string|max:2000']);

        return $this->mutate(fn () => $this->service->transition($id, $action, $data, $request->attributes->get('user')));
    }

    private function rules(): array
    {
        return [
            'kind' => 'required|in:RECEIPT,ISSUE,TRANSFER,STOCK_COUNT',
            'source_outlet_id' => 'nullable|uuid',
            'destination_outlet_id' => 'nullable|uuid',
            'business_date' => 'required|date_format:Y-m-d',
            'reference' => 'required|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'lines' => 'required|array|min:1|max:100',
            'lines.*.product_id' => 'required|uuid',
            'lines.*.quantity' => 'nullable|integer|min:1|max:1000000',
            'lines.*.counted_quantity' => 'nullable|integer|min:0|max:1000000',
        ];
    }
}
