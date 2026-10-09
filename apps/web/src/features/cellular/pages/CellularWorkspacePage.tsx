import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, CheckCircle2, CircleDashed, Clock3, Database, FileCheck2, PackageX, ReceiptText, Store, TrendingUp } from 'lucide-react';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { ErrorState, LoadingState } from '../../../components/states';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { cellularApi, type DailyClosing, type Stock } from '../api';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const number = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00+07:00`));

const PAGE = {
  '/cellular/pekerjaan': { eyebrow: 'Pekerjaan Saya', title: 'Antrean Kerja Cellular', description: 'Prioritas harian berdasarkan role, status workflow, dan risiko operasional yang memerlukan tindakan.', section: 'work' },
  '/cellular/tagihan': { eyebrow: 'Tagihan & Pembayaran', title: 'Kontrol Tagihan dan Settlement', description: 'Kesiapan dokumen pembelian, kewajiban supplier, dan settlement kanal pembayaran Cellular.', section: 'billing' },
  '/cellular/pembukuan': { eyebrow: 'Pembukuan', title: 'Buku Operasional Cellular', description: 'Jejak transaksi penjualan dan persediaan untuk rekonsiliasi sebelum posting jurnal.', section: 'books' },
  '/cellular/laporan': { eyebrow: 'Laporan & Analitik', title: 'Analitik Kinerja Cellular', description: 'Analisis omzet, unit, outlet, produk, dan kesehatan stok dari data transaksi tersimpan.', section: 'reports' },
  '/cellular/integrasi': { eyebrow: 'Data & Integrasi', title: 'Pusat Data Cellular', description: 'Kendalikan sumber laporan manual, ECSYS, validasi staging, dan kesiapan integrasi.', section: 'integration' },
} as const;

type WorkTone = 'danger' | 'warning' | 'info' | 'neutral';
type WorkItem = { id: string; title: string; description: string; meta: string; path: string; action: string; tone: WorkTone };

const toneClass: Record<WorkTone, string> = {
  danger: 'border-danger/30 bg-danger-light text-danger',
  warning: 'border-warning/30 bg-warning-light text-warning-dark',
  info: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-200',
  neutral: 'border-line bg-surface text-subtle',
};

const roleTitle: Record<string, string> = {
  ADMIN: 'Admin Cellular', ADMIN_GUDANG: 'Admin Gudang', ACCOUNTING: 'Accounting', FINANCE: 'Finance', MANAGER: 'Manager', HEAD_OPS: 'Head Operasional', SPV: 'SPV', LEADER: 'Leader', BOD: 'Direksi',
};

function closingItem(row: DailyClosing, action: string, tone: WorkTone, description: string): WorkItem {
  return {
    id: `closing-${row.id}`,
    title: `${dateLabel(row.business_date)} · ${row.shift_code}`,
    description,
    meta: `${row.source_reference} · selisih ${money(Number(row.difference))}`,
    path: '/cellular/penerimaan',
    action,
    tone,
  };
}

function buildWorkItems(role: string, closings: DailyClosing[], lowStock: Stock[], postedDates: string[]): WorkItem[] {
  const items: WorkItem[] = [];
  if (role === 'ADMIN') {
    closings.filter(row => row.status === 'correction').forEach(row => items.push(closingItem(row, 'Perbaiki', 'danger', row.review_note || 'Accounting meminta koreksi data penerimaan.')));
    closings.filter(row => row.status === 'draft').forEach(row => items.push(closingItem(row, 'Tinjau dan ajukan', 'warning', 'Draf belum diajukan ke Accounting.')));
    const recordedDates = new Set(closings.map(row => row.business_date));
    [...new Set(postedDates)].filter(date => !recordedDates.has(date)).forEach(date => items.push({ id: `missing-${date}`, title: `Penerimaan ${dateLabel(date)} belum dibuat`, description: 'Penjualan posted sudah tersedia, tetapi rekap penerimaan belum tercatat.', meta: 'Batas pengajuan H+1 pukul 23.59 WIB', path: '/cellular/penerimaan', action: 'Buat rekap', tone: 'warning' }));
  } else if (role === 'ACCOUNTING') {
    closings.filter(row => row.status === 'submitted').forEach(row => items.push(closingItem(row, 'Periksa', Number(row.difference) === 0 ? 'info' : 'warning', 'Pengajuan Admin menunggu validasi atau permintaan koreksi.')));
  } else if (role === 'MANAGER') {
    closings.filter(row => row.status === 'validated').forEach(row => items.push(closingItem(row, 'Putuskan', Number(row.difference) === 0 ? 'info' : 'warning', 'Penerimaan telah divalidasi Accounting dan menunggu persetujuan.')));
  } else if (role === 'FINANCE') {
    closings.filter(row => row.status === 'approved' && Number(row.difference) !== 0).forEach(row => items.push(closingItem(row, 'Tinjau selisih', 'warning', 'Penerimaan disetujui memiliki selisih kanal yang perlu dipantau sebelum settlement.')));
  }

  if (role === 'ADMIN_GUDANG' || ['MANAGER', 'HEAD_OPS', 'SPV', 'LEADER'].includes(role)) {
    lowStock.slice(0, 8).forEach(row => items.push({ id: `stock-${row.id}`, title: `${row.sku} · ${row.name}`, description: row.quantity === 0 ? 'Stok habis dan memerlukan penerimaan atau transfer.' : 'Saldo berada pada batas minimum lima unit.', meta: `Saldo ${number(row.quantity)} unit`, path: '/cellular/persediaan', action: role === 'ADMIN_GUDANG' ? 'Catat mutasi' : 'Periksa stok', tone: row.quantity === 0 ? 'danger' : 'warning' }));
  }
  return items;
}

export default function CellularWorkspacePage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = PAGE[pathname as keyof typeof PAGE] ?? PAGE['/cellular/pekerjaan'];
  const [month, setMonth] = useState(today().slice(0, 7));
  const canSeeSales = !!user && hasCapability(user.role, 'view:cellular_sales', user.divisionCode);
  const canSeeClosings = !!user && hasCapability(user.role, 'view:cellular_daily', user.divisionCode);
  const products = useQuery({ queryKey: ['cellular', 'products'], queryFn: cellularApi.products });
  const outlets = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: cellularApi.outlets });
  const stock = useQuery({ queryKey: ['cellular', 'stock'], queryFn: cellularApi.stock });
  const movements = useQuery({ queryKey: ['cellular', 'movements'], queryFn: cellularApi.movements });
  const sales = useQuery({ queryKey: ['cellular', 'sales', month], queryFn: () => cellularApi.sales(month), enabled: canSeeSales });
  const closings = useQuery({ queryKey: ['cellular', 'daily-closings', month], queryFn: () => cellularApi.dailyClosings(month), enabled: canSeeClosings });
  const queries = [products, outlets, stock, movements, ...(canSeeSales ? [sales] : []), ...(canSeeClosings ? [closings] : [])];
  const failed = queries.find(query => query.error);

  const data = useMemo(() => {
    const saleRows = sales.data?.data ?? [];
    const posted = saleRows.filter(row => row.status === 'posted');
    const stockRows = stock.data?.data ?? [];
    const closingRows = closings.data?.data ?? [];
    const outletNames = new Map((outlets.data?.data ?? []).map(row => [row.id, row.name]));
    const byOutlet = new Map<string, { id: string; name: string; revenue: number; units: number }>();
    posted.forEach(row => { const item = byOutlet.get(row.outlet_id) ?? { id: row.outlet_id, name: row.outlet_name, revenue: 0, units: 0 }; item.revenue += Number(row.total_amount); item.units += row.quantity; byOutlet.set(row.outlet_id, item); });
    return {
      saleRows, posted, stockRows, closingRows, outletNames,
      revenue: posted.reduce((sum, row) => sum + Number(row.total_amount), 0),
      units: posted.reduce((sum, row) => sum + row.quantity, 0),
      lowStock: stockRows.filter(row => row.quantity <= 5),
      totalStock: stockRows.reduce((sum, row) => sum + row.quantity, 0),
      outletPerformance: [...byOutlet.values()].sort((a, b) => b.revenue - a.revenue),
    };
  }, [closings.data, outlets.data, sales.data, stock.data]);

  if (queries.some(query => query.isLoading)) return <LoadingState label="Menyiapkan workspace ERP Cellular..." />;
  if (failed) return <ErrorState title="Workspace Cellular gagal dimuat" description={failed.error?.message ?? 'Data tidak tersedia.'} onRetry={() => queries.forEach(query => void query.refetch())} />;

  const role = user?.role ?? '';
  const workItems = buildWorkItems(role, data.closingRows, data.lowStock, data.posted.map(row => row.business_date));
  const statusCounts = {
    draft: data.closingRows.filter(row => row.status === 'draft').length,
    submitted: data.closingRows.filter(row => row.status === 'submitted').length,
    validated: data.closingRows.filter(row => row.status === 'validated').length,
    approved: data.closingRows.filter(row => row.status === 'approved').length,
    correction: data.closingRows.filter(row => row.status === 'correction').length,
  };

  return <div className="space-y-6 pb-10 animate-fade-in">
    <DivisionPageHeader division="Divisi Cellular" descriptor={`${page.eyebrow} · ${roleTitle[role] ?? role ?? 'Role'}`} title={page.title} description={page.description}
      actions={<label className="text-xs font-semibold text-subtle">Periode<input aria-label="Periode laporan" type="month" className="mt-1 block min-h-10 rounded-input border border-line bg-panel px-3 text-sm text-navy" value={month} onChange={event => setMonth(event.target.value)} /></label>} />

    {page.section === 'work' ? <>
      <KPICardGrid columns={4}>
        <KPICard variant="gradient" label="Tindakan saya" value={number(workItems.length)} note={`Antrean untuk ${roleTitle[role] ?? role}`} icon={<FileCheck2 />} />
        <KPICard label="Menunggu Accounting" value={number(statusCounts.submitted)} note="Pengajuan Admin belum divalidasi" icon={<Clock3 />} />
        <KPICard label="Menunggu Manager" value={number(statusCounts.validated)} note="Sudah diperiksa Accounting" icon={<CheckCircle2 />} />
        <KPICard variant={statusCounts.correction || data.lowStock.length ? 'outlined' : 'default'} label="Pengecualian" value={number(statusCounts.correction + data.lowStock.length)} note={`${statusCounts.correction} koreksi · ${data.lowStock.length} stok kritis`} icon={<AlertTriangle />} />
      </KPICardGrid>
      <WorkQueue items={workItems} role={roleTitle[role] ?? role} counts={statusCounts} />
    </> : <>
      <section className="grid gap-3 rounded-card-lg border border-line bg-panel p-4 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Status operasional</p><h2 className="mt-1 text-lg font-bold text-navy">{workItems.length ? `${workItems.length} prioritas memerlukan tindak lanjut` : 'Data operasional dalam kondisi terkendali'}</h2><p className="mt-1 text-sm text-subtle">Ringkasan dihitung dari transaksi, penerimaan, dan saldo yang tersimpan.</p></div>
        <Link to="/cellular/pekerjaan" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-input bg-primary-600 px-4 text-sm font-semibold text-white">Buka antrean <ArrowRight className="h-4 w-4" /></Link>
      </section>
      <KPICardGrid columns={4}>
        <KPICard variant="gradient" label="Penerimaan tercatat" value={canSeeSales ? money(data.revenue) : 'Terbatas'} note={`${number(data.posted.length)} transaksi posted`} icon={<TrendingUp />} />
        <KPICard label="Unit terjual" value={canSeeSales ? number(data.units) : 'Terbatas'} note={`${number(data.saleRows.filter(row => row.status === 'voided').length)} pembatalan`} icon={<ReceiptText />} />
        <KPICard label="Persediaan" value={number(data.totalStock)} note={`${number(data.stockRows.length)} saldo produk/outlet`} icon={<Boxes />} />
        <KPICard variant={data.lowStock.length ? 'outlined' : 'default'} label="Perlu perhatian" value={number(data.lowStock.length)} note="Saldo 5 unit atau kurang" icon={<AlertTriangle />} />
      </KPICardGrid>
    </>}

    {page.section === 'billing' && <Readiness title="Alur tagihan dan pembayaran" items={[["Pembelian & penerimaan barang", movements.data?.data.some(row => row.quantity_delta > 0) ?? false, 'Mutasi barang masuk tersedia sebagai bukti penerimaan.'], ['Tagihan supplier', false, 'Register invoice, jatuh tempo, dan approval belum memiliki kontrak backend.'], ['Settlement kanal pembayaran', false, 'Data EDC, QRIS, transfer, dan biaya layanan perlu dimasukkan melalui staging.']]} />}
    {page.section === 'books' && <Ledger rows={movements.data?.data ?? []} outletName={id => data.outletNames.get(id) ?? 'Outlet'} />}
    {page.section === 'reports' && <OutletReport rows={data.outletPerformance} />}
    {page.section === 'integration' && <Readiness title="Kesiapan sumber data" items={[["Input manual ERP", true, 'Produk, stok, penjualan, penerimaan, dan pembatalan memiliki endpoint serta audit.'], ['Spreadsheet operasional', false, 'File harus masuk staging, validasi header, pratinjau, dan rekonsiliasi total.'], ['ECSYS', false, 'Kontrak sumber, identifier unik, jadwal, serta retry belum ditetapkan.']]} />}
  </div>;
}

function WorkQueue({ items, role, counts }: { items: WorkItem[]; role: string; counts: Record<string, number> }) {
  const stages = [
    ['Draf', counts.draft, 'Admin'], ['Diajukan', counts.submitted, 'Accounting'], ['Divalidasi', counts.validated, 'Manager'], ['Disetujui', counts.approved, 'Selesai'], ['Koreksi', counts.correction, 'Admin'],
  ];
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
    <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5"><div><h2 className="font-bold text-navy">Prioritas untuk {role}</h2><p className="mt-1 text-xs text-subtle">Dibentuk dari status penerimaan dan kondisi stok aktual</p></div><span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-200">{items.length} pekerjaan</span></div>
      <div className="divide-y divide-line">{items.map(item => <article key={item.id} className="grid gap-4 p-5 transition-colors hover:bg-surface md:grid-cols-[auto_1fr_auto] md:items-center"><span className={`flex h-10 w-10 items-center justify-center rounded-input border ${toneClass[item.tone]}`}>{item.id.startsWith('stock-') ? <PackageX className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}</span><div className="min-w-0"><h3 className="font-semibold text-navy">{item.title}</h3><p className="mt-1 text-sm text-subtle">{item.description}</p><p className="mt-2 text-xs font-medium text-subtle">{item.meta}</p></div><Link to={item.path} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-input border border-line bg-panel px-3 text-xs font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50 dark:text-primary-200">{item.action}<ArrowRight className="h-3.5 w-3.5" /></Link></article>)}</div>
      {!items.length && <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-success"/><h3 className="mt-3 font-bold text-navy">Tidak ada tindakan untuk role ini</h3><p className="mx-auto mt-1 max-w-md text-sm text-subtle">Tidak ada dokumen pada status yang menjadi tanggung jawab Anda di periode terpilih.</p></div>}
    </section>
    <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">Alur penerimaan</h2><p className="mt-1 text-xs text-subtle">Posisi seluruh dokumen pada periode terpilih</p><ol className="mt-5 space-y-4">{stages.map(([label, count, owner], index) => <li key={String(label)} className="flex gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-xs font-bold ${Number(count) ? 'bg-primary-600 text-white' : 'border border-line bg-surface text-subtle'}`}>{count}</span><div className="min-w-0 flex-1 border-b border-line pb-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-navy">{label}</p><span className="text-[11px] font-medium text-subtle">{owner}</span></div><p className="mt-1 text-xs text-subtle">Tahap {index + 1} dari workflow penerimaan</p></div></li>)}</ol><Link to="/cellular/penerimaan" className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-input bg-primary-600 px-4 text-sm font-semibold text-white">Buka register penerimaan<ArrowRight className="h-4 w-4" /></Link></section>
  </div>;
}

function Ledger({ rows, outletName }: { rows: { id: string; created_at: string; sku: string; outlet_id: string; kind: string; quantity_delta: number; quantity_after: number }[]; outletName: (id: string) => string }) { return <section className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><div className="border-b border-line p-5"><h2 className="font-bold text-navy">Buku persediaan</h2><p className="mt-1 text-xs text-subtle">Jejak kuantitas; nilai HPP dan jurnal keuangan belum ditetapkan</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-subtle"><tr><th className="px-5 py-3">Waktu</th><th>Referensi barang</th><th>Outlet</th><th>Jenis</th><th>Perubahan</th><th>Saldo</th></tr></thead><tbody className="divide-y divide-line">{rows.slice(0, 100).map(row => <tr key={row.id}><td className="px-5 py-4 text-subtle">{row.created_at.slice(0, 16).replace('T', ' ')}</td><td className="font-semibold text-navy">{row.sku}</td><td>{outletName(row.outlet_id)}</td><td>{row.kind}</td><td className="tabular-nums">{row.quantity_delta > 0 ? '+' : ''}{row.quantity_delta}</td><td className="font-bold tabular-nums text-navy">{row.quantity_after}</td></tr>)}</tbody></table></div>{!rows.length && <p className="p-8 text-center text-sm text-subtle">Belum ada mutasi untuk dibukukan.</p>}</section>; }

function OutletReport({ rows }: { rows: { id: string; name: string; revenue: number; units: number }[] }) { return <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="font-bold text-navy">Kinerja outlet</h2><p className="mt-1 text-xs text-subtle">Berdasarkan penjualan posted pada periode terpilih</p></div><Store className="h-5 w-5 text-primary-600" /></div><div className="mt-5 grid gap-3 md:grid-cols-2">{rows.map((row, index) => <article key={row.id} className="rounded-card border border-line p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-primary-700">Peringkat {index + 1}</p><h3 className="mt-1 font-bold text-navy">{row.name}</h3></div><TrendingUp className="h-5 w-5 text-success" /></div><p className="mt-5 text-xl font-bold tabular-nums text-navy">{money(row.revenue)}</p><p className="mt-1 text-xs text-subtle">{number(row.units)} unit terjual</p></article>)}</div>{!rows.length && <p className="py-10 text-center text-sm text-subtle">Belum ada data outlet pada periode ini.</p>}</section>; }

function Readiness({ title, items }: { title: string; items: [string, boolean, string][] }) { return <section className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">{title}</h2><div className="mt-5 grid gap-4 lg:grid-cols-3">{items.map(([label, ready, detail]) => <article key={label} className="rounded-card border border-line p-4"><div className="flex items-center justify-between"><span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${ready ? 'bg-success-light text-success' : 'bg-surface text-subtle'}`}>{ready ? 'Tersedia' : 'Perlu implementasi'}</span>{ready ? <CheckCircle2 className="h-5 w-5 text-success" /> : <CircleDashed className="h-5 w-5 text-muted" />}</div><h3 className="mt-4 font-bold text-navy">{label}</h3><p className="mt-2 text-sm leading-6 text-subtle">{detail}</p></article>)}</div><div className="mt-5 flex items-start gap-3 rounded-card border border-primary-200 bg-primary-50 p-4 text-sm text-primary-900 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-100"><Database className="mt-0.5 h-5 w-5 shrink-0" /><p>Kontrol yang belum tersedia tidak menghasilkan transaksi atau angka semu. Implementasi backend berikutnya harus memakai staging, validasi, idempotency, approval, dan audit.</p></div></section>; }
