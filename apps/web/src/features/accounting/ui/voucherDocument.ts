import type { VoucherRecord } from '../../../api/vouchers';
import { formatRupiah, formatDate } from '../../../utils/format';

export const paymentStatusNames = { UNPAID: 'Belum dibayar', PARTIAL: 'Sebagian dibayar', PAID: 'Lunas' };
export const priorityNames = { URGENT: 'Mendesak', NORMAL: 'Normal', SCHEDULED: 'Terjadwal' };
export const paymentNames = { CASH: 'Tunai', BANK: 'Transfer bank', UNDECIDED: 'Belum ditentukan' };
export const voucherStatusNames = { draft: 'DRAF', correction: 'PERLU KOREKSI', submitted: 'MENUNGGU PEMERIKSAAN', pending_approval: 'MENUNGGU PERSETUJUAN', approved: 'DISETUJUI' };
const units = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas'];
function words(n: bigint): string {
  if(n < 12n) return units[Number(n)]!;
  if(n < 20n) return words(n-10n)+' Belas';
  if(n < 100n) return words(n/10n)+' Puluh '+words(n%10n);
  if(n < 200n) return 'Seratus '+words(n-100n);
  if(n < 1000n) return words(n/100n)+' Ratus '+words(n%100n);
  if(n < 2000n) return 'Seribu '+words(n-1000n);
  for(const [base,label] of [[1000000000n,'Miliar'],[1000000n,'Juta'],[1000n,'Ribu']] as const) if(n>=base) return words(n/base)+' '+label+' '+words(n%base);
  return '';
}
export function voucherTerbilang(amount: string): string {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(amount);
  if(!match) return 'Nominal tidak tersedia';
  const rupiah = BigInt(match[1]!); const sen = BigInt((match[2] ?? '').padEnd(2,'0'));
  return ((rupiah===0n ? 'Nol' : words(rupiah))+' Rupiah'+(sen ? ' dan '+words(sen)+' Sen' : '')).replace(/\s+/g,' ').trim();
}
export function voucherDocumentRows(record: VoucherRecord): string[][] {
  return [...(record.payment_summary ? [['Status realisasi',paymentStatusNames[record.payment_summary.status]],['Realisasi aktif',formatRupiah(record.payment_summary.paid_amount)],['Sisa pengeluaran',formatRupiah(record.payment_summary.remaining_amount)]] : []),['Perusahaan',record.company_name || 'Belum dicatat'],['Nomor / versi',record.voucher_no+' / '+record.version],['Status',voucherStatusNames[record.status]],['Outlet sumber',record.outlet_name+' · '+record.source_division_code],['Penerima',record.entity_name],['Tanggal voucher',formatDate(record.voucher_date)],['Jatuh tempo',formatDate(record.due_date)],['Prioritas',priorityNames[record.priority ?? 'NORMAL']],['Rencana pembayaran',paymentNames[record.payment_method ?? 'UNDECIDED']],['Bank',record.bank_name || '—'],['Pemilik rekening',record.bank_account_holder || '—'],['Rekening',record.bank_account || record.bank_account_masked || '—'],['Referensi pengajuan',record.source_reference],['Invoice',record.invoice_number || '—'],['Tanggal invoice',record.invoice_date ? formatDate(record.invoice_date) : '—'],['Nomor faktur',record.tax_invoice_number || '—'],['Periode tagihan',record.billing_period || '—'],['Surat jalan',record.delivery_reference || '—']];
}
export async function createVoucherPdf(record: VoucherRecord) {
  const [{ jsPDF },{ default: autoTable }] = await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const doc = new jsPDF();
  const clean = (s: string) => Array.from(s, char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? ' ' : char).join('').replace(/••••/g,'****').replace(/—/g,'-').replace(/·/g,'/');
  doc.setFontSize(17); doc.text('VOUCHER PENGAJUAN PENGELUARAN',14,20);
  doc.setFontSize(9);doc.text('Dokumen pengajuan internal / bukan bukti dana telah dibayar.',14,28);
  autoTable(doc,{ startY:34, body:voucherDocumentRows(record).map(row=>row.map(clean)), theme:'grid', styles:{fontSize:9,cellPadding:3}, columnStyles:{0:{cellWidth:48,fontStyle:'bold'}}, margin:{left:14,right:14} });
  doc.addPage();doc.setFontSize(14);doc.text('Rincian dan jejak pemeriksaan',14,20);
  autoTable(doc,{startY:28,head:[['Uraian','Nominal']],body:[[clean(record.description),clean(formatRupiah(record.amount))],['Terbilang',clean(voucherTerbilang(record.amount))]],styles:{fontSize:10,cellPadding:4},columnStyles:{1:{cellWidth:65}},margin:{left:14,right:14}});
  autoTable(doc,{head:[['Tindakan','Role','Waktu','Versi / status']],body:(record.events ?? []).map(event=>[clean(event.action),clean(event.actor_role),clean(event.created_at),event.metadata.version+' / '+voucherStatusNames[event.metadata.status]]),styles:{fontSize:8,cellPadding:3},margin:{left:14,right:14}});
  if(record.payments?.length) {
    doc.addPage();doc.setFontSize(14);doc.text('Catatan realisasi pembayaran',14,20);
    autoTable(doc,{startY:28,head:[['Tanggal / metode','Referensi','Nominal','Status / catatan']],body:record.payments.map(p=>[formatDate(p.paid_date)+' / '+p.method,clean(p.reference),clean(formatRupiah(p.amount)),clean(p.status==='voided'?'Dibatalkan: '+p.void_reason:p.notes)]),styles:{fontSize:9,cellPadding:3},margin:{left:14,right:14}});
  }
  for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(8);doc.text('Status sistem bukan tanda tangan elektronik. Halaman '+page+' / '+doc.getNumberOfPages(),14,287);}
  return doc;
}

export async function exportVoucherPdf(record: VoucherRecord): Promise<void> {
  const doc = await createVoucherPdf(record);
  doc.save('voucher-'+record.id+'-v'+record.version+'.pdf');
}
