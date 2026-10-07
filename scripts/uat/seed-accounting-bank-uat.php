<?php

use App\Models\AccountingAccount;
use App\Models\AccountingBankReconciliation;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Fixture saldo bank UAT saja; tidak menyediakan jalur input produksi.
require __DIR__.'/../../apps/api/vendor/autoload.php';
$app = require __DIR__.'/../../apps/api/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
try {
    $backup = $argv[1] ?? '';
    if (! app()->environment('local') || config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== 'dashboard_divisi_mvp' || ! in_array(config('database.connections.pgsql.host'), ['127.0.0.1', 'localhost'], true) || ! str_ends_with($backup, '.erpbackup') || ! is_file($backup) || filesize($backup) < 1024) {
        throw new RuntimeException('TARGET_REJECTED');
    }
    $result = DB::transaction(function () {
        $division = Division::where('code', 'ACC')->firstOrFail();
        $actor = User::where('email', 'manager.acc@dashboard.test')->where('role', 'MANAGER')->where('division_code', 'ACC')->where('is_active', true)->firstOrFail();
        $result = [];
        $opening = [3000000, 2000000];
        foreach (['2026-09', '2026-10'] as $month) {
            $period = AccountingPeriod::where('division_id', $division->id)->whereDate('period_month', $month.'-01')->lockForUpdate()->firstOrFail();
            if ($period->status !== 'draft' || ! str_contains($period->notes ?? '', 'MENU-UAT-20261007')) {
                throw new RuntimeException('PERIOD_REJECTED');
            }
            foreach (['UAT-MANDIRI-26', 'UAT-BCA-26'] as $i => $code) {
                $account = AccountingAccount::where('division_id', $division->id)->where('code', $code)->firstOrFail();
                if (! str_contains($account->description ?? '', 'MENU-UAT-20261007')) {
                    throw new RuntimeException('ACCOUNT_REJECTED');
                }
                $journal = AccountingTransaction::where('division_id', $division->id)->where('period_id', $period->id)->where('account_id', $account->id)->whereNull('cancelled_at')->where('is_draft', false)->get();
                if ($journal->contains(fn ($r) => ! str_starts_with($r->reference_no ?? '', 'MENU-UAT-20261007-'))) {
                    throw new RuntimeException('JOURNAL_REJECTED');
                }
                $delta = (int) $journal->sum('debit_amount') - (int) $journal->sum('credit_amount');
                $ending = $opening[$i] + $delta;
                $bankEnding = $ending + ($month === '2026-10' && $i === 1 ? 50000 : 0);
                $notes = 'MENU-UAT-20261007 UAT / SIMULASI '.$month.' '.$code;
                $row = AccountingBankReconciliation::where('period_id', $period->id)->where('account_id', $account->id)->first();
                $existing = (bool) $row;
                if ($row) {
                    if ($row->notes !== $notes || (int) $row->jul_balance !== $opening[$i] || (int) $row->aug_balance !== $bankEnding || $row->is_verified) {
                        throw new RuntimeException('EXISTING_CONFLICT');
                    }
                } else {
                    $row = AccountingBankReconciliation::create(['id' => (string) Str::uuid(), 'division_id' => $division->id, 'period_id' => $period->id, 'account_id' => $account->id, 'jul_balance' => $opening[$i], 'aug_balance' => $bankEnding, 'mutation' => $bankEnding - $opening[$i], 'notes' => $notes, 'is_verified' => false]);
                    app(AuditService::class)->logRequired(['actorId' => $actor->id, 'actorRole' => 'MANAGER', 'divisionCode' => 'ACC', 'entity' => 'AccountingBankReconciliation', 'entityId' => $row->id, 'action' => 'accounting.uat.bank_fixture.created', 'metadata' => ['batch' => 'MENU-UAT-20261007', 'source' => 'local-fixture', 'verified' => false]]);
                }
                $result[] = ['id' => $row->id, 'month' => $month, 'opening' => $opening[$i], 'ending' => $bankEnding, 'existing' => $existing, 'verified' => false];
                $opening[$i] = $ending;
            }
        }

        return $result;
    });
    echo json_encode(['passed' => true, 'rows' => $result], JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    fwrite(STDERR, in_array($e->getMessage(), ['TARGET_REJECTED', 'PERIOD_REJECTED', 'ACCOUNT_REJECTED', 'JOURNAL_REJECTED', 'EXISTING_CONFLICT'], true) ? $e->getMessage() : 'Fixture ditolak; detail sensitif disembunyikan.');
    exit(1);
}
