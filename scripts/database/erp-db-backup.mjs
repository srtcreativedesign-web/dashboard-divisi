import * as d from './erp-db-common.mjs';
const backupRoot = d.path.resolve(process.env.ERP_BACKUP_DIR || 'C:/ERP/backups/dashboard-divisi');
const keyFile = d.path.join(d.api, '.env.backup-key');
const LIMIT = 128 * 1024 * 1024;
let phase = 'configuration';
function localFile(file) {
  const full = d.path.resolve(backupRoot, file);
  if (!full.startsWith(backupRoot + d.path.sep)) throw Error('BACKUP_PATH_REJECTED');
  return full;
}
function initialize(createKey = true) {
  d.config();
  if (backupRoot === d.path.parse(backupRoot).root || backupRoot === d.root || backupRoot === d.api || backupRoot.startsWith(d.api + d.path.sep)) throw Error('BACKUP_ROOT_REJECTED');
  const marker = d.path.join(backupRoot, '.erp-backup-directory');
  if (d.fs.existsSync(backupRoot)) {
    if (d.fs.lstatSync(backupRoot).isSymbolicLink()) throw Error('BACKUP_ROOT_REJECTED');
    if (!d.fs.existsSync(marker) && backupRoot !== d.path.resolve('C:/ERP/backups/dashboard-divisi') && d.fs.readdirSync(backupRoot).length > 0) throw Error('BACKUP_DIRECTORY_NOT_EMPTY');
  }
  d.fs.mkdirSync(backupRoot, { recursive: true });
  d.restricted(backupRoot, true);
  if (!d.fs.existsSync(marker)) d.savePrivate(marker, 'ERP_BACKUP_DIRECTORY_V1');
  if (!d.fs.existsSync(keyFile)) {
    if (!createKey) throw Error('BACKUP_KEY_MISSING');
    d.savePrivate(keyFile, d.crypto.randomBytes(32).toString('hex'));
  }
  const key = d.fs.readFileSync(keyFile, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/.test(key)) throw Error('BACKUP_KEY_REJECTED');
  return Buffer.from(key, 'hex');
}
function fileInventory() {
  const files = [];
  let size = 0;
  function add(file, relative) {
    if (d.fs.lstatSync(file).isSymbolicLink()) throw Error('SYMLINK_BACKUP_REJECTED');
    const stat = d.fs.statSync(file);
    if (!stat.isFile() || (size += stat.size) > LIMIT) throw Error('BACKUP_SIZE_LIMIT');
    const content = d.fs.readFileSync(file);
    files.push({ path: relative.replaceAll('\\', '/'), sha256: d.digest(content), content: content.toString('base64') });
  }
  function walk(folder) {
    if (!d.fs.existsSync(folder)) return;
    if (d.fs.lstatSync(folder).isSymbolicLink()) throw Error('SYMLINK_BACKUP_REJECTED');
    for (const entry of d.fs.readdirSync(folder, { withFileTypes: true })) {
      const full = d.path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw Error('SYMLINK_BACKUP_REJECTED');
      if (entry.isDirectory()) walk(full);
      else add(full, d.path.relative(d.api, full));
    }
  }
  walk(d.path.join(d.api, 'storage/app/private'));
  for (const file of ['.env', '.env.database-roles.json', '.env.uat-accounts.md']) if (d.fs.existsSync(d.path.join(d.api, file))) add(d.path.join(d.api, file), file);
  return files;
}
function backup() {
  const key = initialize(), identity = d.ownerIdentity();
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + d.crypto.randomBytes(4).toString('hex');
  const raw = localFile(id + '.dump.tmp'), output = localFile(id + '.erpbackup');
  const start = Date.now();
  try {
    const before = d.fingerprint(identity), files = fileInventory();
    d.pg('pg_dump', ['-d', d.database, '-Fc', '-f', raw], identity);
    if (d.fs.statSync(raw).size > LIMIT) throw Error('BACKUP_SIZE_LIMIT');
    const dump = d.fs.readFileSync(raw), after = d.fingerprint(identity);
    if (JSON.stringify(before) !== JSON.stringify(after) || JSON.stringify(files) !== JSON.stringify(fileInventory())) throw Error('SOURCE_CHANGED_RETRY_WHEN_QUIET');
    const bundle = Buffer.from(JSON.stringify({ format: 1, fingerprintVersion: 2, database: d.database, created: new Date().toISOString(), dump: dump.toString('base64'), dumpSha256: d.digest(dump), fingerprint: before, files }));
    if (bundle.length > LIMIT * 2) throw Error('BACKUP_SIZE_LIMIT');
    const iv = d.crypto.randomBytes(12), cipher = d.crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(bundle), cipher.final()]);
    d.savePrivate(output, Buffer.concat([Buffer.from('ERPBK001'), iv, cipher.getAuthTag(), encrypted]));
    const result = { backup: output, sha256: d.digest(d.fs.readFileSync(output)), bytes: d.fs.statSync(output).size, tables: Object.keys(before.tables).length, includedFiles: files.length, durationMs: Date.now() - start, encrypted: true, keyIncluded: false };
    d.fs.writeFileSync(localFile(id + '.manifest.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { if (d.fs.existsSync(raw)) d.fs.unlinkSync(raw); }
}
function restoreCheck(input) {
  phase = 'decrypt';
  const key = initialize(false), full = d.path.resolve(input || '');
  if (!full.startsWith(backupRoot + d.path.sep) || !full.endsWith('.erpbackup') || d.fs.lstatSync(full).isSymbolicLink()) throw Error('BACKUP_PATH_REJECTED');
  const bytes = d.fs.readFileSync(full);
  if (bytes.length > LIMIT * 2 || bytes.subarray(0, 8).toString() !== 'ERPBK001') throw Error('BACKUP_FORMAT_REJECTED');
  const decipher = d.crypto.createDecipheriv('aes-256-gcm', key, bytes.subarray(8, 20));
  decipher.setAuthTag(bytes.subarray(20, 36));
  const bundle = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(36)), decipher.final()]));
  if (bundle.format !== 1 || bundle.database !== d.database) throw Error('BACKUP_FORMAT_REJECTED');
  const dump = Buffer.from(bundle.dump, 'base64');
  if (d.digest(dump) !== bundle.dumpSha256) throw Error('DUMP_CHECKSUM_REJECTED');
  const target = 'dashboard_divisi_mvp_restore_' + d.crypto.randomBytes(4).toString('hex');
  const raw = localFile(target + '.dump.tmp'), marker = 'ERP_RESTORE_CHECK:' + target;
  const identity = d.ownerIdentity();
  let created = false;
  const start = Date.now();
  try {
    phase = 'create_isolated_database';
    if (d.sql(`SELECT count(*) FROM pg_database WHERE datname='${target}'`, d.admin, 'postgres') !== '0') throw Error('RESTORE_TARGET_EXISTS');
    d.sql(`CREATE DATABASE ${target} OWNER ${identity.user} TEMPLATE template0`, d.admin, 'postgres');
    created = true;
    d.sql(`COMMENT ON DATABASE ${target} IS '${marker}'; REVOKE ALL ON DATABASE ${target} FROM PUBLIC;`, d.admin, 'postgres');
    d.savePrivate(raw, dump);
    phase = 'restore_isolated_database';
    d.pg('pg_restore', ['-d', target, '--clean', '--if-exists', '--no-owner', '--no-acl', '--single-transaction', '--exit-on-error', raw], identity);
    phase = 'compare_database';
    const restored = d.fingerprint(identity, target, bundle.fingerprintVersion ?? 1);
    if (JSON.stringify(restored) !== JSON.stringify(bundle.fingerprint)) {
      console.error(JSON.stringify({ comparison: Object.fromEntries(Object.keys(restored).map(key => [key, JSON.stringify(restored[key]) === JSON.stringify(bundle.fingerprint[key])])) }));
      if (restored.constraints !== bundle.fingerprint.constraints) {
        const query = "SELECT c.conrelid::regclass::text || ':' || c.contype::text || ':' || CASE WHEN c.contype='n' THEN '' ELSE c.conname END || ':' || pg_get_constraintdef(c.oid,true) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' ORDER BY 1";
        const source = d.sql(query, identity).split('\n'), destination = d.sql(query, identity, target).split('\n');
        console.error(JSON.stringify({ constraintMetadataDiff: { source: source.filter(line => !destination.includes(line)), restored: destination.filter(line => !source.includes(line)) } }));
      }
      throw Error('RESTORE_DATA_OR_SCHEMA_MISMATCH');
    }
    for (const testDatabase of [d.database, target]) {
      const setup = "BEGIN; CREATE TEMP TABLE erp_constraint_probe (LIKE public.projects INCLUDING CONSTRAINTS EXCLUDING DEFAULTS); ";
      d.sql(setup + "INSERT INTO erp_constraint_probe(id,name,division_code,status,contract_value) VALUES (0,'Anonim','PROJECT','planning',0),(1,'Anonim','PROJECT','in_progress',0),(2,'Anonim','PROJECT','on_hold',0),(3,'Anonim','PROJECT','completed',0); ROLLBACK;", identity, testDatabase);
      let rejected = false;
      try { d.sql(setup + "INSERT INTO erp_constraint_probe(id,name,division_code,status,contract_value) VALUES(0,'Anonim','PROJECT','invalid_status',0); ROLLBACK;", identity, testDatabase); } catch { rejected = true; }
      if (!rejected) throw Error('RESTORE_CONSTRAINT_BEHAVIOR_MISMATCH');
      if ('cel_stock_balances' in bundle.fingerprint.tables) {
        const uid = "'00000000-0000-4000-8000-000000000000'";
        const probes = [
          ["cel_stock_balances", `INSERT INTO erp_cell_probe(id,product_id,outlet_id,quantity,version) VALUES (${uid},${uid},${uid},0,1)`, `INSERT INTO erp_cell_probe(id,product_id,outlet_id,quantity,version) VALUES (${uid},${uid},${uid},-1,1)`],
          ["cel_products", `INSERT INTO erp_cell_probe(id,sku,name,kind,is_active) VALUES (${uid},'ANONIM','Anonim','SIM_CARD',true)`, `INSERT INTO erp_cell_probe(id,sku,name,kind,is_active) VALUES (${uid},'ANONIM','Anonim','INVALID_KIND',true)`],
          ["cel_manual_sales", `INSERT INTO erp_cell_probe(id,product_id,outlet_id,product_name,outlet_name,business_date,quantity,unit_price_cents,total_cents,source_reference,source_key,created_by,status,version) VALUES (${uid},${uid},${uid},'Anonim','Anonim','2026-10-06',1,10,10,'ANONIM','ANONIM',${uid},'posted',1)`, `INSERT INTO erp_cell_probe(id,product_id,outlet_id,product_name,outlet_name,business_date,quantity,unit_price_cents,total_cents,source_reference,source_key,created_by,status,version) VALUES (${uid},${uid},${uid},'Anonim','Anonim','2026-10-06',1,10,11,'ANONIM','ANONIM',${uid},'posted',1)`],
        ];
        for (const [table, accepted, invalid] of probes) {
          const begin = `BEGIN; CREATE TEMP TABLE erp_cell_probe (LIKE public.${table} INCLUDING CONSTRAINTS EXCLUDING DEFAULTS); `;
          d.sql(begin + accepted + '; ROLLBACK;', identity, testDatabase);
          let denied = false;
          try { d.sql(begin + invalid + '; ROLLBACK;', identity, testDatabase); } catch { denied = true; }
          if (!denied) throw Error('RESTORE_CELLULAR_CONSTRAINT_MISMATCH');
        }
      }
    }
    let verifiedFiles = 0;
    for (const file of bundle.files) {
      if (!/^(storage\/app\/private\/|\.env(?:$|\.database-roles\.json$|\.uat-accounts\.md$))/.test(file.path) || file.path.includes('..') || file.path.includes('\\')) throw Error('RESTORE_FILE_PATH_REJECTED');
      const content = Buffer.from(file.content, 'base64');
      if (d.digest(content) !== file.sha256) throw Error('RESTORE_FILE_CHECKSUM_REJECTED');
      const check = localFile(target + '.file.tmp');
      d.savePrivate(check, content);
      try { if (d.digest(d.fs.readFileSync(check)) !== file.sha256) throw Error('RESTORE_FILE_WRITE_MISMATCH'); }
      finally { d.fs.unlinkSync(check); }
      verifiedFiles++;
    }
    const report = { database: d.database, restoredInto: target, tableCount: Object.keys(bundle.fingerprint.tables).length, rowsSchemaIndexesSequencesMatch: true, projectStatusConstraintVerified: true, cellularConstraintsVerified: 'cel_stock_balances' in bundle.fingerprint.tables, fingerprintVersion: bundle.fingerprintVersion ?? 1, verifiedFiles, durationMs: Date.now() - start, productionOverwritten: false };
    d.fs.writeFileSync(full + '.restore-check.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally {
    if (d.fs.existsSync(raw)) d.fs.unlinkSync(raw);
    if (created) {
      const check = d.sql(`SELECT shobj_description(oid,'pg_database') || '|' || pg_get_userbyid(datdba) FROM pg_database WHERE datname='${target}'`, d.admin, 'postgres');
      if (check !== marker + '|' + identity.user || !/^dashboard_divisi_mvp_restore_[a-f0-9]{8}$/.test(target)) throw Error('RESTORE_CLEANUP_TARGET_REJECTED');
      d.sql(`DROP DATABASE ${target}`, d.admin, 'postgres');
    }
  }
}
try {
  if (process.argv[2] === 'backup') backup();
  else if (process.argv[2] === 'restore-check') restoreCheck(process.argv[3]);
  else throw Error('USE_BACKUP_OR_RESTORE_CHECK');
} catch (error) { console.error(JSON.stringify({ failed: true, phase, reason: /^[A-Z_]+$/.test(error.message) ? error.message : 'OPERATION_FAILED', productionOverwritten: false, secretsDisplayed: false })); process.exitCode = 1; }
