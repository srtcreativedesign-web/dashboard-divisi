import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDatabaseEnv, normalizeConstraint } from './erp-db-common.mjs';
const lines = ['DB_CONNECTION=pgsql', 'DB_HOST=127.0.0.1', 'DB_PORT=5432', 'DB_DATABASE=dashboard_divisi_mvp', 'DB_USERNAME=runtime_test', 'DB_PASSWORD="test#only"'];
test('membaca pemisah CR, CRLF dan LF pada konfigurasi lokal', () => {
  for (const separator of ['\r', '\r\n', '\n']) assert.equal(parseDatabaseEnv(lines.join(separator)).password, 'test#only');
});
test('menolak database lain dan URL yang mengesampingkan target', () => {
  assert.throws(() => parseDatabaseEnv(lines.join('\n').replace('dashboard_divisi_mvp', 'database_lain')));
  assert.throws(() => parseDatabaseEnv(lines.join('\n') + '\nDATABASE_URL=postgresql://example.test/db'));
});
test('menolak host non-loopback dan koneksi bukan PostgreSQL', () => {
  assert.throws(() => parseDatabaseEnv(lines.join('\n').replace('127.0.0.1', 'example.test')));
  assert.throws(() => parseDatabaseEnv(lines.join('\n').replace('pgsql', 'sqlite')));
});
test('cast array text PostgreSQL setara tetap cocok tanpa mengabaikan perubahan nilai atau aturan', () => {
  const before = "CHECK (kind::text = ANY (ARRAY['SIM_CARD'::character varying, 'ACCESSORY'::character varying]::text[]))";
  const after = "CHECK (kind::text = ANY (ARRAY['SIM_CARD'::character varying::text, 'ACCESSORY'::character varying::text]))";
  assert.equal(normalizeConstraint(before), normalizeConstraint(after));
  assert.notEqual(normalizeConstraint(before), normalizeConstraint(after.replace('ACCESSORY', 'OTHER')));
  assert.notEqual(normalizeConstraint(before), normalizeConstraint(after.replace('ANY', 'ALL')));
  const literal = "CHECK (kind::text = ANY (ARRAY['A::character varying'::character varying]::text[]))";
  assert.match(normalizeConstraint(literal), /'A::character varying'::text/);
  for (const expression of ["CHECK (amount::numeric(12,2) >= 0)", "CHECK (kind = ANY (ARRAY['abc'::character varying(2)]::text[]))", "CHECK (value = ANY (ARRAY[field::character varying]::text[]))"]) {
    assert.equal(normalizeConstraint(expression), expression);
  }
});
