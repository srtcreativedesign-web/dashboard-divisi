<?php

namespace Tests\Feature;

use App\Models\Division;
use Tests\TestCase;

class BodOverviewTest extends TestCase
{
    public function test_overview_contains_only_active_mvp_divisions_without_fabricated_metrics(): void
    {
        $data = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/bod/overview')->assertOk()->json('data');
        $this->assertEqualsCanonicalizing(['ACC', 'PROJECT', 'CELL'], array_column($data, 'divisionCode'));
        foreach ($data as $row) {
            $this->assertSame('not_available', $row['dataStatus']);
            $this->assertNull($row['revenue']['gross']);
            $this->assertNull($row['target']['value']);
            $this->assertNull($row['performance']['score']);
            $this->assertNull($row['workforce']['count']);
            $this->assertNull($row['revenue']['freshness']);
        }
        Division::where('code', 'CELL')->update(['is_active' => false]);
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/bod/overview')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_invalid_date_and_reverse_range_are_rejected(): void
    {
        foreach (['from=2026-02-30', 'from[]=2026-01-01', 'from=2026-10-02&to=2026-10-01'] as $query) {
            $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/bod/overview?'.$query)
                ->assertStatus(400)->assertJsonPath('error.code', 'VALIDATION_ERROR');
        }
    }
}
