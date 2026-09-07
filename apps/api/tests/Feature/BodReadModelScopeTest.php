<?php

namespace Tests\Feature;

use Tests\TestCase;

class BodReadModelScopeTest extends TestCase
{
    public function test_bod_overview_returns_all_divisions_for_bod_and_only_own_for_manager(): void
    {
        // BOD melihat 7 divisi
        $bod = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/overview');
        $bod->assertStatus(200);
        $this->assertCount(7, $bod->json('data'));

        // Manager WRAP hanya melihat divisinya sendiri (anti data leak lintas divisi)
        $mgr = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/bod/overview');
        $mgr->assertStatus(200);
        $data = $mgr->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('WRAP', $data[0]['divisionCode']);
    }

    public function test_bod_executive_read_model_scoped_for_manager(): void
    {
        $response = $this->authenticated('manager.wrap@dashboard.test')
            ->getJson('/api/v1/bod/executive-read-model');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('WRAP', $data[0]['divisionCode']);
    }
}
