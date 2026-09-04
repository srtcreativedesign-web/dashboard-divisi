import React from 'react';
import { DollarSign, Target, Activity, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SparklineSvg } from './SparklineSvg';

export interface ExecutiveKpiCardsProps {
  totalRevenue: number;
  totalTarget: number;
  achievementPct: number;
  workforceCount: number;
  sparklines?: {
    revenue?: number[];
    target?: number[];
    margin?: number[];
    workforce?: number[];
  };
}

export function ExecutiveKpiCards({
  totalRevenue,
  totalTarget,
  achievementPct,
  workforceCount,
  sparklines,
}: ExecutiveKpiCardsProps) {
  // Default mock 7-day sparkline trend data if not provided
  const revSparkline = sparklines?.revenue ?? [1850, 1920, 2050, 2180, 2100, 2240, 2350];
  const targetSparkline = sparklines?.target ?? [92, 94, 98, 97, 101, 103, 102.1];
  const marginSparkline = sparklines?.margin ?? [22.4, 23.1, 23.5, 24.0, 24.2, 24.5, 24.8];
  const workforceSparkline = sparklines?.workforce ?? [72, 74, 76, 78, 79, 80.5, 81.7];

  const isSurplus = totalRevenue >= totalTarget;
  const gapNominal = Math.abs((totalRevenue - totalTarget) / 1e6);
  const estimatedProfit = totalRevenue * 0.248; // 24.8% estimated blended net margin
  const productivityPerHead = workforceCount > 0 ? totalRevenue / workforceCount / 1e6 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="executive-kpi-cards">
      {/* Card 1: Omset Realisasi */}
      <div className="group relative overflow-hidden rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Realisasi Omset
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
                Rp {(totalRevenue / 1e9).toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-700">M</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100 transition-colors group-hover:bg-primary-100">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-pill bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
            <ArrowUpRight className="h-3.5 w-3.5" /> +14.8%
          </span>
          <span className="truncate text-slate-700 font-medium">vs bulan lalu</span>
        </div>

        {/* Micro Sparkline */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
            <span>Tren 7 Hari</span>
            <span className="font-semibold text-primary-700">Aktual</span>
          </div>
          <SparklineSvg data={revSparkline} color="#0284c7" height={32} />
        </div>
      </div>

      {/* Card 2: Capaian Target */}
      <div className="group relative overflow-hidden rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-300">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Capaian Target
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isSurplus ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {achievementPct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              isSurplus
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 group-hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-200 group-hover:bg-rose-100'
            }`}
          >
            <Target className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-bold border ${
              isSurplus
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {isSurplus ? (
              <>
                <ArrowUpRight className="h-3.5 w-3.5" /> +{(achievementPct - 100).toFixed(1)}% Surplus
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3.5 w-3.5" /> {(achievementPct - 100).toFixed(1)}% Defisit
              </>
            )}
          </span>
          <span className="truncate text-slate-700 font-medium">
            {isSurplus ? '+' : '-'}Rp {gapNominal.toFixed(0)} Jt
          </span>
        </div>

        {/* Micro Sparkline */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
            <span>Target: Rp {(totalTarget / 1e9).toFixed(2)} M</span>
            <span className="font-semibold text-emerald-800">Capaian</span>
          </div>
          <SparklineSvg
            data={targetSparkline}
            color={isSurplus ? '#059669' : '#e11d48'}
            height={32}
          />
        </div>
      </div>

      {/* Card 3: Margin Laba Bersih */}
      <div className="group relative overflow-hidden rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-sky-300">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Estimasi Margin Laba
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
                24.8%
              </span>
              <span className="text-xs font-bold text-slate-700">
                (Rp {(estimatedProfit / 1e9).toFixed(2)} M)
              </span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 transition-colors group-hover:bg-sky-100">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-pill bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
            <ArrowUpRight className="h-3.5 w-3.5" /> +1.8% MoM
          </span>
          <span className="truncate text-slate-700 font-medium">Batas aman &gt; 18%</span>
        </div>

        {/* Micro Sparkline */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
            <span>Stabilitas Margin</span>
            <span className="font-semibold text-sky-600">Sehat</span>
          </div>
          <SparklineSvg data={marginSparkline} color="#0284c7" height={32} />
        </div>
      </div>

      {/* Card 4: Produktivitas SDM */}
      <div className="group relative overflow-hidden rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Produktivitas SDM
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
                Rp {productivityPerHead.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-700">Jt/Org</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 transition-colors group-hover:bg-indigo-100">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-pill bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
            <ArrowUpRight className="h-3.5 w-3.5" /> +5.4%
          </span>
          <span className="truncate text-slate-700 font-medium">{workforceCount} Karyawan Aktif</span>
        </div>

        {/* Micro Sparkline */}
        <div className="mt-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
            <span>Rata-rata Output</span>
            <span className="font-semibold text-indigo-600">Optimal</span>
          </div>
          <SparklineSvg data={workforceSparkline} color="#6366f1" height={32} />
        </div>
      </div>
    </div>
  );
}
