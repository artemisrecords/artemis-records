"use client";

import type { CSSProperties } from "react";

/* Minimal, dependency-free SVG charts tuned for the editorial palette. */

export function Sparkline({
  data,
  width = 140,
  height = 36,
  stroke = "var(--color-magenta)",
  fill = "rgba(159, 32, 99, 0.14)",
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => (i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`))
    .join(" ");
  const fillPath = `${path} L${width} ${height} L0 ${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="block"
    >
      <path d={fillPath} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={stroke}
      />
    </svg>
  );
}

export function BarChart({
  data,
  height = 140,
  ariaLabel = "Graphique en barres",
}: {
  data: { label: string; value: number; accent?: boolean }[];
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="flex items-end gap-2"
      style={{ height }}
    >
      {data.map((d) => {
        const h = Math.max(6, (d.value / max) * (height - 22));
        const barStyle: CSSProperties = {
          height: `${h}px`,
        };
        return (
          <div key={d.label} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-t-[2px] transition-colors ${
                d.accent ? "bg-magenta" : "bg-bleu-nuit-700/80 hover:bg-bleu-nuit-700"
              }`}
              style={barStyle}
              title={`${d.label} — ${d.value}`}
            />
            <div className="text-[9px] tracking-eyebrow uppercase font-bold text-ink-subtle truncate max-w-full">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Donut({
  segments,
  size = 120,
  thickness = 14,
  centerLabel,
  centerHint,
  ariaLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerHint?: string;
  ariaLabel?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const summary =
    ariaLabel ||
    `Répartition : ${segments
      .map(
        (s) =>
          `${s.label} ${Math.round((s.value / total) * 100)} pour cent`,
      )
      .join(", ")}`;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div
      className="flex items-center gap-5"
      role="img"
      aria-label={summary}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(28,31,74,0.08)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const dasharray = `${len} ${circ - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
        })}
        {centerLabel && (
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            className="font-display"
            fontSize="18"
            fill="var(--color-ink)"
          >
            {centerLabel}
          </text>
        )}
        {centerHint && (
          <text
            x="50%"
            y="62%"
            textAnchor="middle"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--color-ink-subtle)"
            fontWeight="700"
          >
            {centerHint.toUpperCase()}
          </text>
        )}
      </svg>
      <ul className="flex flex-col gap-1.5 text-[12px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 font-serif">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-ink">{s.label}</span>
            <span className="text-ink-subtle">
              · {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
