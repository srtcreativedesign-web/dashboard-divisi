import React, { useState } from 'react';
import { Trophy, ArrowUpDown, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import type { BodOverviewItem } from '../../api/bod';

export interface DivisionLeaderboardProps {
  divisions: BodOverviewItem[];
}

export function DivisionLeaderboard({ divisions }: DivisionLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'achievement' | 'revenue'>('achievement');

  const sortedData = [...divisions].sort((a, b) => {
    if (sortBy === 'achievement') {
      return b.target.achievement - a.target.achievement;
    }
    return (b.revenue.gross ?? 0) - (a.revenue.gross ?? 0);
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-black border border-amber-300 shadow-xs text-xs">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-800 font-black border border-slate-300 shadow-xs text-xs">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-black border border-amber-200 shadow-xs text-xs">
          🥉
        </span>
      );
    }
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-6 shadow-xs"
      data-testid="division-leaderboard"
    >
      {/* Header with Title and Sorting Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Leaderboard Kinerja 7 Divisi Ritel
            </h3>
            <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              Ranking Capaian
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-700 font-medium">
            Evaluasi progres realisasi terhadap target bulanan per unit bisnis
          </p>
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" /> Urutkan:
          </span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setSortBy('achievement')}
              className={`rounded-md px-2.5 py-1 font-bold transition-all ${
                sortBy === 'achievement'
                  ? 'bg-white text-navy shadow-xs border border-line/40'
                  : 'text-slate-700 font-medium hover:text-navy'
              }`}
              data-testid="sort-by-achievement"
            >
              % Capaian
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`rounded-md px-2.5 py-1 font-bold transition-all ${
                sortBy === 'revenue'
                  ? 'bg-white text-navy shadow-xs border border-line/40'
                  : 'text-slate-700 font-medium hover:text-navy'
              }`}
              data-testid="sort-by-revenue"
            >
              Nominal Omset
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="mt-4 space-y-3">
        {sortedData.map((d, index) => {
          const rank = index + 1;
          const grossRev = d.revenue.gross ?? 0;
          const targetVal = d.target.value;
          const pct = d.target.achievement;
          const isSurplus = grossRev >= targetVal;
          const gapNominal = Math.abs((grossRev - targetVal) / 1e6);
          const progressWidth = Math.min(Math.max(pct, 5), 100);

          let barColor = 'from-primary-500 to-sky-400';
          if (pct >= 100) {
            barColor = 'from-emerald-500 to-teal-400';
          } else if (pct < 85) {
            barColor = 'from-rose-500 to-amber-500';
          }

          return (
            <div
              key={d.divisionCode}
              className="group relative overflow-hidden rounded-xl border border-line/50 bg-white p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              data-testid={`leaderboard-item-${d.divisionCode}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Left: Rank, Division Name, Code */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  {getRankBadge(rank)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-navy group-hover:text-primary-700 transition-colors">
                        {d.divisionName}
                      </span>
                      <span className="rounded-pill bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {d.divisionCode}
                      </span>
                      {rank === 1 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800">
                          <Award className="h-3 w-3 text-amber-500" /> Juara 1
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                      Target: Rp {(targetVal / 1e6).toLocaleString('id-ID')} Jt
                    </p>
                  </div>
                </div>

                {/* Center: Realized Revenue */}
                <div className="text-left sm:text-right">
                  <span className="text-xs font-black text-navy">
                    Rp {(grossRev / 1e6).toLocaleString('id-ID')} Jt
                  </span>
                  <div className="flex items-center sm:justify-end gap-1 text-[11px]">
                    <span
                      className={`inline-flex items-center font-bold ${
                        isSurplus ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {isSurplus ? (
                        <>
                          <ArrowUpRight className="h-3 w-3" /> +Rp {gapNominal.toFixed(0)} Jt
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3" /> -Rp {gapNominal.toFixed(0)} Jt
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right: Achievement Percentage Badge */}
                <div className="shrink-0 text-right sm:min-w-[90px]">
                  <span
                    className={`inline-flex items-center justify-center rounded-pill px-2.5 py-1 text-xs font-black border ${
                      pct >= 100
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : pct >= 85
                        ? 'bg-primary-50 text-primary-800 border-primary-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="mt-2.5 relative h-2.5 w-full overflow-hidden rounded-pill bg-slate-100">
                <div
                  className={`h-full rounded-pill bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${progressWidth}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress pencapaian target ${d.divisionName}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
