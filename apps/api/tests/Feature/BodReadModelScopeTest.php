<?php

namespace Tests\Feature;

use Tests\TestCase;

class BodReadModelScopeTest extends TestCase
{
    public function test_only_bod_can_read_cross_division_overview(): void
    {
        foreach (['/bod/overview', '/bod/executive-read-model'] as $path) {
            $this->withHeader('Authorization', '')->getJson('/api/v1'.$path)->assertStatus(401);
            foreach (['manager.acc@dashboard.test', 'manager.project@dashboard.test', 'admin.cell@dashboard.test'] as $email) {
                $this->authenticated($email)->getJson('/api/v1'.$path)->assertStatus(403)
                    ->assertJsonPath('error.code', 'FORBIDDEN_CAPABILITY');
            }
            $this->authenticated('bod1@dashboard.test')->getJson('/api/v1'.$path)->assertOk()->assertJsonCount(3, 'data');
        }
    }
}
