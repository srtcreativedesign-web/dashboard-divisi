import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const QUALITY_STEPS = [
  ['Lingkungan', 'npm run check:env'],
  ['Orkestrasi gate', 'npm run release:test'],
  ['Lint', 'npm run lint'],
  ['TypeScript', 'npm run typecheck'],
  ['Frontend', 'npm run test --workspace @dashboard-divisi/web'],
  ['Contracts', 'npm run test --workspace @dashboard-divisi/contracts'],
  ['Build', 'npm run build'],
  ['Guard database', 'npm run db:test'],
  ['Guard scanner', 'npm run scan:test'],
  ['Formatter PHP', 'php vendor/bin/pint --test', 'apps/api'],
  ['Backend', 'php artisan test --without-tty', 'apps/api'],
];

function executeStep([, command, directory = '.']) {
  // Command berasal dari daftar tetap; tidak menerima input shell dari pengguna.
  const result = spawnSync(command, {
    shell: true, cwd: resolve(root, directory), stdio: 'inherit',
    env: { ...process.env, APP_ENV: 'testing', DB_CONNECTION: 'sqlite', DB_DATABASE: ':memory:', DB_URL: '', DATABASE_URL: '' },
  });
  return result.status;
}

export function runQualityGate(execute = executeStep, steps = QUALITY_STEPS) {
  let failed = false;
  const checks = steps.map(step => {
    if (failed) return { name: step[0], status: 'not_run' };
    let exitCode;
    try { exitCode = execute(step); } catch { exitCode = null; }
    failed = exitCode !== 0;
    return { name: step[0], status: failed ? 'failed' : 'passed', exitCode };
  });
  return { scope: 'technical_checks_only', passed: !failed && checks.length > 0, checks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const startedAt = new Date().toISOString();
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim() ?? null;
  const workingTreeDirty = Boolean(spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout?.trim());
  const report = { startedAt, commit, workingTreeDirty, ...runQualityGate(), finishedAt: new Date().toISOString() };
  const reportPath = resolve(root, 'artifacts/release/latest.json');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Bukti teknis: ${reportPath}`);
  console.log('Gate ini tidak membuktikan UAT, kapasitas, pemulihan produksi atau penerimaan bisnis.');
  process.exitCode = report.passed ? 0 : 1;
}
