"use client";

import { useId } from "react";

function toPoints(values: number[], width: number, height: number, pad = 2) {
  if (values.length < 2) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  return values.map((v, i) => ({
    x: i * stepX,
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
}

export function Sparkline({
  values,
  color = "var(--color-accent)",
  width = 140,
  height = 44,
  filled = true,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  filled?: boolean;
}) {
  const gradientId = useId();
  const points = toPoints(values, width, height);

  if (points.length === 0) {
    return <div style={{ width, height }} aria-hidden />;
  }

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden className="overflow-visible">
      {filled && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarChart({
  values,
  labels,
  height = 220,
}: {
  values: number[];
  labels?: string[];
  height?: number;
}) {
  if (values.length === 0) {
    return (
      <div className="grid place-items-center text-sm text-content-dim" style={{ height }}>
        No data
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const peakIndex = values.indexOf(max);

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {values.map((v, i) => {
          // Floor at 8% so near-flat series stay visible as bars.
          const pct = 8 + ((v - min) / span) * 92;
          const isPeak = i === peakIndex;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-colors ${
                isPeak ? "bg-accent" : "bg-info/35 hover:bg-info/55"
              }`}
              style={{ height: `${pct}%` }}
              title={labels?.[i] ? `${labels[i]}: ${v}` : String(v)}
            />
          );
        })}
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[10px] text-content-faint">
          {labels
            .filter((_, i) => i % Math.ceil(labels.length / 7) === 0)
            .map((label, i) => (
              <span key={i}>{label}</span>
            ))}
        </div>
      )}
    </div>
  );
}

export function AssetIcon({ symbol, color, size = 34 }: { symbol: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-[11px] font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}1f`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}33`,
      }}
    >
      {symbol.slice(0, 3)}
    </span>
  );
}
