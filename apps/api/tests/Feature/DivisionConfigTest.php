<?php

namespace Tests\Feature;

use Tests\TestCase;

class DivisionConfigTest extends TestCase
{
    public function test_get_all_configs_returns_all_division_configs(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/division-configs');

        $response->assertStatus(200);
        $this->assertCount(8, $response->json('data'));
    }

    public function test_get_acc_division_config(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/division-configs/ACC');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('ACC', $data['divisionCode']);
        $this->assertContains('dashboard', $data['enabledModules']);
        $this->assertContains('accounting', $data['enabledModules']);
        $this->assertContains('accounting.balance', $data['enabledKpis']);
    }

    public function test_get_single_division_config(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/division-configs/MINI');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('MINI', $data['divisionCode']);
        $this->assertContains('dashboard', $data['enabledModules']);
        $this->assertContains('workforce', $data['enabledModules']);
        $this->assertContains('revenue.net', $data['enabledKpis']);
    }

    public function test_get_non_existent_division_config_returns_404(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/division-configs/NON_EXISTENT');

        $response->assertStatus(404);
        $this->assertEquals('RESOURCE_NOT_FOUND', $response->json('error.code'));
    }

    public function test_upsert_division_config_with_manage_permission(): void
    {
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->postJson('/api/v1/division-configs/WRAP', [
                'enabledModules' => ['dashboard', 'revenue', 'custom_module'],
                'enabledKpis' => ['revenue.gross', 'custom.kpi'],
            ]);

        $response->assertStatus(200);
        $this->assertEquals('WRAP', $response->json('data.divisionCode'));
        $this->assertContains('custom_module', $response->json('data.enabledModules'));
    }
}
