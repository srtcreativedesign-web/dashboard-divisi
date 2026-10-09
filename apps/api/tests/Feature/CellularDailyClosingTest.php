<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Tests\TestCase;

class CellularDailyClosingTest extends TestCase
{
    public function test_admin_accounting_manager_complete_daily_closing_workflow(): void
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $payload = ['outlet_id' => $outlet->id, 'business_date' => now('Asia/Jakarta')->toDateString(), 'shift_code' => 'SHIFT-1', 'cash' => '100.00', 'qris' => '0', 'edc' => '0', 'transfer' => '0', 'source_reference' => 'TUTUP-UJI-1'];

        $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/daily-closings', $payload)->assertCreated()->assertJsonPath('data.status', 'draft');
        $id = $draft->json('data.id');
        $submitted = $this->postJson("/api/v1/cellular/daily-closings/{$id}/submit", ['version' => 1])->assertOk()->assertJsonPath('data.status', 'submitted');

        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->authenticated('manager.cell@dashboard.test');
        $validated = $this->postJson("/api/v1/cellular/daily-closings/{$id}/validate", ['version' => $submitted->json('data.version')])->assertOk()->assertJsonPath('data.status', 'validated');

        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'MANAGER']);
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson("/api/v1/cellular/daily-closings/{$id}/approve", ['version' => $validated->json('data.version')])->assertOk()->assertJsonPath('data.status', 'approved');
    }

    public function test_roles_cannot_skip_workflow_or_mutate_without_capability(): void
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $payload = ['outlet_id' => $outlet->id, 'business_date' => now('Asia/Jakarta')->toDateString(), 'shift_code' => 'SHIFT-2', 'cash' => '0', 'qris' => '0', 'edc' => '0', 'transfer' => '0', 'source_reference' => 'TUTUP-UJI-2'];
        $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/daily-closings', $payload)->assertCreated();
        $id = $draft->json('data.id');
        $this->postJson("/api/v1/cellular/daily-closings/{$id}/approve", ['version' => 1])->assertForbidden();
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson("/api/v1/cellular/daily-closings/{$id}/approve", ['version' => 1])->assertStatus(409);
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'HEAD_OPS']);
        $this->authenticated('manager.cell@dashboard.test')->getJson('/api/v1/cellular/daily-closings?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk();
        $this->postJson('/api/v1/cellular/daily-closings', $payload)->assertForbidden();
    }
}
