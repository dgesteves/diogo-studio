import type { ReactElement } from "react";

type SparklineTone = "accent" | "good" | "warn" | "hot" | "muted";

const toneClasses: Record<SparklineTone, string> = {
  accent: "text-accent",
  good: "text-signal-good",
  warn: "text-signal-warn",
  hot: "text-signal-hot",
  muted: "text-subtle-foreground",
};

export function Sparkline({
  values,
  tone = "accent",
  ariaLabel,
}: {
  values: readonly number[];
  tone?: SparklineTone;
  ariaLabel?: string;
}): ReactElement | null {
  if (values.length < 2) return null;

  const width = 120;
  const height = 36;
  const pad = 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return { x, y };
  });

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;
  const area = `${d} L ${last.x} ${height - pad} L ${first.x} ${height - pad} Z`;

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? "Sparkline trend"}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`h-full w-full ${toneClasses[tone]}`}
    >
      <path d={area} fill="currentColor" fillOpacity={0.12} />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={1.8} fill="currentColor" />
    </svg>
  );
}
