<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\Accounting\HrRecapService;
use App\Services\OrgReadModelService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HrRecapController extends Controller
{
    public function __construct(private HrRecapService $service, private OrgReadModelService $org) {}

    private function mutate(callable $work, int $status = 201)
    {
        try {
            return response()->json(DB::transaction($work), $status);
        } catch (UniqueConstraintViolationException $e) {
            throw new ApiException('VERSION_CONFLICT', 'Kode, referensi atau absensi telah tercatat.');
        }
    }

    public function employees(Request $r)
    {
        return response()->json($this->org->accountingEmployees($r->attributes->get('user')));
    }

    public function createEmployee(Request $r)
    {
        $data = $r->validate(['code' => 'required|string|max:50|regex:/^[A-Za-z0-9_-]+$/', 'name' => 'required|string|max:255', 'source_reference' => 'required|string|max:255']);

        return $this->mutate(fn () => $this->org->createAccountingEmployee($data, $r->attributes->get('user')));
    }

    public function index(Request $r)
    {
        return response()->json($this->service->list($r->validate(['kind' => 'required|in:leave,attendance', 'month' => 'required|date_format:Y-m', 'page' => 'nullable|integer|min:1|max:1000000']), $r->attributes->get('user')));
    }

    public function show(Request $r, string $id)
    {
        return response()->json($this->service->get($id, $r->attributes->get('user')));
    }

    private function data(Request $r, bool $correction): array
    {
        $rules = ['kind' => 'required|in:leave,attendance', 'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required_if:kind,leave|nullable|date_format:Y-m-d|after_or_equal:start_date',
            'leave_type' => 'required_if:kind,leave|nullable|string|max:100',
            'source_days' => ['required_if:kind,leave', 'nullable', 'regex:/^\d{1,3}(\.\d{1,2})?$/'],
            'approval_reference' => 'required_if:kind,leave|nullable|string|max:255',
            'attendance_status' => 'required_if:kind,attendance|nullable|in:PRESENT,ABSENT,LEAVE,SICK,OFF',
            'schedule_reference' => 'required_if:kind,attendance|nullable|string|max:255',
            'late_minutes' => 'required_if:kind,attendance|nullable|integer|min:0|max:1440'];
        if ($correction) {
            $rules += ['version' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:2000', 'employee_id' => 'prohibited', 'source_reference' => 'prohibited'];
        } else {
            $rules += ['employee_id' => 'required|uuid', 'source_reference' => 'required|string|max:255'];
        }

        return $r->validate($rules);
    }

    public function store(Request $r)
    {
        $data = $this->data($r, false);

        return $this->mutate(fn () => $this->service->create($data, $r->attributes->get('user')));
    }

    public function update(Request $r, string $id)
    {
        $data = $this->data($r, true);

        return $this->mutate(fn () => $this->service->change($id, $data, $r->attributes->get('user')), 200);
    }

    public function void(Request $r, string $id)
    {
        $data = $r->validate(['version' => 'required|integer|min:1', 'reason' => 'required|string|min:10|max:2000']);

        return $this->mutate(fn () => $this->service->change($id, $data, $r->attributes->get('user'), true), 200);
    }
}
