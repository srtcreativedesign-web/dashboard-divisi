import fs from 'node:fs';
import path from 'node:path';
import * as db from '../database/erp-db-common.mjs';

const dataset = JSON.parse(fs.readFileSync(new URL('./omzet-dataset.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const backup = args.find(v => v.startsWith('--backup='))?.slice(9);
const output = path.resolve(args.find(v => v.startsWith('--report='))?.slice(9) || 'C:/ERP/omzet-uat-report.json');
const report = { batch: dataset.batch, checks: [], rows: [], passed: false, secretsDisplayed: false };
const sessions = {};
const base = 'http://127.0.0.1:8000/api/v1';
const money = c => String(c / 100n) + '.' + String(c % 100n).padStart(2, '0');
const cents = v => BigInt(v.replace('.', ''));
const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k).value).join('-');
};
function check(name, passed, details = {}) {
  report.checks.push({ name, passed: Boolean(passed), ...details });
  if (!passed) throw Error('CHECK_FAILED');
}
async function request(actor, method, route, body, status = 200) {
  const response = await fetch(base + route, { method, headers: { Accept: 'application/json', Origin: 'http://localhost:5173', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(sessions[actor] ? { Authorization: 'Bearer ' + sessions[actor].token } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const json = await response.json();
  check(method + ' ' + route, response.status === status, { expected: status, actual: response.status, code: json.error?.code });
  return json.data;
}
async function action(v, actor, name, data = {}) {
  return request(actor, 'POST', '/accounting/omzet/' + v.id + '/' + name, { version: v.version, ...data });
}
async function list(month) {
  const rows = []; let page = 1; let last;
  do { const data = await request('admin', 'GET', '/accounting/omzet?month=' + month + '&page=' + page); rows.push(...data.items); last = data.last_page; page++; } while (page <= last);
  return rows;
}
try {
  const config = db.config();
  if (!args.includes('--write') || !backup?.endsWith('.erpbackup') || !fs.existsSync(backup) || fs.statSync(backup).size < 1024) throw Error('BACKUP_REQUIRED');
  if (!output.startsWith(path.resolve('C:/ERP') + path.sep) || !output.endsWith('.json')) throw Error('REPORT_PATH_REJECTED');
  if (!/^APP_ENV=local\s*$/m.test(fs.readFileSync(path.join(db.api, '.env'), 'utf8')) || config.database !== db.database || dataset.through !== today() || !/^OMZET-UAT-\d{8}$/.test(dataset.batch)) throw Error('LOCAL_TARGET_REJECTED');
  const password = fs.readFileSync(path.join(db.api, '.env.uat-accounts.md'), 'utf8').match(/Uat![A-Za-z0-9]+/)?.[0];
  if (!password) throw Error('CREDENTIALS_UNAVAILABLE');
  for (const [key, actor] of Object.entries(dataset.actors)) {
    const data = await request(null, 'POST', '/auth/login', { email: actor.email, password });
    sessions[key] = { token: data.accessToken, id: data.user.id };
    check('Role/domain ' + key, data.user.role === actor.role && data.user.divisionCode === 'ACC');
  }
  const outlets = await request('admin', 'GET', '/accounting/omzet/outlets');
  const outlet = outlets.find(o => o.divisionCode === dataset.division && o.name.includes(dataset.outletMarker));
  check('Outlet khusus UAT tersedia', Boolean(outlet));
  const months = [...new Set(dataset.rows.map(r => r.business_date.slice(0, 7)))];
  const existing = (await Promise.all(months.map(list))).flat();
  for (const row of dataset.rows) {
    check('Tanggal/kanal/referensi dataset ' + row.source_reference, row.business_date >= dataset.from && row.business_date <= dataset.through && row.source_reference.startsWith(dataset.batch + '-') && ['cash_amount', 'qris_amount', 'edc_amount', 'transfer_amount', 'other_amount'].reduce((total, k) => total + cents(row[k]), 0n) === cents(row.outlet_amount));
    const conflict = existing.find(v => v.outlet_id === outlet.id && v.business_date === row.business_date && v.shift === row.shift);
    check('Preflight tanpa menimpa ' + row.source_reference, !conflict || conflict.source_reference === row.source_reference);
  }
  let testedLate = false;
  for (const row of dataset.rows) {
    const input = { ...row, outlet_id: outlet.id };
    let v = existing.find(v => v.source_reference === row.source_reference);
    const wasExisting = Boolean(v);
    const resume = v && args.includes('--resume') && v.created_by === sessions.admin.id && Object.entries(input).every(([k, value]) => v[k] === value);
    if (!v) v = await request('admin', 'POST', '/accounting/omzet', input, 201);
    if ((!wasExisting || resume) && row.business_date < today()) {
      if (resume) v = await request('admin', 'GET', '/accounting/omzet/' + v.id);
      if (v.status === 'draft') {
        if (!v.submission_window.can_submit) {
          if (!testedLate) {
            await request('admin', 'POST', '/accounting/omzet/' + v.id + '/submit', { version: v.version }, 422);
            testedLate = true;
          }
          let permit = v.unlock_requests.find(p => p.status === 'pending');
          if (!permit) { v = await action(v, 'admin', 'request-unlock', { reason: 'UAT / SIMULASI pengisian historis September/Oktober melalui izin resmi.' }); permit = v.unlock_requests.find(p => p.status === 'pending'); }
          v = await action(v, 'manager', 'decide-unlock', { unlock_id: permit.id, decision: 'approve', reason: 'UAT / SIMULASI izin input historis oleh Manager berbeda dari pembuat.' });
        }
        v = await action(v, 'admin', 'submit');
      }
      if (v.status === 'submitted') v = await action(v, 'accounting', 'review', { decision: 'validate', reason: 'UAT / SIMULASI kanal pembayaran sesuai dengan omzet outlet.' });
    }
    report.rows.push({ id: v.id, source_reference: v.source_reference, date: row.business_date, status: v.status, version: v.version, existing: wasExisting });
    if (report.rows.length % 10 === 0) console.log(JSON.stringify({ progress: report.rows.length, total: dataset.rows.length, secretsDisplayed: false }));
  }
  const rows = (await Promise.all(months.map(list))).flat().filter(v => v.source_reference.startsWith(dataset.batch + '-'));
  check('Seluruh batch tersimpan tanpa duplikasi', rows.length === dataset.rows.length);
  check('H+1: masa lalu tervalidasi dan hari ini draf', rows.every(v => v.business_date < today() ? v.status === 'validated' : v.status === 'draft'));
  const first = rows.find(v => v.status === 'validated');
  const last = rows.find(v => v.business_date === today());
  if (first) {
    const source = dataset.rows.find(r => r.source_reference === first.source_reference);
    await request('admin', 'PUT', '/accounting/omzet/' + first.id, { ...source, outlet_id: outlet.id, version: first.version }, 409);
    await request('admin', 'POST', '/accounting/omzet/' + first.id + '/review', { version: first.version, decision: 'validate' }, 403);
  }
  if (last) await request('admin', 'POST', '/accounting/omzet/' + last.id + '/submit', { version: last.version }, 422);
  await request('admin', 'POST', '/accounting/omzet', { ...dataset.rows[0], outlet_id: outlet.id, business_date: '2026-10-08', source_reference: dataset.batch + '-FUTURE' }, 400);
  const annual = await request('accounting', 'GET', '/accounting/omzet/annual?year=2026');
  for (const month of months) {
    const expected = dataset.rows.filter(v => v.business_date.startsWith(month) && v.business_date < today()).reduce((total, v) => total + cents(v.outlet_amount), 0n);
    const actual = rows.filter(v => v.business_date.startsWith(month) && v.status === 'validated').reduce((total, v) => total + cents(v.outlet_amount), 0n);
    check('Jumlah omzet tervalidasi ' + month, actual === expected);
    check('Laporan tahunan memuat ' + month, cents(annual.months.find(m => m.month === month).amount) >= actual);
    report[month] = { records: rows.filter(v => v.business_date.startsWith(month)).length, validated_amount: money(actual), recorded_amount: money(dataset.rows.filter(v => v.business_date.startsWith(month)).reduce((total, v) => total + cents(v.outlet_amount), 0n)) };
  }
  report.database = JSON.parse(db.sql("SELECT json_build_object('records',count(*),'validated',sum(CASE WHEN status='validated' THEN 1 ELSE 0 END),'draft',sum(CASE WHEN status='draft' THEN 1 ELSE 0 END),'events',(SELECT count(*) FROM acc_omzet_events WHERE record_id IN (SELECT id FROM acc_omzet_records WHERE source_reference LIKE '" + dataset.batch + "-%')),'audit',(SELECT count(*) FROM audit_events WHERE entity_id IN (SELECT id::text FROM acc_omzet_records WHERE source_reference LIKE '" + dataset.batch + "-%') AND action LIKE 'accounting.omzet.%')) FROM acc_omzet_records WHERE source_reference LIKE '" + dataset.batch + "-%'", config));
  check('Persistensi PostgreSQL dan audit', Number(report.database.records) === 74 && Number(report.database.validated) === 72 && Number(report.database.draft) === 2 && Number(report.database.events) === Number(report.database.audit));
  report.passed = true;
} catch (error) {
  report.failure = ['BACKUP_REQUIRED', 'LOCAL_TARGET_REJECTED', 'REPORT_PATH_REJECTED', 'CREDENTIALS_UNAVAILABLE', 'POSTGRES_COMMAND_FAILED', 'CHECK_FAILED'].includes(error.message) ? error.message : 'Proses gagal; informasi credential/transport disembunyikan.';
  process.exitCode = 1;
} finally {
  for (const [key, session] of Object.entries(sessions)) {
    try { await request(key, 'POST', '/auth/logout', {}); } catch { report.passed = false; process.exitCode = 1; }
    session.token = '';
  }
  if (output.startsWith(path.resolve('C:/ERP') + path.sep) && output.endsWith('.json')) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, rows: report.rows.length, checks: report.checks.length, failed: report.checks.filter(c => !c.passed), failure: report.failure, report: output, secretsDisplayed: false }));
}
