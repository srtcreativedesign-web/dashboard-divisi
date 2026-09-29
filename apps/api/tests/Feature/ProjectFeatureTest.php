<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_projects()
    {
        $response = $this->getJson('/api/v1/projects');
        $response->assertStatus(401);
    }

    public function test_user_without_capability_cannot_access_projects()
    {
        // Manager Accounting cannot access Projects
        $response = $this->authenticated('manager.acc@dashboard.test')->getJson('/api/v1/projects');
        $response->assertStatus(403);
    }

    public function test_user_with_capability_can_access_projects()
    {
        // Manager Project CAN access Projects
        $response = $this->authenticated('manager.project@dashboard.test')->getJson('/api/v1/projects');
        $response->assertStatus(200);
    }
}
