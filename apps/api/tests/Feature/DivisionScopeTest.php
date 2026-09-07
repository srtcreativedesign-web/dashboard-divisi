<?php

namespace Tests\Feature;

use Tests\TestCase;

class DivisionScopeTest extends TestCase
{
    public function test_manager_cannot_read_other_divisions_config(): void
    {
        // Manager WRAP mencoba baca konfigurasi CELL -> SCOPE_VIOLATION
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/division-configs/CELL');

        $response->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $response->json('error.code'));
    }

    public function test_manager_can_read_own_divisions_config(): void
    {
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/division-configs/WRAP');

        $response->assertStatus(200);
        $this->assertEquals('WRAP', $response->json('data.divisionCode'));
    }

    public function test_manager_cannot_write_other_divisions_config(): void
    {
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->postJson('/api/v1/division-configs/CELL', [
                'enabledModules' => ['dashboard', 'revenue'],
                'enabledKpis' => ['revenue.gross'],
            ]);

        $response->assertStatus(403);
        $this->assertEquals('SCOPE_VIOLATION', $response->json('error.code'));
    }
}
