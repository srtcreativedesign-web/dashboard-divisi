import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoucherPayments } from './VoucherPayments';
import { voucherApi, type VoucherRecord } from '../../../api/vouchers';
vi.mock('../../../api/vouchers',()=>({voucherApi:{recordPayment:vi.fn(),voidPayment:vi.fn(),downloadPayment:vi.fn()}}));
const r={id:'v1',version:4,status:'approved',amount:'1000.00',payment_method:'BANK',bank_name:'Bank anonim',bank_account:'123456789012',bank_account_holder:'Penerima anonim',approved_at:'2026-10-06T17:30:00Z',payment_summary:{paid_amount:'0.00',remaining_amount:'1000.00',status:'UNPAID'},payments:[]} as unknown as VoucherRecord;
let client:QueryClient;
beforeEach(()=>{vi.clearAllMocks();client=new QueryClient({defaultOptions:{mutations:{retry:false}}});});
afterEach(()=>{cleanup();client.clear();});
const mount=(record=r,finance=true,manager=false,onSaved=vi.fn(),onBusy=vi.fn())=>render(<QueryClientProvider client={client}><VoucherPayments record={record} finance={finance} manager={manager} onSaved={onSaved} onBusyChange={onBusy}/></QueryClientProvider>);
const fill=()=>{for(const [label,value] of [['Tanggal pembayaran','2026-10-07'],['Nominal dibayar (Rp)','150.25'],['Referensi transaksi','TRANSFER-UJI'],['Catatan realisasi','Pembayaran telah dilakukan di luar ERP']] as const) fireEvent.change(screen.getByLabelText(label),{target:{value}});fireEvent.change(screen.getByLabelText('Bukti pembayaran'),{target:{files:[new File(['anonim'],'bukti.pdf',{type:'application/pdf'})]}});};
describe('Realisasi voucher menurut role',()=>{
 it('Finance mengirim desimal, versi dan bukti, serta mengunci form selama pending',async()=>{
  let resolve!:(value:{data:VoucherRecord;meta:{trace_id:string}})=>void;
  vi.mocked(voucherApi.recordPayment).mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const saved=vi.fn(),busy=vi.fn();mount(r,true,false,saved,busy);fill();
  expect(screen.getByLabelText('Tanggal pembayaran')).toHaveAttribute('min','2026-10-07');
  fireEvent.submit(screen.getByRole('form',{name:'Form realisasi pembayaran'}));
  await waitFor(()=>expect(voucherApi.recordPayment).toHaveBeenCalledWith(expect.objectContaining({version:4}),expect.objectContaining({amount:'150.25',method:'BANK',reference:'TRANSFER-UJI'}),expect.any(File)));
  expect(screen.getByLabelText('Nominal dibayar (Rp)')).toBeDisabled();expect(busy).toHaveBeenCalledWith(true);
  resolve({data:{...r,version:5},meta:{trace_id:'uji'}});await waitFor(()=>expect(saved).toHaveBeenCalledWith(expect.objectContaining({version:5})));
 });
 it('Admin/pembaca, voucher belum disetujui dan voucher lunas tidak menerima form Finance',()=>{
  const view=mount(r,false,false);expect(screen.queryByRole('form')).not.toBeInTheDocument();view.unmount();
  const draft=mount({...r,status:'draft'},true,false);expect(screen.queryByRole('form')).not.toBeInTheDocument();draft.unmount();
  mount({...r,payment_summary:{paid_amount:'1000.00',remaining_amount:'0.00',status:'PAID'}},true,false);expect(screen.getByText('Lunas')).toBeInTheDocument();expect(screen.queryByRole('form')).not.toBeInTheDocument();
 });
 it('rekening belum lengkap menghalangi form bank dan error simpan mempertahankan input',async()=>{
  const missing=mount({...r,bank_account:undefined});fill();expect(screen.getByRole('button',{name:'Simpan realisasi pembayaran'})).toBeDisabled();missing.unmount();
  vi.mocked(voucherApi.recordPayment).mockRejectedValue(new Error('VERSION_CONFLICT: muat ulang'));mount();fill();fireEvent.submit(screen.getByRole('form',{name:'Form realisasi pembayaran'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('VERSION_CONFLICT');expect(screen.getByLabelText('Nominal dibayar (Rp)')).toHaveValue(150.25);
 });
 it('Manager membatalkan catatan dengan alasan dan versi, pembaca hanya mengunduh bukti',async()=>{
  const payment={id:'p1',paid_date:'2026-10-07',amount:'150.25',method:'BANK',reference:'TRANSFER-UJI',notes:'Pembayaran di luar ERP',status:'recorded',original_name:'bukti.pdf',created_by:'finance',created_at:'2026-10-07'} as const;
  const record={...r,payments:[payment],payment_summary:{paid_amount:'150.25',remaining_amount:'849.75',status:'PARTIAL' as const}};
  vi.mocked(voucherApi.voidPayment).mockResolvedValue({data:{...record,version:5},meta:{trace_id:'uji'}});vi.mocked(voucherApi.downloadPayment).mockResolvedValue(undefined);
  const saved=vi.fn();const manager=mount(record,false,true,saved);fireEvent.click(screen.getByRole('button',{name:'Batalkan catatan TRANSFER-UJI'}));
  fireEvent.change(screen.getByLabelText('Alasan pembatalan'),{target:{value:'Pembetulan catatan salah, bukan refund'}});fireEvent.submit(screen.getByRole('form',{name:'Pembatalan catatan pembayaran'}));
  await waitFor(()=>expect(voucherApi.voidPayment).toHaveBeenCalledWith(record,payment,'Pembetulan catatan salah, bukan refund'));manager.unmount();
  mount(record,false,false);expect(screen.queryByRole('button',{name:/Batalkan catatan/})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Unduh bukti TRANSFER-UJI'}));await waitFor(()=>expect(voucherApi.downloadPayment).toHaveBeenCalledWith(record,payment));
 });
});
