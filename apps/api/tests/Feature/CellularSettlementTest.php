<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\User;
use Tests\TestCase;

class CellularSettlementTest extends TestCase
{
    private function approvedClosing(): array
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $date = now('Asia/Jakarta')->toDateString();
        $this->authenticated('admin.cell@dashboard.test');
        $draft = $this->postJson('/api/v1/cellular/daily-closings', ['outlet_id' => $outlet->id, 'business_date' => $date, 'shift_code' => 'SETTLEMENT-UJI', 'cash' => '1000.00', 'qris' => '2000.00', 'edc' => '0', 'transfer' => '0', 'source_reference' => 'CLOSE-SET-001'])->assertCreated();
        $submitted = $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/submit', ['version' => 1])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->authenticated('manager.cell@dashboard.test');
        $validated = $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/validate', ['version' => $submitted->json('data.version')])->assertOk();
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'MANAGER']);
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson('/api/v1/cellular/daily-closings/'.$draft->json('data.id').'/approve', ['version' => $validated->json('data.version')])->assertOk();
        return ['id' => $draft->json('data.id'), 'date' => $date];
    }

    public function test_finance_and_accounting_complete_partial_settlement_workflow(): void
    {
        $closing = $this->approvedClosing();
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.cell@dashboard.test');
        $sources = $this->getJson('/api/v1/cellular/settlements/sources?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk();
        $this->assertSame('1000.00', collect($sources->json('data'))->firstWhere('channel', 'cash')['expected']);
        $draft = $this->postJson('/api/v1/cellular/settlements', ['daily_closing_id' => $closing['id'], 'channel' => 'cash', 'settlement_date' => $closing['date'], 'gross' => '600.00', 'fee' => '10.00', 'destination' => 'Kas Pusat', 'reference' => 'CASH-UJI-001'])->assertCreated()->assertJsonPath('data.net', '590.00');
        $submitted = $this->postJson('/api/v1/cellular/settlements/'.$draft->json('data.id').'/submit', ['version' => 1])->assertOk()->assertJsonPath('data.status', 'submitted');
        User::where('email', 'manager.cell@dashboard.test')->update(['role' => 'ACCOUNTING']);
        $this->authenticated('manager.cell@dashboard.test');
        $this->postJson('/api/v1/cellular/settlements/'.$draft->json('data.id').'/reconcile', ['version' => $submitted->json('data.version')])->assertOk()->assertJsonPath('data.status', 'reconciled');
        $sources = $this->getJson('/api/v1/cellular/settlements/sources?month='.now('Asia/Jakarta')->format('Y-m'))->assertOk();
        $cash = collect($sources->json('data'))->firstWhere('channel', 'cash');
        $this->assertSame('600.00', $cash['reconciled']); $this->assertSame('400.00', $cash['remaining']);
    }

    public function test_controls_reject_duplicate_reference_and_invalid_role(): void
    {
        $closing = $this->approvedClosing(); $payload = ['daily_closing_id' => $closing['id'], 'channel' => 'qris', 'settlement_date' => $closing['date'], 'gross' => '500.00', 'fee' => '5.00', 'destination' => 'BCA', 'reference' => 'QRIS-UJI-001'];
        $this->authenticated('admin.cell@dashboard.test')->postJson('/api/v1/cellular/settlements', $payload)->assertForbidden();
        User::where('email', 'admin.cell@dashboard.test')->update(['role' => 'FINANCE']);
        $this->authenticated('admin.cell@dashboard.test')->postJson('/api/v1/cellular/settlements', $payload)->assertCreated();
        $this->postJson('/api/v1/cellular/settlements', $payload)->assertStatus(409);
    }
}
