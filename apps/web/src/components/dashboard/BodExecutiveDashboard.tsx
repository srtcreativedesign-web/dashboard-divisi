import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { bodApi, type BodOverviewItem } from '../../api/bod';
import { ExecutiveKpiCards } from './ExecutiveKpiCards';
import { DualToneAreaChart } from './DualToneAreaChart';
import { DivisionLeaderboard } from './DivisionLeaderboard';
import { InteractiveDonutChart, type DonutSlice } from './InteractiveDonutChart';
import { getPeriodSummary } from '../../data/dashboardPeriodData';
import { type PeriodFilterOption } from '../filters/StickyContextFilterBar';

export default function BodExecutiveDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPeriod = searchParams.get('period');
  const activePeriod: PeriodFilterOption =
    rawPeriod && ['today', '7d', 'month', 'ytd'].includes(rawPeriod)
      ? (rawPeriod as PeriodFilterOption)
      : 'month';
  const activeDivision = searchParams.get('divisionCode') || 'ALL';

  const periodSummary = getPeriodSummary(activePeriod, activeDivision);

  const handlePeriodChange = (newPeriod: 'today' | '7d' | 'month' | 'ytd') => {
    const next = new URLSearchParams(searchParams);
    if (newPeriod !== 'month') {
      next.set('period', newPeriod);
    } else {
      next.delete('period');
    }
    setSearchParams(next);
  };

  const { data: rawData, isLoading } = useQuery<BodOverviewItem[]>({
    queryKey: ['bod', 'overview', activePeriod, activeDivision],
    queryFn: () => bodApi.overview().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Gunakan data periode terpilih (7d, today, month, ytd)
  const data = (rawData && rawData.length > 0 && activePeriod === 'month' && activeDivision === 'ALL')
    ? rawData
    : periodSummary.divisions;

  // Computations
  const totalRevenue = periodSummary.totalRevenue;
  const totalTarget = periodSummary.totalTarget;
  const achievementPct = periodSummary.achievementPct;
  const totalWorkforce = periodSummary.totalWorkforce;

  // Donut data mapping
  const colorMap: Record<string, string> = {
    WRAP: '#0284c7', // Sky ocean
    CELL: '#0ea5e9', // Cyan
    MINI: '#10b981', // Emerald
    FNB: '#f59e0b',  // Amber
    REFL: '#8b5cf6', // Purple
    MC: '#06b6d4',   // Teal
    ACC: '#6366f1',  // Indigo
  };

  const donutData: DonutSlice[] = data.map((d) => ({
    label: d.divisionName,
    code: d.divisionCode,
    value: d.revenue.gross ?? 0,
    color: colorMap[d.divisionCode] ?? '#64748b',
  }));

  // Top & Bottom performers
  const sortedByAchievement = [...data].sort(
    (a, b) => b.target.achievement - a.target.achievement
  );
  const topPerformers = sortedByAchievement.slice(0, 3);
  const bottomPerformers = sortedByAchievement.slice(-3).reverse();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-loading">
        <div className="h-32 bg-slate-100 rounded-card-lg border border-line/40" />
        <div className="grid md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 rounded-card-lg" />
          <div className="h-28 bg-slate-100 rounded-card-lg" />
          <div className="h-28 bg-slate-100 rounded-card-lg" />
          <div className="h-28 bg-slate-100 rounded-card-lg" />
        </div>
        <div className="h-72 bg-slate-100 rounded-card-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="bod-executive-dashboard">
      {/* 1. Header Ringkasan Konsolidasi BOD */}
      <section className="rounded-card-lg border border-line/60 bg-gradient-to-r from-sky-50 via-white to-sky-50/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-navy">
                  Executive Performance Matrix (Konsolidasi Direksi)
                </h2>
                <p className="text-xs text-slate-700 font-medium">
                  Pengawasan omzet, target bulanan, efisiensi margin, dan produktivitas 7 divisi ritel
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className="rounded-pill bg-white px-3 py-1 text-xs font-bold text-navy border border-line/60 shadow-xs"
              data-testid="bod-period-badge"
            >
              Periode: {periodSummary.periodLabel}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Executive KPI Cards dengan Micro-Sparklines */}
      <ExecutiveKpiCards
        totalRevenue={totalRevenue}
        totalTarget={totalTarget}
        achievementPct={achievementPct}
        workforceCount={totalWorkforce}
      />

      {/* 3. Dual-Tone Gradient Area Chart */}
      <DualToneAreaChart
        activePeriod={activePeriod}
        onPeriodChange={handlePeriodChange}
        dataOverride={periodSummary.chartPoints}
      />

      {/* 4. Division Leaderboard & Interactive Donut Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DivisionLeaderboard divisions={data} />
        </div>
        <div className="lg:col-span-1">
          <InteractiveDonutChart data={donutData} />
        </div>
      </div>

      {/* 5. Top & Bottom Performers Highlight Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 3 Performers */}
        <section
          className="rounded-card-lg border border-emerald-200 bg-emerald-50/30 p-6 shadow-xs"
          data-testid="top-performers-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Top 3 Divisi Berkinerja Unggul
            </h3>
            <span className="rounded-pill bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Melebihi Target
            </span>
          </div>

          <div className="space-y-3">
            {topPerformers.map((d, i) => (
              <div
                key={d.divisionCode}
                className="flex items-center justify-between rounded-card border border-emerald-100 bg-white p-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-navy text-sm">{d.divisionName}</p>
                    <p className="text-[11px] text-slate-700 font-medium">
                      Omset: Rp {((d.revenue.gross ?? 0) / 1e6).toLocaleString('id-ID')} Jt
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-pill bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 border border-emerald-200">
                    {d.target.achievement.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 Divisi Perlu Perhatian */}
        <section
          className="rounded-card-lg border border-rose-200 bg-rose-50/30 p-6 shadow-xs"
          data-testid="bottom-performers-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              3 Divisi Perlu Akselerasi
            </h3>
            <span className="rounded-pill bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
              Perlu Evaluasi
            </span>
          </div>

          <div className="space-y-3">
            {bottomPerformers.map((d) => {
              const gapJt = Math.abs((d.target.value - (d.revenue.gross ?? 0)) / 1e6);
              return (
                <div
                  key={d.divisionCode}
                  className="flex items-center justify-between rounded-card border border-rose-100 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-800 font-black text-xs">
                      !
                    </span>
                    <div>
                      <p className="font-bold text-navy text-sm">{d.divisionName}</p>
                      <p className="text-[11px] text-slate-700 font-medium">
                        Kekurangan: -Rp {gapJt.toLocaleString('id-ID')} Jt
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-pill bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-800 border border-rose-200">
                      {d.target.achievement.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
