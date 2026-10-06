import * as d from './erp-db-common.mjs';
let checks = 0;
function assert(condition) { if (!condition) throw Error('PRIVILEGE_CHECK_FAILED'); checks++; }
function denied(query, identity) {
  let rejected = false;
  try { d.sql('BEGIN; ' + query + '; ROLLBACK;', identity); } catch { rejected = true; }
  assert(rejected);
}
try {
  d.config();
  const roles = d.roleConfig();
  for (const identity of [roles.runtime, roles.monitor]) {
    assert(d.sql('SELECT current_user', identity) === identity.user);
    assert(d.sql("SELECT count(*) FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)", identity) === '0');
    assert(d.sql("SELECT count(*) FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=current_user)", identity) === '0');
    assert(d.sql("SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user)", identity) === '0');
    denied('CREATE TABLE public.erp_security_probe(id integer)', identity);
    denied('ALTER TABLE users ADD COLUMN erp_probe integer', identity);
    denied('TRUNCATE users', identity);
    denied('CREATE SCHEMA erp_security_probe', identity);
  }
  d.sql('BEGIN; INSERT INTO users SELECT * FROM users WHERE false; UPDATE users SET name=name WHERE false; DELETE FROM users WHERE false; INSERT INTO audit_events SELECT * FROM audit_events WHERE false; ROLLBACK;', roles.runtime);
  checks++;
  denied('UPDATE audit_events SET action=action WHERE false', roles.runtime);
  denied('DELETE FROM audit_events WHERE false', roles.runtime);
  denied('UPDATE acc_omzet_events SET id=id WHERE false', roles.runtime);
  denied('DELETE FROM acc_voucher_events WHERE false', roles.runtime);
  for (const table of ['cel_stock_movements','acc_voucher_attachments','acc_hr_events','acc_deposit_events']) {
    if (d.sql("SELECT to_regclass('public."+table+"') IS NOT NULL", roles.runtime) === 't') {
      denied('UPDATE '+table+' SET id=id WHERE false', roles.runtime);
      denied('DELETE FROM '+table+' WHERE false', roles.runtime);
    }
  }
  denied('DELETE FROM migrations WHERE false', roles.runtime);
  denied('UPDATE accounting_master_history SET action=action WHERE false', roles.runtime);
  denied('DELETE FROM accounting_master_history WHERE false', roles.runtime);
  assert(Number(d.sql('SELECT count(*) FROM outlets', roles.monitor)) >= 0);
  assert(Number(d.sql('SELECT count(id) FROM users', roles.monitor)) >= 0);
  denied('SELECT password_hash FROM users', roles.monitor);
  denied('SET TRANSACTION READ WRITE; UPDATE outlets SET name=name WHERE false', roles.monitor);
  denied('SET TRANSACTION READ WRITE; DELETE FROM users WHERE false', roles.monitor);
  d.sql('BEGIN; CREATE TABLE public.erp_security_probe(id integer); ROLLBACK;', roles.owner);
  checks++;
  console.log(JSON.stringify({ checks, passed: true, runtime: roles.runtime.user, monitor: roles.monitor.user, migrator: roles.owner.user, testRowsWritten: 0, secretsDisplayed: false }));
} catch { console.error('Verifikasi privilege gagal; credential disembunyikan.'); process.exitCode = 1; }
