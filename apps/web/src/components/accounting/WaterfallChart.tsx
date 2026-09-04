import React, { useState } from 'react';
import { TrendingDown, TrendingUp, DollarSign, Info } from 'lucide-react';

export interface WaterfallItem {
  id: string;
  label: string;
  amount: number; // Positif untuk penambahan, negatif untuk pengurangan, atau nilai akumulatif jika isTotal
  isTotal?: boolean;
  category?: string;
}

export interface WaterfallChartProps {
  title?: string;
  subtitle?: string;
  items: WaterfallItem[];
  height?: number;
}

const rupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

export function WaterfallChart({
  title = 'Waterfall Chart: Aliran Arus Kas & Margin',
  subtitle = 'Visualisasi jembatan penambahan dan pengurangan dari pendapatan hingga saldo bersih',
  items,
  height = 280,
}: WaterfallChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  // Komputasi running balance untuk setiap step
  let running = 0;
  const computedSteps = items.map((item) => {
    const prev = running;
    let startVal = 0;
    let endVal = 0;

    if (item.isTotal) {
      startVal = 0;
      endVal = running;
    } else {
      startVal = prev;
      endVal = prev + item.amount;
      running = endVal;
    }

    const low = Math.min(startVal, endVal);
    const high = Math.max(startVal, endVal);

    return {
      ...item,
      prevRunning: prev,
      currentRunning: running,
      startVal,
      endVal,
      low,
      high,
    };
  });

  // Skala sumbu Y
  const allValues = computedSteps.flatMap((s) => [s.low, s.high, 0]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const svgWidth = 720;
  const svgHeight = height;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getY = (val: number) => {
    const norm = (val - minVal) / range;
    return padTop + chartH - norm * chartH;
  };

  const barWidth = Math.min(Math.max(chartW / items.length * 0.65, 20), 45);
  const slotWidth = chartW / items.length;

  const activeStep = hoverIndex !== null ? computedSteps[hoverIndex] : null;

  // Horizontal Grid Lines
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minVal + (i / gridSteps) * range;
    const y = getY(val);
    return { val, y };
  });

  return (
    <section
      className="rounded-card-lg border border-line/60 bg-white/95 backdrop-blur-md p-5 shadow-xs"
      data-testid="waterfall-chart-section"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              {title}
            </h3>
            <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              Jembatan Kas &amp; P&amp;L
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500"></span>
            <span className="font-semibold text-slate-600">Inflow / Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-500"></span>
            <span className="font-semibold text-slate-600">Beban / Keluar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-navy"></span>
            <span className="font-semibold text-slate-600">Saldo Akhir</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative mt-4 w-full select-none overflow-hidden rounded-xl bg-slate-50/40 p-2 border border-slate-100">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Waterfall Chart Visualisasi Finansial"
          role="img"
        >
          {/* Grid lines & Y Axis */}
          {gridLines.map((line, i) => (
            <g key={i}>
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
                y={line.y + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
                fontWeight={500}
              >
                {Math.abs(line.val) >= 1e9
                  ? `${(line.val / 1e9).toFixed(1)}M`
                  : Math.abs(line.val) >= 1e6
                  ? `${(line.val / 1e6).toFixed(0)}Jt`
                  : line.val.toLocaleString('id-ID')}
              </text>
            </g>
          ))}

          {/* Zero baseline */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={padLeft}
              y1={getY(0)}
              x2={padLeft + chartW}
              y2={getY(0)}
              stroke="#64748b"
              strokeWidth={1.5}
            />
          )}

          {/* Bars and Connectors */}
          {computedSteps.map((step, idx) => {
            const slotX = padLeft + idx * slotWidth;
            const barX = slotX + (slotWidth - barWidth) / 2;

            const yHigh = getY(step.high);
            const yLow = getY(step.low);
            const barH = Math.max(yLow - yHigh, 4);

            const isPos = step.amount >= 0;
            let fillColor = '#10b981'; // Emerald
            if (step.isTotal) {
              fillColor = '#0f172a'; // Navy
            } else if (!isPos) {
              fillColor = '#e11d48'; // Rose
            }

            const isHovered = hoverIndex === idx;

            // Connector to next bar
            let nextConnectorY: number | null = null;
            if (idx < computedSteps.length - 1) {
              const nextStep = computedSteps[idx + 1];
              if (nextStep && !nextStep.isTotal) {
                nextConnectorY = getY(step.endVal);
              }
            }

            return (
              <g key={step.id}>
                {/* Connector line to next step */}
                {nextConnectorY !== null && idx < computedSteps.length - 1 && (
                  <line
                    x1={barX + barWidth}
                    y1={nextConnectorY}
                    x2={slotX + slotWidth + (slotWidth - barWidth) / 2}
                    y2={nextConnectorY}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* The Floating/Total Bar */}
                <rect
                  x={barX}
                  y={yHigh}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={fillColor}
                  fillOpacity={isHovered ? 1 : 0.88}
                  stroke={isHovered ? '#ffffff' : 'none'}
                  strokeWidth={isHovered ? 2 : 0}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  data-testid={`waterfall-bar-${step.id}`}
                />

                {/* Amount label above or below bar */}
                <text
                  x={barX + barWidth / 2}
                  y={yHigh - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {Math.abs(step.amount) >= 1e9
                    ? `${(step.amount / 1e9).toFixed(1)}M`
                    : `${(step.amount / 1e6).toFixed(0)}Jt`}
                </text>

                {/* X Axis Step Label */}
                <text
                  x={barX + barWidth / 2}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isHovered ? 700 : 500}
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {step.label.length > 12 ? `${step.label.substring(0, 11)}…` : step.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeStep && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-3 rounded-card border border-line/60 bg-navy/95 text-white p-3 shadow-xl backdrop-blur-md transition-all duration-150 text-xs z-20"
            style={{
              left: `${Math.min(
                Math.max(
                  padLeft + hoverIndex * slotWidth - 80,
                  10
                ),
                svgWidth - 210
              )}px`,
            }}
            data-testid="waterfall-tooltip"
          >
            <p className="font-bold text-slate-200 border-b border-white/10 pb-1">
              {activeStep.label}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Nominal:</span>
                <span
                  className={`font-black ${
                    activeStep.isTotal
                      ? 'text-cyan-300'
                      : activeStep.amount >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeStep.amount >= 0 ? '+' : ''}
                  {rupiah(activeStep.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Kumulatif Saldo:</span>
                <span className="font-extrabold text-white">
                  {rupiah(activeStep.endVal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
