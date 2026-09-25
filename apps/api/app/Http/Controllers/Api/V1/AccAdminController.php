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

class AccAdminController extends Controller
{
    // Modul 1: Dashboard Analytics
    public function dashboard(): JsonResponse
    {
        $totalOmset = AccStoranHarian::sum("pendapatan_tunai") 
            + AccDetailCashless::sum("nominal_qris") 
            + AccDetailCashless::sum("nominal_edc");

        $totalPengeluaran = AccLaundryLog::sum("total_tagihan");

        // Okupansi kursi harian (dari max 10 kursi x total hari tercatat)
        $totalLogKursi = AccUtilisasiKursi::count();
        $okupansiPersen = $totalLogKursi > 0 ? min(100, round(($totalLogKursi / 300) * 100, 1)) : 0;

        // Alarm deteksi fraud (jika CCTV terisi tapi tidak ada transaksi Kysoft)
        $alerts = [];
        $unmatchedCctv = AccUtilisasiKursi::where("utilisasi_cctv", true)
            ->whereNull("terapis_nama")
            ->count();

        if ($unmatchedCctv > 0) {
            $alerts[] = [
                "type" => "danger",
                "message" => "Terdapat {$unmatchedCctv} pemakaian kursi terdeteksi CCTV tanpa data transaksi POS!"
            ];
        }

        // Low stock alerts
        $lowStocks = AccStokOpname::where("stok_akhir", "<", 5)->pluck("barang_nama")->unique();
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

    // Modul 2: Pemasukan & Ops (Storan & Cashless & Laundry)
    public function getStoran(Request $request): JsonResponse
    {
        return response()->json(AccStoranHarian::orderBy("tanggal", "desc")->get());
    }

    public function saveStoran(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "shift" => "required|integer",
            "pendapatan_tunai" => "required|numeric",
            "no_kysoft_sales" => "nullable|string",
        ]);

        $storan = AccStoranHarian::updateOrCreate(
            ["tanggal" => $data["tanggal"], "shift" => $data["shift"]],
            $data
        );

        return response()->json(["status" => "success", "data" => $storan]);
    }

    public function getCashless(): JsonResponse
    {
        return response()->json(AccDetailCashless::orderBy("tanggal", "desc")->get());
    }

    public function saveCashless(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "shift" => "required|integer",
            "nominal_qris" => "required|numeric",
            "nominal_edc" => "required|numeric",
            "no_storan_finance" => "nullable|string",
        ]);

        $cashless = AccDetailCashless::updateOrCreate(
            ["tanggal" => $data["tanggal"], "shift" => $data["shift"]],
            $data
        );

        return response()->json(["status" => "success", "data" => $cashless]);
    }

    public function getLaundry(): JsonResponse
    {
        return response()->json(AccLaundryLog::orderBy("tanggal", "desc")->get());
    }

    public function saveLaundry(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "berat_kg" => "required|numeric",
            "harga_per_kg" => "required|numeric",
        ]);

        $data["total_tagihan"] = $data["berat_kg"] * $data["harga_per_kg"];

        $laundry = AccLaundryLog::create($data);

        return response()->json(["status" => "success", "data" => $laundry]);
    }

    // Modul 3: Persediaan & Stok
    public function getStok(): JsonResponse
    {
        return response()->json(AccStokOpname::orderBy("tanggal", "desc")->get());
    }

    public function saveStok(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "barang_nama" => "required|string",
            "stok_awal" => "required|integer",
            "barang_datang" => "required|integer",
            "pemakaian" => "required|integer",
        ]);

        $data["stok_akhir"] = $data["stok_awal"] + $data["barang_datang"] - $data["pemakaian"];

        $stok = AccStokOpname::create($data);

        return response()->json(["status" => "success", "data" => $stok]);
    }

    // Modul 4: Audit CCTV & Kursi
    public function getUtilisasi(): JsonResponse
    {
        return response()->json(AccUtilisasiKursi::orderBy("tanggal", "desc")->get());
    }

    public function saveUtilisasi(Request $request): JsonResponse
    {
        $data = $request->validate([
            "tanggal" => "required|date",
            "no_kursi" => "required|integer",
            "jam_mulai" => "nullable|string",
            "jam_selesai" => "nullable|string",
            "durasi_menit" => "required|integer",
            "terapis_nama" => "nullable|string",
            "utilisasi_cctv" => "required|boolean",
        ]);

        $utilisasi = AccUtilisasiKursi::create($data);

        return response()->json(["status" => "success", "data" => $utilisasi]);
    }

    // Modul 5: Komisi & Bonus
    public function getKomisi(): JsonResponse
    {
        return response()->json(AccRekapKomisi::orderBy("periode_akhir", "desc")->get());
    }

    public function hitungKomisi(Request $request): JsonResponse
    {
        $data = $request->validate([
            "periode_awal" => "required|date",
            "periode_akhir" => "required|date",
            "karyawan_nama" => "required|string",
            "sesi_30m" => "required|integer",
            "sesi_60m" => "required|integer",
            "sesi_90m" => "required|integer",
        ]);

        // Hitung komisi: Rp 2500 per sesi 30m, Rp 5000 per 60m, Rp 7500 per 90m
        $data["total_bonus"] = ($data["sesi_30m"] * 2500) 
            + ($data["sesi_60m"] * 5000) 
            + ($data["sesi_90m"] * 7500);

        $komisi = AccRekapKomisi::create($data);

        return response()->json(["status" => "success", "data" => $komisi]);
    }
}

