import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NumericFormat } from 'react-number-format';
import { CheckCircle2, Circle } from 'lucide-react';
import { DetailSheet } from '../ui/DetailSheet';
import type { AccTransaction, TransactionPayload } from '../../api/accounting';
import { formatRupiah } from '../../utils/format';

const MAX_AMOUNT = 999999999999.99;
const jakartaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const journalSchema = z.object({
  account_id: z.string().min(1, 'Rekening wajib dipilih'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().trim().min(10, 'Keterangan minimal 10 karakter').max(1000, 'Keterangan maksimal 1.000 karakter'),
  reference_no: z.string().trim().max(255, 'Referensi maksimal 255 karakter').optional(),
  debit_amount: z.number().min(0, 'Debit minimal 0').max(MAX_AMOUNT, 'Nilai debit melewati batas'),
  credit_amount: z.number().min(0, 'Kredit minimal 0').max(MAX_AMOUNT, 'Nilai kredit melewati batas'),
}).refine(data => (data.debit_amount > 0 && data.credit_amount === 0) || (data.credit_amount > 0 && data.debit_amount === 0), {
  message: 'Isi tepat satu nilai debit atau kredit', path: ['debit_amount'],
});

type JournalFormValues = z.infer<typeof journalSchema>;

interface JournalFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionPayload) => Promise<void>;
  editingTx: AccTransaction | null;
  periodId: string;
  periodLabel: string;
  accounts: { id: string; code: string; displayName: string; isActive: boolean }[];
  categories: { id: string; code: string; name: string; isActive: boolean }[];
  isLoading: boolean;
}

const inputClass = 'mt-1.5 w-full rounded-input border border-line bg-panel px-3 py-2.5 text-sm text-navy focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export function JournalFormDrawer({ isOpen, onClose, onSubmit, editingTx, periodId, periodLabel, accounts, categories, isLoading }: JournalFormDrawerProps) {
  const { control, register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: { account_id: '', category_id: '', transaction_date: jakartaToday(), description: '', reference_no: '', debit_amount: 0, credit_amount: 0 },
  });
  useEffect(() => {
    reset(editingTx ? {
      account_id: editingTx.accountId, category_id: editingTx.categoryId, transaction_date: editingTx.transactionDate.slice(0, 10),
      description: editingTx.description, reference_no: editingTx.referenceNo ?? '', debit_amount: Number(editingTx.debitAmount), credit_amount: Number(editingTx.creditAmount),
    } : { account_id: '', category_id: '', transaction_date: jakartaToday(), description: '', reference_no: '', debit_amount: 0, credit_amount: 0 });
  }, [editingTx, reset, isOpen]);

  const values = watch();
  const amountReady = (values.debit_amount > 0 && values.credit_amount === 0) || (values.credit_amount > 0 && values.debit_amount === 0);
  const checks = [
    ['Tanggal transaksi terisi', Boolean(values.transaction_date)],
    ['Rekening dan kategori dipilih', Boolean(values.account_id && values.category_id)],
    ['Tepat satu sisi debit atau kredit terisi', amountReady],
    ['Keterangan minimal 10 karakter', values.description.trim().length >= 10],
  ] as const;
  const readyCount = checks.filter(([, ready]) => ready).length;
  const amount = values.debit_amount > 0 ? values.debit_amount : values.credit_amount;
  const side = values.debit_amount > 0 ? 'Debit' : values.credit_amount > 0 ? 'Kredit' : 'Belum dipilih';

  return <DetailSheet isOpen={isOpen} onClose={() => { if (!isSubmitting && !isLoading) onClose(); }} title={editingTx ? 'Perbarui jurnal' : 'Buat draf jurnal'} subtitle={`Periode ${periodLabel}. Entri disimpan sebagai draf dan tidak memindahkan dana.`} size="lg" footer={<div className="flex w-full items-center justify-between gap-3"><div><p className="text-xs text-subtle">Nilai {side.toLowerCase()}</p><p className="font-semibold tabular-nums text-navy">{amount > 0 ? formatRupiah(amount) : 'Belum diisi'}</p></div><div className="flex gap-2"><button type="button" onClick={onClose} disabled={isSubmitting || isLoading} className="rounded-input border border-line px-4 py-2 text-sm font-semibold">Batal</button><button type="submit" form="journal-form" disabled={isSubmitting || isLoading} className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting || isLoading ? 'Menyimpan...' : editingTx ? 'Simpan perubahan' : 'Simpan draf'}</button></div></div>}>
    <form id="journal-form" onSubmit={handleSubmit(async form => onSubmit({ ...form, period_id: periodId, is_draft: true, version: editingTx?.version }))}>
      <fieldset disabled={isSubmitting || isLoading} className="space-y-5">
        <aside className="rounded-card border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-100"><p className="font-semibold">Pencatatan manual yang dapat ditelusuri</p><p className="mt-1 text-xs leading-relaxed">Gunakan referensi dokumen sumber agar voucher, setoran, atau bukti lain dapat dicocokkan. Lampiran ditambahkan setelah draf tersimpan.</p></aside>
        <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">01</span><div><h3 className="font-semibold text-navy">Identitas dokumen</h3><p className="text-xs text-subtle">Tetapkan tanggal dan referensi sumber transaksi.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label htmlFor="journal-date" className="text-sm font-medium text-navy">Tanggal transaksi<input id="journal-date" type="date" {...register('transaction_date')} className={inputClass} />{errors.transaction_date && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors.transaction_date.message}</span>}</label><label htmlFor="journal-reference" className="text-sm font-medium text-navy">Nomor referensi <span className="font-normal text-subtle">(opsional)</span><input id="journal-reference" type="text" maxLength={255} placeholder="Nomor voucher, setoran, atau bukti" {...register('reference_no')} className={inputClass} />{errors.reference_no && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors.reference_no.message}</span>}</label></div></section>
        <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">02</span><div><h3 className="font-semibold text-navy">Klasifikasi pembukuan</h3><p className="text-xs text-subtle">Pilih rekening dan kategori sesuai master data aktif.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label htmlFor="journal-account" className="text-sm font-medium text-navy">Rekening<select id="journal-account" {...register('account_id')} className={inputClass}><option value="">Pilih rekening</option>{accounts.filter(x => x.isActive).map(x => <option value={x.id} key={x.id}>{x.code} · {x.displayName}</option>)}</select>{errors.account_id && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors.account_id.message}</span>}</label><label htmlFor="journal-category" className="text-sm font-medium text-navy">Kategori<select id="journal-category" {...register('category_id')} className={inputClass}><option value="">Pilih kategori</option>{categories.filter(x => x.isActive).map(x => <option value={x.id} key={x.id}>{x.code} · {x.name}</option>)}</select>{errors.category_id && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors.category_id.message}</span>}</label></div></section>
        <section className="rounded-card-lg border border-line p-4"><div className="mb-4 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">03</span><div><h3 className="font-semibold text-navy">Nilai dan keterangan</h3><p className="text-xs text-subtle">Isi salah satu sisi. Debit dan kredit tidak boleh terisi bersamaan.</p></div></div><div className="grid gap-4 sm:grid-cols-2">{(['debit_amount', 'credit_amount'] as const).map(name => <label key={name} htmlFor={`journal-${name}`} className="text-sm font-medium text-navy">{name === 'debit_amount' ? 'Debit' : 'Kredit'} (Rp)<Controller name={name} control={control} render={({ field: { onChange, value: fieldValue } }) => <NumericFormat id={`journal-${name}`} aria-label={name === 'debit_amount' ? 'Debit (Rp)' : 'Kredit (Rp)'} value={fieldValue === 0 ? '' : fieldValue} thousandSeparator="." decimalSeparator="," decimalScale={2} prefix="Rp " allowNegative={false} onValueChange={numeric => onChange(numeric.floatValue || 0)} className={inputClass} placeholder="Rp 0" />} />{errors[name] && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors[name]?.message}</span>}</label>)}</div><label htmlFor="journal-description" className="mt-4 block text-sm font-medium text-navy">Keterangan transaksi<textarea id="journal-description" {...register('description')} rows={4} maxLength={1000} className={inputClass} placeholder="Jelaskan tujuan, sumber, dan konteks transaksi minimal 10 karakter" />{errors.description && <span className="mt-1 block text-xs text-danger dark:text-red-300">{errors.description.message}</span>}</label></section>
        <aside aria-label="Kesiapan draf jurnal" className="rounded-card-lg border border-line bg-surface p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-navy">Kesiapan draf</h3><p className="text-xs text-subtle">{readyCount} dari {checks.length} pemeriksaan terpenuhi</p></div><strong className="text-xl text-navy">{Math.round(readyCount / checks.length * 100)}%</strong></div><ul className="mt-3 space-y-2">{checks.map(([label, ready]) => <li key={label} className="flex items-center gap-2 text-xs text-subtle">{ready ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" /> : <Circle aria-hidden="true" className="h-4 w-4 text-slate-400" />}{label}</li>)}</ul></aside>
      </fieldset>
    </form>
  </DetailSheet>;
}
