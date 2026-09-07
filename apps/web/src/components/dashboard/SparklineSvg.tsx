import React, { useId } from 'react';

export interface SparklineSvgProps {
  data: number[];
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  height?: number;
  width?: number | string;
  className?: string;
  showLastPoint?: boolean;
}

// Function to calculate smooth bezier curve path points
function getControlPoint(
  current: [number, number],
  previous?: [number, number],
  next?: [number, number],
  reverse?: boolean
): [number, number] {
  const p = previous ?? current;
  const n = next ?? current;
  const smoothing = 0.18;
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

function getBezierPath(points: [number, number][]): string {
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

export function SparklineSvg({
  data,
  color = '#0ea5e9',
  fillOpacity = 0.22,
  strokeWidth = 2,
  height = 36,
  width = '100%',
  className = '',
  showLastPoint = true,
}: SparklineSvgProps) {
  const gradientId = useId();

  if (!data || data.length === 0) {
    return null;
  }

  const svgWidth = 100;
  const svgHeight = 32;
  const paddingY = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points: [number, number][] = data.map((val, idx) => {
    const x = data.length > 1 ? (idx / (data.length - 1)) * svgWidth : svgWidth / 2;
    const normalizedY = (val - min) / range;
    // Invert because SVG y=0 is top
    const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
    return [x, y];
  });

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (!firstPoint || !lastPoint) return null;

  const linePath = getBezierPath(points);
  const areaPath = `${linePath} L ${lastPoint[0]},${svgHeight} L ${firstPoint[0]},${svgHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area Fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Smooth Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Glowing Last Point */}
      {showLastPoint && (
        <g>
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r={2.5} fill={color} />
          <circle
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r={4.5}
            fill={color}
            opacity={0.35}
            className="animate-pulse"
          />
        </g>
      )}
    </svg>
  );
}
