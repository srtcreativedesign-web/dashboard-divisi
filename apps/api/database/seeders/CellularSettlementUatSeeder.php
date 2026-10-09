<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CellularSettlementUatSeeder extends Seeder
{
    public function run(): void
    {
        $finance = User::where('division_code', 'CELL')->where('role', 'FINANCE')->firstOrFail();
        $accounting = User::where('division_code', 'CELL')->where('role', 'ACCOUNTING')->firstOrFail();
        $channels = ['cash', 'qris', 'edc', 'transfer'];
        $closings = DB::table('cel_daily_closings')->where('status', 'approved')->orderBy('business_date')->get();
        foreach ($closings as $closingIndex => $closing) {
            foreach ($channels as $channelIndex => $channel) {
                $expected = (int) $closing->{$channel.'_cents'};
                if ($expected <= 0) continue;
                $reference = sprintf('UAT-%s-%s-%02d', strtoupper($channel), str_replace('-', '', $closing->business_date), $closingIndex + 1);
                $status = match (($closingIndex + $channelIndex) % 4) { 0 => 'reconciled', 1 => 'submitted', 2 => 'correction', default => 'draft' };
                $gross = $status === 'reconciled' ? $expected : max(1, intdiv($expected * 60, 100));
                $fee = in_array($channel, ['qris', 'edc'], true) ? intdiv($gross * 7, 1000) : 0;
                $key = hash('sha256', $closing->id.'|'.$channel.'|'.$reference);
                DB::table('cel_settlements')->updateOrInsert(['source_key' => $key], [
                    'id' => DB::table('cel_settlements')->where('source_key', $key)->value('id') ?? (string) Str::uuid(),
                    'daily_closing_id' => $closing->id, 'channel' => $channel, 'settlement_date' => $closing->business_date,
                    'gross_cents' => $gross, 'fee_cents' => $fee, 'net_cents' => $gross - $fee,
                    'destination' => $channel === 'cash' ? 'Kas Pusat Cellular' : 'BCA Operasional Cellular', 'reference' => $reference,
                    'status' => $status, 'review_note' => $status === 'correction' ? 'Nomor batch belum sesuai mutasi bank.' : null,
                    'created_by' => $finance->id, 'reviewed_by' => in_array($status, ['reconciled', 'correction'], true) ? $accounting->id : null,
                    'version' => in_array($status, ['draft'], true) ? 1 : 2, 'created_at' => $closing->business_date, 'updated_at' => now(),
                ]);
            }
        }
    }
}
