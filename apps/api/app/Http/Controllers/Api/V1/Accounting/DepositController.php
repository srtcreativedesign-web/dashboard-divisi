<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\DepositService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class DepositController extends Controller
{
    public function __construct(private DepositService $service) {}

    private function filters(Request $r): array
    {
        return $r->validate(['month' => 'required|date_format:Y-m', 'page' => 'nullable|integer|min:1|max:1000000']);
    }

    public function index(Request $r)
    {
        return response()->json($this->service->list($this->filters($r), $r->attributes->get('user')));
    }

    public function sources(Request $r)
    {
        return response()->json($this->service->sources($this->filters($r), $r->attributes->get('user')));
    }

    public function show(Request $r, string $id)
    {
        return response()->json($this->service->detail($id, $r->attributes->get('user')));
    }

    private function mutate(callable $work, int $status = 200)
    {
        try {
            return response()->json($work(), $status);
        } catch (UniqueConstraintViolationException $e) {
            throw new ApiException('VERSION_CONFLICT', 'Referensi sumber atau bukti penerimaan sudah tercatat.');
        }
    }

    private function amount(): array
    {
        return ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,2})?$/'];
    }

    public function store(Request $r)
    {
        $d = $r->validate(['omzet_id' => 'required|uuid', 'channel' => 'required|in:cash,qris,edc,transfer,other', 'deposit_date' => 'required|date_format:Y-m-d', 'amount' => $this->amount(), 'destination' => 'required|string|max:255', 'source_reference' => 'required|string|max:255', 'evidence_reference' => 'required|string|max:255']);

        return $this->mutate(fn () => $this->service->create($d, $r->attributes->get('user')), 201);
    }

    public function receive(Request $r, string $id)
    {
        $d = $r->validate(['version' => 'required|integer|min:1', 'received_date' => 'required|date_format:Y-m-d', 'amount' => $this->amount(), 'evidence_reference' => 'required|string|max:255']);

        return $this->mutate(fn () => $this->service->change($id, 'receive', $d, $r->attributes->get('user')));
    }

    public function void(Request $r, string $id)
    {
        return $this->cancel($r, $id);
    }

    public function voidReceipt(Request $r, string $id, string $receiptId)
    {
        return $this->cancel($r, $id, $receiptId);
    }

    private function cancel(Request $r, string $id, ?string $receiptId = null)
    {
        $d = $r->validate(['version' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:2000']);

        return $this->mutate(fn () => $this->service->change($id, $receiptId ? 'void_receipt' : 'void', $d, $r->attributes->get('user'), $receiptId));
    }
}
