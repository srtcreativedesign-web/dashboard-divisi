import React from 'react';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  height?: number;
  className?: string;
  showValues?: boolean;
  onBarClick?: (item: BarChartData, index: number) => void;
  activeLabel?: string;
}

export function BarChart({
  data,
  height = 140,
  className = '',
  showValues = true,
  onBarClick,
  activeLabel,
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barAreaHeight = Math.max(60, height - 44);

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Bars area */}
      <div
        className="relative w-full flex items-end justify-around gap-2 pt-5 pb-1"
        style={{ height: `${barAreaHeight}px` }}
      >
        {/* Subtle Horizontal Grid Lines */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="w-full border-b border-dashed border-line" />
          <div className="w-full border-b border-dashed border-line" />
          <div className="w-full border-b border-line" />
        </div>

        {data.map((d, idx) => {
          const heightPercent = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          const isActive = !!activeLabel && activeLabel.toLowerCase() === d.label.toLowerCase();
          const isClickable = !!onBarClick;

          return (
            <div
              key={idx}
              onClick={() => onBarClick?.(d, idx)}
              className={`flex-1 flex flex-col items-center justify-end h-full z-10 transition-all ${
                isClickable ? 'cursor-pointer group' : ''
              }`}
            >
              {/* Value label on top of bar */}
              {showValues && (
                <span
                  className={`text-[11px] font-bold mb-1 transition-all tabular-nums ${
                    isActive
                      ? 'text-primary-600 scale-110 font-extrabold'
                      : 'text-muted group-hover:text-navy group-hover:-translate-y-0.5'
                  }`}
                >
                  {d.value}
                </span>
              )}

              {/* Bar column track */}
              <div
                className={`w-full max-w-[48px] sm:max-w-[64px] h-full bg-surface/80 rounded-t-md relative flex items-end justify-center overflow-hidden border transition-all ${
                  isActive
                    ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/30'
                    : 'border-line/70 group-hover:border-slate-300 group-hover:bg-slate-200/40'
                }`}
              >
                {/* Colored fill */}
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: d.color || '#0284c7',
                    opacity: isActive ? 1 : 0.9,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-around items-start text-center mt-2.5 gap-2 border-t border-line/60 pt-2">
        {data.map((d, idx) => {
          const isActive = !!activeLabel && activeLabel.toLowerCase() === d.label.toLowerCase();
          return (
            <div
              key={idx}
              onClick={() => onBarClick?.(d, idx)}
              className={`flex-1 flex flex-col items-center text-center px-0.5 ${
                onBarClick ? 'cursor-pointer group' : ''
              }`}
            >
              <span
                className={`text-xs transition-colors truncate max-w-full ${
                  isActive
                    ? 'text-primary-700 dark:text-primary-300 font-bold'
                    : 'text-muted font-medium group-hover:text-navy'
                }`}
                title={d.label}
              >
                {d.label}
              </span>
              {d.subLabel && (
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {d.subLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
