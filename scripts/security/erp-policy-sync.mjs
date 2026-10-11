import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const target = resolve(root, 'apps/web/src/session/capabilities.generated.json');
const roles = ['MANAGER', 'HEAD_OPS', 'SPV', 'LEADER', 'ADMIN', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE'];

export function serializePolicy(policy) {
  if (policy.schemaVersion !== 1 || !policy.domains || Object.keys(policy.domains).sort().join(',') !== 'ACC,CELL,PROJECT') throw new Error('Kontrak domain policy tidak valid');
  const capabilities = values => {
    if (!Array.isArray(values) || values.some(value => typeof value !== 'string' || !/^[a-z]+:[a-z_]+$/.test(value)) || new Set(values).size !== values.length) throw new Error('Daftar capability tidak valid');
    return [...values].sort();
  };
  const domains = Object.fromEntries(Object.keys(policy.domains).sort().map(domain => {
    const source = policy.domains[domain];
    if (!source || Object.keys(source).sort().join(',') !== [...roles].sort().join(',')) throw new Error('Kontrak role policy tidak valid');
    return [domain, Object.fromEntries(roles.map(role => [role, capabilities(source[role])]))];
  }));
  const bod = capabilities(policy.bod);
  if (bod.some(capability => !capability.startsWith('view:'))) throw new Error('BOD tidak boleh mendapat capability mutasi');
  return JSON.stringify({ schemaVersion: 1, domains, bod }, null, 2) + '\n';
}

export function assertPolicyMatches(expected, actual) {
  if (expected !== actual.replace(/\r\n/g, '\n')) throw new Error('Policy frontend tertinggal. Jalankan npm run policy:sync dan tinjau perubahan.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (process.argv.length !== 3 || !['--check', '--write'].includes(mode)) throw new Error('Gunakan --check atau --write');
    const exported = spawnSync('php', [resolve(root, 'scripts/security/export-policy.php')], { cwd: root, encoding: 'utf8' });
    if (exported.status !== 0) throw new Error('Ekspor backend gagal; periksa PHP dan composer install.');
    const expected = serializePolicy(JSON.parse(exported.stdout));
    if (mode === '--write') writeFileSync(target, expected);
    else assertPolicyMatches(expected, readFileSync(target, 'utf8'));
    console.log(mode === '--write' ? 'Matriks frontend diperbarui dari policy backend.' : 'Policy frontend/backend sinkron.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
