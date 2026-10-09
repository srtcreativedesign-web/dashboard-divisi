<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\AnnualOmzetService;
use App\Services\Accounting\OmzetService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class OmzetController extends Controller
{
    public function __construct(private OmzetService $service) {}

    public function outlets(Request $request)
    {
        return response()->json($this->service->outlets($request->attributes->get('user')));
    }

    public function annual(Request $request, AnnualOmzetService $report)
    {
        $data = $request->validate(['year' => 'required|integer|min:1900|max:9999']);

        return response()->json($report->report($data['year'], $request->attributes->get('user')));
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'month' => 'required|date_format:Y-m',
            'status' => 'nullable|in:draft,submitted,correction,pending_approval,validated',
            'outlet_id' => 'nullable|uuid',
            'page' => 'nullable|integer|min:1',
        ]);

        return response()->json($this->service->list($filters));
    }

    public function show(string $id)
    {
        return response()->json($this->service->detail($id));
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
        $rules = [
            'outlet_id' => 'required|uuid',
            'business_date' => 'required|date_format:Y-m-d',
            'shift' => 'required|string|max:30',
            'requires_ap' => 'required|boolean',
            'source_reference' => 'required|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'expense_amount' => ['sometimes', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'shift_breakdown' => 'sometimes|array|min:1|max:3',
            'shift_breakdown.*.shift_no' => 'required|integer|between:1,3|distinct',
            'shift_breakdown.*.gross_amount' => ['required', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'division_code' => 'prohibited', 'divisionCode' => 'prohibited',
            'status' => 'prohibited', 'created_by' => 'prohibited', 'ap_amount' => 'prohibited', 'expected_deposit_amount' => 'prohibited',
            'version' => $id ? 'required|integer|min:1' : 'prohibited',
        ];
        foreach (OmzetService::AMOUNTS as $field) {
            $rules[$field] = ['required', 'regex:/^\d{1,12}(\.\d{1,2})?$/'];
        }
        $data = $request->validate($rules);
        try {
            $record = $this->service->save($id, $data, $request->attributes->get('user'));
        } catch (UniqueConstraintViolationException) {
            throw new ApiException('IDEMPOTENCY_CONFLICT', 'Rekap outlet, tanggal, dan shift ini sudah ada. Buka rekap yang tercatat.');
        }

        return response()->json($record, $id ? 200 : 201);
    }

    public function action(Request $request, string $id, string $action)
    {
        $data = $request->validate([
            'version' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:2000',
            'decision' => 'nullable|in:validate,return,approve,reject',
            'ap_amount' => ['nullable', 'regex:/^\d{1,12}(\.\d{1,2})?$/'],
            'unlock_id' => 'nullable|uuid',
        ]);

        return response()->json($this->service->act($id, $action, $data, $request->attributes->get('user')));
    }
}
