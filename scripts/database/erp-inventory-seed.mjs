import * as d from './erp-db-common.mjs';

try {
  d.config();
  const identity = d.ownerIdentity();
  if (identity.user !== 'dashboard_divisi_mvp_app' || identity.database !== d.database) throw Error('SEEDER_REJECTED');
  const sql = `
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email='admin-gudang.acc@dashboard.test' AND role='ADMIN_GUDANG' AND division_code='ACC') THEN
    RAISE EXCEPTION 'ADMIN_GUDANG_ACC_REQUIRED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE email='manager.acc@dashboard.test' AND role='MANAGER' AND division_code='ACC') THEN
    RAISE EXCEPTION 'MANAGER_ACC_REQUIRED';
  END IF;
END $$;
INSERT INTO acc_inventory_locations(id,code,name,kind,active,version,created_at,updated_at) VALUES
 ('8c1b4df7-d220-4f8f-b5ae-4cc44df87a01','HO-GDG','Gudang Pusat','WAREHOUSE',true,1,now(),now()),
 ('8c1b4df7-d220-4f8f-b5ae-4cc44df87a02','CELL-T3','Outlet Cellular T3','OUTLET',true,1,now(),now())
ON CONFLICT (code) DO NOTHING;
INSERT INTO acc_inventory_items(id,sku,name,unit,minimum_stock,active,version,created_at,updated_at) VALUES
 ('9d2c5ef8-e331-4a90-a6bf-5dd55ef98b01','KRT-THERMAL-80','Kertas Thermal 80 mm','Roll',30,true,1,now(),now()),
 ('9d2c5ef8-e331-4a90-a6bf-5dd55ef98b02','ATK-A4-80','Kertas A4 80 gsm','Rim',10,true,1,now(),now()),
 ('9d2c5ef8-e331-4a90-a6bf-5dd55ef98b03','TINTA-003-BK','Tinta Epson 003 Black','Botol',5,true,1,now(),now())
ON CONFLICT (sku) DO NOTHING;
INSERT INTO acc_inventory_balances(id,item_id,location_id,quantity,version,created_at,updated_at)
SELECT gen_random_uuid(),i.id,l.id,v.qty,1,now(),now() FROM (VALUES
 ('KRT-THERMAL-80','HO-GDG',120.000),('ATK-A4-80','HO-GDG',40.000),('TINTA-003-BK','HO-GDG',12.000)
) v(sku,code,qty) JOIN acc_inventory_items i ON i.sku=v.sku JOIN acc_inventory_locations l ON l.code=v.code
ON CONFLICT (item_id,location_id) DO NOTHING;
INSERT INTO acc_inventory_documents(id,document_number,kind,source_location_id,destination_location_id,business_date,reference,notes,status,created_by,reviewed_by,version,created_at,updated_at)
SELECT 'ad3d6fa9-f442-4ba1-b7c0-6ee66fa09c01','INV-20261001-SEED01','RECEIPT',NULL,l.id,'2026-10-01','BAST-PERSEDIAAN-2026-10-001','Saldo awal UAT berdasarkan berita acara persediaan.','approved',u.id::uuid,m.id::uuid,2,now(),now()
FROM acc_inventory_locations l, users u, users m WHERE l.code='HO-GDG' AND u.email='admin-gudang.acc@dashboard.test' AND m.email='manager.acc@dashboard.test'
ON CONFLICT (document_number) DO NOTHING;
INSERT INTO acc_inventory_document_lines(id,document_id,item_id,quantity,counted_quantity)
SELECT gen_random_uuid(),d.id,i.id,v.qty,NULL FROM (VALUES ('KRT-THERMAL-80',120.000),('ATK-A4-80',40.000),('TINTA-003-BK',12.000)) v(sku,qty)
JOIN acc_inventory_items i ON i.sku=v.sku CROSS JOIN acc_inventory_documents d WHERE d.document_number='INV-20261001-SEED01'
ON CONFLICT (document_id,item_id) DO NOTHING;
INSERT INTO acc_inventory_documents(id,document_number,kind,source_location_id,destination_location_id,business_date,reference,notes,status,created_by,version,created_at,updated_at)
SELECT 'ad3d6fa9-f442-4ba1-b7c0-6ee66fa09c02','INV-20261009-SEED02','ISSUE',l.id,NULL,'2026-10-09','REQ-CELL-T3-2026-10-009','Contoh pengeluaran yang menunggu persetujuan Manager.','submitted',u.id::uuid,2,now(),now()
FROM acc_inventory_locations l, users u WHERE l.code='HO-GDG' AND u.email='admin-gudang.acc@dashboard.test'
ON CONFLICT (document_number) DO NOTHING;
INSERT INTO acc_inventory_document_lines(id,document_id,item_id,quantity,counted_quantity)
SELECT gen_random_uuid(),d.id,i.id,10.000,NULL FROM acc_inventory_documents d,acc_inventory_items i WHERE d.document_number='INV-20261009-SEED02' AND i.sku='KRT-THERMAL-80'
ON CONFLICT (document_id,item_id) DO NOTHING;
COMMIT;`;
  const executable = d.path.join(process.env.ERP_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin', 'psql.exe');
  try {
    d.cp.execFileSync(executable, ['-h','127.0.0.1','-p','5432','-U',identity.user,'-w','-d',d.database,'-X','-At','--set=ON_ERROR_STOP=1'], { env:{...process.env,PGPASSWORD:identity.password,PGCONNECT_TIMEOUT:'5'}, input:sql, encoding:'utf8', stdio:['pipe','pipe','pipe'], timeout:120000 });
  } catch (error) { throw new Error(String(error?.stderr || 'POSTGRES_COMMAND_FAILED').replaceAll(identity.password, '[REDACTED]').trim().slice(0, 1000)); }
  const counts = d.sql("SELECT json_build_object('items',(SELECT count(*) FROM acc_inventory_items),'locations',(SELECT count(*) FROM acc_inventory_locations),'documents',(SELECT count(*) FROM acc_inventory_documents),'balances',(SELECT count(*) FROM acc_inventory_balances))", identity);
  console.log(JSON.stringify({ seeded: true, counts: JSON.parse(counts), secretsDisplayed: false }));
} catch (error) {
  console.error('Seed persediaan gagal; transaksi dibatalkan dan credential disembunyikan:', error instanceof Error ? error.message : 'UNKNOWN');
  process.exitCode = 1;
}
