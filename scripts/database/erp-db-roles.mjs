import * as d from './erp-db-common.mjs';
const runtime = 'dashboard_divisi_mvp_runtime', monitor = 'dashboard_divisi_mvp_readonly', owner = 'dashboard_divisi_mvp_app';
function apply() {
  d.config();
  if (d.sql('SELECT current_user', d.admin) !== 'postgres') throw Error('ADMIN_IDENTITY_REJECTED');
  if (d.sql("SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname=current_database()", d.admin) !== owner) throw Error('DATABASE_OWNER_REJECTED');
  let roles;
  if (d.fs.existsSync(d.rolesFile)) roles = d.roleConfig();
  else {
    if (d.sql(`SELECT count(*) FROM pg_roles WHERE rolname IN ('${runtime}','${monitor}')`, d.admin) !== '0') throw Error('ROLE_COLLISION');
    const current = d.config();
    if (current.user !== owner) throw Error('MIGRATOR_CONFIG_REJECTED');
    roles = { owner: current, runtime: { user: runtime, password: d.crypto.randomBytes(32).toString('hex') }, monitor: { user: monitor, password: d.crypto.randomBytes(32).toString('hex') } };
    d.savePrivate(d.rolesFile, JSON.stringify(roles));
  }
  if (roles.owner.user !== owner || roles.owner.database !== d.database || roles.runtime.user !== runtime || roles.monitor.user !== monitor || ![roles.runtime.password, roles.monitor.password].every(p => /^[a-f0-9]{64}$/.test(p))) throw Error('ROLE_CONFIG_REJECTED');
  const create = [roles.runtime, roles.monitor].map(r => `DO $role$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${r.user}') THEN CREATE ROLE ${r.user} LOGIN PASSWORD '${r.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS; END IF; END $role$;`).join('\n');
  d.sql(`BEGIN;
${create}
REVOKE ALL ON DATABASE ${d.database} FROM ${runtime}, ${monitor};
GRANT CONNECT ON DATABASE ${d.database} TO ${runtime}, ${monitor};
REVOKE CREATE ON SCHEMA public FROM PUBLIC, ${runtime}, ${monitor};
GRANT USAGE ON SCHEMA public TO ${runtime}, ${monitor};
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${runtime}, ${monitor};
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ${runtime};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${monitor};
REVOKE INSERT,UPDATE,DELETE ON migrations FROM ${runtime};
REVOKE UPDATE,DELETE ON audit_events,acc_omzet_events,acc_voucher_events,accounting_master_history FROM ${runtime};
DO $protection$ BEGIN
IF to_regclass('public.acc_deposit_events') IS NOT NULL THEN REVOKE UPDATE,DELETE ON acc_deposit_events FROM ${runtime}; END IF;
IF to_regclass('public.acc_hr_events') IS NOT NULL THEN REVOKE UPDATE,DELETE ON acc_hr_events FROM ${runtime}; END IF;
IF to_regclass('public.cel_stock_movements') IS NOT NULL THEN REVOKE UPDATE,DELETE ON cel_stock_movements FROM ${runtime}; END IF;
IF to_regclass('public.acc_voucher_attachments') IS NOT NULL THEN REVOKE UPDATE,DELETE ON acc_voucher_attachments FROM ${runtime}; END IF;
IF to_regclass('public.acc_cellular_import_batches') IS NOT NULL THEN REVOKE DELETE ON acc_cellular_import_batches FROM ${runtime}; END IF;
IF to_regclass('public.acc_cellular_import_rows') IS NOT NULL THEN REVOKE UPDATE,DELETE ON acc_cellular_import_rows FROM ${runtime}; END IF;
IF to_regclass('public.acc_cellular_import_events') IS NOT NULL THEN REVOKE UPDATE,DELETE ON acc_cellular_import_events FROM ${runtime}; END IF;
END $protection$;
REVOKE SELECT ON users FROM ${monitor};
GRANT SELECT(id,name,email,role,division_code,is_active,created_at,updated_at) ON users TO ${monitor};
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ${runtime};
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ${monitor};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO ${runtime};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public GRANT SELECT ON TABLES TO ${monitor};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO ${runtime};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public GRANT SELECT ON SEQUENCES TO ${monitor};
ALTER ROLE ${monitor} IN DATABASE ${d.database} SET default_transaction_read_only=on;
COMMIT;`, d.admin);
  const env = d.fs.readFileSync(d.envFile, 'utf8');
  if (d.config().user !== runtime) {
    d.savePrivate(d.envFile + '.runtime-before-' + Date.now(), env);
    let next = env;
    for (const [key, value] of Object.entries({ DB_USERNAME: runtime, DB_PASSWORD: roles.runtime.password })) next = next.replace(new RegExp('^' + key + '=.*$', 'm'), key + '=' + value);
    d.fs.writeFileSync(d.envFile, next);
  }
  console.log(JSON.stringify({ database: d.database, runtime, monitor, migrator: owner, secretsDisplayed: false }));
}
try {
  if (process.argv[2] !== 'apply') throw Error('USE_APPLY_AFTER_REVIEW');
  apply();
} catch (error) { console.error(/^[A-Z_]+$/.test(error.message) ? error.message : 'ROLE_CONFIGURATION_FAILED'); process.exitCode = 1; }
