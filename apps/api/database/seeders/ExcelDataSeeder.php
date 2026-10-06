<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class ExcelDataSeeder extends Seeder
{
    public function run(): void
    {
        $json = File::get(storage_path('app/seed_data.json'));
        $data = json_decode($json, true);

        if (isset($data['acc_storan_harian'])) {
            foreach ($data['acc_storan_harian'] as $row) {
                DB::table('acc_storan_harian')->updateOrInsert(
                    ['tanggal' => $row['tanggal'], 'shift' => $row['shift'], 'division_code' => 'ACC'],
                    ['pendapatan_tunai' => $row['pendapatan_tunai'], 'no_kysoft_sales' => 'SYS-'.rand(1000,9999)]
                );
            }
        }

        if (isset($data['acc_detail_cashless'])) {
            foreach ($data['acc_detail_cashless'] as $row) {
                DB::table('acc_detail_cashless')->updateOrInsert(
                    ['tanggal' => $row['tanggal'], 'shift' => $row['shift']],
                    ['nominal_qris' => $row['nominal_qris'], 'nominal_edc' => $row['nominal_edc'], 'no_storan_finance' => $row['no_storan_finance'], 'division_code' => 'ACC']
                );
            }
        }

        if (isset($data['acc_stok_opname'])) {
            foreach ($data['acc_stok_opname'] as $row) {
                DB::table('acc_stok_opname')->updateOrInsert(
                    ['tanggal' => $row['tanggal'], 'barang_nama' => $row['barang_nama']],
                    [
                        'stok_awal' => $row['stok_awal'],
                        'barang_datang' => $row['barang_datang'],
                        'pemakaian' => $row['pemakaian'],
                        'stok_akhir' => $row['stok_akhir'],
                        'division_code' => 'ACC'
                    ]
                );
            }
        }

        if (isset($data['acc_utilisasi_kursi'])) {
            foreach ($data['acc_utilisasi_kursi'] as $row) {
                DB::table('acc_utilisasi_kursi')->updateOrInsert(
                    ['tanggal' => $row['tanggal'], 'no_kursi' => $row['no_kursi'], 'jam_mulai' => $row['jam_mulai']],
                    [
                        'jam_selesai' => $row['jam_selesai'],
                        'durasi_menit' => $row['durasi_menit'],
                        'terapis_nama' => $row['terapis_nama'],
                        'utilisasi_cctv' => $row['utilisasi_cctv'],
                        'division_code' => 'ACC'
                    ]
                );
            }
        }

        if (isset($data['acc_rekap_komisi'])) {
            foreach ($data['acc_rekap_komisi'] as $row) {
                DB::table('acc_rekap_komisi')->updateOrInsert(
                    ['periode_awal' => $row['periode_awal'], 'periode_akhir' => $row['periode_akhir'], 'karyawan_nama' => $row['karyawan_nama']],
                    [
                        'sesi_30m' => $row['sesi_30m'],
                        'sesi_60m' => $row['sesi_60m'],
                        'sesi_90m' => $row['sesi_90m'],
                        'total_bonus' => $row['total_bonus'],
                        'division_code' => 'ACC'
                    ]
                );
            }
        }

        $this->command->info('Excel data seeded successfully!');
    }
}
