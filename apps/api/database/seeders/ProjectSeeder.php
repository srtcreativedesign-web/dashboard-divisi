<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\ProjectInvoice;
use App\Models\ProjectMilestone;
use App\Models\ProjectRab;
use App\Models\ProjectVendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ProjectSeeder extends Seeder
{
    public function run()
    {
        // 1. Seed Master Vendors Proyek
        $vendors = [
            [
                'name' => 'PT Semen Nusantara Beton',
                'category' => 'Supplier Material',
                'contact_person' => 'Bambang Sudiro',
                'phone' => '081234567890',
                'email' => 'sales@nusantarabeton.test',
                'bank_details' => 'Bank Mandiri 123-00-9876543-1 a.n PT Semen Nusantara Beton',
            ],
            [
                'name' => 'CV Mitra Baja & Besi Mandiri',
                'category' => 'Supplier Baja & Besi',
                'contact_person' => 'Hendra Setiawan',
                'phone' => '081398765432',
                'email' => 'order@mitrabaja.test',
                'bank_details' => 'BCA 8820192831 a.n Hendra Setiawan',
            ],
            [
                'name' => 'PT Solusi MEP Jaya',
                'category' => 'Subkontraktor Elektrikal',
                'contact_person' => 'Ir. Dimas Prayoga',
                'phone' => '081187654321',
                'email' => 'proyek@mepjaya.test',
                'bank_details' => 'BNI 0492817293 a.n PT Solusi MEP Jaya',
            ],
            [
                'name' => 'CV Rental Alat Berat Utama',
                'category' => 'Sewa Alat Berat',
                'contact_person' => 'Agus Prasetyo',
                'phone' => '081578901234',
                'email' => 'rental@alatberatutama.test',
                'bank_details' => 'BRI 029301928374501 a.n Agus Prasetyo',
            ],
        ];

        $vendorModels = [];
        foreach ($vendors as $vData) {
            $vendor = ProjectVendor::firstOrCreate(
                ['name' => $vData['name']],
                $vData
            );
            $vendorModels[] = $vendor;
        }

        // 2. Daftar Master Proyek
        $projects = [
            [
                'division_code' => 'PROJECT',
                'name' => 'Pembangunan Fasilitas Publik Tahap 1',
                'client_name' => 'Pemerintah Kota',
                'contract_value' => 2500000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subMonths(3)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(6)->format('Y-m-d'),
                'description' => 'Pembangunan area taman terbuka hijau, fasilitas olahraga outdoor, dan gedung serbaguna.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Revitalisasi Area Perkantoran',
                'client_name' => 'PT Maju Bersama',
                'contract_value' => 1200000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subMonths(1)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(4)->format('Y-m-d'),
                'description' => 'Pembaruan interior, partisi modular, instalasi kelistrikan, dan fasad gedung utama.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Pemasangan Jaringan Listrik dan IT',
                'client_name' => 'Dinas Pendidikan',
                'contract_value' => 850000000,
                'status' => 'planning',
                'start_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(3)->format('Y-m-d'),
                'description' => 'Instalasi LAN berkecepatan tinggi, fiber optik, dan pengadaan rack server di 10 sekolah.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Renovasi Puskesmas Rawat Inap',
                'client_name' => 'Dinas Kesehatan',
                'contract_value' => 450000000,
                'status' => 'completed',
                'start_date' => Carbon::now()->subMonths(5)->format('Y-m-d'),
                'end_date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'description' => 'Renovasi gedung IGD 24 jam, ruang tindakan, dan upgrade instalasi gas medis.',
            ],
        ];

        $index = 1;
        foreach ($projects as $projData) {
            $code = sprintf('PRJ-2026-%03d', $index++);
            $existing = Project::where('name', $projData['name'])->orWhere('project_code', $code)->first();
            if ($existing) {
                continue;
            }

            $projData['project_code'] = $code;
            $projData['location'] = 'Jakarta & Sekitarnya';
            $project = Project::create($projData);

            // A. Seed Milestones
            $m1 = ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => 'Tahap 1: Perencanaan Teknis & Desain BAST 0',
                'weight_percentage' => 20,
                'actual_percentage' => 20,
                'payment_status' => true,
                'due_date' => Carbon::parse($project->start_date)->addDays(14),
                'completion_date' => Carbon::parse($project->start_date)->addDays(12),
                'status' => 'completed',
                'notes' => 'Gambar kerja teknis, shop drawing, dan perizinan telah disetujui klien.',
            ]);

            $m2 = ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => 'Tahap 2: Pekerjaan Struktur Bawah & Pondasi',
                'weight_percentage' => 35,
                'actual_percentage' => $project->status === 'completed' ? 35 : ($project->status === 'planning' ? 0 : 30),
                'payment_status' => $project->status === 'completed',
                'due_date' => Carbon::parse($project->start_date)->addMonths(1),
                'completion_date' => $project->status === 'completed' ? Carbon::parse($project->start_date)->addMonths(1) : null,
                'status' => $project->status === 'completed' ? 'completed' : ($project->status === 'planning' ? 'pending' : 'in_progress'),
                'notes' => 'Pekerjaan galian, pembesian balok sloof, dan pengecoran pondasi.',
            ]);

            $m3 = ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => 'Tahap 3: Pekerjaan Arsitektur & Finishing',
                'weight_percentage' => 30,
                'actual_percentage' => $project->status === 'completed' ? 30 : 0,
                'payment_status' => $project->status === 'completed',
                'due_date' => Carbon::parse($project->start_date)->addMonths(3),
                'completion_date' => $project->status === 'completed' ? Carbon::parse($project->start_date)->addMonths(3) : null,
                'status' => $project->status === 'completed' ? 'completed' : 'pending',
                'notes' => 'Pemasangan dinding bata ringan, lantai keramik granit, dan pengecatan.',
            ]);

            $m4 = ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => 'Tahap 4: Serah Terima Pertama (BAST 1) & Retensi',
                'weight_percentage' => 15,
                'actual_percentage' => $project->status === 'completed' ? 15 : 0,
                'payment_status' => $project->status === 'completed',
                'due_date' => Carbon::parse($project->end_date),
                'completion_date' => $project->status === 'completed' ? Carbon::parse($project->end_date) : null,
                'status' => $project->status === 'completed' ? 'completed' : 'pending',
                'notes' => 'Pemeriksaan bersama BAST 1 dan masa pemeliharaan retensi 5%.',
            ]);

            // B. Seed RAB Items
            $rab1 = ProjectRab::create([
                'project_id' => $project->id,
                'item_name' => 'Pengadaan Semen Portland & Ready-Mix',
                'category' => 'material',
                'volume' => 150,
                'unit' => 'm3',
                'unit_price' => 850000,
                'total_price' => 127500000,
            ]);

            $rab2 = ProjectRab::create([
                'project_id' => $project->id,
                'item_name' => 'Baja Tulangan & Wiremesh',
                'category' => 'material',
                'volume' => 12000,
                'unit' => 'kg',
                'unit_price' => 14500,
                'total_price' => 174000000,
            ]);

            $rab3 = ProjectRab::create([
                'project_id' => $project->id,
                'item_name' => 'Upah Tenaga Kerja Tukang & Mandor',
                'category' => 'labor',
                'volume' => 90,
                'unit' => 'hari',
                'unit_price' => 1200000,
                'total_price' => 108000000,
            ]);

            $rab4 = ProjectRab::create([
                'project_id' => $project->id,
                'item_name' => 'Instalasi Elektrikal & Panel Distribusi',
                'category' => 'subcon',
                'volume' => 1,
                'unit' => 'ls',
                'unit_price' => 65000000,
                'total_price' => 65000000,
            ]);

            $rab5 = ProjectRab::create([
                'project_id' => $project->id,
                'item_name' => 'Sewa Excavator & Mobilisasi Alat',
                'category' => 'equipment',
                'volume' => 14,
                'unit' => 'shift',
                'unit_price' => 2500000,
                'total_price' => 35000000,
            ]);

            // C. Seed Realized Expenses (Biaya Riil Lapangan)
            if ($project->status === 'in_progress' || $project->status === 'completed') {
                ProjectExpense::create([
                    'project_id' => $project->id,
                    'project_rab_id' => $rab1->id,
                    'project_vendor_id' => $vendorModels[0]->id,
                    'item_name' => 'Pembelian Semen Ready-Mix Tahap 1',
                    'category' => 'material',
                    'amount' => 65000000,
                    'expense_date' => Carbon::parse($project->start_date)->addDays(10)->format('Y-m-d'),
                    'notes' => 'Pengiriman cor tahap pertama plat pondasi 75 m3.',
                ]);

                ProjectExpense::create([
                    'project_id' => $project->id,
                    'project_rab_id' => $rab2->id,
                    'project_vendor_id' => $vendorModels[1]->id,
                    'item_name' => 'Pengadaan Besi Beton D13 Ulir & Kawat',
                    'category' => 'material',
                    'amount' => 95000000,
                    'expense_date' => Carbon::parse($project->start_date)->addDays(15)->format('Y-m-d'),
                    'notes' => 'Besi ulir sertifikasi SNI, nota lunas.',
                ]);

                ProjectExpense::create([
                    'project_id' => $project->id,
                    'project_rab_id' => $rab3->id,
                    'project_vendor_id' => null,
                    'item_name' => 'Pembayaran Upah Tukang & Mandor Minggu 1-4',
                    'category' => 'labor',
                    'amount' => 45000000,
                    'expense_date' => Carbon::parse($project->start_date)->addDays(28)->format('Y-m-d'),
                    'notes' => 'Transfer payroll mandor lapangan.',
                ]);

                ProjectExpense::create([
                    'project_id' => $project->id,
                    'project_rab_id' => $rab5->id,
                    'project_vendor_id' => $vendorModels[3]->id,
                    'item_name' => 'Sewa Excavator Mini Galian Tanah',
                    'category' => 'equipment',
                    'amount' => 17500000,
                    'expense_date' => Carbon::parse($project->start_date)->addDays(5)->format('Y-m-d'),
                    'notes' => '7 shift pekerjaan galian saluran drainase.',
                ]);
            }

            // D. Seed Termin Invoices
            $inv1 = ProjectInvoice::create([
                'project_id' => $project->id,
                'project_milestone_id' => $m1->id,
                'invoice_number' => sprintf('INV/%s/%s/001', preg_replace('/[^A-Za-z0-9]/', '', $code), Carbon::parse($project->start_date)->format('Ymd')),
                'term_name' => 'Termin 1 (Uang Muka 20%)',
                'amount' => $project->contract_value * 0.20,
                'status' => 'paid',
                'due_date' => Carbon::parse($project->start_date)->addDays(14)->format('Y-m-d'),
                'paid_date' => Carbon::parse($project->start_date)->addDays(12)->format('Y-m-d'),
                'payment_reference' => 'TRF-KLIEN-9823412',
                'notes' => 'Pembayaran uang muka kontrak via transfer bank.',
            ]);

            if ($project->status === 'in_progress' || $project->status === 'completed') {
                $inv2Status = $project->status === 'completed' ? 'paid' : 'invoiced';
                ProjectInvoice::create([
                    'project_id' => $project->id,
                    'project_milestone_id' => $m2->id,
                    'invoice_number' => sprintf('INV/%s/%s/002', preg_replace('/[^A-Za-z0-9]/', '', $code), Carbon::parse($project->start_date)->addMonths(1)->format('Ymd')),
                    'term_name' => 'Termin 2 (Progres Pondasi 35%)',
                    'amount' => $project->contract_value * 0.35,
                    'status' => $inv2Status,
                    'due_date' => Carbon::parse($project->start_date)->addDays(45)->format('Y-m-d'),
                    'paid_date' => $project->status === 'completed' ? Carbon::parse($project->start_date)->addDays(40)->format('Y-m-d') : null,
                    'payment_reference' => $project->status === 'completed' ? 'TRF-KLIEN-9912048' : null,
                    'notes' => 'Tagihan termin progres struktur dasar.',
                ]);
            }

            // E. Seed Progress Photos (Before, In-Progress, After)
            // Area: Fasad Depan
            $project->photos()->create([
                'milestone_id' => $m1->id,
                'stage' => 'before',
                'area_name' => 'Fasad Depan & Pintu Masuk',
                'caption' => 'Kondisi bangunan eksisting sebelum pengerjaan renovasi dimulai.',
                'photo_path' => 'project_photos/sample-before.jpg',
                'taken_at' => Carbon::parse($project->start_date)->format('Y-m-d'),
            ]);

            if ($project->status === 'in_progress' || $project->status === 'completed') {
                $project->photos()->create([
                    'milestone_id' => $m2->id,
                    'stage' => 'in_progress',
                    'area_name' => 'Fasad Depan & Pintu Masuk',
                    'caption' => 'Pemasangan rangka baja struktural dan perbaikan elevasi lantai.',
                    'photo_path' => 'project_photos/sample-inprogress.jpg',
                    'taken_at' => Carbon::parse($project->start_date)->addDays(25)->format('Y-m-d'),
                ]);
            }

            if ($project->status === 'completed') {
                $project->photos()->create([
                    'milestone_id' => $m4->id,
                    'stage' => 'after',
                    'area_name' => 'Fasad Depan & Pintu Masuk',
                    'caption' => 'Pekerjaan fasad selesai 100%, serah terima fisik BAST.',
                    'photo_path' => 'project_photos/sample-after.jpg',
                    'taken_at' => Carbon::parse($project->end_date)->format('Y-m-d'),
                ]);
            }

            // Area: Ruang Interior Utama
            $project->photos()->create([
                'milestone_id' => $m1->id,
                'stage' => 'before',
                'area_name' => 'Ruang Interior Utama',
                'caption' => 'Area interior lama sebelum pembongkaran dan relokasi sekat.',
                'photo_path' => 'project_photos/sample-before.jpg',
                'taken_at' => Carbon::parse($project->start_date)->addDays(1)->format('Y-m-d'),
            ]);

            if ($project->status === 'completed') {
                $project->photos()->create([
                    'milestone_id' => $m4->id,
                    'stage' => 'after',
                    'area_name' => 'Ruang Interior Utama',
                    'caption' => 'Finishing lantai granit, partisi kaca, dan tata cahaya selesai.',
                    'photo_path' => 'project_photos/sample-after.jpg',
                    'taken_at' => Carbon::parse($project->end_date)->format('Y-m-d'),
                ]);
            }
        }
    }
}
