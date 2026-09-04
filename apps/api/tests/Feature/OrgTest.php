<?php

namespace Tests\Feature;

use Tests\TestCase;

class OrgTest extends TestCase
{
    public function test_get_divisions_for_bod_and_manager(): void
    {
        // BOD sees all 8 divisions including ACC
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/divisions');
        $bodRes->assertStatus(200);
        $this->assertCount(8, $bodRes->json('data'));
        $this->assertContains('ACC', collect($bodRes->json('data'))->pluck('code')->all());

        // Manager WRAP sees only 1
        $mgrRes = $this->authenticated('manager.wrap@dashboard.test')->getJson('/api/v1/org/divisions');
        $mgrRes->assertStatus(200);
        $this->assertCount(1, $mgrRes->json('data'));
        $this->assertEquals('WRAP', $mgrRes->json('data.0.code'));

        // Manager ACC sees only 1 (ACC)
        $mgrAccRes = $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/org/divisions');
        $mgrAccRes->assertStatus(200);
        $this->assertCount(1, $mgrAccRes->json('data'));
        $this->assertEquals('ACC', $mgrAccRes->json('data.0.code'));
    }

    public function test_get_outlets_for_bod_and_admin(): void
    {
        // BOD sees all 8 outlets including ACC-001
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/outlets');
        $bodRes->assertStatus(200);
        $this->assertCount(8, $bodRes->json('data'));
        $this->assertContains('ACC-001', collect($bodRes->json('data'))->pluck('code')->all());

        // Admin CELL sees only CELL outlet
        $admRes = $this->authenticated('admin.cell@dashboard.test')->getJson('/api/v1/org/outlets');
        $admRes->assertStatus(200);
        $this->assertCount(1, $admRes->json('data'));
        $this->assertEquals('CELL-001', $admRes->json('data.0.code'));

        // Admin ACC sees only ACC outlet
        $admAccRes = $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/org/outlets');
        $admAccRes->assertStatus(200);
        $this->assertCount(1, $admAccRes->json('data'));
        $this->assertEquals('ACC-001', $admAccRes->json('data.0.code'));
    }

    public function test_get_context_returns_correct_user_scope_context(): void
    {
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/me/context');
        $bodRes->assertStatus(200);
        $this->assertEquals('ALL_7_DIVISI', $bodRes->json('data.scope'));
        $this->assertCount(8, $bodRes->json('data.divisions'));

        $mgrRes = $this->authenticated('manager.mini@dashboard.test')->getJson('/api/v1/org/me/context');
        $mgrRes->assertStatus(200);
        $this->assertEquals('MINI', $mgrRes->json('data.scope'));
        $this->assertCount(1, $mgrRes->json('data.divisions'));

        $mgrAccRes = $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/org/me/context');
        $mgrAccRes->assertStatus(200);
        $this->assertEquals('ACC', $mgrAccRes->json('data.scope'));
        $this->assertCount(1, $mgrAccRes->json('data.divisions'));
    }
}
