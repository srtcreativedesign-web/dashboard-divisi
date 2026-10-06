<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\DivisionConfig;
use Tests\TestCase;

class BodReadModelTest extends TestCase
{
    public function test_read_model_uses_configuration_without_inventing_values_or_compatibility(): void
    {
        $acc = Division::where('code', 'ACC')->firstOrFail();
        DivisionConfig::where('division_id', $acc->id)->update(['enabled_kpis' => ['accounting.balance']]);
        $data = $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/bod/executive-read-model')->assertOk()->json('data');
        $this->assertEqualsCanonicalizing(['ACC', 'PROJECT', 'CELL'], array_column($data, 'divisionCode'));
        $row = collect($data)->firstWhere('divisionCode', 'ACC');
        $this->assertSame([['kpiCode' => 'accounting.balance', 'value' => null, 'compatible' => false]], $row['metrics']);
        $this->assertSame([], $row['compatibleDivisions']);
    }

    public function test_legacy_division_kpi_is_not_comparable(): void
    {
        $this->authenticated('bod1@dashboard.test')->getJson('/api/v1/bod/kpi-compatibility?a=WRAP&b=CELL&kpi=revenue.gross')
            ->assertOk()->assertJsonPath('data.compatible', false);
    }
}
