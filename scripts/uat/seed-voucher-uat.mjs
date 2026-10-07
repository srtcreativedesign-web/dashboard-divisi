import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import * as db from '../database/erp-db-common.mjs';

const base='http://127.0.0.1:8000/api/v1';
const dataset=JSON.parse(fs.readFileSync(new URL('./voucher-dataset.json',import.meta.url),'utf8'));
const options=process.argv.slice(2);
const backup=options.find(v=>v.startsWith('--backup='))?.slice(9);
const reportFile=path.resolve(options.find(v=>v.startsWith('--report='))?.slice(9)||'C:/ERP/voucher-uat-report.json');
const report={batch:dataset.batch,startedAt:new Date().toISOString(),database:db.database,rows:[],checks:[],passed:false,secretsDisplayed:false};
const sessions={};let password;
function check(name,pass,details={}){report.checks.push({name,passed:Boolean(pass),...details});if(!pass)throw Error('UAT_CHECK_FAILED');}
function today(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');}
async function request(actor,method,route,body,extra={},transport='bearer'){
 const session=sessions[actor];const headers={Accept:'application/json',Origin:'http://localhost:5173'};
 if(transport==='bearer'&&session)headers.Authorization='Bearer '+session.token;
 if(transport==='cookie'&&session)headers.Cookie=session.cookie;
 if(body&&!(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const response=await fetch(base+route,{method,headers:{...headers,...extra},body,redirect:'error',signal:AbortSignal.timeout(120000)});
 const raw=await response.arrayBuffer();let json;
 if(response.headers.get('content-type')?.includes('json'))json=JSON.parse(Buffer.from(raw).toString());
 return {status:response.status,json,data:json?.data,bytes:Buffer.from(raw),trace:json?.meta?.trace_id||json?.error?.trace_id,code:json?.error?.code};
}
async function expect(actor,method,route,body,status,name,extra={},transport='bearer'){
 const result=await request(actor,method,route,body,extra,transport);
 check(name,result.status===status,{expected:status,actual:result.status,trace:result.trace,code:result.code});return result;
}
async function action(v,kind,actor,data={}){return (await expect(actor,'POST','/accounting/vouchers/'+v.id+'/'+kind,{version:v.version,...data},200,kind+' '+v.source_reference)).data;}
function input(row,outlet){return {type:row.type,outlet_id:outlet.id,voucher_date:dataset.date,due_date:dataset.date,entity_name:dataset.payee,source_reference:dataset.batch+'-'+row.key,amount:row.amount,description:row.description,company_name:dataset.company,priority:'NORMAL',payment_method:row.method,...(row.method==='BANK'?{bank_name:dataset.bank.name,bank_account_holder:dataset.bank.holder,bank_account:dataset.bank.account}:{}),invoice_number:dataset.batch+'-'+row.key,invoice_date:dataset.date,billing_period:dataset.date.slice(0,7),delivery_reference:'UAT / SIMULASI'};}
function proof(v){const pdf=new jsPDF();pdf.setTextColor(170,0,0);pdf.setFontSize(20);pdf.text('UAT / SIMULASI - BUKAN BUKTI NYATA',14,24);pdf.setTextColor(0,0,0);pdf.setFontSize(11);pdf.text('Pengujian realisasi voucher dalam database lokal.',14,40);pdf.text(v.source_reference,14,52);pdf.text('Tidak ada transfer uang, pembelian atau jurnal nyata.',14,64);return pdf.output('arraybuffer');}
function paymentForm(v,row,overrides={},file){const form=new FormData();for(const [key,value]of Object.entries({version:String(v.version),paid_date:dataset.date,amount:row.paid||'0.01',method:row.method,reference:v.source_reference+'-PAY-01',notes:'UAT / SIMULASI realisasi pengujian, bukan pembayaran nyata.',...overrides}))form.append(key,value);if(file!==null)form.append('file',file||new Blob([proof(v)],{type:'application/pdf'}),'bukti-uat.pdf');return form;}
async function list(){let rows=[];let page=1,last=1;do{const response=await expect('admin','GET','/accounting/vouchers?month='+dataset.date.slice(0,7)+'&page='+page,undefined,200,'Baca daftar halaman '+page);rows.push(...response.data.items);last=response.data.last_page;page++;}while(page<=last);return rows;}
try{
 if(!options.includes('--write')||!backup||!backup.endsWith('.erpbackup')||!fs.existsSync(backup)||fs.statSync(backup).size<1024)throw Error('BACKUP_REQUIRED');
 if(!reportFile.startsWith(path.resolve('C:/ERP')+path.sep)||!reportFile.endsWith('.json'))throw Error('REPORT_PATH_REJECTED');
 const config=db.config();const envText=fs.readFileSync(path.join(db.api,'.env'),'utf8');
 if(!/^APP_ENV=local\s*$/m.test(envText)||config.database!==db.database||dataset.date!==today()||!/^VOUCHER-UAT-\d{8}$/.test(dataset.batch))throw Error('LOCAL_TARGET_REJECTED');
 const credentials=fs.readFileSync(path.join(db.api,'.env.uat-accounts.md'),'utf8');password=credentials.match(/Uat![A-Za-z0-9]+/)?.[0];if(!password)throw Error('UAT_CREDENTIALS_UNAVAILABLE');
 await expect(null,'POST','/auth/login',{email:dataset.actors.admin.email,password},403,'Origin asing ditolak',{Origin:'https://invalid.example'},'anonymous');
 await expect(null,'GET','/accounting/vouchers?month='+dataset.date.slice(0,7),undefined,401,'Tanpa sesi ditolak',{},'anonymous');
 for(const [key,actor]of Object.entries(dataset.actors)){
  const response=await expect(null,'POST','/auth/login',{email:actor.email,password},200,'Login UAT '+key);
  sessions[key]={token:response.data.accessToken,cookie:'access_token='+response.data.accessToken,user:response.data.user};
  check('Identitas role/domain '+key,response.data.user.role===actor.role&&response.data.user.divisionCode===actor.division);
 }
 const outlets=(await expect('admin','GET','/accounting/vouchers/outlets',undefined,200,'Direktori outlet UAT')).data;
 const sources={};for(const domain of ['CELL','PROJECT']){sources[domain]=outlets.find(o=>o.divisionCode===domain&&/Uji UI/i.test(o.name));check('Outlet khusus uji '+domain,Boolean(sources[domain]));}
 const existing=await list();const records={};
 for(const row of dataset.scenarios){
  const body=input(row,sources[row.division]);let v=existing.find(v=>v.source_reference===body.source_reference);
  if(v){v=(await expect('admin','GET','/accounting/vouchers/'+v.id,undefined,200,'Seed existing tidak diubah '+row.key)).data;const resume=options.includes('--resume')&&row.paid&&v.status==='approved'&&v.payments.length===0&&v.version===4&&v.company_name===dataset.company&&v.description===row.description&&v.amount===row.amount; if(!resume){records[row.key]=v;report.rows.push({key:row.key,id:v.id,status:v.status,version:v.version,summary:v.payment_summary,existing:true});continue;}}
  const resumed=Boolean(v); if(!v)
  v=(await expect('admin','POST','/accounting/vouchers',body,201,'Seed '+row.key)).data;
  if(!resumed&&row.stage!=='draft')v=await action(v,'submit','admin');
  if(!resumed&&row.stage==='correction')v=await action(v,'review','accounting',{decision:'return',reason:'UAT / SIMULASI rincian perlu dilengkapi Admin.'});
  else if(!resumed&&!['draft','submitted'].includes(row.stage))v=await action(v,'review','accounting',{decision:'validate',reason:'UAT / SIMULASI dokumen telah diperiksa Accounting.'});
  if(!resumed&&['approved','partial','paid','voided'].includes(row.stage))v=await action(v,'decide','manager',{decision:'approve',reason:'UAT / SIMULASI pengeluaran disetujui untuk pengujian.'});
  if(row.paid){
   if(row.stage==='paid'){
    const attempts=await Promise.all([request('finance','POST','/accounting/vouchers/'+v.id+'/payments',paymentForm(v,row)),request('finance','POST','/accounting/vouchers/'+v.id+'/payments',paymentForm(v,row))]);
    check('Dua permintaan realisasi hanya satu tersimpan',attempts.filter(r=>r.status===201).length===1&&attempts.some(r=>[409,429].includes(r.status)),{actual:attempts.map(r=>r.status)});
    v=(await expect('finance','GET','/accounting/vouchers/'+v.id,undefined,200,'Verifikasi pembayaran serentak')).data;
    check('Satu realisasi setelah permintaan serentak',v.payments.length===1&&v.payment_summary.remaining_amount==='0.00');
   }else v=(await expect('finance','POST','/accounting/vouchers/'+v.id+'/payments',paymentForm(v,row),201,'Realisasi '+row.key)).data;
  }
  if(row.stage==='voided')v=(await expect('manager','POST','/accounting/vouchers/'+v.id+'/payments/'+v.payments[0].id+'/void',{version:v.version,reason:'UAT / SIMULASI catatan salah dibatalkan, bukan refund.'},200,'Pembatalan catatan UAT oleh Manager')).data;
  records[row.key]=v;report.rows.push({key:row.key,id:v.id,status:v.status,version:v.version,summary:v.payment_summary,existing:resumed,resumed});
 }
 const draft=records['01-DRAF'],approved=records['05-DISETUJUI'],partial=records['06-SEBAGIAN'];const draftRow=dataset.scenarios.find(r=>r.key==='01-DRAF');const draftBody=input(draftRow,sources[draftRow.division]);const payUrl='/accounting/vouchers/'+approved.id+'/payments';
 const before=(await expect('admin','GET','/accounting/vouchers/'+approved.id,undefined,200,'Snapshot sebelum penolakan')).data;
 await expect('admin','POST','/accounting/vouchers',draftBody,403,'Cookie tanpa CSRF ditolak',{},'cookie');
 for(const actor of ['project','cell','bod','head'])await expect(actor,'POST','/accounting/vouchers',draftBody,403,'Role/domain tidak boleh membuat: '+actor);
 for(const actor of ['project','cell','head'])await expect(actor,'GET','/accounting/vouchers/'+approved.id,undefined,403,'Rincian lintas scope ditolak: '+actor);
 await expect('admin','POST','/accounting/vouchers',{...draftBody,created_by:sessions.finance.user.id},400,'Actor palsu ditolak');
 await expect('admin','POST','/accounting/vouchers',{...draftBody,status:'approved'},400,'Status palsu ditolak');
 await expect('admin','POST','/accounting/vouchers',draftBody,409,'Duplikasi seed ditolak');
 await expect('admin','PUT','/accounting/vouchers/'+draft.id,{...draftBody,version:0},400,'Versi invalid ditolak');
 await expect('admin','PUT','/accounting/vouchers/'+approved.id,{...input(dataset.scenarios.find(r=>r.key==='05-DISETUJUI'),sources.CELL),version:approved.version},409,'Approved tidak dapat diedit');
 await expect('admin','POST','/accounting/vouchers/'+approved.id+'/review',{version:approved.version,decision:'validate',reason:'UAT pengujian pemeriksaan oleh pembuat'},403,'Admin tidak boleh memeriksa');
 await expect('accounting','POST','/accounting/vouchers/'+approved.id+'/decide',{version:approved.version,decision:'approve',reason:'UAT pengujian approval tanpa capability'},403,'Accounting tidak boleh menyetujui');
 for(const actor of ['admin','accounting','manager','project','cell','bod'])await expect(actor,'POST',payUrl,paymentForm(approved,{method:'BANK'}),403,'Realisasi bukan Finance ditolak: '+actor);
 await expect('finance','POST','/accounting/vouchers/'+draft.id+'/payments',paymentForm(draft,{method:'BANK'}),409,'Draf belum boleh direalisasikan');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{version:'1'}),409,'Versi realisasi lama ditolak');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{amount:'999999999999.99'}),409,'Pembayaran berlebih ditolak');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{amount:'1e6'}),400,'Format nominal eksponen ditolak');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{method:'CASH'}),400,'Metode berbeda dari rencana ditolak');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{},null),400,'Bukti wajib tidak dapat dilewati');
 const virus=Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=','base64');
 await expect('finance','POST',payUrl,paymentForm(approved,{method:'BANK'},{},new Blob([virus],{type:'application/octet-stream'})),422,'EICAR pada unggahan pembayaran ditolak');
 if(partial.payments.length){await expect('finance','POST','/accounting/vouchers/'+partial.id+'/payments',paymentForm(partial,{method:'BANK'},{reference:'  '+partial.payments[0].reference.toLowerCase()+'  '}),409,'Referensi realisasi ternormalisasi duplikat ditolak');}
 const after=(await expect('admin','GET','/accounting/vouchers/'+approved.id,undefined,200,'Snapshot setelah penolakan')).data;
 check('Penolakan tidak mengubah voucher/total/event/payment',before.version===after.version&&JSON.stringify(before.payment_summary)===JSON.stringify(after.payment_summary)&&before.events.length===after.events.length&&before.payments.length===after.payments.length);
 for(const actor of ['accounting','manager','bod']){const v=(await expect(actor,'GET','/accounting/vouchers/'+approved.id,undefined,200,'Proyeksi rekening '+actor)).data;check('Rekening lengkap tidak bocor ke '+actor,!Object.hasOwn(v,'bank_account')&&v.bank_account_masked==='••••0001'&&v.events.every(e=>!Object.hasOwn(e.metadata.snapshot,'bank_account')));}
 const financeView=(await expect('finance','GET','/accounting/vouchers/'+approved.id,undefined,200,'Finance membaca tujuan rekening')).data;check('Finance menerima tujuan rekening yang disetujui',financeView.bank_account===dataset.bank.account);
 const p=partial.payments[0];if(p){const download='/accounting/vouchers/'+partial.id+'/payments/'+p.id+'/download';const file=await expect('accounting','GET',download,undefined,200,'Accounting mengunduh bukti privat');check('Bukti PDF UAT benar',file.bytes.subarray(0,5).toString()==='%PDF-');await expect('project','GET',download,undefined,403,'Download bukti lintas divisi ditolak');await expect('finance','GET','/accounting/vouchers/'+draft.id+'/payments/'+p.id+'/download',undefined,404,'Parent bukti salah ditolak');await expect('finance','POST','/accounting/vouchers/'+partial.id+'/payments/'+p.id+'/void',{version:partial.version,reason:'UAT Finance tidak boleh membatalkan catatan'},403,'Finance tidak boleh membatalkan catatan');}
 const finalRows=await list();check('List tanpa rekening penuh',finalRows.every(v=>!Object.hasOwn(v,'bank_account')));
 check('Delapan referensi batch tersimpan tanpa duplikasi',finalRows.filter(v=>v.source_reference.startsWith(dataset.batch+'-')).length===dataset.scenarios.length);
 const ids=report.rows.map(v=>v.id);check('ID untuk verifikasi database valid',ids.every(id=>/^[0-9a-f-]{36}$/.test(id)));
 const idList=ids.map(id=>"'"+id+"'").join(',');
 const dbCounts=JSON.parse(db.sql("SELECT json_build_object('vouchers',(SELECT count(*) FROM acc_vouchers WHERE id IN ("+idList+")),'events',(SELECT count(*) FROM acc_voucher_events WHERE voucher_id IN ("+idList+")),'payments',(SELECT count(*) FROM acc_voucher_payments WHERE voucher_id IN ("+idList+")),'audit',(SELECT count(*) FROM audit_events WHERE entity_id IN ("+idList+") AND action LIKE 'accounting.voucher.%'),'payment_audit',(SELECT count(*) FROM audit_events WHERE entity_id IN (SELECT id::text FROM acc_voucher_payments WHERE voucher_id IN ("+idList+")) AND action IN ('accounting.voucher.payment_recorded','accounting.voucher.payment_voided')),'snapshot_full_bank',(SELECT count(*) FROM acc_voucher_events WHERE voucher_id IN ("+idList+") AND metadata::jsonb->'snapshot' ? 'bank_account'))",config));
 check('Persistensi PostgreSQL dan audit workflow',Number(dbCounts.vouchers)===8&&Number(dbCounts.events)===Number(dbCounts.audit)+Number(dbCounts.payment_audit)&&Number(dbCounts.audit)>0&&Number(dbCounts.snapshot_full_bank)===0,{counts:dbCounts});report.databaseCounts=dbCounts;
 report.passed=true;
}catch(error){report.failure=error.message==='UAT_CHECK_FAILED'?'Satu pemeriksaan tidak memenuhi hasil yang diharapkan.':['BACKUP_REQUIRED','REPORT_PATH_REJECTED','LOCAL_TARGET_REJECTED','UAT_CREDENTIALS_UNAVAILABLE','POSTGRES_COMMAND_FAILED'].includes(error.message)?error.message:'Proses UAT gagal; detail transport/credential tidak dicatat.';process.exitCode=1;
}finally{
 for(const [key,session]of Object.entries(sessions)){try{const r=await request(key,'POST','/auth/logout',{});report.checks.push({name:'Tutup sesi probe '+key,passed:r.status===200,actual:r.status});if(r.status!==200){report.passed=false;process.exitCode=1;}session.token='';session.cookie='';}catch{report.passed=false;process.exitCode=1;}}
 password=undefined;report.finishedAt=new Date().toISOString();
 if(reportFile.startsWith(path.resolve('C:/ERP')+path.sep)&&reportFile.endsWith('.json'))fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,rows:report.rows.length,checks:report.checks.length,failed:report.checks.filter(c=>!c.passed).map(c=>({name:c.name,expected:c.expected,actual:c.actual,code:c.code})),failure:report.failure,report:reportFile,secretsDisplayed:false}));
}
