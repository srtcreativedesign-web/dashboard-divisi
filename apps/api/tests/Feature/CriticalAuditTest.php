<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\Outlet;
use App\Models\Project;
use App\Models\User;
use App\Services\AuditService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CriticalAuditTest extends TestCase
{
    private function unavailable(): void
    {
        Schema::drop('audit_events');
    }

    public function test_login_cannot_issue_cookie_when_required_audit_fails(): void
    {
        $this->unavailable();
        $this->postJson('/api/v1/auth/login', ['email' => 'bod1@dashboard.test', 'password' => 'Password123!'])
            ->assertStatus(500)->assertJsonPath('error.code', 'INTERNAL_ERROR')->assertCookieMissing('access_token');
    }

    public function test_password_reset_rolls_back_password_and_session_version_on_audit_failure(): void
    {
        $user = User::where('email', 'bod2@dashboard.test')->firstOrFail();
        $hash = $user->password_hash;
        $token = $this->getJwtTokenForUser($user->email);
        $this->unavailable();
        $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/v1/auth/reset', ['oldPassword' => 'Password123!', 'newPassword' => 'NewPasswordSecure123!'])->assertStatus(500);
        $this->assertSame($hash, $user->fresh()->password_hash);
        $this->assertSame(0, $user->fresh()->session_version);
        $this->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_logout_audit_failure_does_not_revoke_session_in_database_or_cache(): void
    {
        $token = $this->getJwtTokenForUser('bod3@dashboard.test');
        $this->unavailable();
        $this->withHeader('Authorization', 'Bearer '.$token)->postJson('/api/v1/auth/logout')->assertStatus(500);
        $this->assertDatabaseCount('revoked_tokens', 0);
        $this->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_omzet_and_voucher_creation_roll_back_with_domain_events_when_audit_fails(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 12:00:00', 'Asia/Jakarta'));
        $outlet = Outlet::where('code', 'CELL-001')->firstOrFail();
        $this->unavailable();
        $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/omzet', ['outlet_id' => $outlet->id,
            'business_date' => '2026-10-04', 'shift' => '1', 'outlet_amount' => '1000.50', 'cash_amount' => '1000.50',
            'qris_amount' => '0', 'edc_amount' => '0', 'transfer_amount' => '0', 'other_amount' => '0', 'requires_ap' => false, 'source_reference' => 'Laporan anonim'])->assertStatus(500);
        $this->assertDatabaseCount('acc_omzet_records', 0);
        $this->assertDatabaseCount('acc_omzet_events', 0);
        $this->postJson('/api/v1/accounting/vouchers', ['outlet_id' => $outlet->id, 'type' => 'BILLING', 'voucher_date' => '2026-10-05',
            'due_date' => '2026-10-20', 'entity_name' => 'Anonim', 'source_reference' => 'INV-UJI', 'amount' => '1000.50', 'description' => 'Uji rollback audit'])->assertStatus(500);
        $this->assertDatabaseCount('acc_vouchers', 0);
        $this->assertDatabaseCount('acc_voucher_events', 0);
    }

    public function test_project_update_rolls_back_when_route_audit_fails(): void
    {
        $project = $this->project();
        $this->unavailable();
        $this->authenticated('manager.project@dashboard.test')->putJson('/api/v1/projects/'.$project->id, ['status' => 'completed', 'contract_value' => '500.50'])->assertStatus(500);
        $this->assertSame('planning', $project->fresh()->status);
        $this->assertEquals(0, $project->fresh()->contract_value);
    }

    private function project(): Project
    {
        return Project::create(['name' => 'Audit anonim', 'division_code' => 'PROJECT', 'status' => 'planning', 'contract_value' => 0]);
    }

    public function test_document_upload_audit_failure_removes_file_and_metadata(): void
    {
        Storage::fake('local');
        $project = $this->project();
        $this->unavailable();
        $this->authenticated('manager.project@dashboard.test')->post('/api/v1/projects/'.$project->id.'/documents', ['title' => 'Anonim.pdf', 'document_type' => 'Contract', 'file' => UploadedFile::fake()->create('anonim.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])->assertStatus(500);
        $this->assertDatabaseCount('project_documents', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('project_documents_private'));
    }

    public function test_document_delete_audit_failure_restores_file_and_metadata(): void
    {
        Storage::fake('local');
        $project = $this->project();
        $path = 'project_documents_private/'.$project->id.'/anonim.pdf';
        $document = $project->documents()->create(['file_path' => $path, 'file_type' => 'Contract', 'title' => 'Anonim.pdf']);
        Storage::disk('local')->put($path, 'Isi anonim');
        $this->unavailable();
        $this->authenticated('manager.project@dashboard.test')->deleteJson('/api/v1/projects/'.$project->id.'/documents/'.$document->id)->assertStatus(500);
        $this->assertDatabaseHas('project_documents', ['id' => $document->id]);
        $this->assertSame('Isi anonim', Storage::disk('local')->get($path));
    }

    public function test_successful_route_audit_has_server_actor_entity_and_trace_without_request_secrets(): void
    {
        $response = $this->authenticated('manager.project@dashboard.test')->withHeader('X-Trace-Id', 'trace-audit-test')
            ->postJson('/api/v1/projects', ['name' => 'Audit anonim', 'contract_value' => 0, 'status' => 'planning', 'password' => 'jangan-log', 'token' => 'jangan-log'])->assertCreated();
        $event = AuditEvent::where('action', 'api.mutation')->firstOrFail();
        $this->assertSame(User::where('email', 'manager.project@dashboard.test')->value('id'), $event->actor_id);
        $this->assertSame((string) $response->json('data.id'), $event->entity_id);
        $this->assertSame('trace-audit-test', $event->trace_id);
        $this->assertStringNotContainsString('jangan-log', json_encode($event->toArray()));
    }

    public function test_rolled_back_nested_audit_does_not_skip_mandatory_route_audit(): void
    {
        Route::post('/api/v1/audit-test-nested', function () {
            $project = $this->project();
            try {
                DB::transaction(function () {
                    app(AuditService::class)->logRequired(['action' => 'test.rolled-back', 'entity' => 'Nested']);
                    throw new \RuntimeException('Rollback pengujian');
                });
            } catch (\RuntimeException) {
            }

            return response()->json($project, 201);
        })->middleware(['api', 'jwt.auth', 'critical.audit']);
        $response = $this->authenticated('manager.project@dashboard.test')->postJson('/api/v1/audit-test-nested')->assertCreated();
        $this->assertDatabaseMissing('audit_events', ['action' => 'test.rolled-back']);
        $this->assertDatabaseHas('audit_events', ['action' => 'api.mutation', 'entity_id' => (string) $response->json('data.id')]);
    }

    public function test_voucher_approval_audit_failure_preserves_status_version_and_history(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 12:00:00', 'Asia/Jakarta'));
        $record = $this->authenticated('admin.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers', [
            'outlet_id' => Outlet::where('code', 'CELL-001')->value('id'), 'type' => 'BILLING', 'voucher_date' => '2026-10-05',
            'due_date' => '2026-10-20', 'entity_name' => 'Anonim', 'source_reference' => 'INV-AUDIT', 'amount' => '1000.50', 'description' => 'Uji approval audit',
        ])->assertCreated()->json('data');
        $record = $this->postJson('/api/v1/accounting/vouchers/'.$record['id'].'/submit', ['version' => $record['version']])->assertOk()->json('data');
        $record = $this->authenticated('accounting@dashboard.test')->postJson('/api/v1/accounting/vouchers/'.$record['id'].'/review', ['version' => $record['version'], 'decision' => 'validate', 'reason' => 'Dokumen anonim telah diperiksa'])->assertOk()->json('data');
        $count = DB::table('acc_voucher_events')->count();
        $this->unavailable();
        $this->authenticated('manager.acc@dashboard.test')->postJson('/api/v1/accounting/vouchers/'.$record['id'].'/decide', ['version' => $record['version'], 'decision' => 'approve', 'reason' => 'Kebutuhan anonim telah disetujui'])->assertStatus(500);
        $this->assertDatabaseHas('acc_vouchers', ['id' => $record['id'], 'status' => 'pending_approval', 'version' => $record['version'], 'approved_at' => null]);
        $this->assertDatabaseCount('acc_voucher_events', $count);
    }

    public function test_invalid_trace_header_is_replaced_with_valid_server_trace(): void
    {
        $response = $this->authenticated('manager.project@dashboard.test')->withHeader('X-Trace-Id', str_repeat('x', 300))->postJson('/api/v1/projects', ['name' => 'Anonim'])->assertCreated();
        $event = AuditEvent::where('action', 'api.mutation')->firstOrFail();
        $this->assertSame($response->headers->get('X-Trace-Id'), $event->trace_id);
        $this->assertSame(36, strlen($event->trace_id));
    }
}
