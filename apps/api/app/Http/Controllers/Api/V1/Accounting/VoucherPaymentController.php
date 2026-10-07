<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\VoucherPaymentService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VoucherPaymentController extends Controller
{
    public function __construct(private VoucherPaymentService $service) {}

    public function store(Request $r, string $id)
    {
        $d = $r->validate(['version' => 'required|integer|min:1', 'paid_date' => 'required|date_format:Y-m-d', 'amount' => ['required', 'string', 'regex:/^\d{1,12}(\.\d{1,2})?$/', 'numeric', 'gt:0'], 'method' => 'required|in:CASH,BANK', 'reference' => 'required|string|max:150', 'notes' => 'required|string|min:10|max:2000', 'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', 'created_by' => 'prohibited', 'status' => 'prohibited', 'division_code' => 'prohibited']);
        try {
            $result = $this->service->record($id, $d, $r->file('file'), $r->attributes->get('user'));
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('IDEMPOTENCY_CONFLICT', 'Referensi pembayaran sudah tercatat.');
        }

        return response()->json($result, 201);
    }

    public function void(Request $r, string $id, string $paymentId)
    {
        $d = $r->validate(['version' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:2000']);

        return response()->json($this->service->void($id, $paymentId, $d, $r->attributes->get('user')));
    }

    public function download(string $id, string $paymentId)
    {
        $p = $this->service->evidence($id, $paymentId);

        return Storage::disk('local')->download($p->file_path, $p->original_name, ['X-Content-Type-Options' => 'nosniff']);
    }
}
