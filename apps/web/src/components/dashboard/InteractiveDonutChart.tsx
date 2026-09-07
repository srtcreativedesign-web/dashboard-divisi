import React, { useState } from 'react';
import { PieChart } from 'lucide-react';

export interface DonutSlice {
  label: string;
  code: string;
  value: number;
  color: string;
}

export interface InteractiveDonutChartProps {
  data: DonutSlice[];
}

export function InteractiveDonutChart({ data }: InteractiveDonutChartProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  let cumulativePercent = 0;

  const activeItem = hoveredCode ? data.find((d) => d.code === hoveredCode) : null;
  const activePercentage = activeItem && total > 0 ? (activeItem.value / total) * 100 : null;

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-6 shadow-xs flex flex-col items-center"
      data-testid="interactive-donut-chart"
    >
      <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary-600" />
            Distribusi Kontribusi Omset
          </h3>
          <p className="mt-0.5 text-xs text-slate-700 font-medium">
            Porsi pendapatan masing-masing divisi terhadap total grup
          </p>
        </div>
        <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
          7 Divisi
        </span>
      </div>

      {/* SVG Donut */}
      <div className="relative w-full aspect-square max-w-[240px] my-2 flex items-center justify-center select-none">
        <svg
          viewBox="-1.2 -1.2 2.4 2.4"
          className="w-full h-full transform -rotate-90 overflow-visible"
          aria-label="Grafik Donat Kontribusi Omset Divisi"
          role="img"
        >
          {data.map((item) => {
            if (item.value === 0 || total === 0) return null;
            const startPercent = cumulativePercent;
            const slicePercent = item.value / total;
            cumulativePercent += slicePercent;
            const endPercent = cumulativePercent;

            const [startX, startY] = getCoordinatesForPercent(startPercent);
            const [endX, endY] = getCoordinatesForPercent(endPercent);
            const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
            const pathData = [
              `M ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            ].join(' ');

            const isHovered = hoveredCode === item.code;
            const isAnyHovered = hoveredCode !== null;

            return (
              <path
                key={item.code}
                d={pathData}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? 0.44 : 0.36}
                strokeOpacity={isAnyHovered && !isHovered ? 0.4 : 1}
                className="cursor-pointer transition-all duration-200 ease-out"
                onMouseEnter={() => setHoveredCode(item.code)}
                onMouseLeave={() => setHoveredCode(null)}
                data-testid={`donut-slice-${item.code}`}
              />
            );
          })}
        </svg>

        {/* Dynamic Center Label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3"
          data-testid="donut-center-label"
        >
          {activeItem && activePercentage !== null ? (
            <div className="animate-fade-in-up">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {activeItem.label}
              </span>
              <span className="block text-base font-black text-navy mt-0.5">
                Rp {(activeItem.value / 1e9).toFixed(2)} M
              </span>
              <span className="inline-block mt-0.5 text-[10px] font-bold rounded-pill bg-primary-50 px-2 py-0.5 text-primary-700 border border-primary-200">
                {activePercentage.toFixed(1)}% Kontribusi
              </span>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                Total Omset
              </span>
              <span className="block text-xl font-black text-navy mt-0.5">
                Rp {(total / 1e9).toFixed(2)} M
              </span>
              <span className="block text-[10px] font-bold text-slate-700 mt-0.5">
                7 Divisi Ritel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="mt-4 w-full grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {data.map((item) => {
          const isHovered = hoveredCode === item.code;
          const sharePct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

          return (
            <button
              key={item.code}
              type="button"
              onMouseEnter={() => setHoveredCode(item.code)}
              onMouseLeave={() => setHoveredCode(null)}
              onClick={() => setHoveredCode(hoveredCode === item.code ? null : item.code)}
              className={`flex items-center justify-between gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                isHovered
                  ? 'bg-primary-50/80 border-primary-300 shadow-xs'
                  : 'bg-transparent border-transparent hover:bg-slate-50'
              }`}
              data-testid={`donut-legend-${item.code}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate font-semibold text-slate-700 text-[11px]">
                  {item.label}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-slate-700">
                {sharePct}%
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
