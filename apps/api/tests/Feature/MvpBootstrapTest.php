<?php

namespace Tests\Feature;

use App\Console\Commands\CreateMvpUser;
use App\Models\AuditEvent;
use App\Models\Division;
use App\Models\DivisionConfig;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\MvpMasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\PendingCommand;

class MvpBootstrapTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_operational_seed_contains_only_mvp_masters(): void
    {
        $this->app->instance('env', 'local');
        $this->seed(DatabaseSeeder::class);
        $this->assertSame(['ACC', 'CELL', 'PROJECT'], Division::orderBy('code')->pluck('code')->all());
        $this->assertDatabaseCount('division_configs', 3);
        foreach (['users', 'outlets', 'accounting_transactions', 'acc_omzet_records', 'projects', 'cel_inventories'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    public function test_repeated_seed_preserves_existing_configuration_and_inactive_division(): void
    {
        $this->seed(MvpMasterSeeder::class);
        $division = Division::where('code', 'ACC')->firstOrFail();
        $division->update(['name' => 'Accounting perusahaan', 'is_active' => false]);
        DivisionConfig::where('division_id', $division->id)->firstOrFail()->update(['enabled_modules' => ['accounting'], 'is_active' => false]);
        $this->seed(MvpMasterSeeder::class);
        $this->assertDatabaseCount('divisions', 3);
        $this->assertDatabaseHas('divisions', ['id' => $division->id, 'name' => 'Accounting perusahaan', 'is_active' => false]);
        $config = DivisionConfig::where('division_id', $division->id)->firstOrFail();
        $this->assertSame(['accounting'], $config->enabled_modules);
        $this->assertFalse($config->is_active);
    }

    public function test_each_mvp_division_supports_all_eight_roles_with_single_scope_and_hashed_password(): void
    {
        $this->seed(MvpMasterSeeder::class);
        foreach (array_keys(MvpMasterSeeder::DIVISIONS) as $division) {
            foreach (CreateMvpUser::ROLES as $role) {
                $email = strtolower($division.'.'.$role).'@example.test';
                $this->createAccount($email, $division, $role)->assertSuccessful();
                $user = User::where('email', $email)->firstOrFail();
                $this->assertTrue(Hash::check('TestingOnly123!', $user->password_hash));
                $this->assertSame($role, $user->role);
                $this->assertSame($division, $user->division_code);
                $this->assertCount(1, $user->scopes);
                $this->assertSame($division, $user->scopes->first()->division->code);
            }
        }
        $this->assertDatabaseCount('users', 24);
        $this->assertDatabaseCount('audit_events', 24);
        $this->assertDatabaseCount('user_scopes', 24);
        $this->assertStringNotContainsString('TestingOnly123!', json_encode(AuditEvent::all()->toArray()));
    }

    public function test_existing_account_is_never_overwritten(): void
    {
        $this->seed(MvpMasterSeeder::class);
        $this->createAccount('person@example.test', 'ACC', 'ADMIN')->assertSuccessful();
        $user = User::where('email', 'person@example.test')->firstOrFail();
        $hash = $user->password_hash;
        $this->artisan('erp:create-user', ['email' => 'PERSON@example.test', '--name' => 'Nama baru', '--division' => 'PROJECT', '--role' => 'MANAGER'])->assertFailed();
        $user->refresh();
        $this->assertSame('ADMIN', $user->role);
        $this->assertSame('ACC', $user->division_code);
        $this->assertSame($hash, $user->password_hash);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('user_scopes', 1);
    }

    public function test_outside_mvp_inactive_division_and_noninteractive_creation_are_rejected(): void
    {
        $this->seed(MvpMasterSeeder::class);
        foreach ([['MINI', 'ADMIN'], ['ACC', 'BOD'], ['ACC', 'SUPERADMIN']] as [$division, $role]) {
            $this->artisan('erp:create-user', ['email' => 'person@example.test', '--name' => 'Person', '--division' => $division, '--role' => $role])->assertFailed();
        }
        Division::where('code', 'ACC')->update(['is_active' => false]);
        $this->artisan('erp:create-user', ['email' => 'person@example.test', '--name' => 'Person', '--division' => 'ACC', '--role' => 'ADMIN'])->assertFailed();
        $this->artisan('erp:create-user', ['email' => 'person@example.test', '--name' => 'Person', '--division' => 'CELL', '--role' => 'ADMIN', '--no-interaction' => true])->assertFailed();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_weak_password_and_mismatched_confirmation_do_not_create_accounts(): void
    {
        $this->seed(MvpMasterSeeder::class);
        foreach ([['weak', 'weak'], ['TestingOnly123!', 'Different123!']] as [$password, $confirmation]) {
            $this->createAccount('person@example.test', 'ACC', 'ADMIN', $password, $confirmation)->assertFailed();
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('user_scopes', 0);
    }

    private function createAccount(string $email, string $division, string $role, string $password = 'TestingOnly123!', string $confirmation = 'TestingOnly123!'): PendingCommand
    {
        return $this->artisan('erp:create-user', ['email' => $email, '--name' => 'Person pengujian', '--division' => $division, '--role' => $role])
            ->expectsQuestion('Password baru (minimal 12 karakter, huruf besar/kecil, angka dan simbol)', $password)
            ->expectsQuestion('Ulangi password baru', $confirmation);
    }
}
