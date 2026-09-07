<?php

namespace Tests\Feature;

use Tests\TestCase;

class BodOverviewTest extends TestCase
{
    public function test_bod_overview_returns_all_7_divisions_with_correct_structure(): void
    {
        $response = $this->authenticated('bod1@dashboard.test')
            ->getJson('/api/v1/bod/overview');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(7, $data);

        // Find MC division
        $mc = collect($data)->firstWhere('divisionCode', 'MC');
        $this->assertNotNull($mc);
        $this->assertNull($mc['revenue']['gross']);
        $this->assertEquals('forex.volume', $mc['revenue']['source']);

        // Find WRAP division
        $wrap = collect($data)->firstWhere('divisionCode', 'WRAP');
        $this->assertNotNull($wrap);
        $this->assertNotNull($wrap['revenue']['gross']);
        $this->assertGreaterThan(0, $wrap['revenue']['gross']);
        $this->assertEquals('revenue.daily', $wrap['revenue']['source']);
        $this->assertArrayHasKey('drillDown', $wrap);
        $this->assertStringContainsString('divisionCode=WRAP', $wrap['drillDown']['href']);
    }
}
