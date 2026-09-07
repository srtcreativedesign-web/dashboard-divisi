import React from 'react';
import { Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { type PeriodSummary } from '../../data/dashboardPeriodData';
import { type PeriodFilterOption } from '../filters/StickyContextFilterBar';

export interface OperationalKpiCardsProps {
  periodData: PeriodSummary;
  activePeriod: PeriodFilterOption;
  userDivision?: string | null;
  role: 'MANAGER' | 'ADMIN' | 'PIC';
  pendingCount?: number;
  pendingNominal?: number;
  approvalRate?: number;
}

function formatNominal(val: number): string {
  if (Math.abs(val) >= 1e9) {
    const m = val / 1e9;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)} M`;
  }
  if (Math.abs(val) >= 1e6) {
    const jt = val / 1e6;
    return `${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)} Jt`;
  }
  return val.toLocaleString('id-ID');
}

export function OperationalKpiCards({
  periodData,
  activePeriod,
  userDivision,
  role,
  pendingCount = 0,
  pendingNominal = 0,
  approvalRate = 96.8,
}: OperationalKpiCardsProps) {
  const allocationLabel =
    activePeriod === 'month'
      ? 'alokasi bulan ini'
      : activePeriod === '7d'
      ? 'alokasi 7 hari terakhir'
      : activePeriod === 'ytd'
      ? 'alokasi tahun berjalan'
      : 'alokasi hari ini';

  const recordedLabel =
    activePeriod === 'today'
      ? 'tercatat hari ini'
      : activePeriod === '7d'
      ? 'tercatat 7 hari terakhir'
      : activePeriod === 'ytd'
      ? 'tercatat YTD'
      : 'tercatat s/d hari ini';

  const scopeBadge =
    role === 'MANAGER'
      ? `${userDivision ?? 'Semua Divisi'} · ${periodData.adminMetrics.targetBadge}`
      : role === 'ADMIN'
      ? `${userDivision ?? 'Divisi'} · ${periodData.adminMetrics.targetBadge}`
      : `${userDivision ?? 'Seluruh Unit'} · ${periodData.adminMetrics.targetBadge}`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Card 1: Target Divisi Berdasarkan Periode */}
      <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {periodData.adminMetrics.targetLabel}
            </span>
            <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-200">
              {scopeBadge}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-2xl font-black text-navy">
              Rp {formatNominal(periodData.adminMetrics.targetNominal)}
            </p>
            <span className="text-xs font-medium text-slate-500">
              {allocationLabel}
            </span>
          </div>
        </div>

        {/* Visual Pacing & Target Operasional */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-sky-600" /> {periodData.adminMetrics.pacingLabel}
            </span>
            <span className="font-bold text-navy">{periodData.adminMetrics.pacingDetail}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(periodData.adminMetrics.pacingValue, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Pacing Operasional</span>
            <span className="text-sky-700 font-semibold">{periodData.adminMetrics.pacingRemaining}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Realisasi Divisi Berjalan */}
      <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Realisasi Omset Berjalan
            </span>
            <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" /> {periodData.adminMetrics.realisasiPct.toFixed(1)}% Capaian
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-2xl font-black text-emerald-800">
              Rp {formatNominal(periodData.adminMetrics.realisasiNominal)}
            </p>
            <span className="text-xs font-medium text-slate-500">
              {recordedLabel}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Capaian & Gap to Target */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Progres terhadap Target</span>
            <span className="font-bold text-emerald-800 font-mono">
              {periodData.adminMetrics.realisasiPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${Math.min(periodData.adminMetrics.realisasiPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-slate-500">
              {periodData.adminMetrics.gapNominal < 0 ? (
                <>
                  Sisa Gap: <strong className="text-rose-600 font-semibold font-mono">-Rp {formatNominal(Math.abs(periodData.adminMetrics.gapNominal))}</strong>
                </>
              ) : (
                <>
                  Surplus: <strong className="text-emerald-700 font-semibold font-mono">+Rp {formatNominal(periodData.adminMetrics.gapNominal)}</strong>
                </>
              )}
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
              {periodData.adminMetrics.realisasiPct >= 100 ? (role === 'ADMIN' ? 'Surplus Target' : 'Surplus') : 'On Track'}
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Contextual Status per Role */}
      {role === 'MANAGER' ? (
        <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Antrean ACC Pending
              </span>
              <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                {pendingCount} Laporan
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-navy">{pendingCount} Berkas</p>
              <span className="text-xs font-medium text-slate-500">
                (Rp {(pendingNominal / 1e6).toLocaleString('id-ID')} Jt)
              </span>
            </div>
          </div>

          {/* Visual Antrean & SLA */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Approval Rate</span>
              <span className="font-bold text-emerald-800 font-mono">{approvalRate.toFixed(1)}% (Target 95%)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(approvalRate, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Prioritas: Cepat</span>
              <span className="text-emerald-700 font-semibold">SLA: &lt; 24 Jam</span>
            </div>
          </div>
        </div>
      ) : role === 'PIC' ? (
        <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Pengawasan
              </span>
              <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                Aktif
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <p className="text-2xl font-black text-navy">100% Real-Time</p>
              <span className="text-xs font-medium text-slate-500">live stream audit</span>
            </div>
          </div>

          {/* Visual Kepatuhan */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Kepatuhan SOP Input</span>
              <span className="font-bold text-emerald-800 font-mono">98.2% Tertib</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.2%' }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Audit Kepatuhan: Prima</span>
              <span className="text-emerald-700 font-semibold">Tervalidasi Sobat</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Status Laporan Operasional
              </span>
              <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                {activePeriod === 'today' ? 'Hari Ini' : activePeriod === '7d' ? '7 Hari' : activePeriod === 'ytd' ? 'YTD' : 'Bulan Ini'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <span className="text-base font-bold text-navy">{periodData.adminMetrics.reportStatus}</span>
                <p className="text-[11px] text-slate-500">{periodData.adminMetrics.reportStatusDetail}</p>
              </div>
            </div>
          </div>

          {/* Visual Kelengkapan Shift */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Kelengkapan Shift Kasir</span>
              <span className="font-bold text-emerald-800">100% (Pagi & Sore)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Settlement EDC: <strong className="text-slate-700">Klop</strong></span>
              <span className="text-emerald-700 font-semibold">Tervalidasi ACC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
