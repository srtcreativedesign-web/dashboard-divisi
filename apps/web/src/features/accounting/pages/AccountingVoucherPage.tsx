import { formatRupiah as rupiah, formatDate } from '../ui/format';
import { StatusBadge } from '../ui/StatusBadge';
import { WorkflowGuide } from '../ui/WorkflowGuide';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voucherApi, type VoucherInput, type VoucherRecord } from '../../../api/vouchers';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import { DetailSheet } from '../../../components/ui/DetailSheet';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';

const statusLabels = { draft: 'Draf', submitted: 'Menunggu pemeriksaan', correction: 'Perlu koreksi', pending_approval: 'Menunggu Manager', approved: 'Disetujui' };
const typeLabels = { BILLING: 'Tagihan Angkasa Pura', PURCHASING: 'Pembelian stok outlet' };
const actionLabels: Record<string, string> = { attachment_uploaded: 'Lampiran ditambahkan', created: 'Draf dibuat', updated: 'Draf diperbarui', submit: 'Diajukan', review: 'Diperiksa', decide: 'Keputusan Manager' };
const localDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
};
const emptyInput = (): VoucherInput => ({ type: 'BILLING', outlet_id: '', voucher_date: '', due_date: '', entity_name: '', source_reference: '', amount: '', description: '' });
const inputClass = 'mt-1 w-full rounded-input border border-line bg-white px-3 py-2 text-sm';

export default function AccountingVoucherPage() {
  const { user } = useAuth();
  const can = (capability: string) => hasCapability(user?.role ?? '', capability, user?.divisionCode);
  const writer = can('write:voucher');
  const reviewer = can('validate:voucher');
  const approver = can('approve:voucher');
  const client = useQueryClient();
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [outlet, setOutlet] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; version: number }>();
  const [input, setInput] = useState<VoucherInput>(emptyInput);
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<{ recordId: string; file: File } | null>(null);
  const directory = useQuery({ queryKey: ['vouchers', 'outlets'], queryFn: async () => (await voucherApi.outlets()).data });
  const list = useQuery({ queryKey: ['vouchers', 'list', month, status, type, outlet, page], enabled: /^\d{4}-\d{2}$/.test(month), queryFn: async () => (await voucherApi.list({ month, status, type, outlet_id: outlet, page: String(page) })).data });
  const detail = useQuery({ queryKey: ['vouchers', 'detail', selected], enabled: Boolean(selected), queryFn: async () => (await voucherApi.detail(selected!)).data });
  const saved = (record: VoucherRecord) => {
    client.setQueryData(['vouchers', 'detail', record.id], record);
    void client.invalidateQueries({ queryKey: ['vouchers', 'list'] });
    setSelected(record.id); setFormOpen(false); setReason(''); setFailure(null); setFeedback('Voucher berhasil diperbarui.');
  };
  const failed = (error: Error) => { setFailure(error.message); setFeedback(null); };
  const save = useMutation({ mutationFn: () => voucherApi.save(input, editing), onSuccess: response => saved(response.data), onError: failed });
  const action = useMutation({ mutationFn: ({ record, kind, data }: { record: VoucherRecord; kind: Parameters<typeof voucherApi.action>[1]; data?: Parameters<typeof voucherApi.action>[2] }) => voucherApi.action(record, kind, data), onSuccess: response => saved(response.data), onError: failed });
  const attachment = useMutation({ mutationFn: ({ record, file }: { record: VoucherRecord; file: File }) => voucherApi.attach(record, file), onSuccess: response => { setAttachmentFile(null); saved(response.data); }, onError: failed });
  const download = useMutation({ mutationFn: ({ record, file }: { record: VoucherRecord; file: NonNullable<VoucherRecord['attachments']>[number] }) => voucherApi.downloadAttachment(record, file), onError: failed });
  const busy = save.isPending || action.isPending || attachment.isPending || download.isPending;
  const openForm = (record?: VoucherRecord) => {
    setEditing(record ? { id: record.id, version: record.version } : undefined);
    setInput(record ? { type: record.type, outlet_id: record.outlet_id, voucher_date: record.voucher_date, due_date: record.due_date, entity_name: record.entity_name, source_reference: record.source_reference, amount: record.amount, description: record.description } : emptyInput());
    setSelected(null); setFormOpen(true); setFailure(null); setFeedback(null);
  };
  const perform = (kind: Parameters<typeof voucherApi.action>[1], decision?: NonNullable<Parameters<typeof voucherApi.action>[2]>['decision']) => {
    if (!detail.data) return;
    setFailure(null);
    action.mutate({ record: detail.data, kind, data: decision ? { decision, reason } : undefined });
  };
  const record = detail.data;
  const owns = record?.created_by === user?.id;
  const editable = writer && owns && record && ['draft', 'correction'].includes(record.status);
  const mayReview = reviewer && record?.status === 'submitted' && !owns;
  const mayDecide = approver && record?.status === 'pending_approval' && !owns && record.reviewed_by !== user?.id;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold text-navy">Voucher tagihan dan pembelian</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Admin mengajukan voucher, Staff Accounting memeriksa, dan Manager memberikan persetujuan.</p></div>{writer && <Button onClick={() => openForm()}>Buat voucher</Button>}</header>
    <p className="text-sm text-slate-500">Voucher disetujui menjadi dasar proses berikutnya. Pembayaran, stok dan jurnal belum otomatis berubah.</p>
    {feedback && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
    <WorkflowGuide kind="voucher" />
    <div className="flex flex-wrap gap-4 rounded-card border border-line bg-white p-4">
      <label className="text-sm">Bulan<input type="month" className={inputClass} value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} /></label>
      <label className="text-sm">Jenis<select className={inputClass} value={type} onChange={event => { setType(event.target.value); setPage(1); }}><option value="">Semua jenis</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm">Status<select className={inputClass} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Semua status</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm">Outlet<select className={inputClass} value={outlet} onChange={event => { setOutlet(event.target.value); setPage(1); }}><option value="">Semua outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label>
      <Button variant="secondary" onClick={() => { void list.refetch(); void directory.refetch(); }}>Muat ulang</Button>
    </div>
    {directory.error && <ErrorState description={directory.error.message} onRetry={() => void directory.refetch()} />}
    {list.isLoading ? <LoadingState /> : list.error ? <ErrorState description={list.error.message} onRetry={() => void list.refetch()} /> : list.data && <>
      {list.data.items.length ? <div className="overflow-x-auto rounded-card border border-line bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Daftar voucher ({list.data.total})</caption><thead className="bg-surface"><tr>{['Tanggal / jatuh tempo', 'Penerima / referensi', 'Outlet / jenis', 'Nominal', 'Status', 'Aksi'].map(label => <th scope="col" key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{list.data.items.map(item => <tr className="border-t border-line" key={item.id}><td className="px-4 py-3 whitespace-nowrap">{formatDate(item.voucher_date)}<span className="block text-xs text-slate-500">Jatuh tempo {formatDate(item.due_date)}</span></td><td className="px-4 py-3">{item.entity_name}<span className="block text-xs text-slate-500">{item.source_reference}</span></td><td className="px-4 py-3">{item.outlet_name}<span className="block text-xs text-slate-500">{typeLabels[item.type]}</span></td><td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{rupiah(item.amount)}</td><td className="px-4 py-3"><StatusBadge status={item.status} label={statusLabels[item.status]} /></td><td className="px-4 py-3"><Button variant="secondary" size="sm" onClick={() => { setSelected(item.id); setReason(''); setFailure(null); setFeedback(null); }}>Lihat</Button></td></tr>)}</tbody></table></div> : <EmptyState title="Belum ada voucher pada filter ini" />}
      <div className="flex items-center justify-between text-sm"><span>Halaman {list.data.current_page} dari {list.data.last_page}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><Button variant="secondary" disabled={page >= list.data.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div></div>
    </>}
    <DetailSheet isOpen={formOpen} onClose={() => !busy && setFormOpen(false)} title={editing ? 'Edit voucher' : 'Buat voucher'}>
      <form aria-label="Form voucher" className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
        {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
        <fieldset disabled={busy || !writer || !directory.data?.length} className="space-y-4">
          <label className="block text-sm">Jenis voucher<select className={inputClass} value={input.type} onChange={event => setInput({ ...input, type: event.target.value as VoucherInput['type'] })}>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="block text-sm">Outlet sumber<select required className={inputClass} value={input.outlet_id} onChange={event => setInput({ ...input, outlet_id: event.target.value })}><option value="">Pilih outlet</option>{directory.data?.map(item => <option key={item.id} value={item.id}>{item.name} ({item.divisionCode})</option>)}</select></label>
          <label className="block text-sm">Tanggal voucher<input required className={inputClass} type="date" max={localDate()} value={input.voucher_date} onChange={event => setInput({ ...input, voucher_date: event.target.value })} /></label>
          <label className="block text-sm">Jatuh tempo<input required className={inputClass} type="date" min={input.voucher_date} value={input.due_date} onChange={event => setInput({ ...input, due_date: event.target.value })} /></label>
          <label className="block text-sm">Penerima pembayaran<input required className={inputClass} maxLength={150} value={input.entity_name} onChange={event => setInput({ ...input, entity_name: event.target.value })} placeholder={input.type === 'BILLING' ? 'Nama penerbit tagihan Angkasa Pura' : 'Nama pemasok'} /></label>
          <label className="block text-sm">Referensi tagihan / permintaan<input required className={inputClass} maxLength={255} value={input.source_reference} onChange={event => setInput({ ...input, source_reference: event.target.value })} /></label>
          <label className="block text-sm">Nominal voucher (Rp)<input required className={inputClass} type="number" min="0.01" max="999999999999.99" step="0.01" value={input.amount} onChange={event => setInput({ ...input, amount: event.target.value })} /></label>
          <label className="block text-sm">Rincian tagihan / barang<textarea required className={inputClass} minLength={10} maxLength={2000} value={input.description} onChange={event => setInput({ ...input, description: event.target.value })} placeholder="Jelaskan tagihan, atau barang dan jumlah yang diajukan." /></label>
          <Button type="submit">{busy ? 'Menyimpan...' : 'Simpan draf'}</Button>
        </fieldset>
        {!directory.data?.length && <p className="text-sm text-slate-500">Outlet aktif diperlukan untuk membuat voucher. Siapkan data master terlebih dahulu.</p>}
      </form>
    </DetailSheet>
    <DetailSheet isOpen={Boolean(selected)} onClose={() => !busy && setSelected(null)} title="Detail voucher">
      {detail.isLoading ? <LoadingState /> : detail.error ? <ErrorState description={detail.error.message} onRetry={() => void detail.refetch()} /> : record && <div className="space-y-5">
        {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold"><StatusBadge status={record.status} label={statusLabels[record.status]} /> · Versi {record.version}</span><Button variant="secondary" size="sm" disabled={busy} onClick={() => void detail.refetch()}>Muat ulang voucher</Button></div>
        <dl className="grid grid-cols-2 gap-3 text-sm">{[['Nomor voucher', record.voucher_no], ['Jenis', typeLabels[record.type]], ['Outlet', record.outlet_name + ' (' + record.source_division_code + ')'], ['Penerima', record.entity_name], ['Tanggal', record.voucher_date], ['Jatuh tempo', record.due_date], ['Referensi', record.source_reference], ['Nominal', rupiah(record.amount)]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl>
        <div className="text-sm"><h3 className="font-semibold">Rincian</h3><p className="mt-1 whitespace-pre-wrap">{record.description}</p></div>
        {record.review_notes && <p className="text-sm">Pemeriksaan: {record.review_notes}</p>}{record.decision_notes && <p className="text-sm">Keputusan Manager: {record.decision_notes}</p>}
        <section className="space-y-3"><h3 className="font-semibold">Lampiran voucher</h3>
          {record.attachments?.length ? record.attachments.map(file => <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm"><span className="break-all">{file.original_name}<span className="block text-xs text-slate-500">{Math.ceil(file.size_bytes / 1024)} KB</span></span><Button variant="secondary" disabled={busy} onClick={() => download.mutate({ record, file })}>Unduh {file.original_name}</Button></div>) : <p className="text-sm text-slate-500">Belum ada lampiran.</p>}
          {(editable || mayReview) && <form aria-label="Unggah lampiran voucher" onSubmit={event => { event.preventDefault(); if (attachmentFile?.recordId === record.id) { setFailure(null); attachment.mutate({ record, file: attachmentFile.file }); } }} className="space-y-2">
            <label className="block text-sm">Berkas tagihan atau bukti<input key={`${record.id}-${record.version}`} type="file" disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={event => { const file = event.target.files?.[0]; setAttachmentFile(file ? { recordId: record.id, file } : null); }} className={inputClass} /></label>
            <p className="text-xs text-slate-500">Maksimal 10 MB per berkas, 20 lampiran per voucher. Berkas diperiksa sebelum disimpan.</p>
            <Button type="submit" disabled={busy || attachmentFile?.recordId !== record.id}>{attachment.isPending ? 'Memeriksa berkas...' : 'Unggah lampiran'}</Button>
          </form>}
        </section>
        {editable && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => openForm(record)}>Edit draf</Button><Button disabled={busy} onClick={() => perform('submit')}>Ajukan pemeriksaan</Button></div>}
        {(mayReview || mayDecide) && <div className="space-y-3"><label className="block text-sm">Catatan pemeriksaan / keputusan<textarea className={inputClass} disabled={busy} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></label><p className="text-xs text-slate-500">Minimal 10 karakter. Catatan dicatat pada riwayat voucher.</p><div className="flex flex-wrap gap-2">{mayReview && <><Button disabled={busy || reason.trim().length < 10} onClick={() => perform('review', 'validate')}>Teruskan ke Manager</Button><Button variant="secondary" disabled={busy || reason.trim().length < 10} onClick={() => perform('review', 'return')}>Kembalikan untuk koreksi</Button></>}{mayDecide && <><Button disabled={busy || reason.trim().length < 10} onClick={() => perform('decide', 'approve')}>Setujui voucher</Button><Button variant="secondary" disabled={busy || reason.trim().length < 10} onClick={() => perform('decide', 'reject')}>Kembalikan untuk koreksi</Button></>}</div></div>}
        {record.status === 'approved' && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Voucher disetujui dan terkunci. Status ini belum menyatakan pembayaran selesai.</p>}
        <section className="space-y-2"><h3 className="font-semibold">Riwayat voucher</h3>{record.events?.map(event => <article key={event.id} className="border-l-2 border-line pl-3 text-sm"><p>{actionLabels[event.action] ?? event.action} · {event.actor_role} · Versi {event.metadata.version}</p><p className="text-slate-500">{statusLabels[event.metadata.status]} · {rupiah(event.metadata.snapshot.amount)} · {event.metadata.snapshot.source_reference}</p>{event.metadata.reason && <p>{event.metadata.reason}</p>}<p className="text-xs text-slate-500">{event.created_at}</p></article>)}</section>
      </div>}
    </DetailSheet>
  </div>;
}
