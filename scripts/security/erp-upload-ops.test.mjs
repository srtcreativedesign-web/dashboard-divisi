import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scannerSettings, maintain } from './erp-upload-ops.mjs';

test('hanya membaca konfigurasi scanner dan menolak lokasi remote/duplikat', () => {
  const input = 'DB_PASSWORD=rahasia\rUPLOAD_SCANNER_BINARY=C:/ERP/tools/clamscan.exe\r\nUPLOAD_SCANNER_DATABASE="C:/ERP/tools/database"\n';
  const settings = scannerSettings(input);
  assert.deepEqual(settings, { binary: 'C:/ERP/tools/clamscan.exe', database: 'C:/ERP/tools/database' });
  assert.throws(() => scannerSettings(input+'UPLOAD_SCANNER_BINARY=C:/another/clamscan.exe'));
  assert.throws(() => scannerSettings(input.replace('C:/ERP/tools/clamscan.exe', '//server/clamscan.exe')));
});

test('updater gagal tetap memeriksa kesiapan dan cleanup, tanpa mencatat output proses', () => {
  const calls = [];
  const result = maintain({ binary: 'C:/ERP/tools/engine/clamscan.exe', database: 'C:/ERP/tools/database' }, (binary, args) => {
    calls.push({ binary, args });
    return calls.length === 1 ? { code: 1, output: 'tidak disimpan' }
      : calls.length === 2 ? { code: 0, output: 'scanner siap' } : { code: 0, output: '{"stale":0,"removed":0,"unexpected":0}' };
  });
  assert.equal(calls.length, 3);
  assert.equal(result.updateSucceeded, false);
  assert.equal(result.scannerReady, true);
  assert.equal(result.quarantineReconciled, true);
  assert.equal(JSON.stringify(result).includes('tidak disimpan'), false);
});

test('scan/cleanup gagal tidak dianggap sehat', () => {
  const result = maintain({ binary: 'C:/ERP/tools/engine/clamscan.exe', database: 'C:/ERP/tools/database' }, () => ({ code: 1, output: '' }));
  assert.equal(result.scannerReady, false);
  assert.equal(result.quarantineReconciled, false);
});
