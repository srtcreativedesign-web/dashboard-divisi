import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import { parseEnv } from 'node:util';
const root = path.resolve(import.meta.dirname, '..', '..');
const api = path.join(root, 'apps/api');
const database = 'dashboard_divisi_mvp';
const rolesFile = path.join(api, '.env.database-roles.json');
const envFile = path.join(api, '.env');
function parseDatabaseEnv(content) {
  const env = Object.assign({}, ...content.split(/\r\n|\r|\n/).filter(line => /^\s*(?:export\s+)?(?:DB_[A-Z_]+|DATABASE_URL)=/.test(line)).map(line => parseEnv(line.trim())));
  if (env.DB_DATABASE !== database || env.DB_CONNECTION !== 'pgsql' || !['127.0.0.1', 'localhost'].includes(env.DB_HOST) || env.DB_PORT !== '5432' || env.DB_URL || env.DATABASE_URL) throw Error('TARGET_CONFIG_REJECTED');
  return { database, user: env.DB_USERNAME, password: env.DB_PASSWORD };
}
const config = () => parseDatabaseEnv(fs.readFileSync(envFile, 'utf8'));
function pg(tool, args, identity, input) {
  const executable = path.join(process.env.ERP_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin', tool + (process.platform === 'win32' ? '.exe' : ''));
  try {
    return cp.execFileSync(executable, ['-h', '127.0.0.1', '-p', '5432', '-U', identity.user, '-w', ...args], {
      env: { ...process.env, PGPASSWORD: identity.password || '', PGCONNECT_TIMEOUT: '5' },
      input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000, maxBuffer: 128 * 1024 * 1024,
    });
  } catch { throw Error('POSTGRES_COMMAND_FAILED'); }
}
function sql(query, identity, target = database) {
  return pg('psql', ['-d', target, '-X', '-At', '--set=ON_ERROR_STOP=1'], identity, query).replaceAll('\r\n', '\n').trim();
}
const admin = { user: 'postgres', password: process.env.ERP_PG_ADMIN_PASSWORD || '' };
function restricted(target, directory = false) {
  if (process.platform === 'win32') {
    const user = cp.execFileSync('whoami', [], { encoding: 'utf8' }).trim();
    cp.execFileSync('icacls', [target, '/inheritance:r', '/grant:r', `${user}:${directory ? '(OI)(CI)' : ''}F`, `*S-1-5-18:${directory ? '(OI)(CI)' : ''}F`, `*S-1-5-32-544:${directory ? '(OI)(CI)' : ''}F`], { stdio: 'pipe' });
  } else fs.chmodSync(target, directory ? 0o700 : 0o600);
}
function savePrivate(file, content) {
  fs.writeFileSync(file, content, { flag: 'wx', mode: 0o600 });
  restricted(file);
}
function roleConfig() { return JSON.parse(fs.readFileSync(rolesFile, 'utf8')); }
function ownerIdentity() {
  const identity = fs.existsSync(rolesFile) ? roleConfig().owner : config();
  if (identity.user !== 'dashboard_divisi_mvp_app' || identity.database !== database || typeof identity.password !== 'string' || !identity.password) throw Error('MIGRATOR_CONFIG_REJECTED');
  return identity;
}
function normalizeConstraint(definition) {
  // PostgreSQL dapat memindahkan cast array text ke setiap literal varchar saat pg_restore.
  // Hanya literal varchar tanpa batas panjang yang dinormalisasi; cast lain tetap dibandingkan.
  return definition.replace(/(ANY\s*\(\s*)ARRAY\[((?:'(?:[^']|'')*'::character varying(?:::text)?(?:,\s*)?)+)\](?:::text\[\])?/g,
    (_, prefix, values) => prefix + 'ARRAY[' + values.replace(/('(?:[^']|'')*')::character varying(?:::text)?/g, '$1::text') + ']');
}
function fingerprint(identity, target = database, version = 2) {
  if (![1, 2].includes(version)) throw Error('FINGERPRINT_VERSION_REJECTED');
  const tables = sql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename", identity, target).split('\n').filter(Boolean);
  const result = { tables: {}, columns: '', indexes: '', constraints: '', sequences: {} };
  for (const name of tables) {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw Error('UNSAFE_TABLE_NAME');
    result.tables[name] = JSON.parse(sql(`SELECT json_build_object('count',count(*),'digest',md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),''))) FROM public."${name}" t`, identity, target));
  }
  result.columns = sql("SELECT md5(string_agg(row_to_json(c)::text,E'\\n' ORDER BY table_name,ordinal_position)) FROM (SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='public') c", identity, target);
  result.indexes = sql("SELECT md5(string_agg(indexdef,E'\\n' ORDER BY indexname)) FROM pg_indexes WHERE schemaname='public'", identity, target);
  result.constraints = sql("SELECT md5(string_agg(c.conrelid::regclass::text || ':' || CASE WHEN c.contype='n' THEN '' ELSE c.conname END || ':' || CASE WHEN c.conrelid='public.projects'::regclass AND c.conname='projects_status_check' THEN replace(replace(replace(pg_get_constraintdef(c.oid,true),'::character varying',''),'::text[]',''),'::text','') ELSE pg_get_constraintdef(c.oid,true) END,E'\\n' ORDER BY c.conrelid::regclass::text,c.contype,CASE WHEN c.contype='n' THEN pg_get_constraintdef(c.oid,true) ELSE c.conname END)) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public'", identity, target);
  if (version === 2) {
    const definitions = sql("SELECT c.conrelid::regclass::text || ':' || c.contype::text || ':' || CASE WHEN c.contype='n' THEN '' ELSE c.conname END || ':' || c.convalidated::text || ':' || c.condeferrable::text || ':' || c.condeferred::text || ':' || pg_get_constraintdef(c.oid,true) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' ORDER BY 1", identity, target);
    result.constraints = crypto.createHash('sha256').update(normalizeConstraint(definitions)).digest('hex');
  }
  const sequences = sql("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename", identity, target).split('\n').filter(Boolean);
  for (const name of sequences) {
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw Error('UNSAFE_SEQUENCE_NAME');
    result.sequences[name] = sql(`SELECT last_value,is_called FROM public."${name}"`, identity, target);
  }
  return result;
}
const digest = content => crypto.createHash('sha256').update(content).digest('hex');
export { fs, path, cp, crypto, root, api, database, rolesFile, envFile, parseDatabaseEnv, normalizeConstraint, config, pg, sql, admin, restricted, savePrivate, roleConfig, ownerIdentity, fingerprint, digest };
