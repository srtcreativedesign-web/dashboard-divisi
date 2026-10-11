import React from 'react';

export interface LineChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartProps {
  data: LineChartData[];
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
  className?: string;
}

export function LineChart({
  data,
  height = 100,
  showDots = true,
  showGrid = false,
  className = '',
}: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;
  const width = 100;
  const chartHeight = height - 24;
  const stepX = data.length > 1 ? (width / (data.length - 1)) : 0;

  const points = data.map((d, idx) => {
    const x = data.length > 1 ? idx * stepX : 50;
    const y = chartHeight - ((d.value - minValue) / range) * chartHeight + (height - chartHeight);
    return { x, y, label: d.label, value: d.value, color: d.color || '#0284c7' };
  });

  const path = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[70px]" preserveAspectRatio="xMidYMid meet">
        {showGrid && (
          <g stroke="var(--color-line)" strokeWidth="0.2" fill="none">
            {[0, 1, 2].map((i) => {
              const y = (i * chartHeight) / 2 + (height - chartHeight);
              return <line key={i} x1="0" y1={y} x2={width} y2={y} />;
            })}
          </g>
        )}
        <path d={path} fill="none" stroke={points[0]?.color || '#0284c7'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        {showDots &&
          points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="1" fill={p.color} className="opacity-90" />
          ))}
      </svg>
      <div className="flex justify-between text-[9px] text-slate-400 -mt-0.5">
        {data.map((d, idx) => (
          <span key={idx} className="truncate text-center" style={{ width: `${100 / data.length}%` }} title={d.label}>
            {d.label.length > 4 ? d.label.slice(0, 3) : d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
