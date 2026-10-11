import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { voucherApi, type VoucherRecord, type VoucherPayment, type VoucherPaymentInput } from '../../../api/vouchers';
import { Button } from '../../../components/ui/Button';
import { formatRupiah, formatDate } from './format';
import { paymentStatusNames } from './voucherDocument';
const field='mt-1 w-full rounded-input border border-line bg-panel px-3 py-2 text-sm';
export function VoucherPayments({record,finance,manager,onSaved,onBusyChange}:{record:VoucherRecord;finance:boolean;manager:boolean;onSaved:(r:VoucherRecord)=>void;onBusyChange:(busy:boolean)=>void}) {
 const [input,setInput]=useState<VoucherPaymentInput>({paid_date:'',amount:'',method:record.payment_method==='BANK'?'BANK':'CASH',reference:'',notes:''});
 const [file,setFile]=useState<File>();const [voiding,setVoiding]=useState<string>();const [reason,setReason]=useState('');const [failure,setFailure]=useState<string>();
 const failed=(e:Error)=>setFailure(e.message);
 const save=useMutation({mutationFn:()=>voucherApi.recordPayment(record,input,file!),onSuccess:r=>onSaved(r.data),onError:failed});
 const cancel=useMutation({mutationFn:(p:VoucherPayment)=>voucherApi.voidPayment(record,p,reason),onSuccess:r=>onSaved(r.data),onError:failed});
 const download=useMutation({mutationFn:(p:VoucherPayment)=>voucherApi.downloadPayment(record,p),onError:failed});
 const busy=save.isPending||cancel.isPending||download.isPending;
 useEffect(()=>{onBusyChange(busy);return ()=>onBusyChange(false);},[busy,onBusyChange]);
 const summary=record.payment_summary;
 const canRecord=finance&&record.status==='approved'&&summary&&summary.status!=='PAID';
 const bankMissing=input.method==='BANK'&&(!record.bank_account||!record.bank_account_holder||!record.bank_name);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const approvedDate=record.approved_at?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(record.approved_at)):undefined;
 return <section aria-label="Realisasi pembayaran voucher" className="space-y-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
  <div><h3 className="text-lg font-semibold">Realisasi pembayaran</h3><p className="mt-1 text-xs text-subtle">Catat pembayaran yang sudah dilakukan di luar ERP. Pencatatan ini tidak mengirim uang atau memposting jurnal.</p></div>
  {summary?<><p className="text-sm font-semibold">{record.status==='approved'?paymentStatusNames[summary.status]:'Menunggu persetujuan'}</p><dl className="grid gap-3 sm:grid-cols-3">{[[record.status==='approved'?'Nominal disetujui':'Nominal pengajuan',record.amount],['Realisasi aktif',summary.paid_amount],['Sisa pengeluaran',summary.remaining_amount]].map(([label,amount])=><div key={label} className="rounded-lg bg-surface p-3"><dt className="text-xs text-subtle">{label}</dt><dd className="mt-2 font-semibold tabular-nums">{formatRupiah(amount!)}</dd></div>)}</dl></>:<p className="text-sm text-subtle">Ringkasan pembayaran belum tersedia. Muat ulang voucher.</p>}
  {failure&&<p role="alert" className="text-sm text-red-700 dark:text-red-300">{failure}</p>}
  {!record.payments?.length&&<p className="text-sm text-subtle">Belum ada catatan realisasi.</p>}
  {record.payments?.map(p=><article key={p.id} className="space-y-2 border-t border-line pt-3 text-sm">
   <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{formatRupiah(p.amount)} · {p.status==='voided'?'Catatan dibatalkan':'Tercatat Finance'}</p><p className="text-xs text-subtle">{formatDate(p.paid_date)} · {p.method==='BANK'?'Transfer bank':'Tunai'}</p></div>
   <p className="break-words">Referensi: {p.reference}</p><p className="whitespace-pre-wrap text-muted">{p.notes}</p>
   {p.status==='voided'&&<p className="text-xs text-subtle">Alasan: {p.void_reason} · {p.voided_at}. Pembatalan catatan bukan pengembalian dana.</p>}
   <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" disabled={busy} onClick={()=>{setFailure(undefined);download.mutate(p);}}>Unduh bukti {p.reference}</Button>{manager&&p.status==='recorded'&&<Button variant="ghost" size="sm" disabled={busy} onClick={()=>{setVoiding(p.id);setReason('');setFailure(undefined);}}>Batalkan catatan {p.reference}</Button>}</div>
   {manager&&voiding===p.id&&p.status==='recorded'&&<form aria-label="Pembatalan catatan pembayaran" className="space-y-2 rounded-lg bg-surface p-3" onSubmit={e=>{e.preventDefault();if(!busy&&reason.trim().length>=10){setFailure(undefined);cancel.mutate(p);}}}><p className="text-xs text-subtle">Batalkan hanya jika catatan salah. Bukti dan histori tetap tersimpan; dana tidak dikembalikan oleh tindakan ini.</p><label className="block text-sm">Alasan pembatalan<textarea required minLength={10} maxLength={2000} disabled={busy} className={field} value={reason} onChange={e=>setReason(e.target.value)}/></label><Button type="submit" variant="danger" disabled={busy||reason.trim().length<10}>Konfirmasi pembatalan catatan</Button><Button variant="ghost" disabled={busy} onClick={()=>setVoiding(undefined)}>Tutup pembatalan</Button></form>}
  </article>)}
  {canRecord&&<form aria-label="Form realisasi pembayaran" className="space-y-4 border-t border-line pt-4" onSubmit={e=>{e.preventDefault();if(!busy&&file&&!bankMissing){setFailure(undefined);save.mutate();}}}>
   <h4 className="font-semibold">Catat realisasi oleh Finance</h4>
   <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Tanggal pembayaran<input required type="date" min={approvedDate} max={today} className={field} value={input.paid_date} onChange={e=>setInput({...input,paid_date:e.target.value})}/></label>
    <label className="text-sm">Nominal dibayar (Rp)<input required type="number" min="0.01" max={summary.remaining_amount} step="0.01" className={field} value={input.amount} onChange={e=>setInput({...input,amount:e.target.value})}/></label>
    <label className="text-sm">Metode realisasi<select className={field} value={input.method} onChange={e=>setInput({...input,method:e.target.value as VoucherPaymentInput['method']})}><option value="CASH" disabled={record.payment_method==='BANK'}>Tunai</option><option value="BANK" disabled={record.payment_method==='CASH'}>Transfer bank</option></select></label>
    <label className="text-sm">Referensi transaksi<input required maxLength={150} className={field} value={input.reference} onChange={e=>setInput({...input,reference:e.target.value})}/></label>
    <label className="text-sm sm:col-span-2">Catatan realisasi<textarea required minLength={10} maxLength={2000} className={field} value={input.notes} onChange={e=>setInput({...input,notes:e.target.value})}/></label>
    <label className="text-sm sm:col-span-2">Bukti pembayaran<input aria-label="Bukti pembayaran" required type="file" accept=".pdf,.jpg,.jpeg,.png" className={field} onChange={e=>setFile(e.target.files?.[0])}/><span className="mt-1 block text-xs text-subtle">PDF/JPG/PNG maksimal 10 MB. Bukti wajib lolos pemindaian sebelum catatan disimpan.</span></label>
   </fieldset>
   {bankMissing&&<p role="status" className="text-sm text-subtle">Tujuan rekening pada voucher disetujui belum lengkap. Realisasi bank belum dapat dicatat.</p>}
   <Button type="submit" disabled={busy||!file||bankMissing}>{save.isPending?'Memindai dan menyimpan...':'Simpan realisasi pembayaran'}</Button>
  </form>}
 </section>;
}
