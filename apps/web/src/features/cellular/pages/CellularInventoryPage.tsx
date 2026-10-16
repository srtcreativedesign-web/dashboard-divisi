import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArchiveRestore, ArrowRight, CheckCircle2, ClipboardCheck, Eye, FilePlus2, PackageSearch, Plus, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { cellularApi, type InventoryDocument, type InventoryKind, type InventoryLine, type InventoryPayload } from '../api';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/states';
import { DetailSheet } from '../../../components/ui/DetailSheet';

const jakartaDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const field = 'mt-1 w-full rounded-input border border-line bg-panel px-3 py-2.5 text-sm text-navy outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950';
const kindLabel: Record<InventoryKind, string> = { RECEIPT: 'Penerimaan barang', ISSUE: 'Pengeluaran barang', TRANSFER: 'Transfer antar-outlet', STOCK_COUNT: 'Hasil stock opname' };
const statusLabel = { draft: 'Draf', submitted: 'Menunggu persetujuan', approved: 'Disetujui', correction: 'Perlu perbaikan' } as const;
const statusTone = { draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200', approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200', correction: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' } as const;
const emptyPayload = (): InventoryPayload => ({ kind: 'RECEIPT', source_outlet_id: null, destination_outlet_id: null, business_date: jakartaDate(), reference: '', notes: '', lines: [{ product_id: '', quantity: 1 }] });

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-navy">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-subtle">{hint}</span>}</label>;
}

function Badge({ status }: { status: InventoryDocument['status'] }) {
  return <span className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-bold ${statusTone[status]}`}>{statusLabel[status]}</span>;
}

export default function CellularInventoryPage() {
  const { user } = useAuth();
  const can = (capability: string) => !!user && hasCapability(user.role, capability, user.divisionCode);
  const client = useQueryClient();
  const [month, setMonth] = useState(jakartaDate().slice(0, 7));
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKindFilter] = useState('');
  const [stockQuery, setStockQuery] = useState('');
  const [stockCondition, setStockCondition] = useState('all');
  const [editor, setEditor] = useState<InventoryDocument | 'new' | null>(null);
  const [detail, setDetail] = useState<InventoryDocument | null>(null);
  const [form, setForm] = useState<InventoryPayload>(emptyPayload());
  const [correction, setCorrection] = useState<InventoryDocument | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [notice, setNotice] = useState('');
  const documentKindRef = useRef<HTMLSelectElement>(null);
  const correctionNoteRef = useRef<HTMLTextAreaElement>(null);

  const catalog = useQuery({ queryKey: ['cellular', 'inventory-catalog'], queryFn: cellularApi.inventoryCatalog, enabled: can('view:cellular') });
  const documents = useQuery({ queryKey: ['cellular', 'inventory-documents', month], queryFn: () => cellularApi.inventoryDocuments(month), enabled: can('view:cellular') && /^\d{4}-\d{2}$/.test(month) });
  const rows = documents.data?.data ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('id-ID');
    return rows.filter(row => {
      const matchesStatus = !status || row.status === status;
      const matchesKind = !kind || row.kind === kind;
      const matchesQuery = !needle || [row.document_number, row.reference, kindLabel[row.kind], row.source_outlet_name, row.destination_outlet_name].some(value => value?.toLocaleLowerCase('id-ID').includes(needle));
      return matchesStatus && matchesKind && matchesQuery;
    });
  }, [kind, query, rows, status]);
  const stocks = catalog.data?.data.balances ?? [];
  const outletName = (id: string | null) => catalog.data?.data.outlets.find(outlet => outlet.id === id)?.name ?? '—';
  const stockNeedle = stockQuery.trim().toLocaleLowerCase('id-ID');
  const filteredStocks = stocks.filter(row => {
    const matchesQuery = !stockNeedle || [row.sku, row.name, outletName(row.outlet_id)].some(value => value.toLocaleLowerCase('id-ID').includes(stockNeedle));
    const isCritical = row.quantity <= 5;
    const matchesCondition = stockCondition === 'all' || (stockCondition === 'critical' ? isCritical : !isCritical);
    return matchesQuery && matchesCondition;
  });
  const metrics = useMemo(() => ({ submitted: rows.filter(row => row.status === 'submitted').length, working: rows.filter(row => row.status === 'draft' || row.status === 'correction').length, approved: rows.filter(row => row.status === 'approved').length, critical: stocks.filter(row => row.quantity <= 5).length }), [rows, stocks]);

  const save = useMutation({ mutationFn: () => editor === 'new' ? cellularApi.createInventoryDocument(form) : cellularApi.updateInventoryDocument(editor as InventoryDocument, form), onSuccess: response => { setEditor(null); setForm(emptyPayload()); setDetail(response.data); setNotice('Dokumen persediaan berhasil disimpan sebagai draf.'); void client.invalidateQueries({ queryKey: ['cellular'] }); } });
  const transition = useMutation({ mutationFn: ({ row, action, note }: { row: InventoryDocument; action: 'submit' | 'approve' | 'correction'; note?: string }) => cellularApi.transitionInventoryDocument(row, action, note), onSuccess: (response, variables) => { setCorrection(null); setReviewNote(''); setDetail(response.data); setNotice(variables.action === 'submit' ? 'Dokumen dikirim kepada Manager.' : variables.action === 'approve' ? 'Dokumen disetujui dan stok telah diposting.' : 'Dokumen dikembalikan kepada Admin Gudang.'); void client.invalidateQueries({ queryKey: ['cellular'] }); } });
  const busy = save.isPending || transition.isPending;
  const error = save.error ?? transition.error ?? catalog.error ?? documents.error;

  const openNew = () => { setNotice(''); setForm(emptyPayload()); setEditor('new'); };
  const openEdit = (row: InventoryDocument) => { setNotice(''); setForm({ kind: row.kind, source_outlet_id: row.source_outlet_id, destination_outlet_id: row.destination_outlet_id, business_date: row.business_date, reference: row.reference, notes: row.notes ?? '', lines: row.lines.map(line => ({ product_id: line.product_id, quantity: line.quantity, counted_quantity: line.counted_quantity })) }); setEditor(row); };
  const setKind = (kind: InventoryKind) => setForm(current => ({ ...current, kind, source_outlet_id: kind === 'RECEIPT' ? null : current.source_outlet_id, destination_outlet_id: kind === 'ISSUE' || kind === 'STOCK_COUNT' ? null : current.destination_outlet_id, lines: current.lines.map(line => ({ ...line, quantity: kind === 'STOCK_COUNT' ? null : line.quantity ?? 1, counted_quantity: kind === 'STOCK_COUNT' ? line.counted_quantity ?? line.quantity ?? 0 : null })) }));
  const updateLine = (index: number, patch: Partial<InventoryLine>) => setForm(current => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, ...patch } : line) }));
  const submitForm = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  const routeText = (row: InventoryDocument) => row.kind === 'RECEIPT' ? `Pemasok → ${outletName(row.destination_outlet_id)}` : row.kind === 'TRANSFER' ? `${outletName(row.source_outlet_id)} → ${outletName(row.destination_outlet_id)}` : outletName(row.source_outlet_id);

  if (!can('view:cellular')) return <p role="alert" className="p-6">Akses persediaan Cellular tidak tersedia.</p>;
  return <div className="min-w-0 space-y-6 pb-12">
    <DivisionPageHeader division="Divisi Cellular" descriptor="Operasional Pendukung · Persediaan" title="Kontrol Persediaan" description="Buat bukti penerimaan, pengeluaran, transfer, atau stock opname. Saldo hanya berubah setelah Manager menyetujui dokumen." actions={can('write:cellular_stock') ? <Button onClick={openNew}><FilePlus2 className="h-4 w-4" />Buat dokumen</Button> : undefined} />

    <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 shadow-card lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">1 · Admin Gudang</p><p className="mt-1 font-bold text-navy">Buat dan periksa bukti</p><p className="mt-1 text-xs text-subtle">Nomor dokumen, outlet, item, jumlah, dan referensi.</p></div><ArrowRight className="hidden h-5 w-5 text-muted lg:block" />
      <div><p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">2 · Manager</p><p className="mt-1 font-bold text-navy">Setujui atau koreksi</p><p className="mt-1 text-xs text-subtle">Pembuat dokumen tidak dapat menyetujui pekerjaannya sendiri.</p></div><ArrowRight className="hidden h-5 w-5 text-muted lg:block" />
      <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">3 · Sistem</p><p className="mt-1 font-bold text-navy">Posting saldo dan audit</p><p className="mt-1 text-xs text-subtle">Mutasi terbentuk atomik dan dapat ditelusuri ke dokumen sumber.</p></div>
    </section>

    <KPICardGrid columns={4}>
      <KPICard variant="gradient" label="Perlu persetujuan" value={metrics.submitted.toLocaleString('id-ID')} note={can('approve:cellular_stock') ? 'Antrean tindakan Manager' : 'Sedang diperiksa Manager'} icon={<ClipboardCheck />} />
      <KPICard variant={metrics.working ? 'outlined' : 'default'} label="Sedang dikerjakan" value={metrics.working.toLocaleString('id-ID')} note="Draf dan dokumen koreksi" icon={<ArchiveRestore />} />
      <KPICard label="Sudah diposting" value={metrics.approved.toLocaleString('id-ID')} note={`Periode ${month}`} icon={<CheckCircle2 />} />
      <KPICard variant={metrics.critical ? 'outlined' : 'default'} label="Stok kritis" value={metrics.critical.toLocaleString('id-ID')} note="Saldo lima unit atau kurang" icon={<PackageSearch />} />
    </KPICardGrid>

    {error && <div role="alert" className="rounded-input border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error.message}</div>}
    {notice && <div role="status" className="rounded-input border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{notice}</div>}

    <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card">
      <div className="border-b border-line p-5"><h2 className="text-lg font-bold text-navy">Register dokumen persediaan</h2><p className="mt-1 text-sm text-subtle">Satu sumber kerja untuk Admin Gudang, Manager, dan pemeriksaan audit.</p></div>
      <section aria-label="Filter dokumen persediaan" className="grid gap-4 border-b border-line p-5 sm:grid-cols-2 xl:grid-cols-[minmax(17rem,1fr)_11rem_13rem_13rem_auto] xl:items-end">
        <Field label="Cari dokumen"><input aria-label="Cari dokumen persediaan" type="search" className={field} placeholder="Nomor, referensi, atau outlet" value={query} onChange={event => setQuery(event.target.value)} /></Field>
        <Field label="Periode"><input aria-label="Periode dokumen" type="month" className={field} value={month} onChange={event => setMonth(event.target.value)} /></Field>
        <Field label="Jenis"><select aria-label="Filter jenis dokumen" className={field} value={kind} onChange={event => setKindFilter(event.target.value)}><option value="">Semua jenis</option>{Object.entries(kindLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Status"><select aria-label="Filter status dokumen" className={field} value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <p aria-live="polite" className="rounded-input bg-surface px-3 py-2.5 text-sm font-semibold text-muted">{filtered.length} dari {rows.length} dokumen</p>
      </section>
      {documents.isLoading ? <p role="status" className="p-6 text-subtle">Memuat register persediaan...</p> : rows.length === 0 ? <div className="p-6"><EmptyState title="Belum ada dokumen" description="Buat dokumen persediaan pertama atau ubah periode." /></div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1020px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Dokumen</th><th>Tanggal</th><th>Jenis & rute</th><th>Isi</th><th>Status</th><th className="px-5 text-right">Tindakan</th></tr></thead><tbody className="divide-y divide-line">{filtered.map(row => <tr key={row.id} className="hover:bg-surface"><td className="px-5 py-4"><strong className="text-navy">{row.document_number}</strong><p className="mt-1 text-xs text-subtle">Ref. {row.reference}</p></td><td>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${row.business_date}T00:00:00`))}</td><td><strong className="text-navy">{kindLabel[row.kind]}</strong><p className="mt-1 text-xs text-subtle">{routeText(row)}</p></td><td><strong className="text-navy">{row.lines.length} produk</strong><p className="mt-1 text-xs text-subtle">{row.lines.reduce((sum, line) => sum + Number(row.kind === 'STOCK_COUNT' ? line.counted_quantity : line.quantity), 0).toLocaleString('id-ID')} unit / hasil hitung</p></td><td><Badge status={row.status} />{row.review_note && <p className="mt-2 max-w-xs text-xs text-red-700 dark:text-red-300">{row.review_note}</p>}</td><td className="px-5"><div className="flex justify-end gap-2"><button type="button" aria-label={`Lihat ${row.document_number}`} className="inline-flex min-h-10 items-center gap-1 font-semibold text-primary-700 dark:text-primary-300" onClick={() => setDetail(row)}><Eye className="h-4 w-4" />Detail</button>{can('write:cellular_stock') && (row.status === 'draft' || row.status === 'correction') && <button type="button" className="min-h-10 font-semibold text-primary-700 dark:text-primary-300" onClick={() => openEdit(row)}>Ubah</button>}{can('write:cellular_stock') && (row.status === 'draft' || row.status === 'correction') && <button type="button" disabled={busy} className="inline-flex min-h-10 items-center gap-1 font-semibold text-emerald-700 disabled:opacity-50 dark:text-emerald-300" onClick={() => transition.mutate({ row, action: 'submit' })}><Send className="h-4 w-4" />Kirim</button>}{can('approve:cellular_stock') && row.status === 'submitted' && <><button type="button" disabled={busy} className="inline-flex min-h-10 items-center gap-1 font-semibold text-emerald-700 disabled:opacity-50 dark:text-emerald-300" onClick={() => transition.mutate({ row, action: 'approve' })}><ShieldCheck className="h-4 w-4" />Setujui</button><button type="button" disabled={busy} className="min-h-10 font-semibold text-red-700 disabled:opacity-50 dark:text-red-300" onClick={() => { setCorrection(row); setReviewNote(''); }}>Koreksi</button></>}</div></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="Dokumen tidak ditemukan" description="Ubah pencarian, jenis, atau status untuk melihat dokumen lainnya." /></div>}
    </section>

    <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="border-b border-line p-5"><h2 className="font-bold text-navy">Posisi stok saat ini</h2><p className="mt-1 text-xs text-subtle">Saldo berasal dari dokumen yang sudah disetujui dan penjualan yang sudah diposting.</p></div><section aria-label="Filter posisi stok" className="grid gap-4 border-b border-line p-5 sm:grid-cols-[minmax(16rem,1fr)_13rem_auto] sm:items-end"><Field label="Cari produk atau outlet"><input aria-label="Cari posisi stok" type="search" className={field} placeholder="SKU, nama produk, atau outlet" value={stockQuery} onChange={event => setStockQuery(event.target.value)} /></Field><Field label="Kondisi stok"><select aria-label="Filter kondisi stok" className={field} value={stockCondition} onChange={event => setStockCondition(event.target.value)}><option value="all">Semua kondisi</option><option value="critical">Perlu tindak lanjut</option><option value="available">Tersedia</option></select></Field><p aria-live="polite" className="rounded-input bg-surface px-3 py-2.5 text-sm font-semibold text-muted">{filteredStocks.length} dari {stocks.length} posisi</p></section>{stocks.length === 0 ? <div className="p-6"><EmptyState title="Belum ada saldo" description="Saldo akan terbentuk saat dokumen penerimaan disetujui." /></div> : filteredStocks.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Produk</th><th>Outlet</th><th className="text-right">Saldo</th><th className="px-5">Kondisi</th></tr></thead><tbody className="divide-y divide-line">{filteredStocks.map(row => <tr key={row.id}><td className="px-5 py-4"><strong className="text-navy">{row.sku}</strong><p className="text-xs text-subtle">{row.name}</p></td><td>{outletName(row.outlet_id)}</td><td className="text-right text-lg font-bold tabular-nums text-navy">{row.quantity.toLocaleString('id-ID')}</td><td className="px-5 font-semibold">{row.quantity <= 5 ? <span className="text-red-700 dark:text-red-300">Perlu tindak lanjut</span> : <span className="text-emerald-700 dark:text-emerald-300">Tersedia</span>}</td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="Posisi stok tidak ditemukan" description="Ubah pencarian atau kondisi untuk melihat posisi stok lainnya." /></div>}</section>

    <DetailSheet
      isOpen={!!editor}
      onClose={() => { if (!busy) setEditor(null); }}
      title={editor === 'new' ? 'Buat dokumen persediaan' : `Ubah ${editor?.document_number ?? 'dokumen'}`}
      subtitle="Lengkapi bukti operasional sebelum dikirim untuk persetujuan Manager."
      icon={FilePlus2}
      size="2xl"
      initialFocusRef={documentKindRef}
      footer={<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => setEditor(null)}>Batal</Button><Button type="submit" form="cellular-inventory-document-form" disabled={busy || form.kind === 'TRANSFER' && form.source_outlet_id === form.destination_outlet_id}>{busy ? 'Menyimpan...' : 'Simpan draf'}</Button></div>}
    >
      <form id="cellular-inventory-document-form" aria-label="Form dokumen persediaan" onSubmit={submitForm} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <section className="grid gap-5 rounded-card border border-line p-4 md:grid-cols-2">
            <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">1. KONTEKS DOKUMEN</p><h3 className="mt-1 font-bold text-navy">Jenis, tanggal, dan rute barang</h3><p className="mt-1 text-xs text-subtle">Pilihan jenis menentukan outlet asal, tujuan, dan cara jumlah dicatat.</p></div>
            <Field label="Jenis dokumen"><select ref={documentKindRef} className={field} value={form.kind} onChange={event => setKind(event.target.value as InventoryKind)}>{Object.entries(kindLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Tanggal bisnis"><input required type="date" max={jakartaDate()} className={field} value={form.business_date} onChange={event => setForm({ ...form, business_date: event.target.value })} /></Field>
            {form.kind !== 'RECEIPT' && <Field label={form.kind === 'TRANSFER' ? 'Outlet asal' : 'Outlet'}><select required className={field} value={form.source_outlet_id ?? ''} onChange={event => setForm({ ...form, source_outlet_id: event.target.value || null })}><option value="">Pilih outlet</option>{catalog.data?.data.outlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}</select></Field>}
            {(form.kind === 'RECEIPT' || form.kind === 'TRANSFER') && <Field label={form.kind === 'TRANSFER' ? 'Outlet tujuan' : 'Outlet penerima'}><select required className={field} value={form.destination_outlet_id ?? ''} onChange={event => setForm({ ...form, destination_outlet_id: event.target.value || null })}><option value="">Pilih outlet</option>{catalog.data?.data.outlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}</select></Field>}
          </section>
          <section className="grid gap-5 rounded-card border border-line p-4 md:grid-cols-2">
            <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">2. BUKTI OPERASIONAL</p><h3 className="mt-1 font-bold text-navy">Referensi dan catatan</h3></div>
            <Field label="Referensi bukti" hint="Nomor surat jalan, BA, nota, atau formulir opname."><input required maxLength={255} className={field} value={form.reference} onChange={event => setForm({ ...form, reference: event.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Catatan operasional"><textarea required minLength={10} maxLength={2000} rows={3} className={field} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field></div>
          </section>
          <section className="rounded-card border border-line p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">3. RINCIAN BARANG</p><h3 className="mt-1 font-bold text-navy">Produk dan jumlah</h3><p className="mt-1 text-xs text-subtle">Satu produk hanya boleh muncul satu kali dalam dokumen.</p></div><Button type="button" variant="secondary" onClick={() => setForm(current => ({ ...current, lines: [...current.lines, { product_id: '', quantity: form.kind === 'STOCK_COUNT' ? null : 1, counted_quantity: form.kind === 'STOCK_COUNT' ? 0 : null }] }))}><Plus className="h-4 w-4" />Tambah baris</Button></div>
            <div className="space-y-3">{form.lines.map((line, index) => <div key={index} className="grid gap-3 rounded-input border border-line bg-surface p-3 md:grid-cols-[1fr_180px_44px] md:items-end"><Field label="Produk"><select required className={field} value={line.product_id} onChange={event => updateLine(index, { product_id: event.target.value })}><option value="">Pilih produk</option>{catalog.data?.data.products.map(product => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}</select></Field><Field label={form.kind === 'STOCK_COUNT' ? 'Hasil hitung fisik' : 'Jumlah unit'}><input required type="number" min={form.kind === 'STOCK_COUNT' ? 0 : 1} max={1000000} step={1} className={field} value={form.kind === 'STOCK_COUNT' ? line.counted_quantity ?? 0 : line.quantity ?? 1} onChange={event => updateLine(index, form.kind === 'STOCK_COUNT' ? { counted_quantity: Number(event.target.value) } : { quantity: Number(event.target.value) })} /></Field><button type="button" aria-label={`Hapus baris ${index + 1}`} disabled={form.lines.length === 1} className="mb-0.5 grid h-11 w-11 place-items-center rounded-input text-red-700 disabled:opacity-30 dark:text-red-300" onClick={() => setForm(current => ({ ...current, lines: current.lines.filter((_, i) => i !== index) }))}><Trash2 className="h-4 w-4" /></button></div>)}</div>
          </section>
          {form.kind === 'TRANSFER' && form.source_outlet_id && form.source_outlet_id === form.destination_outlet_id && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">Outlet asal dan tujuan transfer harus berbeda.</p>}
          {save.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">{save.error.message}</p>}
        </fieldset>
      </form>
    </DetailSheet>

    <DetailSheet
      isOpen={!!detail}
      onClose={() => setDetail(null)}
      title="Detail dokumen persediaan"
      subtitle={detail ? `${detail.document_number} · ${kindLabel[detail.kind]} · ${routeText(detail)}` : undefined}
      icon={ClipboardCheck}
      badge={detail ? { text: statusLabel[detail.status], variant: detail.status === 'approved' ? 'success' : detail.status === 'submitted' ? 'warning' : detail.status === 'correction' ? 'danger' : 'neutral' } : undefined}
      size="xl"
      footer={<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={() => window.print()}>Cetak berita acara</Button><Button type="button" variant="secondary" onClick={() => setDetail(null)}>Tutup</Button></div>}
    >
      {detail && <div className="space-y-5"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div className="rounded-card border border-line bg-surface p-4"><dt className="text-subtle">Tanggal bisnis</dt><dd className="mt-1 font-semibold text-navy">{detail.business_date}</dd></div><div className="rounded-card border border-line bg-surface p-4"><dt className="text-subtle">Referensi bukti</dt><dd className="mt-1 font-semibold text-navy">{detail.reference}</dd></div><div className="sm:col-span-2 rounded-card border border-line bg-surface p-4"><dt className="text-subtle">Catatan</dt><dd className="mt-1 text-navy">{detail.notes || '—'}</dd></div></dl><section><h3 className="mb-2 font-bold text-navy">Rincian barang</h3><div className="overflow-x-auto rounded-input border border-line"><table className="w-full min-w-[28rem] text-left text-sm"><thead className="bg-surface text-xs uppercase text-subtle"><tr><th className="px-4 py-2">Produk</th><th className="px-4 py-2 text-right">Jumlah</th></tr></thead><tbody className="divide-y divide-line">{detail.lines.map((line, index) => <tr key={line.id ?? index}><td className="px-4 py-3"><strong className="text-navy">{line.sku}</strong><p className="text-xs text-subtle">{line.product_name}</p></td><td className="px-4 py-3 text-right font-bold text-navy">{Number(detail.kind === 'STOCK_COUNT' ? line.counted_quantity : line.quantity).toLocaleString('id-ID')}</td></tr>)}</tbody></table></div></section>{detail.review_note && <section className="rounded-card border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"><p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">CATATAN PEMERIKSA</p><p className="mt-2 text-sm text-red-800 dark:text-red-200">{detail.review_note}</p></section>}<section className="rounded-card border border-line bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wider text-subtle">PEMISAHAN TUGAS</p><p className="mt-2 text-sm leading-6 text-navy">{detail.reviewer_id ? 'Dokumen telah diperiksa oleh pengguna berbeda dan identitasnya tersimpan pada audit trail.' : 'Dokumen belum diperiksa. Pembuat tidak dapat menyetujui dokumennya sendiri.'}</p></section></div>}
    </DetailSheet>

    <DetailSheet
      isOpen={!!correction}
      onClose={() => { if (!busy) { setCorrection(null); setReviewNote(''); } }}
      title="Minta perbaikan dokumen"
      subtitle={correction ? `${correction.document_number} · dikembalikan kepada Admin Gudang` : undefined}
      icon={ArchiveRestore}
      badge={{ text: 'Koreksi Manager', variant: 'danger' }}
      size="lg"
      initialFocusRef={correctionNoteRef}
      footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => { setCorrection(null); setReviewNote(''); }}>Batal</Button><Button type="submit" form="cellular-inventory-correction-form" disabled={busy || reviewNote.trim().length < 10}>{busy ? 'Mengirim...' : 'Kirim koreksi'}</Button></div>}
    >
      {correction && <form id="cellular-inventory-correction-form" aria-label="Kembalikan dokumen untuk koreksi" className="space-y-5" onSubmit={event => { event.preventDefault(); transition.mutate({ row: correction, action: 'correction', note: reviewNote }); }}><section className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Jelaskan data, jumlah, outlet, atau bukti yang harus diperbaiki. Catatan ini tampil kepada Admin Gudang dan tersimpan dalam histori dokumen.</section><Field label="Catatan koreksi"><textarea ref={correctionNoteRef} required minLength={10} maxLength={2000} rows={5} className={field} value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></Field><p className="text-xs text-subtle">Minimal 10 karakter · {reviewNote.trim().length}/2000.</p>{transition.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">{transition.error.message}</p>}</form>}
    </DetailSheet>
  </div>;
}
