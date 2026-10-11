import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serializePolicy, assertPolicyMatches } from './erp-policy-sync.mjs';

const fixture = () => JSON.parse(readFileSync(new URL('../../apps/web/src/session/capabilities.generated.json', import.meta.url), 'utf8'));

test('perubahan hak backend memerlukan sinkronisasi frontend; CRLF setara', () => {
  const current = serializePolicy(fixture());
  assert.doesNotThrow(() => assertPolicyMatches(current, current.replace(/\n/g, '\r\n')));
  const changed = fixture();
  changed.domains.ACC.ADMIN.push('approve:acc_period');
  assert.throws(() => assertPolicyMatches(serializePolicy(changed), current), /tertinggal/);
});
test('menolak hilangnya role/domain serta capability duplikat', () => {
  const missingRole = fixture(); delete missingRole.domains.ACC.FINANCE;
  assert.throws(() => serializePolicy(missingRole));
  const missingDomain = fixture(); delete missingDomain.domains.CELL;
  assert.throws(() => serializePolicy(missingDomain));
  const duplicate = fixture(); duplicate.bod.push(duplicate.bod[0]);
  assert.throws(() => serializePolicy(duplicate));
});
test('menolak kontrak malformed dan hak mutasi BOD', () => {
  const mutation = fixture(); mutation.bod.push('write:omzet');
  assert.throws(() => serializePolicy(mutation), /BOD/);
  const invalid = fixture(); invalid.domains.ACC.ADMIN.push({ name: 'view:secret' });
  assert.throws(() => serializePolicy(invalid));
});
