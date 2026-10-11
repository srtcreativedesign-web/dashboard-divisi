import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Package,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState, LoadingState } from '../../../components/states';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { cellularApi, type DailyClosing, type Movement, type Stock } from '../api';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const integer = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const shortDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${value.slice(0, 10)}T00:00:00+07:00`));
const monthLabel = (value: string) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00+07:00`));

function roleWorkspace(role: string) {
  if (role === 'ADMIN') return { title: 'Meja Admin Outlet', description: 'Catat penjualan manual dan pastikan referensi transaksi harian lengkap.', action: 'Catat penjualan', path: '/cellular/penjualan', icon: ReceiptText };
  if (role === 'ADMIN_GUDANG') return { title: 'Meja Admin Gudang', description: 'Periksa stok kritis lalu catat penerimaan atau koreksi barang.', action: 'Catat mutasi stok', path: '/cellular/persediaan', icon: PackagePlus };
  if (role === 'MANAGER') return { title: 'Meja Manager', description: 'Tinjau penerimaan, stok kritis, pengecualian, dan kesiapan tutup periode.', action: 'Buka antrean kerja', path: '/cellular/pekerjaan', icon: TrendingUp };
  if (role === 'ACCOUNTING') return { title: 'Meja Accounting', description: 'Periksa penerimaan, settlement, pengecualian, dan kesiapan sumber periode.', action: 'Buka kontrol Accounting', path: '/cellular/pembukuan', icon: ReceiptText };
  if (role === 'FINANCE') return { title: 'Meja Finance', description: 'Catat dana masuk dan pantau sisa settlement tiap kanal pembayaran.', action: 'Buka settlement kanal', path: '/cellular/tagihan', icon: ReceiptText };
  return { title: 'Ringkasan Operasional', description: 'Pantau kondisi outlet, katalog, serta persediaan Cellular.', action: 'Buka katalog', path: '/cellular/produk', icon: ShoppingBag };
}

function movementLabel(movement: Movement) {
  if (movement.kind === 'SALE') return 'Penjualan';
  if (movement.kind === 'VOID') return 'Pembatalan';
  return movement.quantity_delta > 0 ? 'Barang masuk' : 'Koreksi stok';
}

const closingStatus: Record<DailyClosing['status'], string> = { draft: 'Draf', submitted: 'Menunggu Accounting', validated: 'Menunggu Manager', approved: 'Disetujui', correction: 'Perlu Koreksi' };

function actionableClosings(role: string, rows: DailyClosing[]) {
  if (role === 'ADMIN') return rows.filter(row => row.status === 'draft' || row.status === 'correction');
  if (role === 'ACCOUNTING') return rows.filter(row => row.status === 'submitted');
  if (role === 'MANAGER') return rows.filter(row => row.status === 'validated');
  if (role === 'FINANCE') return rows.filter(row => row.status === 'approved' && Number(row.difference) !== 0);
  return [];
}

function roleAction(role: string) {
  if (role === 'ADMIN') return 'Lengkapi atau ajukan';
  if (role === 'ACCOUNTING') return 'Validasi penerimaan';
  if (role === 'MANAGER') return 'Berikan keputusan';
  if (role === 'FINANCE') return 'Tinjau selisih settlement';
  return 'Pantau penerimaan';
}

export default function CellularDashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(today().slice(0, 7));
  const can = (capability: string) => !!user && hasCapability(user.role, capability, user.divisionCode);
  const canSeeSales = can('view:cellular_sales');
  const canSeeClosings = can('view:cellular_daily');
  const products = useQuery({ queryKey: ['cellular', 'products'], queryFn: cellularApi.products });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets });
  const stock = useQuery({ queryKey: ['cellular', 'stock'], queryFn: cellularApi.stock });
  const movements = useQuery({ queryKey: ['cellular', 'movements'], queryFn: cellularApi.movements });
  const sales = useQuery({ queryKey: ['cellular', 'sales', month], queryFn: () => cellularApi.sales(month), enabled: canSeeSales && /^\d{4}-\d{2}$/.test(month) });
  const closings = useQuery({ queryKey: ['cellular', 'daily-closings', month], queryFn: () => cellularApi.dailyClosings(month), enabled: canSeeClosings && /^\d{4}-\d{2}$/.test(month) });
  const required = [products, outlets, stock, movements, ...(canSeeSales ? [sales] : []), ...(canSeeClosings ? [closings] : [])];
  const failed = required.find(query => query.error);

  const metrics = useMemo(() => {
    const productRows = products.data?.data ?? [];
    const stockRows = stock.data?.data ?? [];
    const saleRows = sales.data?.data ?? [];
    const closingRows = closings.data?.data ?? [];
    const posted = saleRows.filter(sale => sale.status === 'posted');
    const lowStock = stockRows.filter(item => item.quantity <= 5);
    return {
      productRows,
      stockRows,
      saleRows,
      posted,
      closingRows,
      lowStock,
      totalStock: stockRows.reduce((total, item) => total + item.quantity, 0),
      revenue: posted.reduce((total, sale) => total + Number(sale.total_amount), 0),
      unitsSold: posted.reduce((total, sale) => total + sale.quantity, 0),
      simCards: productRows.filter(product => product.kind === 'SIM_CARD').length,
      accessories: productRows.filter(product => product.kind === 'ACCESSORY').length,
      voided: saleRows.filter(sale => sale.status === 'voided').length,
    };
  }, [closings.data, products.data, sales.data, stock.data]);

  const dailySales = useMemo(() => {
    const grouped = new Map<string, { date: string; omzet: number; unit: number }>();
    metrics.posted.forEach(sale => {
      const current = grouped.get(sale.business_date) ?? { date: sale.business_date, omzet: 0, unit: 0 };
      current.omzet += Number(sale.total_amount);
      current.unit += sale.quantity;
      grouped.set(sale.business_date, current);
    });
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics.posted]);

  const outletPerformance = useMemo(() => {
    const names = new Map((outlets.data?.data ?? []).map(outlet => [outlet.id, outlet.name]));
    const grouped = new Map<string, { id: string; name: string; revenue: number; units: number }>();
    metrics.posted.forEach(sale => {
      const current = grouped.get(sale.outlet_id) ?? { id: sale.outlet_id, name: names.get(sale.outlet_id) ?? sale.outlet_name, revenue: 0, units: 0 };
      current.revenue += Number(sale.total_amount);
      current.units += sale.quantity;
      grouped.set(sale.outlet_id, current);
    });
    return [...grouped.values()].sort((a, b) => b.revenue - a.revenue);
  }, [metrics.posted, outlets.data]);

  if (required.some(query => query.isLoading)) return <LoadingState label="Menyiapkan pusat kendali Cellular..." />;
  if (failed) return <ErrorState title="Dashboard Cellular gagal dimuat" description={failed.error?.message ?? 'Data operasional tidak tersedia.'} onRetry={() => required.forEach(query => void query.refetch())} />;

  const workspace = roleWorkspace(user?.role ?? '');
  const role = user?.role ?? '';
  const WorkspaceIcon = workspace.icon;
  const recentMovements = (movements.data?.data ?? []).slice(0, 6);
  const myClosings = actionableClosings(role, metrics.closingRows);
  const maxMix = Math.max(metrics.productRows.length, 1);

  return <div className="space-y-6 pb-10 animate-fade-in">
    <DivisionPageHeader
      division="Divisi Cellular"
      descriptor="Penerimaan · Persediaan · Pembukuan · Analitik"
      title="Pusat Kendali Cellular"
      description="Kendalikan pekerjaan lintas penerimaan harian, persediaan, pembukuan, tagihan, integrasi, dan analitik dari satu ruang kerja."
      actions={<Link to="/cellular/pekerjaan" className="inline-flex min-h-10 items-center gap-2 rounded-input border border-line bg-panel px-3 text-sm font-semibold text-primary-700 shadow-card hover:bg-surface dark:text-primary-300">Buka pekerjaan saya <ArrowRight className="h-4 w-4" /></Link>}
    />

    <section className="flex flex-col gap-4 rounded-card-lg border border-primary-200 bg-gradient-to-r from-primary-50 to-panel p-5 shadow-card dark:border-primary-900 dark:from-primary-950/50 dark:to-panel sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary-600 text-white"><WorkspaceIcon className="h-5 w-5" aria-hidden="true" /></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Ruang kerja sesuai role</p><h2 className="mt-1 text-lg font-bold text-navy">{workspace.title}</h2><p className="mt-1 text-sm text-subtle">{workspace.description}</p></div>
      </div>
      <Link to={workspace.path} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-input bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">{workspace.action}</Link>
    </section>

    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-base font-bold text-navy">Ringkasan periode</h2><p className="mt-1 text-xs text-subtle">{monthLabel(month)} · data transaksi dan persediaan yang tersimpan di sistem</p></div>
      {canSeeSales && <label className="text-xs font-semibold text-subtle">Periode penjualan<input aria-label="Periode penjualan" type="month" min="2000-01" max="2099-12" className="mt-1 block min-h-10 rounded-input border border-line bg-panel px-3 text-sm text-navy" value={month} onChange={event => setMonth(event.target.value)} /></label>}
    </div>

    <KPICardGrid columns={4}>
      <KPICard variant="gradient" label={canSeeSales ? 'Omzet tercatat' : 'Outlet aktif'} value={canSeeSales ? rupiah(metrics.revenue) : integer(outlets.data?.data.length ?? 0)} note={canSeeSales ? `${integer(metrics.posted.length)} transaksi posted pada periode ini` : 'Outlet Cellular dalam cakupan akun'} icon={canSeeSales ? <TrendingUp /> : <Store />} />
      <KPICard label={canSeeSales ? 'Unit terjual' : 'Produk aktif'} value={integer(canSeeSales ? metrics.unitsSold : metrics.productRows.length)} note={canSeeSales ? `${metrics.voided} transaksi dibatalkan` : `${metrics.simCards} kartu · ${metrics.accessories} aksesori`} icon={canSeeSales ? <ShoppingBag /> : <Package />} />
      <KPICard label="Saldo stok tercatat" value={integer(metrics.totalStock)} note={`${integer(metrics.stockRows.length)} kombinasi produk dan outlet`} icon={<Boxes />} />
      <KPICard variant={metrics.lowStock.length ? 'outlined' : 'default'} label="Stok perlu perhatian" value={integer(metrics.lowStock.length)} note="Saldo 5 unit atau kurang" icon={<AlertTriangle />} />
    </KPICardGrid>

    {canSeeClosings && <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
      <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5"><div><h2 className="font-bold text-navy">Tindakan penerimaan saya</h2><p className="mt-1 text-xs text-subtle">{roleAction(role)} pada {monthLabel(month)}</p></div><Link to="/cellular/pekerjaan" className="text-xs font-semibold text-primary-700 dark:text-primary-300">Buka semua →</Link></div>
        <div className="divide-y divide-line">{myClosings.slice(0, 4).map(row => <Link key={row.id} to="/cellular/penerimaan" className="grid gap-3 p-4 transition-colors hover:bg-surface sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className={`flex h-9 w-9 items-center justify-center rounded-pill ${row.status === 'correction' || Number(row.difference) !== 0 ? 'bg-warning-light text-warning-dark' : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200'}`}>{row.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span><div className="min-w-0"><p className="font-semibold text-navy">{shortDate(row.business_date)} · {row.shift_code}</p><p className="mt-1 truncate text-xs text-subtle">{row.source_reference} · selisih {rupiah(Number(row.difference))}</p></div><span className="w-fit rounded-pill bg-surface px-2.5 py-1 text-[11px] font-bold text-subtle">{closingStatus[row.status]}</span></Link>)}</div>
        {!myClosings.length && <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-success"/><p className="mt-3 text-sm font-semibold text-navy">Tidak ada tindakan untuk role Anda</p><p className="mt-1 text-xs text-subtle">Tidak ada dokumen pada status yang memerlukan tindakan di periode ini.</p></div>}
      </section>
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Status penerimaan</h2><p className="mt-1 text-xs text-subtle">Posisi workflow periode berjalan</p></div><ReceiptText className="h-5 w-5 text-primary-600"/></div><div className="mt-5 space-y-4">{[
        ['Draf', metrics.closingRows.filter(row => row.status === 'draft').length, 'bg-slate-400'],
        ['Menunggu Accounting', metrics.closingRows.filter(row => row.status === 'submitted').length, 'bg-warning'],
        ['Menunggu Manager', metrics.closingRows.filter(row => row.status === 'validated').length, 'bg-primary-600'],
        ['Disetujui', metrics.closingRows.filter(row => row.status === 'approved').length, 'bg-success'],
        ['Perlu Koreksi', metrics.closingRows.filter(row => row.status === 'correction').length, 'bg-danger'],
      ].map(([label, count, color]) => <div key={String(label)}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-medium text-subtle">{label}</span><span className="font-bold tabular-nums text-navy">{count}</span></div><div className="h-1.5 overflow-hidden rounded-pill bg-surface"><div className={`h-full rounded-pill ${color}`} style={{ width: `${metrics.closingRows.length ? Math.max((Number(count) / metrics.closingRows.length) * 100, Number(count) ? 6 : 0) : 0}%` }}/></div></div>)}</div></section>
    </div>}

    <div className="grid gap-6 xl:grid-cols-3">
      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-navy">{canSeeSales ? 'Tren omzet harian' : 'Komposisi katalog'}</h2><p className="mt-1 text-xs text-subtle">{canSeeSales ? 'Transaksi posted pada periode terpilih' : 'Sebaran kartu perdana dan aksesori aktif'}</p></div><Link to={canSeeSales ? '/cellular/penjualan' : '/cellular/produk'} className="text-xs font-semibold text-primary-700 dark:text-primary-300">Lihat detail →</Link></div>
        {canSeeSales ? dailySales.length ? <div className="mt-5 h-64" aria-label="Grafik tren omzet harian"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dailySales} margin={{ top: 8, right: 8, left: 6, bottom: 0 }}><defs><linearGradient id="cellularRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0284c7" stopOpacity={0.35}/><stop offset="95%" stopColor="#0284c7" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false}/><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} axisLine={false} tickLine={false}/><YAxis tickFormatter={value => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(Number(value))} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} axisLine={false} tickLine={false}/><Tooltip labelFormatter={value => shortDate(String(value))} formatter={(value, name) => name === 'omzet' ? [rupiah(Number(value)), 'Omzet'] : [integer(Number(value)), 'Unit']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-line)', backgroundColor: 'var(--color-panel)', color: 'var(--color-navy)' }}/><Area type="monotone" dataKey="omzet" stroke="#0284c7" strokeWidth={2.5} fill="url(#cellularRevenue)"/></AreaChart></ResponsiveContainer></div> : <div className="mt-5 rounded-card border border-dashed border-line p-10 text-center"><ReceiptText className="mx-auto h-8 w-8 text-muted"/><p className="mt-3 text-sm font-semibold text-navy">Belum ada penjualan posted</p><p className="mt-1 text-xs text-subtle">Catat transaksi manual agar tren omzet periode ini terbentuk.</p></div> : <div className="mt-6 space-y-5">{[{ label: 'Kartu perdana', value: metrics.simCards, color: 'bg-primary-600' }, { label: 'Aksesori', value: metrics.accessories, color: 'bg-success' }].map(item => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-navy">{item.label}</span><span className="font-bold tabular-nums text-navy">{item.value} produk</span></div><div className="h-2.5 overflow-hidden rounded-pill border border-line bg-surface"><div className={`h-full rounded-pill ${item.color}`} style={{ width: `${(item.value / maxMix) * 100}%` }}/></div></div>)}</div>}
      </section>

      <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card">
        <div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Stok kritis</h2><p className="mt-1 text-xs text-subtle">Prioritas pengadaan atau transfer</p></div><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${metrics.lowStock.length ? 'bg-warning-light text-warning-dark' : 'bg-success-light text-success'}`}>{metrics.lowStock.length ? `${metrics.lowStock.length} item` : 'Aman'}</span></div>
        <ul className="mt-4 divide-y divide-line">{metrics.lowStock.slice(0, 6).map(item => <StockAlert key={item.id} item={item} outletName={outlets.data?.data.find(outlet => outlet.id === item.outlet_id)?.name ?? 'Outlet'} />)}</ul>
        {!metrics.lowStock.length && <div className="py-10 text-center"><Package className="mx-auto h-8 w-8 text-success"/><p className="mt-3 text-sm font-semibold text-navy">Tidak ada saldo kritis</p><p className="mt-1 text-xs text-subtle">Seluruh saldo tercatat berada di atas 5 unit.</p></div>}
      </section>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {canSeeSales && <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Performa outlet</h2><p className="mt-1 text-xs text-subtle">Urutan omzet posted pada {monthLabel(month)}</p></div><Store className="h-5 w-5 text-primary-600"/></div><div className="mt-4 space-y-3">{outletPerformance.slice(0, 5).map((outlet, index) => <div key={outlet.id} className="flex items-center gap-3 rounded-card border border-line p-3"><span className="flex h-8 w-8 items-center justify-center rounded-pill bg-surface text-xs font-bold text-primary-700">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{outlet.name}</p><p className="text-xs text-subtle">{integer(outlet.units)} unit</p></div><p className="text-sm font-bold tabular-nums text-navy">{rupiah(outlet.revenue)}</p></div>)}</div>{!outletPerformance.length && <p className="mt-6 text-sm text-subtle">Belum ada performa outlet pada periode ini.</p>}</section>}
      <section className={`rounded-card-lg border border-line bg-panel p-5 shadow-card ${canSeeSales ? '' : 'lg:col-span-2'}`}><div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Aktivitas stok terbaru</h2><p className="mt-1 text-xs text-subtle">Jejak penjualan, pembatalan, dan mutasi manual</p></div><Boxes className="h-5 w-5 text-primary-600"/></div><ul className="mt-4 divide-y divide-line">{recentMovements.map(movement => <MovementRow key={movement.id} movement={movement} outletName={outlets.data?.data.find(outlet => outlet.id === movement.outlet_id)?.name ?? 'Outlet'} />)}</ul>{!recentMovements.length && <p className="mt-6 text-sm text-subtle">Belum ada aktivitas stok yang tercatat.</p>}</section>
    </div>
  </div>;
}

function StockAlert({ item, outletName }: { item: Stock; outletName: string }) {
  return <li className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-navy">{item.sku} · {item.name}</p><p className="truncate text-xs text-subtle">{outletName}</p></div><span className={`rounded-pill px-2.5 py-1 text-xs font-bold tabular-nums ${item.quantity === 0 ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning-dark'}`}>{item.quantity} unit</span></li>;
}

function MovementRow({ movement, outletName }: { movement: Movement; outletName: string }) {
  const positive = movement.quantity_delta > 0;
  return <li className="flex items-start gap-3 py-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-sm font-bold ${positive ? 'bg-success-light text-success' : 'bg-surface text-navy'}`}>{positive ? '+' : '−'}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-navy">{movementLabel(movement)} · {movement.sku}</p><time className="text-xs text-subtle">{shortDate(movement.created_at)}</time></div><p className="mt-1 text-xs text-subtle">{outletName} · {movement.quantity_delta > 0 ? '+' : ''}{movement.quantity_delta} unit · saldo {movement.quantity_after}</p></div></li>;
}
