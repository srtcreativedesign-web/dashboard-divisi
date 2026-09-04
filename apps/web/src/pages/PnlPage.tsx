import { useState } from 'react';
import { PieChart, TrendingUp, DollarSign, Award, ArrowUpRight, CheckCircle2, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PnlComparisonChart } from '../components/pnl/PnlComparisonChart';
import { useAuth } from '../session/AuthContext';
import { WaterfallChart, type WaterfallItem } from '../components/accounting/WaterfallChart';

interface PnlItem {
  id: string;
  section: 'Revenue' | 'COGS' | 'Opex';
  label: string;
  amount: number;
}

const INITIAL_PNL: PnlItem[] = [
  { id: '1', section: 'Revenue', label: 'Pendapatan Sewa Tenant', amount: 850000000 },
  { id: '2', section: 'Revenue', label: 'Pendapatan Komisi Penjualan', amount: 320000000 },
  { id: '3', section: 'Revenue', label: 'Pendapatan Event & Utility', amount: 150000000 },
  { id: '4', section: 'COGS', label: 'Harga Pokok Penjualan (HPP)', amount: 280000000 },
  { id: '5', section: 'Opex', label: 'Gaji Karyawan & Tunjangan', amount: 240000000 },
  { id: '6', section: 'Opex', label: 'Biaya Listrik, Air & Gas', amount: 95000000 },
  { id: '7', section: 'Opex', label: 'Pemasaran, Promosi & Event', amount: 65000000 },
  { id: '8', section: 'Opex', label: 'Pemeliharaan Gedung & Fasilitas', amount: 45000000 },
];

export default function PnlPage() {
  const { user } = useAuth();
  const isBod = user?.role === 'BOD';

  const [pnlItems] = useState<PnlItem[]>(INITIAL_PNL);

  const totalRevenue = pnlItems.filter(i => i.section === 'Revenue').reduce((a, b) => a + b.amount, 0);
  const totalCogs = pnlItems.filter(i => i.section === 'COGS').reduce((a, b) => a + b.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalOpex = pnlItems.filter(i => i.section === 'Opex').reduce((a, b) => a + b.amount, 0);
  const netProfit = grossProfit - totalOpex;
  const netMargin = Math.round((netProfit / totalRevenue) * 100);

  const pnlWaterfall: WaterfallItem[] = [
    { id: 'rev', label: 'Pendapatan', amount: totalRevenue },
    { id: 'cogs', label: 'HPP (COGS)', amount: -totalCogs },
    { id: 'gross', label: 'Laba Kotor', amount: grossProfit, isTotal: true },
    { id: 'opex', label: 'Beban Operasional', amount: -totalOpex },
    { id: 'net', label: 'Laba Bersih', amount: netProfit, isTotal: true },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#0b132b] to-navy p-6 text-white shadow-lg print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-primary-light backdrop-blur-md">
              <PieChart className="h-3.5 w-3.5" /> Laporan Finansial Resmi (Profit & Loss)
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Profit & Loss (PnL) Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Analisis pendapatan, beban pokok penjualan, biaya operasional, dan laba bersih.
            </p>
          </div>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary-dark text-white shadow-md">
            <Printer className="mr-2 h-4 w-4" /> Cetak / Export PDF Resmi
          </Button>
        </div>
      </section>

      {/* Kop Surat Perusahaan (Hanya tampil saat dicetak) */}
      <div className="hidden print:block text-center border-b-2 border-navy pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-navy uppercase tracking-widest">PT DASHBOARD DIVISI INDONESIA</h1>
        <p className="text-xs text-slate-600">Gedung Pusat Operasional, Lantai 12 · Jakarta Pusat · Telp: (021) 555-0199</p>
        <p className="text-sm font-bold text-navy mt-2 underline">LAPORAN LABA RUGI RESMI (PROFIT & LOSS STATEMENT)</p>
        <p className="text-xs text-slate-500">Periode Berjalan: September 2026</p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Gross Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalRevenue.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-semibold flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> +15.8% YTD
          </p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Gross Profit (Laba Kotor)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-info/10 text-info">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {grossProfit.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Gross Margin: {Math.round((grossProfit / totalRevenue) * 100)}%</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Net Profit (Laba Bersih)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {netProfit.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-bold">Net Profit Margin: {netMargin}%</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Profitability Rating</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-success">High Profitability</p>
          <p className="mt-1 text-xs text-slate-500">Target Q3 Reached</p>
        </article>
      </section>

      {/* Comparison Chart (BOD Only) */}
      {isBod && <PnlComparisonChart />}

      {/* Waterfall Chart Margin P&L */}
      <WaterfallChart
        title="Waterfall Chart: Formasi Laba Rugi (P&L Margin)"
        subtitle="Visualisasi pembentukan laba bersih dari pendapatan kotor, pemotongan HPP, dan beban operasional"
        items={pnlWaterfall}
      />

      {/* PnL Statement Table */}
      <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm print:border-none print:p-0">
        <h2 className="text-lg font-bold text-navy print:hidden">Laporan Rincian Laba Rugi (Profit & Loss Statement)</h2>
        <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40 print:border-slate-800">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500 print:bg-slate-100">
              <tr>
                <th className="px-4 py-3.5 border-b">Elemen Finansial</th>
                <th className="px-4 py-3.5 text-center border-b">Kategori</th>
                <th className="px-4 py-3.5 text-right border-b">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-medium">
              {/* Revenue */}
              <tr className="bg-primary/5 font-bold text-navy">
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-xs">Total Gross Revenue (Pendapatan)</td>
                <td className="px-4 py-3 text-right font-mono text-base">Rp {totalRevenue.toLocaleString('id-ID')}</td>
              </tr>
              {pnlItems.filter(i => i.section === 'Revenue').map(item => (
                <tr key={item.id} className="hover:bg-surface/50">
                  <td className="px-6 py-2.5 text-slate-700">{item.label}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500">Pendapatan</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">Rp {item.amount.toLocaleString('id-ID')}</td>
                </tr>
              ))}

              {/* COGS */}
              <tr className="bg-warning/5 font-bold text-navy">
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-xs">Total Harga Pokok Penjualan (HPP)</td>
                <td className="px-4 py-3 text-right font-mono text-base text-warning">Rp {totalCogs.toLocaleString('id-ID')}</td>
              </tr>

              {/* Gross Profit */}
              <tr className="bg-info/10 font-black text-navy border-t-2 border-b-2 border-info/30">
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-xs">GROSS PROFIT (LABA KOTOR)</td>
                <td className="px-4 py-3 text-right font-mono text-lg text-info">Rp {grossProfit.toLocaleString('id-ID')}</td>
              </tr>

              {/* OPEX */}
              <tr className="bg-danger/5 font-bold text-navy">
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider text-xs">Total Biaya Operasional (Opex)</td>
                <td className="px-4 py-3 text-right font-mono text-base text-danger">Rp {totalOpex.toLocaleString('id-ID')}</td>
              </tr>
              {pnlItems.filter(i => i.section === 'Opex').map(item => (
                <tr key={item.id} className="hover:bg-surface/50">
                  <td className="px-6 py-2.5 text-slate-700">{item.label}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500">Biaya Operasional</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">Rp {item.amount.toLocaleString('id-ID')}</td>
                </tr>
              ))}

              {/* NET PROFIT */}
              <tr className="bg-success/15 font-black text-navy border-t-2 border-b-2 border-success/40">
                <td colSpan={2} className="px-4 py-4 uppercase tracking-wider text-sm">NET PROFIT (LABA BERSIH DENGAN MARGIN {netMargin}%)</td>
                <td className="px-4 py-4 text-right font-mono text-xl text-success">Rp {netProfit.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Pengesahan (Hanya Tampil saat Cetak) */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-8 text-xs font-semibold text-navy">
          <div className="text-center w-48">
            <p>Disiapkan Oleh,</p>
            <div className="h-16" />
            <p className="underline font-bold">Admin Keuangan</p>
            <p className="text-[10px] text-slate-500">Staf Divisi Finance</p>
          </div>
          <div className="text-center w-48">
            <p>Diperiksa & ACC Oleh,</p>
            <div className="h-16" />
            <p className="underline font-bold">Manager Divisi</p>
            <p className="text-[10px] text-slate-500">Superadmin Operasional</p>
          </div>
          <div className="text-center w-48">
            <p>Disetujui Oleh,</p>
            <div className="h-16" />
            <p className="underline font-bold">Executive Board (BOD)</p>
            <p className="text-[10px] text-slate-500">Direksi Perusahaan</p>
          </div>
        </div>
      </section>
    </div>
  );
}
