<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\ProjectRab;
use App\Models\ProjectDocument;
use Illuminate\Support\Carbon;

class ProjectSeeder extends Seeder
{
    public function run()
    {
        $projects = [
            [
                'division_code' => 'PROJECT',
                'name' => 'Pembangunan Fasilitas Publik Tahap 1',
                'client_name' => 'Pemerintah Kota',
                'contract_value' => 2500000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subMonths(3)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(6)->format('Y-m-d'),
                'description' => 'Pembangunan area taman, fasilitas olahraga, dan gedung serbaguna.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Revitalisasi Area Perkantoran',
                'client_name' => 'PT Maju Bersama',
                'contract_value' => 1200000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subMonths(1)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(4)->format('Y-m-d'),
                'description' => 'Pembaruan interior dan eksterior gedung kantor utama.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Pemasangan Jaringan Listrik dan IT',
                'client_name' => 'Dinas Pendidikan',
                'contract_value' => 850000000,
                'status' => 'planning',
                'start_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(3)->format('Y-m-d'),
                'description' => 'Proyek jaringan di 10 sekolah.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Pembangunan Jembatan Akses',
                'client_name' => 'Kementerian PUPR',
                'contract_value' => 5500000000,
                'status' => 'on_hold',
                'start_date' => Carbon::now()->subMonths(6)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(12)->format('Y-m-d'),
                'description' => 'Pembangunan jembatan penghubung antar kecamatan.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Pembangunan Tower A',
                'client_name' => 'PT Properti Sentosa',
                'contract_value' => 12000000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subMonths(8)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(18)->format('Y-m-d'),
                'description' => 'Pembangunan menara apartemen 30 lantai.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Renovasi Puskesmas',
                'client_name' => 'Dinas Kesehatan',
                'contract_value' => 450000000,
                'status' => 'completed',
                'start_date' => Carbon::now()->subMonths(5)->format('Y-m-d'),
                'end_date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'description' => 'Renovasi gedung pelayanan dan IGD.',
            ],
            [
                'division_code' => 'PROJECT',
                'name' => 'Instalasi Sistem Peringatan Dini',
                'client_name' => 'BNPB',
                'contract_value' => 300000000,
                'status' => 'in_progress',
                'start_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'end_date' => Carbon::now()->addMonths(1)->format('Y-m-d'),
                'description' => 'Pemasangan sensor EWS di area pesisir.',
            ]
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

            // Dummy Milestones
            $m1 = ProjectMilestone::create([
                'project_id' => $project->id,
                'title' => 'Tahap Perencanaan & Desain',
                'weight_percentage' => 20,
                'actual_percentage' => 20,
                'payment_status' => true,
                'due_date' => Carbon::parse($project->start_date)->addDays(14),
                'completion_date' => Carbon::parse($project->start_date)->addDays(12),
                'status' => 'completed',
                'notes' => 'Desain arsitektur dan perizinan telah disetujui klien.',
            ]);

            // Seed photo before
            $project->photos()->create([
                'milestone_id' => $m1->id,
                'stage' => 'before',
                'area_name' => 'Kondisi Eksisting Awal',
                'caption' => 'Kondisi fisik lapangan sebelum pekerjaan dimulai.',
                'photo_path' => 'project_photos/sample-before.jpg',
                'taken_at' => Carbon::parse($project->start_date),
            ]);

            if ($project->status === 'in_progress' || $project->status === 'completed') {
                $m2 = ProjectMilestone::create([
                    'project_id' => $project->id,
                    'title' => 'Pekerjaan Struktur & Fondasi',
                    'weight_percentage' => 30,
                    'actual_percentage' => $project->status === 'completed' ? 30 : 25,
                    'payment_status' => $project->status === 'completed',
                    'due_date' => Carbon::parse($project->start_date)->addMonths(1),
                    'completion_date' => $project->status === 'completed' ? Carbon::parse($project->start_date)->addMonths(1) : null,
                    'status' => $project->status === 'completed' ? 'completed' : 'in_progress',
                    'notes' => 'Pekerjaan cor beton dan pembesian berjalan sesuai spesifikasi.',
                ]);

                // Seed photo in_progress
                $project->photos()->create([
                    'milestone_id' => $m2->id,
                    'stage' => 'in_progress',
                    'area_name' => 'Struktur Utama',
                    'caption' => 'Pengecoran struktur lantai dan pilar.',
                    'photo_path' => 'project_photos/sample-inprogress.jpg',
                    'taken_at' => Carbon::parse($project->start_date)->addDays(20),
                ]);
            }

            if ($project->status === 'completed') {
                $project->photos()->create([
                    'stage' => 'after',
                    'area_name' => 'Hasil Akhir',
                    'caption' => 'Kondisi selesai 100% dan siap serah terima.',
                    'photo_path' => 'project_photos/sample-after.jpg',
                    'taken_at' => Carbon::parse($project->end_date),
                ]);
            }
        }
    }
}
