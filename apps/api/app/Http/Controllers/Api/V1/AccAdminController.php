<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AccStoranHarian;
use App\Models\AccDetailCashless;
use App\Models\AccLaundryLog;
use App\Models\AccStokOpname;
use App\Models\AccUtilisasiKursi;
use App\Models\AccRekapKomisi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AccAdminController extends Controller
{
    private function scope($query)
    {
        $user = Auth::user();
        $divisionCode = $user?->division_code ?? 'ACC';
        return $query->where('division_code', $divisionCode);
    }

    public function dashboard(): JsonResponse
    {
        $totalOmset = $this->scope(AccStoranHarian::query())->sum("pendapatan_tunai")
            + $this->scope(AccDetailCashless::query())->sum("nominal_qris")
            + $this->scope(AccDetailCashless::query())->sum("nominal_edc");

        $totalPengeluaran = $this->scope(AccLaundryLog::query())->sum("total_tagihan");

        $totalLogKursi = $this->scope(AccUtilisasiKursi::query())->count();
        $okupansiPersen = $totalLogKursi > 0 ? min(100, round(($totalLogKursi / 300) * 100, 1)) : 0;

        $alerts = [];
        $unmatchedCctv = $this->scope(AccUtilisasiKursi::query())
            ->where("utilisasi_cctv", true)
            ->whereNull("terapis_nama")
            ->count();

        if ($unmatchedCctv > 0) {
            $alerts[] = [
                "type" => "danger",
                "message" => "Terdapat {$unmatchedCctv} pemakaian kursi terdeteksi CCTV tanpa data transaksi POS!"
            ];
        }

        $lowStocks = $this->scope(AccStokOpname::query())
            ->where("stok_akhir", "<", 5)
            ->pluck("barang_nama")->unique();

        foreach ($lowStocks as $item) {
            $alerts[] = [
                "type" => "warning",
                "message" => "Stok barang [{$item}] menipis (di bawah 5 unit)!"
            ];
        }

        return response()->json([
            "kpis" => [
                "total_omset" => $totalOmset,
                "okupansi" => $okupansiPersen,
                "total_pengeluaran" => $totalPengeluaran,
                "estimasi_profit" => $totalOmset - $totalPengeluaran,
            ],
            "alerts" => $alerts,
        ]);
    }

    public function getStoran(Request $request): JsonResponse
    {
        return response()->json($this->scope(AccStoranHarian::query())->orderBy("tanggal", "desc")->get());
    }

    public function saveStoran(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "shift" => "required|integer|min:1|max:2",
            "pendapatan_tunai" => "required|numeric|min:0",
            "no_kysoft_sales" => "nullable|string",
        ]);

        $data['division_code'] = Auth::user()?->division_code ?? 'ACC';

        $storan = DB::transaction(function () use ($data) {
            return AccStoranHarian::updateOrCreate(
                ["tanggal" => $data["tanggal"], "shift" => $data["shift"], "division_code" => $data['division_code']],
                $data
            );
        });

        return response()->json(["status" => "success", "data" => $storan]);
    }

    public function getCashless(): JsonResponse
    {
        return response()->json($this->scope(AccDetailCashless::query())->orderBy("tanggal", "desc")->get());
    }

    public function saveCashless(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "shift" => "required|integer|min:1|max:2",
            "nominal_qris" => "required|numeric|min:0",
            "nominal_edc" => "required|numeric|min:0",
            "no_storan_finance" => "nullable|string",
        ]);

        $cashless = DB::transaction(function () use ($data) {
            return AccDetailCashless::updateOrCreate(
                ["tanggal" => $data["tanggal"], "shift" => $data["shift"]],
                $data
            );
        });

        return response()->json(["status" => "success", "data" => $cashless]);
    }

    public function getLaundry(): JsonResponse
    {
        return response()->json($this->scope(AccLaundryLog::query())->orderBy("tanggal", "desc")->get());
    }

    public function saveLaundry(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "berat_kg" => "required|numeric|min:0",
            "harga_per_kg" => "required|numeric|min:0",
        ]);

        $data["total_tagihan"] = $data["berat_kg"] * $data["harga_per_kg"];

        $laundry = DB::transaction(function () use ($data) {
            return AccLaundryLog::create($data);
        });

        return response()->json(["status" => "success", "data" => $laundry]);
    }

    public function getStok(): JsonResponse
    {
        return response()->json($this->scope(AccStokOpname::query())->orderBy("tanggal", "desc")->get());
    }

    public function saveStok(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "barang_nama" => "required|string",
            "stok_awal" => "required|integer|min:0",
            "barang_datang" => "required|integer|min:0",
            "pemakaian" => "required|integer|min:0",
        ]);

        $data["stok_akhir"] = $data["stok_awal"] + $data["barang_datang"] - $data["pemakaian"];

        $stok = DB::transaction(function () use ($data) {
            return AccStokOpname::create($data);
        });

        return response()->json(["status" => "success", "data" => $stok]);
    }

    public function getUtilisasi(): JsonResponse
    {
        return response()->json($this->scope(AccUtilisasiKursi::query())->orderBy("tanggal", "desc")->get());
    }

    public function saveUtilisasi(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "no_kursi" => "required|integer|min:1|max:10",
            "jam_mulai" => "nullable|date_format:H:i",
            "jam_selesai" => "nullable|date_format:H:i",
            "durasi_menit" => "required|integer|min:0",
            "terapis_nama" => "nullable|string",
            "utilisasi_cctv" => "required|boolean",
        ]);

        $utilisasi = DB::transaction(function () use ($data) {
            return AccUtilisasiKursi::create($data);
        });

        return response()->json(["status" => "success", "data" => $utilisasi]);
    }

    public function getKomisi(): JsonResponse
    {
        return response()->json($this->scope(AccRekapKomisi::query())->orderBy("periode_akhir", "desc")->get());
    }

    public function hitungKomisi(Request $request): JsonResponse
    {
        $data = $request->validate([
            "periode_awal" => "required|date",
            "periode_akhir" => "required|date",
            "karyawan_nama" => "required|string",
            "sesi_30m" => "required|integer|min:0",
            "sesi_60m" => "required|integer|min:0",
            "sesi_90m" => "required|integer|min:0",
        ]);

        $data["total_bonus"] = ($data["sesi_30m"] * 2500)
            + ($data["sesi_60m"] * 5000)
            + ($data["sesi_90m"] * 7500);

        $komisi = DB::transaction(function () use ($data) {
            return AccRekapKomisi::create($data);
        });

        return response()->json(["status" => "success", "data" => $komisi]);
    }
}
