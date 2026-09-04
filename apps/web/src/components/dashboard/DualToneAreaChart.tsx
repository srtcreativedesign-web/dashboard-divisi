import React, { useState, useId } from 'react';
import { TrendingUp, Calendar, Info } from 'lucide-react';

export type TimeframeMode = 'daily' | 'weekly' | 'monthly' | 'ytd';

interface ChartPoint {
  label: string;
  shortLabel: string;
  actual: number; // in Millions IDR
  target: number; // in Millions IDR
}

const TIMEFRAME_DATA: Record<TimeframeMode, ChartPoint[]> = {
  daily: [
    { label: 'Senin, 28 Agu', shortLabel: 'Sen', actual: 480, target: 450 },
    { label: 'Selasa, 29 Agu', shortLabel: 'Sel', actual: 520, target: 470 },
    { label: 'Rabu, 30 Agu', shortLabel: 'Rab', actual: 490, target: 480 },
    { label: 'Kamis, 31 Agu', shortLabel: 'Kam', actual: 560, target: 500 },
    { label: 'Jumat, 01 Sep', shortLabel: 'Jum', actual: 610, target: 550 },
    { label: 'Sabtu, 02 Sep', shortLabel: 'Sab', actual: 720, target: 680 },
    { label: 'Minggu, 03 Sep', shortLabel: 'Min', actual: 690, target: 650 },
  ],
  weekly: [
    { label: 'Minggu ke-1', shortLabel: 'M-1', actual: 3450, target: 3300 },
    { label: 'Minggu ke-2', shortLabel: 'M-2', actual: 3620, target: 3500 },
    { label: 'Minggu ke-3', shortLabel: 'M-3', actual: 3890, target: 3700 },
    { label: 'Minggu ke-4 (Berjalan)', shortLabel: 'M-4', actual: 3990, target: 4150 },
  ],
  monthly: [
    { label: 'Januari 2026', shortLabel: 'Jan', actual: 12800, target: 12500 },
    { label: 'Februari 2026', shortLabel: 'Feb', actual: 13100, target: 13000 },
    { label: 'Maret 2026', shortLabel: 'Mar', actual: 13950, target: 13500 },
    { label: 'April 2026', shortLabel: 'Apr', actual: 14200, target: 14000 },
    { label: 'Mei 2026', shortLabel: 'Mei', actual: 14600, target: 14200 },
    { label: 'Juni 2026', shortLabel: 'Jun', actual: 14100, target: 14500 },
    { label: 'Juli 2026', shortLabel: 'Jul', actual: 14850, target: 14500 },
    { label: 'Agustus 2026', shortLabel: 'Agu', actual: 15300, target: 14800 },
    { label: 'September 2026 (Est)', shortLabel: 'Sep', actual: 14950, target: 14650 },
  ],
  ytd: [
    { label: 'Kuartal I (Q1)', shortLabel: 'Q1', actual: 39850, target: 39000 },
    { label: 'Kuartal II (Q2)', shortLabel: 'Q2', actual: 42900, target: 42700 },
    { label: 'Kuartal III (Q3 Berjalan)', shortLabel: 'Q3', actual: 45100, target: 44000 },
  ],
};

function getControlPoint(
  current: [number, number],
  previous?: [number, number],
  next?: [number, number],
  reverse?: boolean
): [number, number] {
  const p = previous ?? current;
  const n = next ?? current;
  const smoothing = 0.2;
  const opposedLine = {
    length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
    angle: Math.atan2(n[1] - p[1], n[0] - p[0]),
  };
  const angle = opposedLine.angle + (reverse ? Math.PI : 0);
  const length = opposedLine.length * smoothing;
  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, y];
}

function getSplinePath(points: [number, number][]): string {
  if (points.length === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first[0]},${first[1]}`;

  return points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;
    const prev = arr[i - 1];
    const prevPrev = i >= 2 ? arr[i - 2] : undefined;
    const next = i + 1 < arr.length ? arr[i + 1] : undefined;
    const [cpsX, cpsY] = getControlPoint(prev ?? point, prevPrev, point);
    const [cpeX, cpeY] = getControlPoint(point, prev, next, true);
    return `${acc} C ${cpsX.toFixed(1)},${cpsY.toFixed(1)} ${cpeX.toFixed(1)},${cpeY.toFixed(1)} ${point[0].toFixed(1)},${point[1].toFixed(1)}`;
  }, '');
}

export function DualToneAreaChart() {
  const [timeframe, setTimeframe] = useState<TimeframeMode>('daily');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const gradientId = useId();
  const strokeGradId = useId();

  const data = TIMEFRAME_DATA[timeframe];

  // Dimensions
  const svgWidth = 700;
  const svgHeight = 240;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Min / Max computation
  const allValues = data.flatMap((d) => [d.actual, d.target]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const minVal = Math.floor(rawMin * 0.9);
  const maxVal = Math.ceil(rawMax * 1.08);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / valRange;
    return padTop + chartH - norm * chartH;
  };

  const actualPoints: [number, number][] = data.map((d, i) => [getX(i), getY(d.actual)]);
  const targetPoints: [number, number][] = data.map((d, i) => [getX(i), getY(d.target)]);

  const actualPath = getSplinePath(actualPoints);
  const targetPath = getSplinePath(targetPoints);

  const firstPt = actualPoints[0] ?? [0, 0];
  const lastPt = actualPoints[actualPoints.length - 1] ?? [0, 0];
  const areaPath = `${actualPath} L ${lastPt[0]},${padTop + chartH} L ${firstPt[0]},${padTop + chartH} Z`;

  // Horizontal Grid Lines
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minVal + (i / gridSteps) * valRange;
    const y = getY(val);
    return { val, y };
  });

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;
  const activeActualPt = hoverIndex !== null && actualPoints[hoverIndex] ? actualPoints[hoverIndex] : null;
  const activeTargetPt = hoverIndex !== null && targetPoints[hoverIndex] ? targetPoints[hoverIndex] : null;

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-6 shadow-xs"
      data-testid="dual-tone-area-chart"
    >
      {/* Header with Title and Timeframe Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Tren Realisasi Omset vs Target
            </h3>
            <span className="rounded-pill bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 border border-primary-200">
              Spline Dual-Tone
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-700 font-medium">
            Perbandingan kurva aktual terhadap target acuan operasional
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div
          className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto"
          role="group"
          aria-label="Pilih Rentang Waktu Grafik"
        >
          {(
            [
              { key: 'daily', label: 'Harian' },
              { key: 'weekly', label: 'Mingguan' },
              { key: 'monthly', label: 'Bulanan' },
              { key: 'ytd', label: 'YTD' },
            ] as const
          ).map((tf) => (
            <button
              key={tf.key}
              onClick={() => {
                setTimeframe(tf.key);
                setHoverIndex(null);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeframe === tf.key
                  ? 'bg-white text-navy shadow-xs border border-line/40'
                  : 'text-slate-700 font-medium hover:text-navy hover:bg-white/50'
              }`}
              data-testid={`timeframe-btn-${tf.key}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Stats Overview */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-cyan-500 to-sky-600"></span>
            <span className="font-semibold text-slate-700">Realisasi Omset (Aktual)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500"></span>
            <span className="font-semibold text-slate-700">Target Acuan</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>Arahkan kursor pada kurva untuk melihat rincian deviasi harian/periode</span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative mt-4 w-full select-none overflow-hidden rounded-xl bg-slate-50/50 p-2 border border-slate-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Grafik Tren Omset Aktual vs Target"
          role="img"
        >
          <defs>
            {/* Area Dual-Tone Gradient */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>

            {/* Line Dual-Tone Gradient */}
            <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Grid Lines and Y-Axis Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={line.y}
                x2={padLeft + chartW}
                y2={line.y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={padLeft - 8}
                y={line.y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
                fontWeight={500}
              >
                {line.val >= 1000 ? `${(line.val / 1000).toFixed(1)}M` : `${line.val}Jt`}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Target Dashed Line */}
          <path
            d={targetPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* Actual Line Spline */}
          <path
            d={actualPath}
            fill="none"
            stroke={`url(#${strokeGradId})`}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points on Curve */}
          {actualPoints.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt[0]}
                cy={pt[1]}
                r={hoverIndex === idx ? 5 : 3.5}
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth={2.5}
                className="transition-all duration-150"
              />
            </g>
          ))}

          {/* X-Axis Labels */}
          {data.map((d, idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={padTop + chartH + 18}
                textAnchor="middle"
                fontSize={11}
                fill={hoverIndex === idx ? '#0f172a' : '#64748b'}
                fontWeight={hoverIndex === idx ? 700 : 500}
              >
                {d.shortLabel}
              </text>
            );
          })}

          {/* Hover Crosshair Guideline */}
          {activeActualPt && (
            <g pointerEvents="none">
              <line
                x1={activeActualPt[0]}
                y1={padTop}
                x2={activeActualPt[0]}
                y2={padTop + chartH}
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {/* Highlight Actual Point */}
              <circle
                cx={activeActualPt[0]}
                cy={activeActualPt[1]}
                r={7}
                fill="#0ea5e9"
                fillOpacity={0.25}
              />
              <circle
                cx={activeActualPt[0]}
                cy={activeActualPt[1]}
                r={4.5}
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth={2}
              />
              {/* Highlight Target Point */}
              {activeTargetPt && (
                <circle
                  cx={activeTargetPt[0]}
                  cy={activeTargetPt[1]}
                  r={4}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </g>
          )}

          {/* Transparent Interactive Hover Slices */}
          {data.map((_, idx) => {
            const widthPerSlice = chartW / data.length;
            const sliceX = padLeft + idx * widthPerSlice;
            const item = data[idx];
            return (
              <rect
                key={idx}
                x={sliceX - widthPerSlice / 2}
                y={padTop}
                width={widthPerSlice}
                height={chartH + padBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                aria-label={`Data titik ${item?.label ?? idx}`}
              />
            );
          })}
        </svg>

        {/* Floating Detailed Crosshair Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-3 rounded-card border border-line/60 bg-navy/95 text-white p-3 shadow-xl backdrop-blur-md transition-all duration-150 text-xs z-20"
            style={{
              left: `${Math.min(Math.max(getX(hoverIndex) - 90, 10), svgWidth - 190)}px`,
            }}
            data-testid="chart-tooltip"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 font-bold text-slate-200">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-cyan-400" />
                {activePoint.label}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Realisasi:</span>
                <span className="font-extrabold text-cyan-300">
                  Rp {activePoint.actual.toLocaleString('id-ID')} Jt
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Target Acuan:</span>
                <span className="font-bold text-amber-300">
                  Rp {activePoint.target.toLocaleString('id-ID')} Jt
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between gap-4">
                <span className="text-slate-300">Deviasi / Gap:</span>
                <span
                  className={`font-black ${
                    activePoint.actual >= activePoint.target ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activePoint.actual >= activePoint.target ? '+' : ''}
                  {(activePoint.actual - activePoint.target).toLocaleString('id-ID')} Jt (
                  {(
                    ((activePoint.actual - activePoint.target) / activePoint.target) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
