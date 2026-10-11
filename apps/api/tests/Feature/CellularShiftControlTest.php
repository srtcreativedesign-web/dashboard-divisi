<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Tests\TestCase;

class CellularShiftControlTest extends TestCase
{
    private function payload(): array
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        return ['outlet_id' => $outlet->id, 'business_date' => now('Asia/Jakarta')->toDateString(), 'shift_code' => 'SHIFT-KONTROL', 'pic_name' => 'Leader Uji', 'due_at' => now('Asia/Jakarta')->endOfDay()->toIso8601String(), 'priority' => 'high', 'checklist' => ['handover_complete' => true, 'stock_count_complete' => true, 'payment_channels_ready' => true, 'closing_matched' => false], 'issue_summary' => 'Selisih closing sedang ditelusuri.'];
    }

    public function test_leader_spv_head_ops_complete_shift_control(): void
    {
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'LEADER']); $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/shift-controls', $this->payload())->assertCreated()->assertJsonPath('data.completed_checks', 3); $id = $draft->json('data.id');
        $submitted = $this->postJson("/api/v1/cellular/shift-controls/{$id}/submit", ['version' => 1])->assertOk()->assertJsonPath('data.status', 'submitted');
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'SPV']); $this->authenticated('manager.cell@dashboard.test');
        $reviewed = $this->postJson("/api/v1/cellular/shift-controls/{$id}/review", ['version' => $submitted->json('data.version')])->assertOk()->assertJsonPath('data.status', 'reviewed');
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'HEAD_OPS']); $this->authenticated('manager.cell@dashboard.test');
        $this->postJson("/api/v1/cellular/shift-controls/{$id}/resolve", ['version' => $reviewed->json('data.version')])->assertOk()->assertJsonPath('data.status', 'resolved');
    }

    public function test_escalation_requires_manager_decision_and_separation_of_duties(): void
    {
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'LEADER']); $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/shift-controls', $this->payload())->assertCreated(); $id = $draft->json('data.id');
        $submitted = $this->postJson("/api/v1/cellular/shift-controls/{$id}/submit", ['version' => 1])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'SPV']); $this->authenticated('manager.cell@dashboard.test');
        $reviewed = $this->postJson("/api/v1/cellular/shift-controls/{$id}/review", ['version' => $submitted->json('data.version')])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'HEAD_OPS']); $this->authenticated('manager.cell@dashboard.test');
        $escalated = $this->postJson("/api/v1/cellular/shift-controls/{$id}/escalate", ['version' => $reviewed->json('data.version'), 'note' => 'Selisih material perlu keputusan Manager.'])->assertOk()->assertJsonPath('data.status', 'escalated');
        User::where('email', 'pic.cell@dashboard.test')->update(['role' => 'MANAGER']); $this->authenticated('pic.cell@dashboard.test');
        $this->postJson("/api/v1/cellular/shift-controls/{$id}/decide", ['version' => $escalated->json('data.version'), 'note' => 'Risiko diterima dan tindakan ditutup.'])->assertOk()->assertJsonPath('data.status', 'resolved');
    }
}
