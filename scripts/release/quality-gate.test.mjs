import test from 'node:test';
import assert from 'node:assert/strict';
import { QUALITY_STEPS, runQualityGate } from './quality-gate.mjs';

test('gagal satu pemeriksaan menghentikan sisanya dan tidak menyatakan lulus', () => {
  let calls = 0;
  const report = runQualityGate(() => ++calls === 2 ? 1 : 0, [['awal'], ['gagal'], ['sisa']]);
  assert.equal(report.passed, false);
  assert.equal(calls, 2);
  assert.deepEqual(report.checks.map(check => check.status), ['passed', 'failed', 'not_run']);
});
test('proses tidak dapat dijalankan atau melempar error dianggap gagal', () => {
  assert.equal(runQualityGate(() => null, [['command']]).passed, false);
  assert.equal(runQualityGate(() => { throw new Error('gagal'); }, [['command']]).passed, false);
});
test('kelulusan hanya berlaku untuk gate teknis yang tidak kosong', () => {
  assert.equal(runQualityGate(() => 0, []).passed, false);
  assert.equal(runQualityGate(() => 0).passed, true);
  assert.equal(runQualityGate(() => 0).scope, 'technical_checks_only');
});
test('gate tidak menjalankan migrasi, seeder, restore atau deployment', () => {
  for (const [, command] of QUALITY_STEPS) assert.doesNotMatch(command, /migrate|seed|restore|deploy/);
});
