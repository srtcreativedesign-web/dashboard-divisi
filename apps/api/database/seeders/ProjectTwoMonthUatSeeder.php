<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\ProjectInvoice;
use App\Models\ProjectMilestone;
use App\Models\ProjectPettyCash;
use App\Models\ProjectRab;
use App\Models\ProjectVendor;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ProjectTwoMonthUatSeeder extends Seeder
{
    public const BATCH = 'PRJ-UAT-202609-202610';

    public function run(): void
    {
        if (! app()->environment('testing')) {
            $backup = getenv('ERP_PROJECT_SEED_BACKUP') ?: '';
            if (! app()->environment('local') || config('database.default') !== 'pgsql'
                || config('database.connections.pgsql.database') !== 'dashboard_divisi_mvp'
                || ! in_array(config('database.connections.pgsql.host'), ['localhost', '127.0.0.1'], true)
                || ! is_file($backup) || ! str_ends_with($backup, '.erpbackup') || filesize($backup) < 1024) {
                throw new RuntimeException('Target seed atau backup ditolak.');
            }
        }
        DB::transaction(function () {
            if (DB::getDriverName() === 'pgsql') {
                DB::select('SELECT pg_advisory_xact_lock(20261008)');
            }
            $actor = User::where('email', 'admin.project@dashboard.test')->where('division_code', 'PROJECT')->where('role', 'ADMIN')->where('is_active', true)->firstOrFail();
            $vendor = ProjectVendor::firstOrCreate(['name' => self::BATCH.' Pemasok SIMULASI'], ['category' => 'material', 'contact_person' => 'Kontak UAT', 'email' => 'vendor.project@example.test']);
            $specs = [
                ['Renovasi outlet terminal', 'new', 'completed', '2026-09-01', '2026-09-30', 120000000],
                ['Pemeliharaan instalasi listrik', 'maintenance', 'completed', '2026-09-01', '2026-09-30', 60000000],
                ['Penataan interior kantor', 'new', 'in_progress', '2026-09-01', '2026-10-31', 200000000],
                ['Pemeliharaan AC outlet', 'maintenance', 'on_hold', '2026-09-01', '2026-10-31', 80000000],
                ['Pembangunan booth Cellular', 'new', 'in_progress', '2026-10-01', '2026-11-30', 150000000],
                ['Pemeliharaan jaringan outlet', 'maintenance', 'in_progress', '2026-10-01', '2026-10-31', 50000000],
                ['Penataan gudang', 'new', 'planning', '2026-10-01', '2026-11-30', 90000000],
                ['Pemeliharaan signage', 'maintenance', 'planning', '2026-10-01', '2026-10-31', 40000000],
            ];
            foreach ($specs as $index => [$name, $classification, $status, $start, $end, $contract]) {
                $code = self::BATCH.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
                $existing = Project::withoutGlobalScopes()->where('project_code', $code)->first();
                if ($existing) {
                    if ($existing->division_code !== 'PROJECT' || ! str_contains($existing->description ?? '', self::BATCH)) {
                        throw new RuntimeException('Kode proyek seed berbenturan.');
                    }

                    continue;
                }
                $project = Project::create(['division_code' => 'PROJECT', 'project_code' => $code, 'name' => '[UAT] '.$name, 'client_name' => 'Klien SIMULASI '.($index + 1), 'location' => 'Lokasi uji internal', 'description' => self::BATCH.' — data sintetis untuk pengujian; bukan transaksi perusahaan.', 'classification' => $classification, 'status' => $status, 'contract_value' => (string) $contract, 'start_date' => $start, 'end_date' => $end]);
                $project->forceFill(['created_at' => $start.' 08:00:00'])->save();
                $milestones = [];
                foreach (['Persiapan', 'Pelaksanaan', 'Serah terima'] as $i => $title) {
                    $done = $status === 'completed' || ($status !== 'planning' && $i === 0);
                    $milestones[] = ProjectMilestone::create(['project_id' => $project->id, 'title' => $title.' [UAT]', 'weight_percentage' => [20, 60, 20][$i], 'status' => $done ? 'completed' : 'pending', 'payment_status' => $done, 'due_date' => $i === 0 ? $start : $end]);
                }
                $rabs = [];
                foreach (['material', 'labor', 'overhead'] as $i => $category) {
                    $budget = $contract * [40, 25, 10][$i] / 100;
                    $rabs[] = ProjectRab::create(['project_id' => $project->id, 'item_name' => ['Material proyek', 'Tenaga kerja', 'Operasional lapangan'][$i].' [UAT]', 'category' => $category, 'volume' => 1, 'unit' => 'paket', 'unit_price' => (string) $budget, 'total_price' => (string) $budget]);
                }
                app(AuditService::class)->logRequired(['actorId' => $actor->id, 'actorRole' => 'ADMIN', 'divisionCode' => 'PROJECT', 'entity' => 'Project', 'entityId' => (string) $project->id, 'action' => 'project.uat.seed.created', 'metadata' => ['batch' => self::BATCH, 'source' => 'local-fixture']]);
                if ($status === 'planning') {
                    ProjectInvoice::create(['project_id' => $project->id, 'project_milestone_id' => $milestones[0]->id, 'invoice_number' => $code.'-DRAF', 'term_name' => 'Draf uang muka [UAT]', 'amount' => (string) ($contract / 5), 'status' => 'draft', 'due_date' => '2026-10-15', 'notes' => self::BATCH.' SIMULASI', 'created_by' => $actor->id]);

                    continue;
                }
                $last = Carbon::parse($end)->min(Carbon::parse('2026-10-08'));
                foreach (['2026-09-01', '2026-10-01'] as $date) {
                    if ($date < $start || $date > $last->toDateString()) {
                        continue;
                    }
                    ProjectPettyCash::create(['project_id' => $project->id, 'type' => 'in', 'category' => 'Top-Up Kas', 'amount' => '2000000.00', 'transaction_date' => $date, 'description' => self::BATCH.' SIMULASI top-up', 'created_by' => $actor->id]);
                }
                for ($date = Carbon::parse($start); $date->lte($last); $date->addDay()) {
                    ProjectPettyCash::create(['project_id' => $project->id, 'type' => 'out', 'category' => 'Operasional Lapangan', 'amount' => (string) (25000 + $index * 5000), 'transaction_date' => $date->toDateString(), 'description' => self::BATCH.' SIMULASI transport lapangan', 'recipient_or_vendor' => 'Tim UAT', 'created_by' => $actor->id]);
                    if ($date->day % 7 === 1) {
                        ProjectExpense::create(['project_id' => $project->id, 'project_rab_id' => $rabs[0]->id, 'project_vendor_id' => $vendor->id, 'item_name' => 'Material mingguan [UAT]', 'category' => 'material', 'amount' => (string) ($contract / 100), 'expense_date' => $date->toDateString(), 'notes' => self::BATCH.' SIMULASI; terpisah dari kas kecil', 'created_by' => $actor->id]);
                    }
                }
                foreach ([20, 60, 20] as $i => $percent) {
                    $paid = $status === 'completed' || $i === 0;
                    $invoiceStatus = $paid ? 'paid' : ($index === 3 && $i === 1 ? 'overdue' : 'invoiced');
                    ProjectInvoice::create(['project_id' => $project->id, 'project_milestone_id' => $milestones[$i]->id, 'invoice_number' => $code.'-T'.($i + 1), 'term_name' => 'Termin '.($i + 1).' [UAT]', 'amount' => (string) ($contract * $percent / 100), 'status' => $invoiceStatus, 'due_date' => $paid ? $last->toDateString() : ($invoiceStatus === 'overdue' ? '2026-09-30' : '2026-10-20'), 'paid_date' => $paid ? $last->toDateString() : null, 'payment_reference' => $paid ? 'SIMULASI-'.$code.'-T'.($i + 1) : null, 'notes' => self::BATCH.' SIMULASI, bukan pembayaran nyata', 'created_by' => $actor->id]);
                }
            }
        });
    }
}
