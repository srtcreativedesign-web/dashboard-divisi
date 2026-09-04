import React, { useId } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Building2, Scale } from 'lucide-react';

export interface ReconciliationMatchGaugeProps {
  totalBank: number;
  totalCashflow: number;
  variance: number;
  isMatched: boolean;
  totalAccounts?: number;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 2,
  }).format(val);

export function ReconciliationMatchGauge({
  totalBank,
  totalCashflow,
  variance,
  isMatched,
  totalAccounts = 31,
}: ReconciliationMatchGaugeProps) {
  const gradientId = useId();

  // Hitung persentase kecocokan (Match Rate)
  const baseDenominator = Math.max(totalBank, totalCashflow, 1);
  const rawMatchRate = 100 - (Math.abs(variance) / baseDenominator) * 100;
  const matchRate = Math.min(Math.max(rawMatchRate, 0), 100);

  // Parameter Busur Geometri Gauge Semicircle
  const cx = 100;
  const cy = 95;
  const r = 70;
  const arcLength = Math.PI * r; // ~219.9
  const dashOffset = arcLength * (1 - matchRate / 100);

  // Sudut Jarum Indikator (-180 deg di kiri, 0 deg di kanan)
  const needleAngle = -180 + (matchRate / 100) * 180;

  // Warna dinamis
  let gaugeColor = '#10b981'; // Emerald
  let badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let statusText = 'Rekonsiliasi Sempurna (Klop)';
  if (!isMatched && matchRate < 98) {
    gaugeColor = '#e11d48'; // Rose
    badgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
    statusText = 'Selisih Perlu Rekonsiliasi';
  } else if (!isMatched || matchRate < 99.9) {
    gaugeColor = '#f59e0b'; // Amber
    badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
    statusText = 'Toleransi Desimal Kecil';
  }

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/95 backdrop-blur-md p-5 shadow-xs"
      data-testid="reconciliation-match-gauge-section"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary-600" />
              Match Reconciliation Gauge (Meteran Pencocokan Kas)
            </h3>
            <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold border ${badgeBg}`}>
              {statusText}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            Tingkat akurasi pencocokan saldo 31 rekening koran bank terhadap buku kas arus kas
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-navy self-start sm:self-auto bg-slate-100 px-3 py-1.5 rounded-lg">
          <Building2 className="h-4 w-4 text-slate-500" />
          <span>{totalAccounts} Rekening Bank Operasional</span>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-12 items-center">
        {/* Semicircle Gauge Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[240px] aspect-[2/1.3] flex items-center justify-center">
            <svg
              viewBox="0 0 200 125"
              className="w-full h-full overflow-visible select-none"
              aria-label="Meteran Rekonsiliasi Bank"
              role="img"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="60%" stopColor={gaugeColor} />
                  <stop offset="100%" stopColor={gaugeColor} />
                </linearGradient>
              </defs>

              {/* Background Track Arc */}
              <path
                d="M 30 95 A 70 70 0 0 1 170 95"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Colored Progress Arc */}
              <path
                d="M 30 95 A 70 70 0 0 1 170 95"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${arcLength}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700 ease-out"
              />

              {/* Needle Indicator */}
              <g
                transform={`rotate(${needleAngle} ${cx} ${cy})`}
                className="transition-all duration-700 ease-out"
              >
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + r - 12}
                  y2={cy}
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
                <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
              </g>

              {/* Min & Max Labels */}
              <text x="30" y="115" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
                0%
              </text>
              <text x="170" y="115" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
                100%
              </text>
            </svg>
          </div>

          {/* Center Readout Text */}
          <div className="text-center mt-1">
            <span
              className="text-3xl font-black tracking-tight text-navy"
              data-testid="match-percentage-text"
            >
              {matchRate.toFixed(2)}%
            </span>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Tingkat Kecocokan (Klop)
            </p>
          </div>
        </div>

        {/* Accompanying Stats Cards */}
        <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line/60 bg-slate-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Saldo Bank (31 Rekening)
            </span>
            <p className="mt-1.5 text-lg font-black text-navy">{rupiah(totalBank)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Rangkuman Rekening Koran</p>
          </div>

          <div className="rounded-xl border border-line/60 bg-slate-50/50 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Saldo Buku Kas
            </span>
            <p className="mt-1.5 text-lg font-black text-navy">{rupiah(totalCashflow)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Buku Besar Kas &amp; Bank</p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              isMatched ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Selisih / Variance
            </span>
            <p
              className={`mt-1.5 text-lg font-black ${
                isMatched ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {rupiah(variance)}
            </p>
            <p className="text-[11px] font-bold mt-0.5 text-slate-600">
              {isMatched ? '✓ Toleransi Aman (< Rp 1)' : 'Perlu Investigasi Entri'}
            </p>
          </div>

          <div className="rounded-xl border border-line/60 bg-emerald-50/20 border-emerald-100 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">Kesiapan Penutupan</p>
              <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                Siap untuk Persetujuan &amp; Closing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
