<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectVendor;
use App\Models\User;
use Tests\TestCase;

class ProjectIntegrityTest extends TestCase
{
    public function test_contract_value_precision_matches_database_and_reader_cannot_create(): void
    {
        $this->authenticated('manager.project@dashboard.test');
        foreach (['0.123', '-1', '10000000000000.00'] as $value) {
            $this->postJson('/api/v1/projects', ['name' => 'Nominal salah', 'contract_value' => $value])->assertStatus(400);
        }
        $this->postJson('/api/v1/projects', ['name' => 'Nominal valid', 'contract_value' => '12.34'])->assertCreated()->assertJsonPath('data.contract_value', '12.34');
        User::where('email', 'manager.project@dashboard.test')->update(['role' => 'LEADER']);
        $this->authenticated('manager.project@dashboard.test')->postJson('/api/v1/projects', ['name' => 'Reader'])->assertForbidden();
        $this->assertDatabaseCount('projects', 1);
    }

    public function test_readers_receive_vendor_directory_without_contact_or_bank_fields(): void
    {
        $vendor = ProjectVendor::create(['name' => 'Vendor anonim', 'category' => 'Material', 'contact_person' => 'Kontak uji', 'phone' => '000', 'email' => 'anonim@example.test', 'bank_details' => 'Rekening uji privat']);
        foreach (['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE'] as $role) {
            User::where('email', 'manager.project@dashboard.test')->update(['role' => $role]);
            $this->flushHeaders()->authenticated('manager.project@dashboard.test');
            foreach (['/api/v1/vendors', '/api/v1/vendors/'.$vendor->id] as $path) {
                $response = $this->getJson($path)->assertOk();
                $data = $path === '/api/v1/vendors' ? $response->json('data.data.0') : $response->json('data');
                $this->assertEqualsCanonicalizing(['id', 'name', 'category', 'created_at', 'updated_at'], array_keys($data));
                $this->assertStringNotContainsString('Rekening uji privat', $response->getContent());
                $this->assertStringNotContainsString('anonim@example.test', $response->getContent());
            }
            $this->postJson('/api/v1/vendors', ['name' => 'Tidak diizinkan'])->assertForbidden();
        }
    }

    public function test_vendor_managers_keep_contact_access_and_bod_remains_readonly(): void
    {
        $vendor = ProjectVendor::create(['name' => 'Vendor anonim', 'phone' => '000', 'bank_details' => 'Rekening uji privat']);
        foreach (['MANAGER', 'ADMIN'] as $role) {
            User::where('email', 'manager.project@dashboard.test')->update(['role' => $role]);
            $this->flushHeaders()->authenticated('manager.project@dashboard.test')->getJson('/api/v1/vendors/'.$vendor->id)->assertOk()->assertJsonPath('data.phone', '000');
        }
        $this->flushHeaders()->authenticated('bod1@dashboard.test')->getJson('/api/v1/vendors/'.$vendor->id)->assertOk()->assertJsonPath('data.bank_details', 'Rekening uji privat');
        $this->putJson('/api/v1/vendors/'.$vendor->id, ['name' => 'Tidak diizinkan'])->assertForbidden();
        $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/vendors/'.$vendor->id)->assertForbidden();
    }

    public function test_rab_cannot_be_created_for_missing_or_foreign_project(): void
    {
        $foreign = Project::withoutGlobalScopes()->create(['name' => 'Di luar domain', 'division_code' => 'CELL', 'status' => 'planning', 'contract_value' => 0]);
        $payload = ['item_name' => 'Material anonim', 'category' => 'Material', 'volume' => 1, 'unit_price' => 100];
        foreach ([$foreign->id, 999999] as $id) {
            $this->authenticated('manager.project@dashboard.test')->postJson('/api/v1/projects/'.$id.'/rab', $payload)->assertNotFound();
        }
        $this->assertDatabaseCount('project_rabs', 0);
        $project = Project::create(['name' => 'Proyek valid', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
        $this->postJson('/api/v1/projects/'.$project->id.'/rab', $payload)->assertCreated()->assertJsonPath('data.project_id', (string) $project->id);
    }

    public function test_search_pagination_and_effective_project_dates_are_validated(): void
    {
        $project = Project::create(['name' => 'Proyek Anonim', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0, 'start_date' => '2026-10-06', 'end_date' => '2026-10-20']);
        ProjectVendor::create(['name' => 'Vendor Anonim']);
        $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects?search=anonim')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/v1/vendors?search=anonim')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/v1/projects?status=&search=')->assertOk()->assertJsonPath('data.total', 1);
        foreach (['projects', 'vendors'] as $path) {
            $this->getJson('/api/v1/'.$path.'?search[]=array')->assertStatus(400);
            $this->getJson('/api/v1/'.$path.'?per_page=100000')->assertStatus(400);
        }
        $this->postJson('/api/v1/projects', ['name' => 'Tanggal salah', 'start_date' => '2026-10-20', 'end_date' => '2026-10-06'])->assertStatus(400);
        $this->putJson('/api/v1/projects/'.$project->id, ['start_date' => '2026-10-21'])->assertStatus(400);
        $this->putJson('/api/v1/projects/'.$project->id, ['end_date' => '2026-10-01'])->assertStatus(400);
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'start_date' => '2026-10-06', 'end_date' => '2026-10-20']);
        $this->putJson('/api/v1/projects/'.$project->id, ['start_date' => '2026-10-21', 'end_date' => '2026-10-22'])->assertOk();
    }
}
