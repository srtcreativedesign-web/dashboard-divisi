<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CellularShiftControlUatSeeder extends Seeder
{
    public function run(): void
    {
        $outlet = Outlet::whereHas('division', fn ($query) => $query->where('code', 'CELL'))->where('is_active', true)->firstOrFail();
        $leader = User::where('division_code', 'CELL')->where('role', 'LEADER')->firstOrFail(); $spv = User::where('division_code', 'CELL')->where('role', 'SPV')->firstOrFail();
        $head = User::where('division_code', 'CELL')->where('role', 'HEAD_OPS')->firstOrFail(); $manager = User::where('division_code', 'CELL')->where('role', 'MANAGER')->firstOrFail();
        $statuses = ['resolved','submitted','reviewed','correction','escalated','draft'];
        foreach ($statuses as $index => $status) {
            $date = CarbonImmutable::create(2026, 10, $index + 4, 12, 0, 0, 'Asia/Jakarta'); $shift = 'SHIFT-'.(($index % 2) + 1);
            $id = DB::table('cel_shift_controls')->where('outlet_id', $outlet->id)->whereDate('business_date', $date)->where('shift_code', $shift)->value('id') ?? (string) Str::uuid();
            $complete = ! in_array($status, ['correction','escalated'], true); $checklist = ['handover_complete'=>true,'stock_count_complete'=>true,'payment_channels_ready'=>true,'closing_matched'=>$complete];
            DB::table('cel_shift_controls')->updateOrInsert(['outlet_id'=>$outlet->id,'business_date'=>$date->toDateString(),'shift_code'=>$shift], ['id'=>$id,'pic_name'=>'Leader Cellular UAT','due_at'=>$date->endOfDay()->utc(),'priority'=>in_array($status,['correction','escalated'],true)?'critical':'normal','checklist'=>json_encode($checklist,JSON_THROW_ON_ERROR),'issue_summary'=>$complete?null:'Selisih closing memerlukan tindak lanjut lintas fungsi.','status'=>$status,'review_note'=>$status==='correction'?'Lampirkan penjelasan selisih closing.':($status==='escalated'?'Selisih material perlu keputusan Manager.':null),'created_by'=>$leader->id,'reviewed_by'=>in_array($status,['reviewed','resolved','correction','escalated'],true)?$spv->id:null,'supervised_by'=>in_array($status,['resolved','escalated'],true)?$head->id:null,'resolved_by'=>$status==='resolved'?$manager->id:null,'version'=>$status==='draft'?1:2,'created_at'=>$date,'updated_at'=>now()]);
        }
    }
}
