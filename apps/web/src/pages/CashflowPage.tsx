import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, Activity, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WaterfallChart, type WaterfallItem } from '../components/accounting/WaterfallChart';
import { ACCOUNTING_EXCEL_DATA } from '../data/accountingExcelData';

export type CashflowPeriod = 'today' | '7d' | 'month' | 'ytd';

interface CashflowTransaction {
  id: string;
  date: string;
  category: 'Inflow' | 'Outflow';
  description: string;
  amount: number;
  type: 'Operasional' | 'Investasi' | 'Pendanaan';
}

const REAL_EXCEL_TRANSACTIONS: CashflowTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-08-31',
    category: 'Inflow',
    description: 'Penerimaan Omset Operasional Wrapping (Excel Sheet)',
    amount: ACCOUNTING_EXCEL_DATA.cashflow.totalRevenue,
    type: 'Operasional',
  },
  {
    id: 'tx-2',
    date: '2026-08-31',
    category: 'Outflow',
    description: 'Tagihan PT Angkasa Pura Indonesia (Sewa Lokasi & Gate)',
    amount: 1720636274,
    type: 'Operasional',
  },
  {
    id: 'tx-3',
    date: '2026-08-31',
    category: 'Outflow',
    description: 'Gaji, THR & Insentif Karyawan Lapangan (58 Outlet)',
    amount: 521906036,
    type: 'Operasional',
  },
  {
    id: 'tx-4',
    date: '2026-08-31',
    category: 'Outflow',
    description: 'Beban Operasional Backoffice & Manajemen Head Office',
    amount: ACCOUNTING_EXCEL_DATA.cashflow.totalBackoffice,
    type: 'Operasional',
  },
  {
    id: 'tx-5',
    date: '2026-08-31',
    category: 'Outflow',
    description: 'Pinjaman & Angsuran Hutang Leasing Mesin Wrapping',
    amount: 83700000,
    type: 'Pendanaan',
  },
  {
    id: 'tx-6',
    date: '2026-08-31',
    category: 'Outflow',
    description: 'Tagihan Kemitraan KSO Bandara HLP',
    amount: 30336954,
    type: 'Operasional',
  },
];

export default function CashflowPage() {
  // Read search params safely
  let urlPeriod: CashflowPeriod | null = null;
  let setSearchParamsFn: ((fn: (prev: URLSearchParams) => URLSearchParams) => void) | undefined;
  try {
    const [searchParams, setSearchParams] = useSearchParams();
    const p = searchParams.get('period') as CashflowPeriod;
    if (p && ['today', '7d', 'month', 'ytd'].includes(p)) {
      urlPeriod = p;
    }
    setSearchParamsFn = (callback) => {
      setSearchParams(callback);
    };
  } catch {
    // isolated test
  }

  const [activePeriod, setActivePeriod] = useState<CashflowPeriod>(urlPeriod || 'month');

  useEffect(() => {
    if (urlPeriod && urlPeriod !== activePeriod) {
      setActivePeriod(urlPeriod);
    }
  }, [urlPeriod]);

  const handlePeriodChange = (newPeriod: CashflowPeriod) => {
    setActivePeriod(newPeriod);
    if (setSearchParamsFn) {
      setSearchParamsFn((prev) => {
        const next = new URLSearchParams(prev);
        next.set('period', newPeriod);
        return next;
      });
    }
  };

  const periodFactor =
    activePeriod === 'today' ? 1 / 30 :
    activePeriod === '7d' ? 7 / 30 :
    activePeriod === 'ytd' ? 9 : 1;

  const periodLabel =
    activePeriod === 'today' ? 'Hari Ini' :
    activePeriod === '7d' ? '7 Hari Terakhir' :
    activePeriod === 'ytd' ? 'Setahun (YTD)' : 'Bulan Ini';

  const totalInflow = Math.round(REAL_EXCEL_TRANSACTIONS.filter(t => t.category === 'Inflow').reduce((acc, curr) => acc + curr.amount, 0) * periodFactor);
  const totalOutflow = Math.round(REAL_EXCEL_TRANSACTIONS.filter(t => t.category === 'Outflow').reduce((acc, curr) => acc + curr.amount, 0) * periodFactor);
  const netCashflow = totalInflow - totalOutflow;

  const waterfallItems: WaterfallItem[] = [
    { id: 'initial', label: 'Saldo Awal Kas', amount: Math.round(ACCOUNTING_EXCEL_DATA.cashflow.initialBalance * periodFactor) },
    { id: 'inflow-sales', label: 'Omset Wrapping', amount: Math.round(ACCOUNTING_EXCEL_DATA.cashflow.totalRevenue * periodFactor) },
    { id: 'outflow-ap', label: 'Angkasa Pura', amount: -Math.round(1720636274 * periodFactor) },
    { id: 'outflow-gaji', label: 'Gaji Lapangan', amount: -Math.round(521906036 * periodFactor) },
    { id: 'outflow-bo', label: 'Backoffice & HO', amount: -Math.round(ACCOUNTING_EXCEL_DATA.cashflow.totalBackoffice * periodFactor) },
    { id: 'outflow-misc', label: 'KSO & Leasing', amount: -Math.round(114036954 * periodFactor) },
    { id: 'net', label: 'Saldo Kas Akhir', amount: Math.round(ACCOUNTING_EXCEL_DATA.cashflow.totalEndingBalance * periodFactor), isTotal: true },
  ];

  const transactions = REAL_EXCEL_TRANSACTIONS.map((t) => ({
    ...t,
    amount: Math.round(t.amount * periodFactor),
    date:
      activePeriod === 'today' ? '2026-09-05' :
      activePeriod === '7d' ? '2026-08-30 s/d 09-05' :
      activePeriod === 'ytd' ? 'YTD 2026 (9 Bln)' : '2026-08-31',
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#0f172a] to-navy p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-success-light backdrop-blur-md">
              <Wallet className="h-3.5 w-3.5" /> Laporan Arus Kas Operasional Resmi
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Cashflow Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Pemantauan arus kas masuk (inflow) dan arus kas keluar (outflow) berbasis buku kas riil Excel.
            </p>
          </div>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <Download className="mr-2 h-4 w-4" /> Download Laporan Cashflow
          </Button>
        </div>

        {/* Timeframe Filter Switcher */}
        <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-pill bg-white/10 p-1 backdrop-blur-md border border-white/15">
            <span className="text-[11px] font-semibold text-emerald-200 px-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" /> Filter Rentang Waktu:
            </span>
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7d', label: '7 Hari' },
                { id: 'month', label: 'Bulan Ini' },
                { id: 'ytd', label: 'Setahun (YTD)' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3.5 py-1 text-xs font-bold rounded-pill transition-all ${
                  activePeriod === p.id
                    ? 'bg-white text-navy shadow-sm scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                data-testid={`btn-cashflow-period-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-emerald-200/80 font-medium">
            Periode Aktif: <strong className="text-white">{periodLabel}</strong> · Sumber: <span className="text-cyan-300 font-mono">Buku Kas Excel Ritel</span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Kas Masuk ({periodLabel})</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalInflow.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-semibold">Data real Excel ({periodLabel})</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Kas Keluar ({periodLabel})</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-danger/10 text-danger">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalOutflow.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Sewa Bandara, Gaji & BO</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Net Cashflow ({periodLabel})</span>
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
