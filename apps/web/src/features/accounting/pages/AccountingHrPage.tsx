import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Database, HeartPulse, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { DetailSheet } from '../../../components/ui/DetailSheet';
import { KPICard } from '../../../components/ui/primitives';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState, ErrorState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { hrApi, type AttendanceStatus, type HrRecord } from '../api/hr';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const formatDate=(value:string)=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(`${value}T00:00:00+07:00`));
const formatDateTime=(value:string)=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value));
const fieldClass='mt-1 min-h-10 rounded-input border border-line bg-panel px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const statusNames:Record<AttendanceStatus,string>={PRESENT:'Hadir',ABSENT:'Tidak hadir',LEAVE:'Cuti',SICK:'Sakit',OFF:'Libur'};

export default function AccountingHrPage(){
 const {user}=useAuth();
 const canView=!!user&&hasCapability(user.role,'view:acc_hr',user.divisionCode);
 const [kind,setKind]=useState<'attendance'|'leave'>('attendance');
 const [month,setMonth]=useState(today().slice(0,7));
 const [page,setPage]=useState(1);
 const [selected,setSelected]=useState<string|null>(null);
 const records=useQuery({queryKey:['accounting-hr-recap',kind,month,page],queryFn:()=>hrApi.list(kind,month,page),enabled:canView&&/^\d{4}-\d{2}$/.test(month)});
 const detail=useQuery({queryKey:['accounting-hr-recap-detail',selected],queryFn:()=>hrApi.detail(selected!),enabled:canView&&!!selected});
 const rows=records.data?.data.items??[];
 const summary=useMemo(()=>{
  if(kind==='leave')return {primary:rows.length,secondary:new Set(rows.map(row=>row.employee_id)).size,third:rows.reduce((sum,row)=>sum+Number(row.source_days??0),0),fourth:rows.filter(row=>row.status==='voided').length};
  return {primary:rows.filter(row=>row.attendance_status==='PRESENT').length,secondary:rows.filter(row=>row.attendance_status==='SICK').length,third:rows.filter(row=>row.attendance_status==='LEAVE').length,fourth:rows.filter(row=>Number(row.late_minutes)>0).length};
 },[kind,rows]);
 if(!canView)return <p role="alert" className="p-6">Akses rekap kehadiran tidak tersedia untuk akun ini.</p>;
 return <div className="space-y-6">
  <AccountingPageHeader area="Operasional Pendukung · Integrasi Kehadiran" title="Rekap kehadiran karyawan" description="Pantau hasil absensi, sakit, cuti, libur, dan keterlambatan yang diterima dari sistem absensi kantor."/>
  <section className="rounded-card-lg border border-primary-200 bg-primary-50/60 p-5 dark:border-primary-900 dark:bg-primary-950/30">
   <div className="flex items-start gap-4"><span className="rounded-card bg-white p-3 text-primary-700 shadow-card dark:bg-slate-900 dark:text-primary-300"><Database className="h-5 w-5"/></span><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Sumber data eksternal · mode baca saja</p><h2 className="mt-1 font-bold text-navy">ERP tidak memproses pengajuan kepegawaian</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Pengajuan dan perubahan absensi, sakit, izin, atau cuti tetap dilakukan pada sistem absensi kantor. Halaman ini hanya menampilkan data yang diterima melalui integrasi API untuk kebutuhan rekap Accounting.</p></div></div>
   <ol className="mt-5 grid gap-3 text-sm md:grid-cols-3">{['Sistem absensi kantor menjadi sumber utama','API mengirim data kehadiran yang telah tercatat','Accounting membaca rekap tanpa mengubah sumber'].map((step,index)=><li key={step} className="flex items-center gap-3 rounded-input border border-primary-100 bg-white/80 p-3 text-muted dark:border-primary-900 dark:bg-slate-950/40"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">{index+1}</span>{step}</li>)}</ol>
  </section>
  <nav aria-label="Jenis rekap kehadiran" className="grid gap-2 rounded-card border border-line bg-panel p-2 sm:grid-cols-2">{([['attendance','Rekap absensi harian','Hadir, sakit, cuti, tidak hadir, libur, dan keterlambatan'],['leave','Riwayat cuti','Periode serta referensi cuti dari sistem sumber']] as const).map(([value,label,hint])=><button key={value} aria-pressed={kind===value} className={`rounded-input px-4 py-3 text-left transition ${kind===value?'bg-primary-600 text-white shadow-card':'text-muted hover:bg-surface'}`} onClick={()=>{setKind(value);setPage(1);setSelected(null);}}><span className="block font-semibold">{label}</span><span className={`mt-1 block text-xs ${kind===value?'text-primary-50':'text-subtle'}`}>{hint}</span></button>)}</nav>
  <section aria-label="Ringkasan kehadiran" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {kind==='attendance'?<>
    <KPICard size="sm" label="Hadir" value={summary.primary.toLocaleString('id-ID')} note="Pada halaman aktif" icon={<UserRoundCheck/>}/>
    <KPICard size="sm" label="Sakit" value={summary.secondary.toLocaleString('id-ID')} note="Status dari sumber" icon={<HeartPulse/>}/>
    <KPICard size="sm" label="Cuti" value={summary.third.toLocaleString('id-ID')} note="Status dari sumber" icon={<CalendarDays/>}/>
    <KPICard size="sm" label="Terlambat" value={summary.fourth.toLocaleString('id-ID')} note="Memiliki menit terlambat" icon={<Clock3/>}/>
   </>:<>
    <KPICard size="sm" label="Catatan cuti" value={summary.primary.toLocaleString('id-ID')} note="Pada halaman aktif" icon={<CalendarDays/>}/>
    <KPICard size="sm" label="Pegawai" value={summary.secondary.toLocaleString('id-ID')} note="Pegawai unik" icon={<UserRoundCheck/>}/>
    <KPICard size="sm" label="Hari dari sumber" value={summary.third.toLocaleString('id-ID',{maximumFractionDigits:2})} note="Tidak menghitung saldo cuti" icon={<Clock3/>}/>
    <KPICard size="sm" label="Tidak aktif" value={summary.fourth.toLocaleString('id-ID')} note="Dibatalkan pada histori sumber" icon={<ShieldCheck/>}/>
   </>}
  </section>
  <section className="overflow-hidden rounded-card border border-line bg-panel shadow-card">
   <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Register hasil integrasi</p><h2 className="mt-1 font-bold text-navy">{kind==='attendance'?'Absensi harian':'Riwayat cuti'}</h2><p className="mt-1 text-sm text-subtle">Data bersifat read-only dan mengikuti nilai yang dikirim sistem absensi kantor.</p></div><label className="text-sm font-semibold text-muted">Bulan rekap<input aria-label="Bulan rekap" type="month" className={`${fieldClass} ml-2 min-w-48`} value={month} onChange={event=>{setMonth(event.target.value);setPage(1);setSelected(null);}}/></label></div>
   {records.error&&<div className="p-5"><ErrorState description={records.error.message} onRetry={()=>void records.refetch()}/></div>}
   {records.isLoading?<p role="status" className="p-5">Memuat rekap dari penyimpanan integrasi...</p>:records.isSuccess&&rows.length===0?<div className="p-5"><EmptyState title="Belum ada data pada periode ini" description="Data akan tampil setelah diterima dari API sistem absensi kantor."/></div>:<div className="overflow-x-auto"><table className="min-w-[920px] w-full text-left text-sm"><thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Pegawai</th><th className="px-4 py-3">Tanggal / periode</th><th className="px-4 py-3">Hasil dari sumber</th><th className="px-4 py-3">Referensi sumber</th><th className="px-4 py-3">Status data</th><th className="px-5 py-3 text-right">Detail</th></tr></thead><tbody className="divide-y divide-line">{rows.map(record=><tr key={record.id} className="hover:bg-surface"><td className="px-5 py-4"><p className="font-semibold text-navy">{record.employee_name}</p><p className="mt-1 text-xs text-subtle">{record.employee_code}</p></td><td className="px-4 py-4">{formatDate(record.start_date)}{kind==='leave'&&record.end_date!==record.start_date&&<p className="mt-1 text-xs text-subtle">s.d. {formatDate(record.end_date)}</p>}</td><td className="px-4 py-4">{kind==='attendance'?<><p className="font-semibold text-navy">{statusNames[record.attendance_status??'ABSENT']}</p><p className="mt-1 text-xs text-subtle">Terlambat {record.late_minutes??0} menit</p></>:<><p className="font-semibold text-navy">{record.leave_type}</p><p className="mt-1 text-xs text-subtle">{record.source_days} hari dari sumber</p></>}</td><td className="px-4 py-4"><p className="break-all font-medium">{record.source_reference}</p><p className="mt-1 break-all text-xs text-subtle">{kind==='attendance'?(record.schedule_reference||'Tanpa referensi jadwal'):(record.approval_reference||'Tanpa referensi cuti')}</p></td><td className="px-4 py-4"><StatusBadge status={record.status} label={record.status==='recorded'?'Aktif di rekap':'Tidak aktif'}/></td><td className="px-5 py-4 text-right"><Button size="sm" variant="secondary" aria-label={`Buka ${record.source_reference}`} onClick={()=>setSelected(record.id)}>Buka</Button></td></tr>)}</tbody></table></div>}
   {(records.data?.data.total??0)>0&&<nav aria-label="Halaman rekap kehadiran" className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 text-sm"><Button size="sm" variant="secondary" disabled={page===1} onClick={()=>setPage(value=>value-1)}>Sebelumnya</Button><span>Halaman {page} · {records.data?.data.total??0} catatan</span><Button size="sm" variant="secondary" disabled={page*50>=(records.data?.data.total??0)} onClick={()=>setPage(value=>value+1)}>Berikutnya</Button></nav>}
  </section>
  <DetailSheet isOpen={!!selected} onClose={()=>setSelected(null)} size="lg" title={detail.data?.data?`${detail.data.data.employee_name} · ${detail.data.data.source_reference}`:'Detail rekap kehadiran'} subtitle="Data read-only dari penyimpanan integrasi sistem absensi kantor." icon={Database}>
   {detail.isLoading?<p role="status">Memuat detail...</p>:detail.error?<ErrorState description={detail.error.message} onRetry={()=>void detail.refetch()}/>:detail.data?.data&&<RecordDetail record={detail.data.data}/>}
  </DetailSheet>
 </div>;
}

function RecordDetail({record}:{record:HrRecord}){
 const attendance=record.kind==='attendance';
 return <div className="space-y-5">
  <section className="rounded-card border border-line bg-surface p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">{attendance?'Absensi harian':'Riwayat cuti'}</p><h3 className="mt-1 text-lg font-bold text-navy">{record.employee_name}</h3><p className="mt-1 text-sm text-subtle">{record.employee_code}</p></div><StatusBadge status={record.status} label={record.status==='recorded'?'Aktif di rekap':'Tidak aktif'}/></div></section>
  <section className="rounded-card border border-line p-4"><h3 className="font-bold text-navy">Data dari sistem sumber</h3><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-subtle">Tanggal / periode</dt><dd className="mt-1 font-semibold text-navy">{formatDate(record.start_date)}{!attendance&&record.end_date!==record.start_date?` s.d. ${formatDate(record.end_date)}`:''}</dd></div><div><dt className="text-subtle">Hasil</dt><dd className="mt-1 font-semibold text-navy">{attendance?statusNames[record.attendance_status??'ABSENT']:`${record.leave_type} · ${record.source_days} hari`}</dd></div><div><dt className="text-subtle">Referensi utama</dt><dd className="mt-1 break-all font-semibold text-navy">{record.source_reference}</dd></div><div><dt className="text-subtle">Referensi pendukung</dt><dd className="mt-1 break-all font-semibold text-navy">{attendance?(record.schedule_reference||'Tidak tersedia'):(record.approval_reference||'Tidak tersedia')}</dd></div>{attendance&&<div><dt className="text-subtle">Keterlambatan</dt><dd className="mt-1 font-semibold text-navy">{record.late_minutes??0} menit</dd></div>}<div><dt className="text-subtle">Data terakhir tersimpan</dt><dd className="mt-1 font-semibold text-navy">{formatDateTime(record.updated_at)}</dd></div></dl></section>
  <section className="rounded-card border border-primary-200 bg-primary-50/60 p-4 text-sm dark:border-primary-900 dark:bg-primary-950/30"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-700 dark:text-primary-300"/><div><h3 className="font-bold text-navy">Tidak dapat diubah dari ERP</h3><p className="mt-1 leading-6 text-muted">Jika data tidak sesuai, perbaikan dilakukan pada sistem absensi kantor. ERP akan menampilkan hasil terbaru setelah sinkronisasi API berikutnya.</p></div></div></section>
 </div>;
}
