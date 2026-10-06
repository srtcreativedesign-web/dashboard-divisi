import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export function scannerSettings(content) {
  const settings = {};
  for (const line of content.split(/\r\n|\r|\n/)) {
    const match = /^(UPLOAD_SCANNER_BINARY|UPLOAD_SCANNER_DATABASE)=(.*)$/.exec(line);
    if (!match) continue;
    if (Object.hasOwn(settings, match[1])) throw new Error('Konfigurasi scanner duplikat');
    let value = match[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    settings[match[1]] = value;
  }
  const binary = settings.UPLOAD_SCANNER_BINARY;
  const database = settings.UPLOAD_SCANNER_DATABASE;
  for (const value of [binary, database]) {
    if (!value || !/^[A-Za-z]:[\\/]/.test(value) || value.includes('\0') || value.includes('..')) {
      throw new Error('Scanner harus memakai lokasi Windows lokal absolut');
    }
  }
  if (path.win32.basename(binary).toLowerCase() !== 'clamscan.exe') throw new Error('Binary scanner tidak sesuai');
  return { binary, database };
}

function execute(binary, args, cwd, timeout) {
  const result = spawnSync(binary, args, { cwd, timeout, windowsHide: true, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return { code: result.error ? -1 : result.status, output: result.stdout ?? '' };
}

export function maintain(settings, run = execute) {
  const engine = path.dirname(settings.binary);
  const installation = path.dirname(settings.database);
  const updater = path.join(engine, 'freshclam.exe');
  const config = path.join(installation, 'freshclam.conf');
  const update = run(updater, ['--quiet', '--config-file='+config], engine, 600000);
  const php = process.env.ERP_UPLOAD_PHP_BINARY ?? 'php';
  const health = run(php, ['artisan', 'erp:scan-check'], path.join(projectRoot, 'apps/api'), 150000);
  const cleanup = run(php, ['artisan', 'erp:quarantine-reconcile', '--apply'], path.join(projectRoot, 'apps/api'), 30000);
  let counts = null;
  try { counts = JSON.parse(cleanup.output.trim()); } catch { /* Output selain ringkasan tidak dianggap sukses. */ }
  return {
    checkedAt: new Date().toISOString(),
    updateSucceeded: update.code === 0,
    scannerReady: health.code === 0,
    quarantineReconciled: cleanup.code === 0 && counts !== null
      && ['stale', 'removed', 'unexpected'].every(key => Number.isInteger(counts[key]) && counts[key] >= 0)
      && counts.unexpected === 0 && counts.removed <= counts.stale,
    quarantine: counts,
    exitCodes: { update: update.code, health: health.code, cleanup: cleanup.code },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const settings = scannerSettings(fs.readFileSync(path.join(projectRoot, 'apps/api/.env'), 'utf8'));
    const reportPath = path.join(path.dirname(settings.database), 'maintenance-status.json');
    const mode = process.argv[2];
    if (mode === 'status') {
      console.log(JSON.stringify(JSON.parse(fs.readFileSync(reportPath, 'utf8'))));
    } else if (mode === 'maintain') {
      const report = maintain(settings);
      const temporary = reportPath+'.tmp';
      fs.writeFileSync(temporary, JSON.stringify(report, null, 2));
      fs.renameSync(temporary, reportPath);
      console.log(JSON.stringify(report));
      if (!report.updateSucceeded || !report.scannerReady || !report.quarantineReconciled) process.exitCode = 1;
    } else {
      throw new Error('Gunakan maintain atau status');
    }
  } catch {
    console.error('Pemeliharaan scanner gagal; periksa konfigurasi lokal. Tidak ada secret yang ditampilkan.');
    process.exitCode = 1;
  }
}
