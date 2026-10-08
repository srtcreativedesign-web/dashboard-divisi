<?php

namespace Tests\Feature;

use App\Contracts\MalwareScanner;
use App\Exceptions\ApiException;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\CellularReportFixture;
use Tests\TestCase;

class CellularReportPreviewTest extends TestCase
{
    private array $fixtures = [];

    protected function tearDown(): void
    {
        foreach ($this->fixtures as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        parent::tearDown();
    }

    private function payload(): array
    {
        $path = $this->fixtures[] = CellularReportFixture::income();

        return ['file' => new UploadedFile($path, 'anonim.xlsx', null, null, true), 'profile' => 'income', 'month' => '2026-09'];
    }

    public function test_central_roles_can_preview_and_all_business_tables_remain_unchanged(): void
    {
        $tables = array_values(array_filter(array_column(DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"), 'name'), fn ($name) => ! in_array($name, ['audit_events', 'rate_limit_counters'], true)));
        $snapshot = fn () => array_map(fn ($name) => DB::table($name)->orderByRaw('1')->get()->toJson(), $tables);
        $before = $snapshot();
        foreach (['admin.acc@dashboard.test', 'accounting@dashboard.test', 'manager.acc@dashboard.test'] as $email) {
            $this->authenticated($email)->postJson('/api/v1/accounting/cellular-preview', $this->payload())
                ->assertOk()->assertJsonPath('data.can_commit', false)->assertJsonPath('data.summary.gross', 1100);
        }
        $this->assertSame($before, $snapshot());
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_unpermitted_roles_and_forged_division_are_rejected_before_parser(): void
    {
        Process::preventStrayProcesses();
        User::create(['id' => (string) Str::uuid(), 'email' => 'headops.acc@dashboard.test', 'name' => 'Head Operasional Anonim', 'password_hash' => password_hash('fixture-only', PASSWORD_BCRYPT), 'role' => 'HEAD_OPS', 'division_code' => 'ACC', 'is_active' => true]);
        foreach (['admin.cell@dashboard.test', 'bod1@dashboard.test', 'headops.acc@dashboard.test', 'finance@dashboard.test'] as $email) {
            $this->authenticated($email)->postJson('/api/v1/accounting/cellular-preview', $this->payload())->assertForbidden();
        }
        $payload = $this->payload();
        $payload['divisionCode'] = 'CELL';
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/cellular-preview', $payload)->assertForbidden();
        Process::assertNothingRan();
    }

    public function test_worker_failure_does_not_leak_private_process_output(): void
    {
        Process::fake(['*' => Process::result(errorOutput: 'private-path credential', exitCode: 1)]);
        $response = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/cellular-preview', $this->payload());
        $response->assertStatus(422);
        $this->assertStringNotContainsString('credential', $response->getContent());
        $this->assertStringNotContainsString('private-path', $response->getContent());
    }

    public function test_scanner_unavailable_prevents_parsing_and_cleans_quarantine(): void
    {
        Process::preventStrayProcesses();
        $this->app->instance(MalwareScanner::class, new class implements MalwareScanner
        {
            public function assertClean(string $path): void
            {
                throw new ApiException('SCANNER_UNAVAILABLE', 'Scanner belum siap.', null, 503);
            }
        });
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/cellular-preview', $this->payload())->assertStatus(503);
        Process::assertNothingRan();
        $this->assertSame([], Storage::disk('quarantine')->allFiles());
    }

    public function test_rejects_missing_file_lock_and_period_without_writing_transactions(): void
    {
        Process::preventStrayProcesses();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/cellular-preview', ['profile' => 'income', 'month' => '2026-09'])->assertStatus(400);
        $payload = $this->payload();
        $payload['file'] = UploadedFile::fake()->createWithContent('~$laporan.xlsx', 'lock');
        $this->postJson('/api/v1/accounting/cellular-preview', $payload)->assertStatus(422);
        Process::assertNothingRan();
    }
}
