<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\VoucherService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VoucherController extends Controller
{
    public function __construct(private VoucherService $service) {}

    public function outlets(Request $request)
    {
        return response()->json($this->service->outlets($request->attributes->get('user')));
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'month' => 'required|date_format:Y-m', 'status' => 'nullable|in:draft,submitted,correction,pending_approval,approved',
            'type' => 'nullable|in:BILLING,PURCHASING', 'outlet_id' => 'nullable|uuid', 'page' => 'nullable|integer|min:1',
        ]);

        return response()->json($this->service->list($filters));
    }

    public function show(string $id)
    {
        return response()->json($this->service->detail($id));
    }

    public function uploadAttachment(Request $request, string $id)
    {
        $data = $request->validate(['version' => 'required|integer|min:1', 'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx|max:10240']);

        return response()->json($this->service->attach($id, $data['version'], $request->file('file'), $request->attributes->get('user')), 201);
    }

    public function downloadAttachment(string $id, string $attachmentId)
    {
        $attachment = $this->service->attachment($id, $attachmentId);

        return Storage::disk('local')->download($attachment->file_path, $attachment->original_name, ['X-Content-Type-Options' => 'nosniff']);
    }

    public function store(Request $request)
    {
        return $this->save($request);
    }

    public function update(Request $request, string $id)
    {
        return $this->save($request, $id);
    }

    private function save(Request $request, ?string $id = null)
    {
        $data = $request->validate([
            'type' => 'required|in:BILLING,PURCHASING', 'outlet_id' => 'required|uuid',
            'voucher_date' => 'required|date_format:Y-m-d', 'due_date' => 'required|date_format:Y-m-d|after_or_equal:voucher_date',
            'entity_name' => 'required|string|max:150', 'source_reference' => 'required|string|max:255',
            'amount' => ['required', 'regex:/^\d{1,12}(\.\d{1,2})?$/', 'numeric', 'gt:0'],
            'description' => 'required|string|min:10|max:2000',
            'division_code' => 'prohibited', 'divisionCode' => 'prohibited', 'status' => 'prohibited',
            'created_by' => 'prohibited', 'reviewed_by' => 'prohibited', 'approved_by' => 'prohibited', 'voucher_no' => 'prohibited',
            'version' => $id ? 'required|integer|min:1' : 'prohibited',
        ]);

        try {
            $record = $this->service->save($id, $data, $request->attributes->get('user'));
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('IDEMPOTENCY_CONFLICT', 'Voucher untuk outlet, penerima dan referensi sumber ini sudah ada.');
        }

        return response()->json($record, $id ? 200 : 201);
    }

    public function action(Request $request, string $id, string $action)
    {
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'reason' => $action === 'submit' ? 'prohibited' : 'required|string|min:10|max:2000',
            'decision' => match ($action) {
                'review' => 'required|in:validate,return', 'decide' => 'required|in:approve,reject', default => 'prohibited'
            },
        ]);

        return response()->json($this->service->act($id, $action, $data, $request->attributes->get('user')));
    }
}
