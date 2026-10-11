import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { voucherTerbilang, voucherDocumentRows, createVoucherPdf } from './voucherDocument';
import { VoucherDocument } from './VoucherDocumentPreview';
import type { VoucherRecord } from '../../../api/vouchers';

afterEach(cleanup);
const record = { id:'v1',voucher_no:'VCH-UJI',version:2,company_name:'Perusahaan anonim',outlet_name:'Outlet uji',source_division_code:'CELL',entity_name:'Penerima uji',voucher_date:'2026-10-07',due_date:'2026-10-08',source_reference:'REQ-UJI',amount:'360000.25',description:'Kebutuhan operasional anonim',status:'draft',priority:'URGENT',payment_method:'BANK',bank_name:'Bank uji',bank_account_masked:'••••9012',events:[] } as unknown as VoucherRecord;
describe('Dokumen voucher pengeluaran',()=>{
 it('menghasilkan PDF nyata dari data tersimpan dengan status dan rekening tersamarkan',async()=>{
  const doc=await createVoucherPdf(record);
  const pdf=doc.output();
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  expect(pdf).toContain('VOUCHER PENGAJUAN PENGELUARAN');
  expect(pdf).toContain('DRAF');
  expect(pdf).toContain('****9012');
  expect(pdf).not.toContain('123456789012');
 });
 it('PDF membedakan status persetujuan, realisasi dan pembatalan catatan',async()=>{
  const doc=await createVoucherPdf({...record,status:'approved',payment_summary:{paid_amount:'150.25',remaining_amount:'849.75',status:'PARTIAL'},payments:[{id:'p1',amount:'150.25',method:'BANK',reference:'TRANSFER-UJI',notes:'Realisasi anonim',paid_date:'2026-10-07',status:'voided',void_reason:'Catatan salah, bukan refund',created_by:'finance',created_at:'2026-10-07',original_name:'bukti.pdf'}]});
  expect(doc.output()).toContain('Sebagian dibayar');expect(doc.output()).toContain('Catatan realisasi pembayaran');expect(doc.output()).toContain('Dibatalkan: Catatan salah, bukan refund');expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
 });
 it('menulis rupiah dan sen tanpa pembulatan float',()=>{
  expect(voucherTerbilang('360000')).toBe('Tiga Ratus Enam Puluh Ribu Rupiah');
  expect(voucherTerbilang('360000.25')).toBe('Tiga Ratus Enam Puluh Ribu Rupiah dan Dua Puluh Lima Sen');
  expect(voucherTerbilang('1001.01')).toBe('Seribu Satu Rupiah dan Satu Sen');
  expect(voucherTerbilang('1e6')).toBe('Nominal tidak tersedia');
 });
 it('dokumen membedakan pengajuan, prioritas dan persetujuan serta tidak mengarang pembayaran',()=>{
  render(<VoucherDocument record={record}/>);
  expect(screen.getByText('DRAF · Versi 2')).toBeInTheDocument();
  expect(screen.getByText('Rp 360.000,25')).toBeInTheDocument();
  expect(screen.getByText('••••9012')).toBeInTheDocument();
  expect(screen.getByText(/Persetujuan belum menyatakan dana telah dibayar/)).toBeInTheDocument();
  expect(screen.getAllByText('Belum tercatat')).toHaveLength(3);
 });
 it('memakai rekening terproyeksi dan nilai aman untuk voucher lama',()=>{
  const rows=voucherDocumentRows(record);
  expect(rows.find(r=>r[0]==='Rekening')?.[1]).toBe('••••9012');
  const legacy=voucherDocumentRows({...record,payment_method:undefined,priority:undefined,company_name:undefined});
  expect(legacy.find(r=>r[0]==='Rencana pembayaran')?.[1]).toBe('Belum ditentukan');
 });
});
