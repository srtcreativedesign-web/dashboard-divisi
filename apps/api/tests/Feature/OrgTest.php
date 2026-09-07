<?php

namespace Tests\Feature;

use Tests\TestCase;

class OrgTest extends TestCase
{
    public function test_get_divisions_for_bod_and_manager(): void
    {
        // BOD sees 7 active divisions (WRAP, CELL, REFL, MINI, FNB, MC, ACC - without decommissioned FIN)
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/divisions');
        $bodRes->assertStatus(200);
        $this->assertCount(7, $bodRes->json('data'));
        $this->assertContains('ACC', collect($bodRes->json('data'))->pluck('code')->all());
        $this->assertNotContains('FIN', collect($bodRes->json('data'))->pluck('code')->all());

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
        // BOD sees all outlets (58 real Sobat outlets + ACC + legacy fallbacks)
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/outlets');
        $bodRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(58, count($bodRes->json('data')));
        $this->assertContains('ACC-001', collect($bodRes->json('data'))->pluck('code')->all());
        $this->assertContains('T3-A', collect($bodRes->json('data'))->pluck('code')->all());

        // Admin CELL sees CELL outlets
        $admRes = $this->authenticated('admin.cell@dashboard.test')->getJson('/api/v1/org/outlets');
        $admRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(4, count($admRes->json('data')));
        $this->assertContains('T2F1', collect($admRes->json('data'))->pluck('code')->all());

        // Admin ACC sees ACC outlet
        $admAccRes = $this->authenticated('admin.acc@dashboard.test')->getJson('/api/v1/org/outlets');
        $admAccRes->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($admAccRes->json('data')));
        $this->assertContains('ACC-001', collect($admAccRes->json('data'))->pluck('code')->all());
    }

    public function test_get_context_returns_correct_user_scope_context(): void
    {
        $bodRes = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/org/me/context');
        $bodRes->assertStatus(200);
        $this->assertEquals('ALL_7_DIVISI', $bodRes->json('data.scope'));
        $this->assertCount(7, $bodRes->json('data.divisions'));

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
