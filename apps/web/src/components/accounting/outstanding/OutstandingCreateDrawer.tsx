import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NumericFormat } from 'react-number-format';
import { z } from 'zod';
import type { AccCategory, AccPeriod } from '../../../api/accounting';
import { DetailSheet } from '../../ui/DetailSheet';

const schema = z.object({
  direction: z.enum(['PAYABLE', 'RECEIVABLE']), period_id: z.string().min(1, 'Periode wajib dipilih'),
  counterparty_name: z.string().trim().min(2, 'Nama pihak wajib diisi').max(200), document_number: z.string().trim().max(150),
  description: z.string().trim().min(5, 'Uraian minimal 5 karakter').max(500), amount: z.number().positive('Nominal harus lebih dari 0'),
  due_date: z.string().min(1, 'Jatuh tempo wajib diisi'), category_name: z.string(),
});
export type OutstandingCreateValues = z.infer<typeof schema>;
interface Props { isOpen: boolean; onClose: () => void; onSubmit: (data: OutstandingCreateValues) => Promise<void>; isLoading: boolean; periods: AccPeriod[]; categories: AccCategory[]; defaultPeriodId?: string }
const fieldClass = 'mt-1.5 w-full rounded-input border border-line bg-panel px-3 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

export function OutstandingCreateDrawer({ isOpen, onClose, onSubmit, isLoading, periods, categories, defaultPeriodId }: Props) {
  const { control, register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<OutstandingCreateValues>({ resolver: zodResolver(schema), defaultValues: { direction: 'PAYABLE', period_id: defaultPeriodId ?? '', counterparty_name: '', document_number: '', description: '', amount: 0, due_date: '', category_name: '' } });
  const direction = watch('direction');
  useEffect(() => { if (isOpen) reset({ direction: 'PAYABLE', period_id: defaultPeriodId ?? '', counterparty_name: '', document_number: '', description: '', amount: 0, due_date: '', category_name: '' }); }, [defaultPeriodId, isOpen, reset]);
  const submit = async (values: OutstandingCreateValues) => { await onSubmit(values); onClose(); };
  return <DetailSheet isOpen={isOpen} onClose={onClose} title="Catat hutang atau piutang" subtitle="Dokumen baru hanya dapat dicatat pada periode yang masih dapat diedit." size="lg" footer={<div className="flex w-full justify-end gap-2"><button type="button" onClick={onClose} disabled={isSubmitting || isLoading} className="rounded-input border border-line bg-panel px-4 py-2 text-sm font-semibold text-muted hover:bg-surface">Batal</button><button type="submit" form="outstanding-create-form" disabled={isSubmitting || isLoading || !periods.length} className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting || isLoading ? 'Menyimpan…' : 'Simpan dokumen'}</button></div>}>
    <form id="outstanding-create-form" onSubmit={handleSubmit(submit)} className="space-y-6">
      <fieldset><legend className="text-xs font-bold uppercase tracking-wider text-subtle">1. Jenis dan periode</legend><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-muted">Jenis dokumen<select {...register('direction')} className={fieldClass}><option value="PAYABLE">Hutang · harus dibayar</option><option value="RECEIVABLE">Piutang · harus diterima</option></select></label>
        <label className="text-sm font-semibold text-muted">Periode pencatatan<select {...register('period_id')} className={fieldClass}><option value="">Pilih periode terbuka</option>{periods.map(period => <option key={period.id} value={period.id}>{period.periodMonth.slice(0, 7)} · {period.status}</option>)}</select>{errors.period_id && <span className="mt-1 block text-xs text-danger">{errors.period_id.message}</span>}</label>
      </div></fieldset>
      <fieldset><legend className="text-xs font-bold uppercase tracking-wider text-subtle">2. Pihak dan dokumen sumber</legend><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-muted">{direction === 'PAYABLE' ? 'Vendor / penerima pembayaran' : 'Pelanggan / pihak tertagih'}<input {...register('counterparty_name')} className={fieldClass} placeholder="Nama perusahaan atau pihak" />{errors.counterparty_name && <span className="mt-1 block text-xs text-danger">{errors.counterparty_name.message}</span>}</label>
        <label className="text-sm font-semibold text-muted">Nomor invoice / referensi<input {...register('document_number')} className={fieldClass} placeholder="Opsional" />{errors.document_number && <span className="mt-1 block text-xs text-danger">{errors.document_number.message}</span>}</label>
      </div><label className="mt-4 block text-sm font-semibold text-muted">Uraian<input {...register('description')} className={fieldClass} placeholder="Jelaskan sumber dan tujuan tagihan" />{errors.description && <span className="mt-1 block text-xs text-danger">{errors.description.message}</span>}</label></fieldset>
      <fieldset><legend className="text-xs font-bold uppercase tracking-wider text-subtle">3. Nilai dan jatuh tempo</legend><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-muted">Nominal<Controller name="amount" control={control} render={({ field: { value, onChange } }) => <NumericFormat value={value || ''} thousandSeparator="." decimalSeparator="," prefix="Rp " allowNegative={false} decimalScale={0} onValueChange={values => onChange(values.floatValue ?? 0)} className={fieldClass} placeholder="Rp 0" />} />{errors.amount && <span className="mt-1 block text-xs text-danger">{errors.amount.message}</span>}</label>
        <label className="text-sm font-semibold text-muted">Jatuh tempo<input type="date" {...register('due_date')} className={fieldClass} />{errors.due_date && <span className="mt-1 block text-xs text-danger">{errors.due_date.message}</span>}</label>
      </div><label className="mt-4 block text-sm font-semibold text-muted">Kategori<select {...register('category_name')} className={fieldClass}><option value="">Belum dikategorikan</option>{categories.filter(item => item.isActive).map(item => <option key={item.id} value={item.name}>{item.code} · {item.name}</option>)}</select></label></fieldset>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted">Realisasi dicatat terpisah agar pembayaran atau penerimaan bertahap tetap memiliki histori yang dapat ditelusuri.</div>
    </form>
  </DetailSheet>;
}
