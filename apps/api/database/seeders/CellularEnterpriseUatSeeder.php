<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CellularEnterpriseUatSeeder extends Seeder
{
    public function run(): void
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $admin = User::where('email', 'admin.cell@dashboard.test')->firstOrFail();
        $manager = User::where('email', 'manager.cell@dashboard.test')->firstOrFail();
        $catalog = [
            ['CEL-TSEL-12', 'Telkomsel 12GB', 'SIM_CARD', 'Telkomsel', '12GB'],
            ['CEL-XL-18', 'XL 18GB', 'SIM_CARD', 'XL', '18GB'],
            ['CEL-ISAT-15', 'Indosat 15GB', 'SIM_CARD', 'Indosat', '15GB'],
            ['CEL-CABLE-C', 'Kabel Data Type-C', 'ACCESSORY', null, '1 meter'],
            ['CEL-CHARGER-20', 'Charger 20W', 'ACCESSORY', null, 'Fast charge'],
        ];
        foreach ($catalog as [$sku, $name, $kind, $provider, $variant]) {
            DB::table('cel_products')->updateOrInsert(['sku' => $sku], ['id' => DB::table('cel_products')->where('sku', $sku)->value('id') ?? (string) Str::uuid(), 'name' => $name, 'kind' => $kind, 'provider' => $provider, 'variant' => $variant, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        }
        $products = DB::table('cel_products')->whereIn('sku', array_column($catalog, 0))->get();
        foreach ($products as $index => $product) {
            DB::table('cel_stock_balances')->updateOrInsert(['product_id' => $product->id, 'outlet_id' => $outlet->id], ['id' => DB::table('cel_stock_balances')->where('product_id', $product->id)->where('outlet_id', $outlet->id)->value('id') ?? (string) Str::uuid(), 'quantity' => $index === 4 ? 4 : 35 - ($index * 4), 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        }
        for ($day = 1; $day <= 9; $day++) {
            $date = CarbonImmutable::create(2026, 10, $day, 12, 0, 0, 'Asia/Jakarta');
            foreach ($products->take(3) as $index => $product) {
                $reference = sprintf('UAT-CELL-%s-%02d-%d', $product->sku, $day, $index + 1);
                $key = hash('sha256', $reference); $quantity = ($day + $index) % 4 + 1; $unit = 3500000 + ($index * 1500000);
                DB::table('cel_manual_sales')->updateOrInsert(['source_key' => $key], ['id' => DB::table('cel_manual_sales')->where('source_key', $key)->value('id') ?? (string) Str::uuid(), 'product_id' => $product->id, 'outlet_id' => $outlet->id, 'product_name' => $product->name, 'outlet_name' => $outlet->name, 'business_date' => $date->toDateString(), 'quantity' => $quantity, 'unit_price_cents' => $unit, 'total_cents' => $unit * $quantity, 'source_reference' => $reference, 'created_by' => $admin->id, 'status' => 'posted', 'version' => 1, 'created_at' => $date, 'updated_at' => $date]);
            }
            $system = (int) DB::table('cel_manual_sales')->where('outlet_id', $outlet->id)->whereDate('business_date', $date)->where('status', 'posted')->sum('total_cents');
            $status = $day <= 4 ? 'approved' : ($day <= 7 ? 'validated' : 'submitted');
            $id = DB::table('cel_daily_closings')->where('outlet_id', $outlet->id)->whereDate('business_date', $date)->where('shift_code', 'SHIFT-1')->value('id') ?? (string) Str::uuid();
            DB::table('cel_daily_closings')->updateOrInsert(['outlet_id' => $outlet->id, 'business_date' => $date->toDateString(), 'shift_code' => 'SHIFT-1'], ['id' => $id, 'system_sales_cents' => $system, 'cash_cents' => intdiv($system, 4), 'qris_cents' => intdiv($system, 4), 'edc_cents' => intdiv($system, 4), 'transfer_cents' => $system - intdiv($system, 4) * 3, 'difference_cents' => 0, 'source_reference' => 'UAT-CLOSE-'.$date->format('Ymd'), 'status' => $status, 'created_by' => $admin->id, 'reviewed_by' => $status !== 'submitted' ? $manager->id : null, 'approved_by' => $status === 'approved' ? $manager->id : null, 'version' => 1, 'created_at' => $date, 'updated_at' => $date]);
        }
    }
}
