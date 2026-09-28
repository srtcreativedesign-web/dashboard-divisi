<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminAttendanceRealization;
use App\Models\AdminLeaveRecord;
use App\Models\AdminVoucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function listLeaves(Request $request)
    {
        $query = AdminLeaveRecord::query();
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }
        return $query->with('employee')->get();
    }

    public function storeLeave(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'division_code' => 'required|string|max:10',
            'leave_type' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'days_taken' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return AdminLeaveRecord::create($validated);
    }

    public function storeAttendanceRealization(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'division_code' => 'required|string|max:10',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'days_scheduled' => 'required|integer',
            'days_present' => 'required|integer',
            'days_absent' => 'nullable|integer',
            'days_leave' => 'nullable|integer',
            'days_sick' => 'nullable|integer',
            'minutes_late' => 'nullable|integer',
        ]);

        return AdminAttendanceRealization::create($validated);
    }

    public function storeChairAudit(Request $request)
    {
        $validated = $request->validate([
            'division_code' => 'required|string|max:10',
            'outlet_id' => 'required|exists:outlets,id',
            'date' => 'required|date',
            'chair_no' => 'required|integer',
            'counter_start' => 'required|integer',
            'counter_end' => 'required|integer|gte:counter_start',
            'cctv_used' => 'required|integer',
            'pos_used' => 'required|integer',
            'notes' => 'nullable|string',
        ]);

        $counterUsed = $validated['counter_end'] - $validated['counter_start'];
        $deviation = $counterUsed - $validated['pos_used'];
        $status = $deviation !== 0 ? 'DEVIATION' : 'OK';

        $id = DB::table('acc_utilisasi_kursi')->insertGetId([
            'tanggal' => $validated['date'],
            'no_kursi' => $validated['chair_no'],
            'durasi_menit' => $counterUsed * 30,
            'terapis_nama' => 'Chair #' . $validated['chair_no'],
            'utilisasi_cctv' => $validated['cctv_used'] > 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $id,
            'division_code' => $validated['division_code'],
            'outlet_id' => $validated['outlet_id'],
            'date' => $validated['date'],
            'chair_no' => $validated['chair_no'],
            'counter_start' => $validated['counter_start'],
            'counter_end' => $validated['counter_end'],
            'cctv_used' => $validated['cctv_used'],
            'pos_used' => $validated['pos_used'],
            'deviation' => $deviation,
            'status' => $status,
            'notes' => $validated['notes'] ?? null,
        ];
    }

    public function storeTherapistRevenue(Request $request)
    {
        $validated = $request->validate([
            'division_code' => 'required|string|max:10',
            'outlet_id' => 'required|exists:outlets,id',
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'shift' => 'required|integer|in:1,2',
            'treatments_count' => 'required|integer',
            'revenue_share' => 'required|numeric|min:0',
            'tips' => 'required|numeric|min:0',
        ]);

        return [
            'id' => rand(100, 999),
            ...$validated,
        ];
    }

    public function storeStockCard(Request $request)
    {
        $validated = $request->validate([
            'division_code' => 'required|string|max:10',
            'outlet_id' => 'required|exists:outlets,id',
            'item_name' => 'required|string|max:100',
            'date' => 'required|date',
            'qty_initial' => 'required|integer|min:0',
            'qty_in' => 'required|integer|min:0',
            'qty_out' => 'required|integer|min:0',
            'qty_actual' => 'required|integer|min:0',
            'unit_cost' => 'required|numeric|min:0',
        ]);

        $cogs = $validated['qty_out'] * $validated['unit_cost'];

        $id = DB::table('acc_stok_opname')->insertGetId([
            'tanggal' => $validated['date'],
            'barang_nama' => $validated['item_name'],
            'stok_awal' => $validated['qty_initial'],
            'barang_datang' => $validated['qty_in'],
            'pemakaian' => $validated['qty_out'],
            'stok_akhir' => $validated['qty_actual'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $id,
            'cogs' => $cogs,
            ...$validated,
        ];
    }

    public function storeDeposit(Request $request)
    {
        $validated = $request->validate([
            'division_code' => 'required|string|max:10',
            'outlet_id' => 'required|exists:outlets,id',
            'date' => 'required|date',
            'shift' => 'required|integer|in:1,2',
            'cash_collected' => 'required|numeric|min:0',
            'cash_deposited' => 'required|numeric|min:0',
            'bank_destination' => 'required|string|max:100',
        ]);

        $id = DB::table('acc_storan_harian')->insertGetId([
            'tanggal' => $validated['date'],
            'shift' => $validated['shift'],
            'pendapatan_tunai' => $validated['cash_deposited'],
            'no_kysoft_sales' => 'DEP-' . date('Ymd', strtotime($validated['date'])) . '-SH' . $validated['shift'],
            'division_code' => $validated['division_code'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'id' => $id,
            'status' => 'VERIFIED',
            ...$validated,
        ];
    }

    public function storeVoucher(Request $request)
    {
        $validated = $request->validate([
            'division_code' => 'required|string|max:10',
            'type' => 'required|in:BILLING,PURCHASING',
            'entity_name' => 'required|string|max:150',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $user = $request->attributes->get('user');

        $voucher = AdminVoucher::create([
            'division_code' => $validated['division_code'],
            'voucher_no' => 'VCH-' . strtoupper($validated['type']) . '-' . date('Ymd') . '-' . rand(1000, 9999),
            'type' => $validated['type'],
            'entity_name' => $validated['entity_name'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'status' => 'DRAFT',
            'created_by' => $user['id'] ?? 1,
        ]);

        return $voucher;
    }
}
