import { useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cellularApi, type Movement, type MovementFilters, type Product, type Sale } from '../api';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Ban, Boxes, CircleDollarSign, Eye, FileText, PackageCheck, PackageX, Plus, Search, ShoppingBag } from 'lucide-react';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/states';
import { DetailSheet } from '../../../components/ui/DetailSheet';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const money = (value: string | number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value));
const formatDateTime = (value?: string) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : 'Belum tersedia';
const fieldClass = 'mt-1 w-full rounded-lg border border-line bg-white dark:bg-slate-900 dark:text-slate-100 p-2 text-sm';
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}{children}</label>; }
function SaleInfo({ label, value }: { label: string; value: string }) { return <div className="rounded-card border border-line bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</dt><dd className="mt-1 font-semibold text-navy">{value}</dd></div>; }

export default function CellularOperationsPage() {
  const { user } = useAuth();
  const can = (cap: string) => !!user && hasCapability(user.role, cap, user.divisionCode);
  const client = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const tab: 'catalog' | 'stock' | 'sales' = location.pathname.endsWith('/penjualan') ? 'sales' : location.pathname.endsWith('/persediaan') ? 'stock' : 'catalog';
  const [month, setMonth] = useState(today().slice(0, 7));
  const [notice, setNotice] = useState('');
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [movementDetail, setMovementDetail] = useState<Movement | null>(null);
  const stockProductRef = useRef<HTMLSelectElement>(null);
  const [movementFilters, setMovementFilters] = useState({ month: today().slice(0, 7), outlet_id: '', product_id: '', kind: '', direction: '', q: '' });
  const [product, setProduct] = useState({ sku: '', name: '', kind: 'SIM_CARD', provider: '', variant: '', is_active: true, change_reason: '' });
  const [productEditor, setProductEditor] = useState<Product | 'new' | null>(null);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [productFilters, setProductFilters] = useState({ q: '', kind: '', provider: '', status: 'active' });
  const [adjustment, setAdjustment] = useState({ product_id: '', outlet_id: '', quantity_delta: '', reference: '', reason: '' });
  const [sale, setSale] = useState({ product_id: '', outlet_id: '', business_date: today(), quantity: '', unit_price: '', reference: '' });
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [saleDetail, setSaleDetail] = useState<Sale | null>(null);
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const saleOutletRef = useRef<HTMLSelectElement>(null);
  const voidReasonRef = useRef<HTMLTextAreaElement>(null);
  const [saleFilters, setSaleFilters] = useState({ q: '', status: 'all' });
  const products = useQuery({ queryKey: ['cellular', 'products'], queryFn: cellularApi.products, enabled: can('view:cellular') });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets, enabled: can('view:cellular') });
  const stock = useQuery({ queryKey: ['cellular', 'stock'], queryFn: cellularApi.stock, enabled: can('view:cellular') });
  const movementParams = useMemo(() => Object.fromEntries(Object.entries(movementFilters).filter(([, value]) => value)), [movementFilters]);
  const movements = useQuery({ queryKey: ['cellular', 'movements', movementParams], queryFn: () => cellularApi.movementRegister(movementParams as MovementFilters), enabled: can('view:cellular') });
  const sales = useQuery({ queryKey: ['cellular', 'sales', month], queryFn: () => cellularApi.sales(month), enabled: can('view:cellular_sales') && /^\d{4}-\d{2}$/.test(month) });
  const mutation = useMutation({ mutationFn: async (action: 'product' | 'product-update' | 'stock' | 'sale' | 'void') => {
    if (action === 'product') await cellularApi.createProduct({ sku: product.sku, name: product.name, kind: product.kind, provider: product.provider || null, variant: product.variant || null });
    if (action === 'product-update' && productEditor && productEditor !== 'new') await cellularApi.updateProduct(productEditor, { ...product, provider: product.provider || null, variant: product.variant || null });
    if (action === 'stock') await cellularApi.adjust({ ...adjustment, quantity_delta: Number(adjustment.quantity_delta) });
    if (action === 'sale') await cellularApi.sell({ ...sale, quantity: Number(sale.quantity) });
    if (action === 'void' && voiding) await cellularApi.voidSale(voiding, voidReason);
    return action;
  }, onSuccess: action => {
    void client.invalidateQueries({ queryKey: ['cellular'] });
    setNotice(action === 'void' ? 'Penjualan dibatalkan dan jumlah stok dikembalikan.' : 'Data berhasil disimpan.');
    if (action === 'product' || action === 'product-update') { setProduct({ sku: '', name: '', kind: 'SIM_CARD', provider: '', variant: '', is_active: true, change_reason: '' }); setProductEditor(null); setProductDetail(null); }
    if (action === 'stock') { setAdjustment(a => ({ ...a, quantity_delta: '', reference: '', reason: '' })); setStockFormOpen(false); }
    if (action === 'sale') { setMonth(sale.business_date.slice(0, 7)); setSale(s => ({ ...s, quantity: '', unit_price: '', reference: '' })); setSaleFormOpen(false); }
    if (action === 'void') { setVoiding(null); setSaleDetail(null); setVoidReason(''); }
  } });
  const submit = (action: 'product' | 'product-update' | 'stock' | 'sale' | 'void') => (e: FormEvent) => { e.preventDefault(); if (mutation.isPending) return; setNotice(''); mutation.mutate(action); };
  const busy = mutation.isPending;
  const outletName = (id: string) => outlets.data?.data.find(o => o.id === id)?.name ?? 'Outlet tidak tersedia';
  const stockRows = stock.data?.data ?? [];
  const productRows = products.data?.data ?? [];
  const productProviders = useMemo(() => [...new Set(productRows.map(row => row.provider).filter((value): value is string => !!value))].sort(), [productRows]);
  const filteredProducts = useMemo(() => productRows.filter(row => {
    const q = productFilters.q.trim().toLocaleLowerCase('id-ID');
    return (!q || `${row.sku} ${row.name} ${row.provider ?? ''} ${row.variant ?? ''}`.toLocaleLowerCase('id-ID').includes(q))
      && (!productFilters.kind || row.kind === productFilters.kind)
      && (!productFilters.provider || row.provider === productFilters.provider)
      && (productFilters.status === 'all' || (productFilters.status === 'active' ? row.is_active : !row.is_active));
  }), [productFilters, productRows]);
  const productMetrics = useMemo(() => ({ active: productRows.filter(row => row.is_active).length, sim: productRows.filter(row => row.kind === 'SIM_CARD' && row.is_active).length, accessories: productRows.filter(row => row.kind === 'ACCESSORY' && row.is_active).length, inactive: productRows.filter(row => !row.is_active).length }), [productRows]);
  const movementRows = movements.data?.data ?? [];
  const stockMetrics = useMemo(() => ({
    units: stockRows.reduce((sum, row) => sum + row.quantity, 0),
    critical: stockRows.filter(row => row.quantity <= 5).length,
    incoming: movementRows.filter(row => row.quantity_delta > 0).reduce((sum, row) => sum + row.quantity_delta, 0),
    outgoing: Math.abs(movementRows.filter(row => row.quantity_delta < 0).reduce((sum, row) => sum + row.quantity_delta, 0)),
  }), [movementRows, stockRows]);
  const saleRows = sales.data?.data ?? [];
  const filteredSales = useMemo(() => saleRows.filter(row => {
    const query = saleFilters.q.trim().toLocaleLowerCase('id-ID');
    const matchesQuery = !query || `${row.product_name} ${row.outlet_name} ${row.source_reference}`.toLocaleLowerCase('id-ID').includes(query);
    const matchesStatus = saleFilters.status === 'all' || row.status === saleFilters.status;
    return matchesQuery && matchesStatus;
  }), [saleFilters, saleRows]);
  const saleMetrics = useMemo(() => {
    const posted = saleRows.filter(row => row.status === 'posted');
    return { total: posted.reduce((sum, row) => sum + Number(row.total_amount), 0), transactions: posted.length, units: posted.reduce((sum, row) => sum + row.quantity, 0), voided: saleRows.filter(row => row.status === 'voided').length };
  }, [saleRows]);
  const availableStock = stockRows.find(row => row.product_id === sale.product_id && row.outlet_id === sale.outlet_id)?.quantity;
  const quantity = Number(sale.quantity || 0);
  const projectedTotal = quantity * Number(sale.unit_price || 0);
  const insufficientStock = availableStock !== undefined && quantity > availableStock;
  const choices = (value: string, set: (value: string) => void, kind: 'product' | 'outlet', ref?: RefObject<HTMLSelectElement | null>) => <select ref={ref} required className={fieldClass} value={value} onChange={e => set(e.target.value)}><option value="">Pilih {kind === 'product' ? 'produk' : 'outlet'}</option>{kind === 'product' ? products.data?.data.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>) : outlets.data?.data.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>;
  const queries = [products, outlets, stock, movements, ...(can('view:cellular_sales') ? [sales] : [])];
  const pageCopy = tab === 'catalog'
    ? { descriptor: 'Produk · Master Katalog', title: 'Katalog Produk Cellular', description: 'Kelola kartu perdana, provider, kuota, dan aksesori sebagai master transaksi dan persediaan.' }
    : tab === 'stock'
      ? { descriptor: 'Persediaan · Stok & Mutasi', title: 'Stok dan Mutasi Cellular', description: 'Pantau saldo barang per outlet serta catat penerimaan, transfer, dan koreksi jumlah barang.' }
      : { descriptor: 'Transaksi · Penjualan Outlet', title: 'Penjualan Cellular', description: 'Catat dan telusuri penjualan manual kartu perdana serta aksesori per outlet dan periode.' };
  const openTab = (next: 'catalog' | 'stock' | 'sales') => {
    setVoiding(null); setVoidReason(''); setSaleFormOpen(false); setSaleDetail(null); setStockFormOpen(false); setMovementDetail(null); setProductEditor(null); setProductDetail(null); mutation.reset(); setNotice('');
    navigate(next === 'catalog' ? '/cellular/produk' : next === 'stock' ? '/cellular/persediaan' : '/cellular/penjualan');
  };
  if (!can('view:cellular')) return <p role="alert" className="p-6">Akses operasional Cellular tidak tersedia untuk akun ini.</p>;
  return <div className="min-w-0 space-y-6 pb-10">
    <DivisionPageHeader division="Divisi Cellular" descriptor={pageCopy.descriptor} title={pageCopy.title} description={pageCopy.description} actions={tab === 'catalog' && can('manage:cellular_catalog') ? <Button onClick={() => { setProduct({ sku: '', name: '', kind: 'SIM_CARD', provider: '', variant: '', is_active: true, change_reason: '' }); setProductEditor('new'); setProductDetail(null); mutation.reset(); }}><Plus className="h-4 w-4" />Tambah produk</Button> : undefined} />
    <nav className="flex flex-wrap gap-1 border-b border-line" aria-label="Bagian operasional Cellular">{(['catalog', 'stock', ...(can('view:cellular_sales') ? ['sales'] : [])] as const).map(t => <button key={t} type="button" disabled={busy} aria-pressed={tab === t} className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors ${tab === t ? 'border-primary-600 text-primary-700 dark:text-primary-300' : 'border-transparent text-subtle hover:text-navy'}`} onClick={() => openTab(t as typeof tab)}>{t === 'catalog' ? 'Katalog produk' : t === 'stock' ? 'Stok & mutasi' : 'Penjualan'}</button>)}</nav>
    {queries.some(q => q.isLoading) && <p role="status">Memuat data...</p>}
    {queries.filter(q => q.error).map((q, i) => <div key={i} role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{q.error?.message}<button type="button" className="ml-3 underline" onClick={() => void q.refetch()}>Coba lagi</button></div>)}
    {mutation.error && !saleFormOpen && !voiding && !productEditor && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{mutation.error.message}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
    {tab === 'catalog' && <>
      <KPICardGrid columns={4}>
        <KPICard size="sm" variant="gradient" label="Produk aktif" value={productMetrics.active.toLocaleString('id-ID')} note={`${productRows.length} SKU tercatat`} icon={<PackageCheck />} />
        <KPICard size="sm" label="Kartu perdana" value={productMetrics.sim.toLocaleString('id-ID')} note="Produk aktif berbasis provider" icon={<ShoppingBag />} />
        <KPICard size="sm" label="Aksesori" value={productMetrics.accessories.toLocaleString('id-ID')} note="Produk aktif non-kartu" icon={<Boxes />} />
        <KPICard size="sm" variant={productMetrics.inactive ? 'outlined' : 'default'} label="Nonaktif" value={productMetrics.inactive.toLocaleString('id-ID')} note="Histori transaksi tetap tersimpan" icon={<PackageX />} />
      </KPICardGrid>
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-semibold text-subtle xl:col-span-2">Cari produk<div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input aria-label="Cari produk" maxLength={100} className={`${fieldClass} mt-0 pl-9`} value={productFilters.q} onChange={e => setProductFilters({ ...productFilters, q: e.target.value })} placeholder="SKU, nama, provider, atau varian" /></div></label><Field label="Jenis"><select className={fieldClass} value={productFilters.kind} onChange={e => setProductFilters({ ...productFilters, kind: e.target.value })}><option value="">Semua jenis</option><option value="SIM_CARD">Kartu perdana</option><option value="ACCESSORY">Aksesori</option></select></Field><Field label="Provider"><select className={fieldClass} value={productFilters.provider} onChange={e => setProductFilters({ ...productFilters, provider: e.target.value })}><option value="">Semua provider</option>{productProviders.map(provider => <option key={provider}>{provider}</option>)}</select></Field><Field label="Status"><select className={fieldClass} value={productFilters.status} onChange={e => setProductFilters({ ...productFilters, status: e.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option><option value="all">Semua status</option></select></Field></div></section>
      <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">MASTER DATA</p><h2 className="mt-1 font-bold text-navy">Register produk dan paket</h2><p className="mt-1 text-xs text-subtle">{filteredProducts.length} dari {productRows.length} produk · perubahan master memakai versi dan alasan.</p></div><span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-200">Sumber transaksi & persediaan</span></div>{filteredProducts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm [&_td]:px-4 [&_th]:px-4 [&_th]:py-3"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th>Produk</th><th>Jenis & provider</th><th>Varian / paket</th><th className="text-right">Stok</th><th>Status</th><th className="text-right">Tindakan</th></tr></thead><tbody className="divide-y divide-line">{filteredProducts.map(row => <tr key={row.id} className="transition-colors hover:bg-surface/60"><td className="py-4"><strong className="text-navy">{row.name}</strong><p className="mt-1 font-mono text-xs text-subtle">{row.sku}</p></td><td><p className="font-medium text-navy">{row.kind === 'SIM_CARD' ? 'Kartu perdana' : 'Aksesori'}</p><p className="mt-1 text-xs text-subtle">{row.provider || 'Tanpa provider'}</p></td><td className="text-navy">{row.variant || '—'}</td><td className="text-right"><strong className="text-base tabular-nums text-navy">{Number(row.stock_quantity).toLocaleString('id-ID')}</strong><p className="text-xs text-subtle">{Number(row.stock_locations).toLocaleString('id-ID')} outlet</p></td><td><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${row.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{row.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td className="text-right"><button type="button" aria-label={`Buka produk ${row.sku}`} className="inline-flex min-h-10 items-center gap-2 font-semibold text-primary-700 underline dark:text-primary-300" onClick={() => { setProductDetail(row); setProductEditor(null); }}><Eye className="h-4 w-4" />Buka</button></td></tr>)}</tbody></table></div> : <div className="p-8"><EmptyState title="Produk tidak ditemukan" description="Ubah filter atau tambahkan produk baru jika katalog memang belum tersedia." /></div>}</section>
      <DetailSheet isOpen={!!productDetail} onClose={() => setProductDetail(null)} title={productDetail?.name ?? 'Detail produk'} subtitle={productDetail ? `${productDetail.sku} · Versi ${productDetail.version}` : undefined} icon={ShoppingBag} badge={productDetail ? { text: productDetail.is_active ? 'Aktif' : 'Nonaktif', variant: productDetail.is_active ? 'success' : 'neutral' } : undefined} size="lg" footer={productDetail && <div className="flex justify-end gap-2">{can('manage:cellular_catalog') && <Button onClick={() => { setProduct({ sku: productDetail.sku, name: productDetail.name, kind: productDetail.kind, provider: productDetail.provider ?? '', variant: productDetail.variant ?? '', is_active: productDetail.is_active, change_reason: '' }); setProductEditor(productDetail); setProductDetail(null); mutation.reset(); }}>Ubah produk</Button>}<Button variant="secondary" onClick={() => setProductDetail(null)}>Tutup</Button></div>}><dl className="grid gap-4 sm:grid-cols-2"><SaleInfo label="Jenis" value={productDetail?.kind === 'SIM_CARD' ? 'Kartu perdana' : 'Aksesori'} /><SaleInfo label="Provider" value={productDetail?.provider || 'Tanpa provider'} /><SaleInfo label="Varian / paket" value={productDetail?.variant || 'Tidak diisi'} /><SaleInfo label="Stok seluruh outlet" value={`${Number(productDetail?.stock_quantity ?? 0).toLocaleString('id-ID')} unit`} /><SaleInfo label="Lokasi stok" value={`${Number(productDetail?.stock_locations ?? 0).toLocaleString('id-ID')} outlet`} /><SaleInfo label="Terakhir diperbarui" value={formatDateTime(productDetail?.updated_at)} /></dl><div className="mt-5 rounded-card border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">Produk yang pernah dipakai transaksi tidak dihapus. Status nonaktif menghentikan pemakaian baru dan histori tetap dapat ditelusuri.</div></DetailSheet>
      <DetailSheet isOpen={!!productEditor} onClose={() => { if (!busy) setProductEditor(null); }} title={productEditor === 'new' ? 'Tambah produk' : 'Ubah produk'} subtitle="Master ini digunakan oleh penjualan, persediaan, dan laporan Cellular." icon={ShoppingBag} size="lg"><fieldset disabled={busy}><form aria-label={productEditor === 'new' ? 'Tambah produk' : 'Ubah produk'} onSubmit={submit(productEditor === 'new' ? 'product' : 'product-update')} className="space-y-5"><section className="grid gap-4 rounded-card border border-line p-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">1. IDENTITAS PRODUK</p><h3 className="mt-1 font-bold text-navy">Kode dan nama transaksi</h3></div><Field label="SKU"><input required autoFocus maxLength={50} pattern="[A-Za-z0-9_-]+" className={fieldClass} value={product.sku} onChange={e => setProduct({ ...product, sku: e.target.value })} /></Field><Field label="Nama produk"><input required maxLength={255} className={fieldClass} value={product.name} onChange={e => setProduct({ ...product, name: e.target.value })} /></Field></section><section className="grid gap-4 rounded-card border border-line p-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">2. KLASIFIKASI</p><h3 className="mt-1 font-bold text-navy">Jenis, provider, dan varian</h3></div><Field label="Jenis"><select className={fieldClass} value={product.kind} onChange={e => setProduct({ ...product, kind: e.target.value })}><option value="SIM_CARD">Kartu perdana</option><option value="ACCESSORY">Aksesori</option></select></Field><Field label="Provider (opsional)"><input maxLength={100} className={fieldClass} value={product.provider} onChange={e => setProduct({ ...product, provider: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Varian / kuota (opsional)"><input maxLength={255} className={fieldClass} value={product.variant} onChange={e => setProduct({ ...product, variant: e.target.value })} placeholder="Contoh: 25 GB / 30 hari" /></Field></div></section>{productEditor !== 'new' && <section className="space-y-4 rounded-card border border-line p-4"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">3. KONTROL PERUBAHAN</p><h3 className="mt-1 font-bold text-navy">Status dan alasan</h3></div><label className="flex items-start gap-3 rounded-input bg-surface p-4"><input type="checkbox" className="mt-1" checked={product.is_active} onChange={e => setProduct({ ...product, is_active: e.target.checked })} /><span><strong className="block text-sm text-navy">Produk aktif</strong><span className="mt-1 block text-xs leading-5 text-subtle">Produk nonaktif tidak dapat dipakai pada transaksi baru. Produk dengan stok positif tidak dapat dinonaktifkan.</span></span></label><Field label="Alasan perubahan"><textarea required minLength={10} maxLength={1000} className={`${fieldClass} min-h-28`} value={product.change_reason} onChange={e => setProduct({ ...product, change_reason: e.target.value })} /></Field><p className="text-xs text-subtle">Minimal 10 karakter · tersimpan dalam audit trail.</p></section>}{mutation.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">{mutation.error.message}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => setProductEditor(null)}>Batal</Button><Button type="submit" disabled={busy || (productEditor !== 'new' && product.change_reason.trim().length < 10)}>{busy ? 'Menyimpan...' : productEditor === 'new' ? 'Simpan produk' : 'Simpan perubahan'}</Button></div></form></fieldset></DetailSheet>
    </>}
    {tab === 'stock' && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Kontrol kuantitas</p><h2 className="mt-1 text-xl font-bold text-navy">Buku Persediaan</h2><p className="mt-1 text-sm text-subtle">Telusuri setiap perubahan saldo ke transaksi atau bukti sumbernya.</p></div>{can('write:cellular_stock') && <Button onClick={() => setStockFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Catat mutasi</Button>}</div>
      <KPICardGrid columns={4}>
        <KPICard variant="gradient" label="Saldo unit" value={stockMetrics.units.toLocaleString('id-ID')} note={`${stockRows.length} kombinasi produk dan outlet`} icon={<Boxes />} />
        <KPICard variant={stockMetrics.critical ? 'outlined' : 'default'} label="Stok kritis" value={stockMetrics.critical.toLocaleString('id-ID')} note="Saldo lima unit atau kurang; batas sementara" icon={<PackageX />} />
        <KPICard label="Barang masuk" value={stockMetrics.incoming.toLocaleString('id-ID')} note={`Periode ${movementFilters.month || 'seluruh data'}`} icon={<ArrowDownToLine />} />
        <KPICard label="Barang keluar" value={stockMetrics.outgoing.toLocaleString('id-ID')} note={`Periode ${movementFilters.month || 'seluruh data'}`} icon={<ArrowUpFromLine />} />
      </KPICardGrid>
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"><label className="text-xs font-semibold text-subtle xl:col-span-2">Cari bukti atau produk<div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input aria-label="Cari bukti atau produk" maxLength={100} className={`${fieldClass} mt-0 pl-9`} value={movementFilters.q} onChange={e => setMovementFilters({ ...movementFilters, q: e.target.value })} placeholder="SKU, nama, referensi, alasan" /></div></label><Field label="Periode posting"><input type="month" className={fieldClass} value={movementFilters.month} onChange={e => setMovementFilters({ ...movementFilters, month: e.target.value })} /></Field><Field label="Outlet"><select className={fieldClass} value={movementFilters.outlet_id} onChange={e => setMovementFilters({ ...movementFilters, outlet_id: e.target.value })}><option value="">Semua outlet</option>{outlets.data?.data.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field><Field label="Sumber"><select className={fieldClass} value={movementFilters.kind} onChange={e => setMovementFilters({ ...movementFilters, kind: e.target.value })}><option value="">Semua sumber</option><option value="ADJUSTMENT">Mutasi manual</option><option value="SALE">Penjualan</option><option value="VOID">Pembatalan</option></select></Field><Field label="Arah"><select className={fieldClass} value={movementFilters.direction} onChange={e => setMovementFilters({ ...movementFilters, direction: e.target.value })}><option value="">Masuk dan keluar</option><option value="IN">Barang masuk</option><option value="OUT">Barang keluar</option></select></Field></div><div className="mt-3 flex justify-end"><button type="button" className="text-xs font-semibold text-primary-700 underline dark:text-primary-300" onClick={() => setMovementFilters({ month: today().slice(0, 7), outlet_id: '', product_id: '', kind: '', direction: '', q: '' })}>Reset filter</button></div></section>
      <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5"><div><h2 className="font-bold text-navy">Register mutasi</h2><p className="mt-1 text-xs text-subtle">{movementRows.length} transaksi ditemukan · maksimal 250 transaksi per pencarian</p></div><span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-200">Jejak sumber aktif</span></div>{movementRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Waktu posting</th><th>Produk</th><th>Outlet</th><th>Sumber & bukti</th><th className="text-right">Perubahan</th><th className="text-right">Saldo</th><th className="px-5 text-right">Detail</th></tr></thead><tbody className="divide-y divide-line">{movementRows.map(row => <tr key={row.id} className="transition-colors hover:bg-surface"><td className="px-5 py-4 text-subtle">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(row.created_at))}</td><td><strong className="text-navy">{row.sku}</strong><p className="text-xs text-subtle">{row.name}</p></td><td>{outletName(row.outlet_id)}</td><td><span className="rounded-pill border border-line bg-surface px-2 py-1 text-xs font-semibold text-navy">{row.source_document_type ?? 'Bukti sumber'}</span><p className="mt-2 font-medium text-navy">{row.reference ?? '—'}</p></td><td className={`text-right text-base font-bold tabular-nums ${row.quantity_delta > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{row.quantity_delta > 0 ? '+' : ''}{row.quantity_delta.toLocaleString('id-ID')}</td><td className="text-right font-bold tabular-nums text-navy">{row.quantity_after.toLocaleString('id-ID')}</td><td className="px-5 text-right"><button type="button" aria-label={`Lihat mutasi ${row.reference ?? row.id}`} className="inline-flex min-h-10 items-center gap-2 font-semibold text-primary-700 underline dark:text-primary-300" onClick={() => setMovementDetail(row)}><Eye className="h-4 w-4" />Lihat</button></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="Mutasi tidak ditemukan" description="Ubah filter atau catat mutasi persediaan pertama untuk periode ini." /></div>}</section>
      <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="border-b border-line p-5"><h2 className="font-bold text-navy">Posisi stok saat ini</h2><p className="mt-1 text-xs text-subtle">Saldo aktual per produk dan outlet. HPP belum dihitung karena metode valuasi belum ditetapkan.</p></div>{stockRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Produk</th><th>Outlet</th><th className="text-right">Saldo</th><th className="px-5">Kondisi</th></tr></thead><tbody className="divide-y divide-line">{stockRows.map(row => <tr key={row.id}><td className="px-5 py-4"><strong className="text-navy">{row.sku}</strong><p className="text-xs text-subtle">{row.name}</p></td><td>{outletName(row.outlet_id)}</td><td className="text-right text-lg font-bold tabular-nums text-navy">{row.quantity.toLocaleString('id-ID')}</td><td className="px-5">{row.quantity <= 5 ? <span className="font-semibold text-red-700 dark:text-red-300">Perlu tindak lanjut</span> : <span className="font-semibold text-emerald-700 dark:text-emerald-300">Tersedia</span>}</td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="Belum ada saldo" description="Saldo terbentuk dari penerimaan, koreksi, atau penjualan yang telah dicatat." /></div>}</section>
      <DetailSheet
        isOpen={stockFormOpen && can('write:cellular_stock')}
        onClose={() => { if (!busy) setStockFormOpen(false); }}
        title="Catat mutasi manual"
        subtitle="Gunakan untuk penerimaan, transfer, atau koreksi dengan bukti yang dapat ditelusuri."
        icon={Boxes}
        size="xl"
        initialFocusRef={stockProductRef}
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => setStockFormOpen(false)}>Batal</Button><Button type="submit" form="cellular-stock-movement-form" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan mutasi'}</Button></div>}
      >
        <fieldset disabled={busy}>
          <form id="cellular-stock-movement-form" aria-label="Catat mutasi stok" onSubmit={submit('stock')} className="space-y-5">
            <section className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2">
              <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">1. KONTEKS PERSEDIAAN</p><h3 className="mt-1 font-bold text-navy">Produk dan lokasi saldo</h3><p className="mt-1 text-xs text-subtle">Pilih saldo produk dan outlet yang akan dikoreksi.</p></div>
              <Field label="Produk">{choices(adjustment.product_id, v => setAdjustment({ ...adjustment, product_id: v }), 'product', stockProductRef)}</Field>
              <Field label="Outlet">{choices(adjustment.outlet_id, v => setAdjustment({ ...adjustment, outlet_id: v }), 'outlet')}</Field>
              <Field label="Perubahan jumlah (+ masuk, − keluar)"><input required type="number" min={-1000000} max={1000000} step={1} className={fieldClass} value={adjustment.quantity_delta} onChange={e => setAdjustment({ ...adjustment, quantity_delta: e.target.value })} /></Field>
            </section>
            <section className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2">
              <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">2. BUKTI DAN ALASAN</p><h3 className="mt-1 font-bold text-navy">Sumber perubahan saldo</h3><p className="mt-1 text-xs text-subtle">Referensi dan alasan menjadi jejak pemeriksaan transaksi.</p></div>
              <Field label="Nomor bukti / referensi"><input required maxLength={255} className={fieldClass} value={adjustment.reference} onChange={e => setAdjustment({ ...adjustment, reference: e.target.value })} placeholder="Surat jalan, BA, atau nomor transfer" /></Field>
              <div className="md:col-span-2"><Field label="Alasan mutasi"><textarea required minLength={10} maxLength={2000} rows={4} className={fieldClass} value={adjustment.reason} onChange={e => setAdjustment({ ...adjustment, reason: e.target.value })} /></Field></div>
            </section>
            <section className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong className="block">Kontrol posting</strong><span className="mt-1 block">Referensi harus unik untuk produk dan outlet yang sama. Sistem menolak stok negatif dan mencatat pelaku pada audit trail.</span></section>
            {mutation.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">{mutation.error.message}</p>}
          </form>
        </fieldset>
      </DetailSheet>
      <DetailSheet
        isOpen={!!movementDetail}
        onClose={() => setMovementDetail(null)}
        title="Detail mutasi persediaan"
        subtitle={movementDetail ? `${movementDetail.reference ?? movementDetail.id} · ${movementDetail.source_document_type ?? 'Bukti sumber'}` : undefined}
        icon={FileText}
        badge={movementDetail ? { text: movementDetail.quantity_delta > 0 ? 'Barang masuk' : 'Barang keluar', variant: movementDetail.quantity_delta > 0 ? 'success' : 'warning' } : undefined}
        size="lg"
        footer={<div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setMovementDetail(null)}>Tutup</Button></div>}
      >
        {movementDetail && <><dl className="grid gap-4 text-sm sm:grid-cols-2"><SaleInfo label="Produk" value={`${movementDetail.sku} · ${movementDetail.name}`} /><SaleInfo label="Outlet" value={outletName(movementDetail.outlet_id)} /><SaleInfo label="Perubahan" value={`${movementDetail.quantity_delta > 0 ? '+' : ''}${movementDetail.quantity_delta.toLocaleString('id-ID')} unit`} /><SaleInfo label="Saldo sesudah" value={`${movementDetail.quantity_after.toLocaleString('id-ID')} unit`} /><SaleInfo label="Waktu posting" value={formatDateTime(movementDetail.created_at)} /><SaleInfo label="Dokumen sumber" value={movementDetail.source_document_id ? 'Dokumen internal terhubung' : 'Bukti eksternal'} /><div className="sm:col-span-2"><SaleInfo label="Alasan" value={movementDetail.reason ?? 'Tidak tersedia'} /></div></dl><section className="mt-5 rounded-card border border-line bg-surface p-4 text-sm leading-6 text-navy"><p className="text-xs font-bold uppercase tracking-wider text-subtle">JEJAK AUDIT</p><p className="mt-2">Identitas pelaku dan dokumen sumber tersimpan pada audit trail. Identifier internal tidak ditampilkan pada layar operasional.</p></section></>}
      </DetailSheet>
    </>}
    {tab === 'sales' && can('view:cellular_sales') && <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Register transaksi</p><h2 className="mt-1 text-xl font-bold text-navy">Penjualan outlet</h2><p className="mt-1 text-sm text-subtle">Pencatatan mengurangi stok secara atomik. Pembatalan mengembalikan unit dan menyimpan alasan audit.</p></div>
        {can('write:cellular_sale') && <Button onClick={() => { setSaleFormOpen(true); setSaleDetail(null); mutation.reset(); }}><Plus className="h-4 w-4" />Catat penjualan</Button>}
      </div>
      <KPICardGrid columns={4}>
        <KPICard size="sm" variant="gradient" label="Penjualan posted" value={money(saleMetrics.total)} note={`${saleMetrics.transactions} transaksi aktif`} icon={<CircleDollarSign />} />
        <KPICard size="sm" label="Unit terjual" value={saleMetrics.units.toLocaleString('id-ID')} note={`Periode ${month}`} icon={<ShoppingBag />} />
        <KPICard size="sm" label="Transaksi aktif" value={saleMetrics.transactions.toLocaleString('id-ID')} note="Membentuk omzet dan closing" icon={<FileText />} />
        <KPICard size="sm" variant={saleMetrics.voided ? 'outlined' : 'default'} label="Dibatalkan" value={saleMetrics.voided.toLocaleString('id-ID')} note="Unit dikembalikan ke stok" icon={<Ban />} />
      </KPICardGrid>
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-bold text-navy">Periode pencatatan</h2><p className="mt-1 text-xs text-subtle">Data berasal dari database dan dibatasi maksimal 100 transaksi terbaru.</p></div><Field label="Bulan laporan"><input required type="month" disabled={busy} className={`${fieldClass} mt-1 min-w-56`} value={month} onChange={e => { setMonth(e.target.value); setVoiding(null); setSaleDetail(null); setVoidReason(''); setNotice(''); mutation.reset(); }} /></Field></div></section>
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
          <Field label="Cari transaksi">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input aria-label="Cari transaksi penjualan" className={`${fieldClass} pl-9`} placeholder="Produk, outlet, atau referensi" value={saleFilters.q} onChange={event => setSaleFilters(current => ({ ...current, q: event.target.value }))} />
            </div>
          </Field>
          <Field label="Status transaksi">
            <select aria-label="Status penjualan" className={fieldClass} value={saleFilters.status} onChange={event => setSaleFilters(current => ({ ...current, status: event.target.value }))}>
              <option value="all">Semua status</option>
              <option value="posted">Posted</option>
              <option value="voided">Dibatalkan</option>
            </select>
          </Field>
        </div>
      </section>
      <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="flex items-center justify-between border-b border-line p-5"><div><h2 className="font-bold text-navy">Register penjualan</h2><p className="mt-1 text-xs text-subtle">Klik transaksi untuk memeriksa sumber, pelaku, dampak stok, dan status.</p></div><span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-200">{filteredSales.length} dari {saleRows.length} transaksi</span></div>{filteredSales.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Tanggal & outlet</th><th className="px-3 py-3">Produk</th><th className="px-3 py-3">Referensi</th><th className="px-3 py-3 text-right">Unit</th><th className="px-3 py-3 text-right">Harga satuan</th><th className="px-3 py-3 text-right">Total</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Detail</th></tr></thead><tbody className="divide-y divide-line">{filteredSales.map(row => <tr key={row.id} className="hover:bg-surface/60"><td className="px-5 py-4"><p className="font-semibold text-navy">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${row.business_date}T00:00:00+07:00`))}</p><p className="mt-1 text-xs text-subtle">{row.outlet_name}</p></td><td className="px-3 py-4 font-medium text-navy">{row.product_name}</td><td className="max-w-48 truncate px-3 py-4 text-subtle">{row.source_reference}</td><td className="px-3 py-4 text-right font-semibold tabular-nums text-navy">{row.quantity.toLocaleString('id-ID')}</td><td className="px-3 py-4 text-right tabular-nums text-navy">{money(row.unit_price)}</td><td className="px-3 py-4 text-right font-bold tabular-nums text-navy">{money(row.total_amount)}</td><td className="px-3 py-4"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${row.status === 'posted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>{row.status === 'posted' ? 'Posted' : 'Dibatalkan'}</span></td><td className="px-5 py-4 text-right"><button type="button" className="inline-flex min-h-10 items-center gap-2 font-semibold text-primary-700 underline dark:text-primary-300" onClick={() => setSaleDetail(row)}><Eye className="h-4 w-4" />Buka</button></td></tr>)}</tbody></table></div> : <div className="p-8"><EmptyState title="Penjualan tidak ditemukan" description="Ubah kata pencarian, status, atau periode untuk melihat transaksi lain." /></div>}</section>
      <DetailSheet
        isOpen={saleFormOpen && can('write:cellular_sale')}
        onClose={() => { if (!busy) setSaleFormOpen(false); }}
        title="Catat penjualan outlet"
        subtitle="Lengkapi konteks transaksi, nilai penjualan, dan referensi laporan sebelum posting."
        icon={CircleDollarSign}
        size="2xl"
        initialFocusRef={saleOutletRef}
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => setSaleFormOpen(false)}>Batal</Button><Button type="submit" form="cellular-sale-form" disabled={busy || insufficientStock}>{busy ? 'Memposting...' : 'Posting penjualan'}</Button></div>}
      >
        <fieldset disabled={busy}>
          <form id="cellular-sale-form" aria-label="Catat penjualan" onSubmit={submit('sale')} className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-5">
              <section className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2">
                <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">1. KONTEKS TRANSAKSI</p><h3 className="mt-1 font-bold text-navy">Outlet dan periode laporan</h3><p className="mt-1 text-xs text-subtle">Outlet dan tanggal menentukan saldo stok serta periode laporan.</p></div>
                <Field label="Outlet">{choices(sale.outlet_id, value => setSale({ ...sale, outlet_id: value }), 'outlet', saleOutletRef)}</Field>
                <Field label="Tanggal penjualan"><input required type="date" max={today()} className={fieldClass} value={sale.business_date} onChange={e => setSale({ ...sale, business_date: e.target.value })} /></Field>
              </section>
              <section className="grid gap-4 rounded-card border border-line p-4 md:grid-cols-2">
                <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">2. PRODUK DAN NILAI</p><h3 className="mt-1 font-bold text-navy">Barang, jumlah, dan harga</h3><p className="mt-1 text-xs text-subtle">Sistem memeriksa saldo outlet sebelum transaksi diposting.</p></div>
                <Field label="Produk">{choices(sale.product_id, value => setSale({ ...sale, product_id: value }), 'product')}</Field>
                <Field label="Jumlah terjual"><input required type="number" min={1} max={1000000} step={1} className={fieldClass} value={sale.quantity} onChange={e => setSale({ ...sale, quantity: e.target.value })} /></Field>
                <Field label="Harga per unit (Rp)"><input required inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,2})?" className={fieldClass} value={sale.unit_price} onChange={e => setSale({ ...sale, unit_price: e.target.value })} /></Field>
                <Field label="Referensi laporan manual"><input required maxLength={255} className={fieldClass} placeholder="Contoh: SALES-T3-20261011-01" value={sale.reference} onChange={e => setSale({ ...sale, reference: e.target.value })} /></Field>
              </section>
            </div>
            <aside className="space-y-4">
              <section className="rounded-card border border-line bg-surface p-5"><h3 className="font-bold text-navy">Ringkasan posting</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-subtle">Stok tersedia</dt><dd className={`text-right font-bold ${insufficientStock ? 'text-danger' : 'text-navy'}`}>{availableStock === undefined ? 'Pilih produk & outlet' : `${availableStock.toLocaleString('id-ID')} unit`}</dd></div><div className="flex justify-between gap-4"><dt className="text-subtle">Jumlah terjual</dt><dd className="font-bold text-navy">{quantity.toLocaleString('id-ID')} unit</dd></div><div className="flex justify-between gap-4 border-t border-line pt-3"><dt className="font-semibold text-navy">Total transaksi</dt><dd className="text-right text-lg font-bold text-primary-700 dark:text-primary-300">{money(projectedTotal)}</dd></div></dl>{insufficientStock && <p role="alert" className="mt-4 rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">Jumlah penjualan melebihi stok tersedia.</p>}</section>
              <section className="rounded-card border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><strong className="block text-sm">Dampak posting</strong><span className="mt-1 block">Stok outlet berkurang dan transaksi masuk ke omzet serta closing H+1. Referensi yang sama tidak dapat digunakan dua kali.</span></section>
            </aside>
            {mutation.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger lg:col-span-2">{mutation.error.message}</p>}
          </form>
        </fieldset>
      </DetailSheet>
      <DetailSheet
        isOpen={!!saleDetail}
        onClose={() => { if (!voiding) setSaleDetail(null); }}
        title="Detail penjualan Cellular"
        subtitle={saleDetail ? `${saleDetail.source_reference} · ${saleDetail.outlet_name} · ${saleDetail.business_date}` : undefined}
        icon={FileText}
        badge={saleDetail ? { text: saleDetail.status === 'posted' ? 'Posted' : 'Dibatalkan', variant: saleDetail.status === 'posted' ? 'success' : 'danger' } : undefined}
        size="xl"
        footer={saleDetail && <div className="flex flex-wrap justify-end gap-2">{can('void:cellular_sale') && saleDetail.status === 'posted' && <Button variant="danger" onClick={() => { setVoiding(saleDetail); setVoidReason(''); mutation.reset(); }}>Batalkan transaksi</Button>}<Button variant="secondary" onClick={() => setSaleDetail(null)}>Tutup</Button></div>}
      >
        {saleDetail && <><dl className="grid gap-4 sm:grid-cols-2"><SaleInfo label="Produk" value={saleDetail.product_name} /><SaleInfo label="Jumlah" value={`${saleDetail.quantity.toLocaleString('id-ID')} unit`} /><SaleInfo label="Harga satuan" value={money(saleDetail.unit_price)} /><SaleInfo label="Total" value={money(saleDetail.total_amount)} /><SaleInfo label="Dicatat oleh" value={saleDetail.created_by_name ?? 'Pengguna Cellular'} /><SaleInfo label="Waktu posting" value={formatDateTime(saleDetail.created_at)} />{saleDetail.status === 'voided' && <><SaleInfo label="Dibatalkan oleh" value={saleDetail.voided_by_name ?? 'Manager Cellular'} /><SaleInfo label="Waktu pembatalan" value={formatDateTime(saleDetail.updated_at)} /><div className="sm:col-span-2"><SaleInfo label="Alasan pembatalan" value={saleDetail.void_reason ?? 'Tidak tersedia'} /></div></>}</dl><section className="mt-5 rounded-card border border-line bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wider text-subtle">KONTROL TRANSAKSI</p><p className="mt-2 text-sm leading-6 text-navy">{saleDetail.status === 'posted' ? 'Transaksi aktif memengaruhi stok outlet, omzet, dan closing H+1.' : 'Transaksi telah dibatalkan. Stok telah dikembalikan dan alasan koreksi tersimpan pada histori.'}</p></section></>}
      </DetailSheet>
      <DetailSheet
        isOpen={!!voiding}
        onClose={() => { if (!busy) { setVoiding(null); setVoidReason(''); mutation.reset(); } }}
        title="Batalkan penjualan"
        subtitle={voiding ? `${voiding.source_reference} · koreksi terbatas untuk Manager` : undefined}
        icon={Ban}
        badge={{ text: 'Koreksi transaksi', variant: 'danger' }}
        size="lg"
        initialFocusRef={voidReasonRef}
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={busy} onClick={() => { setVoiding(null); setVoidReason(''); mutation.reset(); }}>Batal</Button><Button type="submit" form="cellular-sale-void-form" variant="danger" disabled={busy || voidReason.trim().length < 10}>{busy ? 'Memproses...' : 'Konfirmasi pembatalan'}</Button></div>}
      >
        {voiding && <fieldset disabled={busy}><form id="cellular-sale-void-form" aria-label="Batalkan penjualan" onSubmit={submit('void')} className="space-y-5"><section className="rounded-card border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><strong className="block">Dampak pembatalan</strong><span className="mt-1 block">{voiding.quantity.toLocaleString('id-ID')} unit {voiding.product_name} akan dikembalikan ke stok {voiding.outlet_name}. Tindakan ini mengoreksi pencatatan dan tidak mencatat pengembalian uang.</span></section><section className="rounded-card border border-line p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">ALASAN DAN AUDIT</p><div className="mt-3"><Field label="Alasan pembatalan"><textarea ref={voidReasonRef} required minLength={10} maxLength={2000} className={`${fieldClass} min-h-32 py-3`} value={voidReason} onChange={e => setVoidReason(e.target.value)} /></Field><p className="mt-1 text-xs text-subtle">Minimal 10 karakter · {voidReason.trim().length}/2000. Alasan disimpan dalam audit trail.</p></div></section>{mutation.error && <p role="alert" className="rounded-input bg-danger-light p-3 text-sm font-semibold text-danger">{mutation.error.message}</p>}</form></fieldset>}
      </DetailSheet>
    </>}
  </div>;
}
