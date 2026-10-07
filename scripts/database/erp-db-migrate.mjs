import * as d from './erp-db-common.mjs';
try {
  d.config();
  const action = process.argv[2];
  if (!['status', 'apply'].includes(action)) throw Error('USE_STATUS_OR_APPLY');
  const identity = d.roleConfig().owner;
  if (identity.user !== 'dashboard_divisi_mvp_app' || identity.database !== d.database) throw Error('MIGRATOR_REJECTED');
  if (d.fs.existsSync(d.path.join(d.api, 'bootstrap/cache/config.php'))) throw Error('CLEAR_CONFIG_CACHE_FIRST');
  const env = { ...process.env, DB_CONNECTION: 'pgsql', DB_HOST: '127.0.0.1', DB_PORT: '5432', DB_DATABASE: d.database, DB_USERNAME: identity.user, DB_PASSWORD: identity.password, DATABASE_URL: '', DB_URL: '' };
  d.cp.execFileSync('php', ['artisan', action === 'apply' ? 'migrate' : 'migrate:status', ...(action === 'apply' ? ['--force'] : [])], { cwd: d.api, env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  if (action === 'apply') d.cp.execFileSync(process.execPath, [d.path.join(import.meta.dirname, 'erp-db-roles.mjs'), 'apply'], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  console.log(JSON.stringify({ database: d.database, action, migrationCommandSucceeded: true, secretsDisplayed: false }));
} catch { console.error('Migrasi gagal; konfigurasi runtime tidak diganti dan credential disembunyikan.'); process.exitCode = 1; }
