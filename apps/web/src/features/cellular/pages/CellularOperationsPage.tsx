import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cellularApi, type Sale } from '../api';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-white p-2 text-sm';
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>; }

export default function CellularOperationsPage() {
  const { user } = useAuth();
  const can = (cap: string) => !!user && hasCapability(user.role, cap, user.divisionCode);
  const client = useQueryClient();
  const [tab, setTab] = useState<'catalog' | 'stock' | 'sales'>('catalog');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [notice, setNotice] = useState('');
  const [product, setProduct] = useState({ sku: '', name: '', kind: 'SIM_CARD', provider: '', variant: '' });
  const [adjustment, setAdjustment] = useState({ product_id: '', outlet_id: '', quantity_delta: '', reference: '', reason: '' });
  const [sale, setSale] = useState({ product_id: '', outlet_id: '', business_date: today(), quantity: '', unit_price: '', reference: '' });
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const products = useQuery({ queryKey: ['cellular', 'products'], queryFn: cellularApi.products });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets });
  const stock = useQuery({ queryKey: ['cellular', 'stock'], queryFn: cellularApi.stock });
  const movements = useQuery({ queryKey: ['cellular', 'movements'], queryFn: cellularApi.movements });
  const sales = useQuery({ queryKey: ['cellular', 'sales', month], queryFn: () => cellularApi.sales(month), enabled: can('view:cellular_sales') && /^\d{4}-\d{2}$/.test(month) });
  const mutation = useMutation({ mutationFn: async (action: 'product' | 'stock' | 'sale' | 'void') => {
    if (action === 'product') await cellularApi.createProduct({ ...product, provider: product.provider || null, variant: product.variant || null });
    if (action === 'stock') await cellularApi.adjust({ ...adjustment, quantity_delta: Number(adjustment.quantity_delta) });
    if (action === 'sale') await cellularApi.sell({ ...sale, quantity: Number(sale.quantity) });
    if (action === 'void' && voiding) await cellularApi.voidSale(voiding, voidReason);
    return action;
  }, onSuccess: action => {
    void client.invalidateQueries({ queryKey: ['cellular'] });
    setNotice(action === 'void' ? 'Penjualan dibatalkan dan jumlah stok dikembalikan.' : 'Data berhasil disimpan.');
    if (action === 'product') setProduct({ sku: '', name: '', kind: 'SIM_CARD', provider: '', variant: '' });
    if (action === 'stock') setAdjustment(a => ({ ...a, quantity_delta: '', reference: '', reason: '' }));
    if (action === 'sale') { setMonth(sale.business_date.slice(0, 7)); setSale(s => ({ ...s, quantity: '', unit_price: '', reference: '' })); }
    if (action === 'void') { setVoiding(null); setVoidReason(''); }
  } });
  const submit = (action: 'product' | 'stock' | 'sale' | 'void') => (e: FormEvent) => { e.preventDefault(); setNotice(''); mutation.mutate(action); };
  const busy = mutation.isPending;
  const outletName = (id: string) => outlets.data?.data.find(o => o.id === id)?.name ?? 'Outlet tidak tersedia';
  const choices = (value: string, set: (value: string) => void, kind: 'product' | 'outlet') => <select required className={fieldClass} value={value} onChange={e => set(e.target.value)}><option value="">Pilih {kind === 'product' ? 'produk' : 'outlet'}</option>{kind === 'product' ? products.data?.data.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>) : outlets.data?.data.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>;
  const button = (label: string) => <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy}>{busy ? 'Menyimpan...' : label}</button>;
  const queries = [products, outlets, stock, movements, ...(can('view:cellular_sales') ? [sales] : [])];
  return <div className="space-y-5 p-6">
    <header><h1 className="text-2xl font-bold text-slate-900">Operasional Cellular</h1><p className="mt-1 text-sm text-slate-500">Kartu perdana dan aksesori. Pencatatan manual dengan stok berdasarkan jumlah barang.</p></header>
    <nav className="flex gap-2" aria-label="Bagian operasional Cellular">{(['catalog', 'stock', ...(can('view:cellular_sales') ? ['sales'] : [])] as const).map(t => <button key={t} type="button" aria-pressed={tab === t} className={`rounded-lg border px-4 py-2 text-sm ${tab === t ? 'border-primary-600 text-primary-700' : 'border-line text-slate-600'}`} onClick={() => { setTab(t as typeof tab); mutation.reset(); setNotice(''); }}>{t === 'catalog' ? 'Katalog' : t === 'stock' ? 'Stok' : 'Penjualan'}</button>)}</nav>
    {queries.some(q => q.isLoading) && <p role="status">Memuat data...</p>}
    {queries.filter(q => q.error).map((q, i) => <div key={i} role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{q.error?.message}<button type="button" className="ml-3 underline" onClick={() => void q.refetch()}>Coba lagi</button></div>)}
    {mutation.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{mutation.error.message}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    {tab === 'catalog' && <>
      {can('manage:cellular_catalog') && <form aria-label="Tambah produk" onSubmit={submit('product')} className="grid gap-3 rounded-xl border border-line bg-white p-5 md:grid-cols-2"><h2 className="font-semibold md:col-span-2">Tambah produk</h2>
        <Field label="SKU"><input required maxLength={50} pattern="[A-Za-z0-9_-]+" className={fieldClass} value={product.sku} onChange={e => setProduct({ ...product, sku: e.target.value })} /></Field>
        <Field label="Nama produk"><input required maxLength={255} className={fieldClass} value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} /></Field>
        <Field label="Jenis"><select className={fieldClass} value={product.kind} onChange={e => setProduct({ ...product, kind: e.target.value })}><option value="SIM_CARD">Kartu perdana</option><option value="ACCESSORY">Aksesori</option></select></Field>
        <Field label="Provider (opsional)"><input maxLength={100} className={fieldClass} value={product.provider} onChange={e => setProduct({ ...product, provider: e.target.value })} /></Field>
        <Field label="Varian / kuota (opsional)"><input maxLength={255} className={fieldClass} value={product.variant} onChange={e => setProduct({ ...product, variant: e.target.value })} /></Field><div className="self-end">{button('Simpan produk')}</div>
      </form>}
      <section className="overflow-x-auto rounded-xl border border-line bg-white p-5"><h2 className="mb-3 font-semibold">Katalog produk</h2><p className="mb-3 text-xs text-slate-500">Menampilkan maksimal 500 produk menurut SKU.</p><table className="w-full text-left text-sm"><thead><tr><th>SKU</th><th>Produk</th><th>Jenis</th><th>Provider</th><th>Varian / kuota</th></tr></thead><tbody>{products.data?.data.map(p => <tr key={p.id} className="border-t border-line"><td className="py-3">{p.sku}</td><td>{p.name}</td><td>{p.kind === 'SIM_CARD' ? 'Kartu perdana' : 'Aksesori'}</td><td>{p.provider || '—'}</td><td>{p.variant || '—'}</td></tr>)}</tbody></table>{products.isSuccess && products.data.data.length === 0 && <p className="mt-4 text-slate-500">Belum ada produk.</p>}</section>
    </>}
    {tab === 'stock' && <>
      {can('write:cellular_stock') && <form aria-label="Catat mutasi stok" onSubmit={submit('stock')} className="grid gap-3 rounded-xl border border-line bg-white p-5 md:grid-cols-2"><h2 className="font-semibold md:col-span-2">Catat mutasi stok</h2><Field label="Produk">{choices(adjustment.product_id, v => setAdjustment({ ...adjustment, product_id: v }), 'product')}</Field><Field label="Outlet">{choices(adjustment.outlet_id, v => setAdjustment({ ...adjustment, outlet_id: v }), 'outlet')}</Field><Field label="Perubahan jumlah (+ masuk, − keluar)"><input required type="number" min={-1000000} max={1000000} step={1} className={fieldClass} value={adjustment.quantity_delta} onChange={e => setAdjustment({ ...adjustment, quantity_delta: e.target.value })} /></Field><Field label="Referensi bukti"><input required maxLength={255} className={fieldClass} value={adjustment.reference} onChange={e => setAdjustment({ ...adjustment, reference: e.target.value })} /></Field><Field label="Alasan mutasi"><textarea required minLength={10} maxLength={2000} className={fieldClass} value={adjustment.reason} onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })} /></Field><div className="self-end">{button('Simpan mutasi')}</div></form>}
      <section className="overflow-x-auto rounded-xl border border-line bg-white p-5"><h2 className="mb-3 font-semibold">Jumlah stok</h2><p className="mb-3 text-xs text-slate-500">Maksimal 500 saldo produk/outlet. Produk tanpa mutasi belum memiliki saldo. Nilai HPP belum dihitung.</p><table className="w-full text-left text-sm"><thead><tr><th>Produk</th><th>Outlet</th><th>Jumlah</th></tr></thead><tbody>{stock.data?.data.map(s => <tr key={s.id} className="border-t border-line"><td className="py-3">{s.sku} — {s.name}</td><td>{outletName(s.outlet_id)}</td><td>{s.quantity}</td></tr>)}</tbody></table>{stock.isSuccess && stock.data.data.length === 0 && <p className="mt-4 text-slate-500">Belum ada mutasi stok.</p>}</section>
      <section className="overflow-x-auto rounded-xl border border-line bg-white p-5"><h2 className="mb-3 font-semibold">100 mutasi terbaru</h2><table className="w-full text-left text-sm"><thead><tr><th>Produk</th><th>Outlet</th><th>Jenis</th><th>Perubahan</th><th>Saldo sesudah</th></tr></thead><tbody>{movements.data?.data.map(m => <tr key={m.id} className="border-t border-line"><td className="py-3">{m.sku}</td><td>{outletName(m.outlet_id)}</td><td>{m.kind === 'SALE' ? 'Penjualan' : m.kind === 'VOID' ? 'Pembatalan' : 'Mutasi manual'}</td><td>{m.quantity_delta}</td><td>{m.quantity_after}</td></tr>)}</tbody></table></section>
    </>}
    {tab === 'sales' && can('view:cellular_sales') && <>
      {can('write:cellular_sale') && <form aria-label="Catat penjualan" onSubmit={submit('sale')} className="grid gap-3 rounded-xl border border-line bg-white p-5 md:grid-cols-2"><h2 className="font-semibold md:col-span-2">Catat penjualan manual</h2><Field label="Produk">{choices(sale.product_id, v => setSale({ ...sale, product_id: v }), 'product')}</Field><Field label="Outlet">{choices(sale.outlet_id, v => setSale({ ...sale, outlet_id: v }), 'outlet')}</Field><Field label="Tanggal penjualan"><input required type="date" max={today()} className={fieldClass} value={sale.business_date} onChange={e => setSale({ ...sale, business_date: e.target.value })} /></Field><Field label="Jumlah terjual"><input required type="number" min={1} max={1000000} step={1} className={fieldClass} value={sale.quantity} onChange={e => setSale({ ...sale, quantity: e.target.value })} /></Field><Field label="Harga per unit (Rp)"><input required inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,2})?" className={fieldClass} value={sale.unit_price} onChange={e => setSale({ ...sale, unit_price: e.target.value })} /></Field><Field label="Referensi laporan manual"><input required maxLength={255} className={fieldClass} value={sale.reference} onChange={e => setSale({ ...sale, reference: e.target.value })} /></Field><div>{button('Simpan penjualan')}</div></form>}
      <Field label="Bulan laporan"><input required type="month" className={`${fieldClass} max-w-xs`} value={month} onChange={e => setMonth(e.target.value)} /></Field>
      <section className="overflow-x-auto rounded-xl border border-line bg-white p-5"><h2 className="mb-2 font-semibold">Penjualan manual</h2><p className="mb-3 text-xs text-slate-500">Maksimal 100 catatan terbaru pada bulan terpilih. Belum terhubung otomatis ke jurnal, penerimaan kas, atau omzet Accounting.</p><table className="w-full text-left text-sm"><thead><tr><th>Tanggal</th><th>Outlet / produk</th><th>Referensi</th><th>Jumlah</th><th>Harga / total (Rp)</th><th>Status</th>{can('void:cellular_sale') && <th>Aksi</th>}</tr></thead><tbody>{sales.data?.data.map(s => <tr key={s.id} className="border-t border-line"><td className="py-3">{s.business_date}</td><td>{s.outlet_name}<br />{s.product_name}</td><td>{s.source_reference}</td><td>{s.quantity}</td><td>{s.unit_price} / {s.total_amount}</td><td>{s.status === 'posted' ? 'Tercatat' : 'Dibatalkan'}{s.void_reason && <p>{s.void_reason}</p>}</td>{can('void:cellular_sale') && <td>{s.status === 'posted' && <button type="button" disabled={busy} className="text-red-700 underline" onClick={() => { setVoiding(s); setVoidReason(''); mutation.reset(); }}>Batalkan</button>}</td>}</tr>)}</tbody></table>{sales.isSuccess && sales.data.data.length === 0 && <p className="mt-4 text-slate-500">Belum ada penjualan pada bulan ini.</p>}</section>
      {voiding && <form aria-label="Batalkan penjualan" onSubmit={submit('void')} className="space-y-3 rounded-xl border border-red-200 bg-white p-5"><h2 className="font-semibold">Batalkan {voiding.source_reference}</h2><p className="text-sm text-slate-600">Jumlah {voiding.quantity} barang akan dikembalikan ke stok. Pembatalan ini belum mencatat pengembalian uang.</p><Field label="Alasan pembatalan"><textarea required minLength={10} maxLength={2000} className={fieldClass} value={voidReason} onChange={e => setVoidReason(e.target.value)} /></Field>{button('Konfirmasi pembatalan')}<button type="button" disabled={busy} className="ml-3 text-sm underline" onClick={() => setVoiding(null)}>Tutup</button></form>}
    </>}
  </div>;
}
