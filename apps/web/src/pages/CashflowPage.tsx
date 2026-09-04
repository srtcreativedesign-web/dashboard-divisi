import { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Activity, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WaterfallChart, type WaterfallItem } from '../components/accounting/WaterfallChart';

interface CashflowTransaction {
  id: string;
  date: string;
  category: 'Inflow' | 'Outflow';
  description: string;
  amount: number;
  type: 'Operasional' | 'Investasi' | 'Pendanaan';
}

const INITIAL_TRANSACTIONS: CashflowTransaction[] = [
  { id: '1', date: '2026-09-03', category: 'Inflow', description: 'Penerimaan Penjualan Harian Tenant', amount: 145000000, type: 'Operasional' },
  { id: '2', date: '2026-09-02', category: 'Outflow', description: 'Pembayaran Listrik & Utility Mal', amount: 35000000, type: 'Operasional' },
  { id: '3', date: '2026-09-01', category: 'Inflow', description: 'Pembayaran Sewa Tenant Bulanan', amount: 350000000, type: 'Operasional' },
  { id: '4', date: '2026-08-30', category: 'Outflow', description: 'Gaji Karyawan Operasional Q3', amount: 210000000, type: 'Operasional' },
  { id: '5', date: '2026-08-28', category: 'Outflow', description: 'Pembelian Perangkat POS Baru', amount: 45000000, type: 'Investasi' },
];

export default function CashflowPage() {
  const [transactions] = useState<CashflowTransaction[]>(INITIAL_TRANSACTIONS);

  const totalInflow = transactions.filter(t => t.category === 'Inflow').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutflow = transactions.filter(t => t.category === 'Outflow').reduce((acc, curr) => acc + curr.amount, 0);
  const netCashflow = totalInflow - totalOutflow;

  const waterfallItems: WaterfallItem[] = [
    { id: 'inflow-sewa', label: 'Sewa Tenant', amount: 350000000 },
    { id: 'inflow-sales', label: 'Sales Harian', amount: 145000000 },
    { id: 'outflow-gaji', label: 'Gaji Karyawan', amount: -210000000 },
    { id: 'outflow-pos', label: 'Perangkat POS', amount: -45000000 },
    { id: 'outflow-util', label: 'Listrik & Utilitas', amount: -35000000 },
    { id: 'net', label: 'Net Cashflow', amount: netCashflow, isTotal: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#0f172a] to-navy p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-success-light backdrop-blur-md">
              <Wallet className="h-3.5 w-3.5" /> Laporan Arus Kas Operasional
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Cashflow Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Pemantauan arus kas masuk (inflow) dan arus kas keluar (outflow) real-time.
            </p>
          </div>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <Download className="mr-2 h-4 w-4" /> Download Laporan Cashflow
          </Button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Kas Masuk (Inflow)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalInflow.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-semibold">+18.5% Periode Ini</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Kas Keluar (Outflow)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-danger/10 text-danger">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalOutflow.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Operasional & Investasi</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Net Cashflow</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {netCashflow.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-bold">Surplus Kas</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Likuiditas Kas</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-info/10 text-info">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-navy">Sangat Sehat</p>
          <p className="mt-1 text-xs text-slate-500">Rasio Kas 2.4x</p>
        </article>
      </section>

      {/* Waterfall Chart Arus Kas */}
      <WaterfallChart
        title="Waterfall Chart Arus Kas Operasional"
        subtitle="Dinamika penerimaan sewa & penjualan terhadap pengeluaran operasional ritel"
        items={waterfallItems}
      />

      {/* Cashflow Table */}
      <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">Mutasi & Transaksi Kas Terbaru</h2>
        <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Tipe Arus Kas</th>
                <th className="px-4 py-3.5">Deskripsi Transaksi</th>
                <th className="px-4 py-3.5 text-center">Kategori</th>
                <th className="px-4 py-3.5 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-medium">
              {transactions.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-navy font-bold">{item.date}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">{item.type}</td>
                  <td className="px-4 py-3 font-medium text-navy">{item.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold ${
                      item.category === 'Inflow' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                    }`}>
                      {item.category === 'Inflow' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${item.category === 'Inflow' ? 'text-success' : 'text-danger'}`}>
                    {item.category === 'Inflow' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
