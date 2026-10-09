import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, CheckCircle2, CircleDashed, Database, ReceiptText, Store, TrendingUp } from 'lucide-react';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { ErrorState, LoadingState } from '../../../components/states';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { cellularApi } from '../api';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const number = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const PAGE = {
  '/cellular/pekerjaan': { eyebrow: 'Pekerjaan Saya', title: 'Antrean Kerja Cellular', description: 'Prioritas harian berdasarkan role, data yang belum lengkap, serta risiko operasional yang harus diselesaikan.', section: 'work' },
  '/cellular/penerimaan': { eyebrow: 'Penerimaan Harian', title: 'Kontrol Penerimaan Harian', description: 'Rekap penjualan per tanggal bisnis sebagai dasar tutup shift, setoran, dan pemeriksaan Accounting.', section: 'receipts' },
  '/cellular/tagihan': { eyebrow: 'Tagihan & Pembayaran', title: 'Kontrol Tagihan dan Settlement', description: 'Kesiapan dokumen pembelian, kewajiban supplier, dan settlement kanal pembayaran Cellular.', section: 'billing' },
  '/cellular/pembukuan': { eyebrow: 'Pembukuan', title: 'Buku Operasional Cellular', description: 'Jejak transaksi penjualan dan persediaan untuk rekonsiliasi sebelum posting jurnal.', section: 'books' },
  '/cellular/laporan': { eyebrow: 'Laporan & Analitik', title: 'Analitik Kinerja Cellular', description: 'Analisis omzet, unit, outlet, produk, dan kesehatan stok dari data transaksi tersimpan.', section: 'reports' },
  '/cellular/integrasi': { eyebrow: 'Data & Integrasi', title: 'Pusat Data Cellular', description: 'Kendalikan sumber laporan manual, ECSYS, validasi staging, dan kesiapan integrasi.', section: 'integration' },
} as const;

export default function CellularWorkspacePage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = PAGE[pathname as keyof typeof PAGE] ?? PAGE['/cellular/pekerjaan'];
  const [month, setMonth] = useState(today().slice(0, 7));
  const canSeeSales = !!user && hasCapability(user.role, 'view:cellular_sales', user.divisionCode);
  const products = useQuery({ queryKey: ['cellular', 'products'], queryFn: cellularApi.products });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets });
  const stock = useQuery({ queryKey: ['cellular', 'stock'], queryFn: cellularApi.stock });
  const movements = useQuery({ queryKey: ['cellular', 'movements'], queryFn: cellularApi.movements });
  const sales = useQuery({ queryKey: ['cellular', 'sales', month], queryFn: () => cellularApi.sales(month), enabled: canSeeSales });
  const queries = [products, outlets, stock, movements, ...(canSeeSales ? [sales] : [])];
  const failed = queries.find(query => query.error);

  const data = useMemo(() => {
    const saleRows = sales.data?.data ?? [];
    const posted = saleRows.filter(row => row.status === 'posted');
    const stockRows = stock.data?.data ?? [];
    const byDay = new Map<string, { date: string; transactions: number; units: number; revenue: number }>();
    posted.forEach(row => {
      const item = byDay.get(row.business_date) ?? { date: row.business_date, transactions: 0, units: 0, revenue: 0 };
      item.transactions += 1; item.units += row.quantity; item.revenue += Number(row.total_amount); byDay.set(row.business_date, item);
    });
    const daily = [...byDay.values()].sort((a, b) => b.date.localeCompare(a.date));
    const outletNames = new Map((outlets.data?.data ?? []).map(row => [row.id, row.name]));
    const byOutlet = new Map<string, { id: string; name: string; revenue: number; units: number }>();
    posted.forEach(row => { const item = byOutlet.get(row.outlet_id) ?? { id: row.outlet_id, name: row.outlet_name, revenue: 0, units: 0 }; item.revenue += Number(row.total_amount); item.units += row.quantity; byOutlet.set(row.outlet_id, item); });
    return {
      saleRows, posted, stockRows, daily, outletNames,
      revenue: posted.reduce((sum, row) => sum + Number(row.total_amount), 0),
      units: posted.reduce((sum, row) => sum + row.quantity, 0),
      lowStock: stockRows.filter(row => row.quantity <= 5),
      totalStock: stockRows.reduce((sum, row) => sum + row.quantity, 0),
      outletPerformance: [...byOutlet.values()].sort((a, b) => b.revenue - a.revenue),
    };
  }, [outlets.data, sales.data, stock.data]);

  if (queries.some(query => query.isLoading)) return <LoadingState label="Menyiapkan workspace ERP Cellular..." />;
  if (failed) return <ErrorState title="Workspace Cellular gagal dimuat" description={failed.error?.message ?? 'Data tidak tersedia.'} onRetry={() => queries.forEach(query => void query.refetch())} />;

  const issues = [
    ...(data.lowStock.length ? [{ label: `${data.lowStock.length} saldo stok kritis`, path: '/cellular/persediaan', tone: 'warning' }] : []),
    ...(!data.posted.length && canSeeSales ? [{ label: 'Belum ada penerimaan pada periode ini', path: '/cellular/penjualan', tone: 'neutral' }] : []),
    ...(!(products.data?.data.length) ? [{ label: 'Master produk belum tersedia', path: '/cellular/produk', tone: 'neutral' }] : []),
  ];

  return <div className="space-y-6 pb-10 animate-fade-in">
    <DivisionPageHeader division="Divisi Cellular" descriptor={`${page.eyebrow} · ${user?.role ?? 'Role'}`} title={page.title} description={page.description}
      actions={<label className="text-xs font-semibold text-subtle">Periode<input aria-label="Periode laporan" type="month" className="mt-1 block min-h-10 rounded-input border border-line bg-panel px-3 text-sm text-navy" value={month} onChange={event => setMonth(event.target.value)} /></label>} />

    <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Status operasional</p><h2 className="mt-1 text-lg font-bold text-navy">{issues.length ? `${issues.length} prioritas memerlukan tindak lanjut` : 'Data operasional dalam kondisi terkendali'}</h2><p className="mt-1 text-sm text-subtle">Ringkasan ini dihitung dari transaksi dan saldo yang tersimpan, bukan angka contoh.</p></div>
      <Link to="/cellular/pekerjaan" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-input bg-primary-600 px-4 text-sm font-semibold text-white">Buka antrean <ArrowRight className="h-4 w-4" /></Link>
    </section>

    <KPICardGrid columns={4}>
      <KPICard variant="gradient" label="Penerimaan tercatat" value={canSeeSales ? money(data.revenue) : 'Terbatas'} note={`${number(data.posted.length)} transaksi posted`} icon={<TrendingUp />} />
      <KPICard label="Unit terjual" value={canSeeSales ? number(data.units) : 'Terbatas'} note={`${number(data.saleRows.filter(row => row.status === 'voided').length)} pembatalan`} icon={<ReceiptText />} />
      <KPICard label="Persediaan" value={number(data.totalStock)} note={`${number(data.stockRows.length)} saldo produk/outlet`} icon={<Boxes />} />
      <KPICard variant={data.lowStock.length ? 'outlined' : 'default'} label="Perlu perhatian" value={number(data.lowStock.length)} note="Saldo 5 unit atau kurang" icon={<AlertTriangle />} />
    </KPICardGrid>

    {page.section === 'work' && <WorkQueue issues={issues} />}
    {page.section === 'receipts' && <DailyReceipts rows={data.daily} />}
    {page.section === 'billing' && <Readiness title="Alur tagihan dan pembayaran" items={[['Pembelian & penerimaan barang', movements.data?.data.some(row => row.quantity_delta > 0) ?? false, 'Mutasi barang masuk tersedia sebagai bukti penerimaan.'], ['Tagihan supplier', false, 'Register invoice, jatuh tempo, dan approval belum memiliki kontrak backend.'], ['Settlement kanal pembayaran', false, 'Data EDC, QRIS, transfer, dan biaya layanan perlu dimasukkan melalui staging.']]} />}
    {page.section === 'books' && <Ledger rows={movements.data?.data ?? []} outletName={id => data.outletNames.get(id) ?? 'Outlet'} />}
    {page.section === 'reports' && <OutletReport rows={data.outletPerformance} />}
    {page.section === 'integration' && <Readiness title="Kesiapan sumber data" items={[['Input manual ERP', true, 'Produk, stok, penjualan, dan pembatalan memiliki endpoint serta audit.'], ['Spreadsheet operasional', false, 'File harus masuk staging, validasi header, pratinjau, dan rekonsiliasi total.'], ['ECSYS', false, 'Kontrak sumber, identifier unik, jadwal, serta retry belum ditetapkan.']]} />}
  </div>;
}

function WorkQueue({ issues }: { issues: { label: string; path: string; tone: string }[] }) {
  return <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">Prioritas hari ini</h2><p className="mt-1 text-xs text-subtle">Daftar otomatis dari kondisi data aktual</p><div className="mt-4 space-y-3">{issues.map(item => <Link key={item.label} to={item.path} className="flex items-center justify-between rounded-card border border-line p-4 hover:border-primary-300"><span className="flex items-center gap-3 text-sm font-semibold text-navy"><AlertTriangle className={`h-4 w-4 ${item.tone === 'warning' ? 'text-warning-dark' : 'text-muted'}`} />{item.label}</span><ArrowRight className="h-4 w-4 text-muted" /></Link>)}{!issues.length && <div className="rounded-card border border-success/30 bg-success-light p-5 text-sm font-semibold text-success"><CheckCircle2 className="mb-2 h-5 w-5" />Tidak ada pengecualian dari data yang tersedia.</div>}</div></section><ProcessRail /></div>;
}

function ProcessRail() { return <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">Alur kerja harian</h2><ol className="mt-4 space-y-4">{['Catat transaksi & bukti', 'Tutup shift dan rekonsiliasi', 'Periksa Accounting', 'Posting dan analisis'].map((label, index) => <li key={label} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">{index + 1}</span><div><p className="text-sm font-semibold text-navy">{label}</p><p className="text-xs text-subtle">{index < 1 ? 'Tersedia sebagian di sistem' : 'Memerlukan modul lanjutan dan kontrol role'}</p></div></li>)}</ol></section>; }

function DailyReceipts({ rows }: { rows: { date: string; transactions: number; units: number; revenue: number }[] }) { return <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="border-b border-line p-5"><h2 className="font-bold text-navy">Register penerimaan per tanggal bisnis</h2><p className="mt-1 text-xs text-subtle">Dasar pemeriksaan tutup shift dan setoran</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Tanggal</th><th>Transaksi</th><th>Unit</th><th>Omzet</th><th>Status data</th></tr></thead><tbody className="divide-y divide-line">{rows.map(row => <tr key={row.date}><td className="px-5 py-4 font-semibold text-navy">{row.date}</td><td>{number(row.transactions)}</td><td>{number(row.units)}</td><td className="font-semibold tabular-nums text-navy">{money(row.revenue)}</td><td><span className="rounded-pill bg-warning-light px-2.5 py-1 text-xs font-bold text-warning-dark">Belum direkonsiliasi</span></td></tr>)}</tbody></table></div>{!rows.length && <p className="p-8 text-center text-sm text-subtle">Belum ada penerimaan posted pada periode ini.</p>}</section>; }

function Ledger({ rows, outletName }: { rows: { id: string; created_at: string; sku: string; outlet_id: string; kind: string; quantity_delta: number; quantity_after: number }[]; outletName: (id: string) => string }) { return <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="border-b border-line p-5"><h2 className="font-bold text-navy">Buku persediaan</h2><p className="mt-1 text-xs text-subtle">Jejak kuantitas; nilai HPP dan jurnal keuangan belum ditetapkan</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Waktu</th><th>Referensi barang</th><th>Outlet</th><th>Jenis</th><th>Perubahan</th><th>Saldo</th></tr></thead><tbody className="divide-y divide-line">{rows.slice(0, 100).map(row => <tr key={row.id}><td className="px-5 py-4 text-subtle">{row.created_at.slice(0, 16).replace('T', ' ')}</td><td className="font-semibold text-navy">{row.sku}</td><td>{outletName(row.outlet_id)}</td><td>{row.kind}</td><td className="tabular-nums">{row.quantity_delta > 0 ? '+' : ''}{row.quantity_delta}</td><td className="font-bold tabular-nums text-navy">{row.quantity_after}</td></tr>)}</tbody></table></div>{!rows.length && <p className="p-8 text-center text-sm text-subtle">Belum ada mutasi untuk dibukukan.</p>}</section>; }

function OutletReport({ rows }: { rows: { id: string; name: string; revenue: number; units: number }[] }) { return <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Kinerja outlet</h2><p className="mt-1 text-xs text-subtle">Berdasarkan penjualan posted pada periode terpilih</p></div><Store className="h-5 w-5 text-primary-600" /></div><div className="mt-5 grid gap-3 md:grid-cols-2">{rows.map((row, index) => <article key={row.id} className="rounded-card border border-line p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-primary-700">Peringkat {index + 1}</p><h3 className="mt-1 font-bold text-navy">{row.name}</h3></div><TrendingUp className="h-5 w-5 text-success" /></div><p className="mt-5 text-xl font-bold tabular-nums text-navy">{money(row.revenue)}</p><p className="mt-1 text-xs text-subtle">{number(row.units)} unit terjual</p></article>)}</div>{!rows.length && <p className="py-10 text-center text-sm text-subtle">Belum ada data outlet pada periode ini.</p>}</section>; }

function Readiness({ title, items }: { title: string; items: [string, boolean, string][] }) { return <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">{title}</h2><div className="mt-5 grid gap-4 lg:grid-cols-3">{items.map(([label, ready, detail]) => <article key={label} className="rounded-card border border-line p-4"><div className="flex items-center justify-between"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${ready ? 'bg-success-light text-success' : 'bg-surface text-subtle'}`}>{ready ? 'Tersedia' : 'Perlu implementasi'}</span>{ready ? <CheckCircle2 className="h-5 w-5 text-success" /> : <CircleDashed className="h-5 w-5 text-muted" />}</div><h3 className="mt-4 font-bold text-navy">{label}</h3><p className="mt-2 text-sm leading-6 text-subtle">{detail}</p></article>)}</div><div className="mt-5 flex items-start gap-3 rounded-card border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-100"><Database className="mt-0.5 h-5 w-5 shrink-0" /><p>Kontrol yang belum tersedia tidak menghasilkan transaksi atau angka semu. Implementasi backend berikutnya harus memakai staging, validasi, idempotency, approval, dan audit.</p></div></section>; }
