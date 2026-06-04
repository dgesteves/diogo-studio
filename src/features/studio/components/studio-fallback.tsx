import type { ReactElement } from "react";

export function StudioFallback({ className }: { className?: string }): ReactElement {
  return (
    <div className={["relative h-full w-full overflow-hidden", className ?? ""].join(" ")}>
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="studio-fallback-title"
        className="absolute inset-0 block h-full w-full"
      >
        <title id="studio-fallback-title">
          The studio — three monitors, a desk, and a chair. The rig where the work ships from.
        </title>

        <defs>
          <linearGradient id="studio-screen-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g
          stroke="var(--border-strong)"
          strokeOpacity="0.35"
          strokeWidth="1"
          fill="none"
          aria-hidden="true"
        >
          <polygon points="200,720 1400,720 1500,820 100,820" />
          {Array.from({ length: 6 }).map((_, i) => {
            const t = (i + 1) / 7;
            return (
              <line
                key={i}
                x1={200 + (1200 * t * 100) / 1300}
                y1={720 + 100 * t}
                x2={1400 + (100 * t * 100) / 1300}
                y2={720 + 100 * t}
                opacity={0.6 - t * 0.3}
              />
            );
          })}
        </g>

        <g stroke="var(--border-strong)" strokeWidth="1.5" fill="var(--surface)" fillOpacity="0.65">
          <polygon points="320,640 1280,640 1340,700 260,700" />
          <polygon
            points="260,700 1340,700 1340,712 260,712"
            fill="var(--surface-muted)"
            fillOpacity="0.4"
          />
        </g>

        <g stroke="var(--border-strong)" strokeWidth="1.2" opacity="0.7">
          <line x1="320" y1="712" x2="320" y2="800" />
          <line x1="1280" y1="712" x2="1280" y2="800" />
        </g>

        <MonitorOutline x={420} y={310} w={260} h={170} screenLabel="src" tilt={-6} />
        <MonitorOutline x={720} y={270} w={340} h={210} screenLabel="ops" tilt={0} />
        <MonitorOutline x={1080} y={310} w={260} h={170} screenLabel="metrics" tilt={6} />

        <g stroke="var(--border-strong)" strokeWidth="1.3" fill="var(--surface)" fillOpacity="0.65">
          <rect x="740" y="640" width="120" height="140" rx="14" />
          <ellipse cx="800" cy="800" rx="78" ry="14" />
          <line x1="800" y1="800" x2="800" y2="840" />
          <ellipse cx="800" cy="850" rx="58" ry="9" />
        </g>

        <g
          fontFamily="var(--font-mono)"
          fontSize="22"
          letterSpacing="0.14em"
          fill="var(--subtle-foreground)"
          opacity="0.75"
          aria-hidden="true"
        >
          <text x="800" y="110" textAnchor="middle">
            THE STUDIO · PRESENT TENSE
          </text>
        </g>
      </svg>
    </div>
  );
}

function MonitorOutline({
  x,
  y,
  w,
  h,
  screenLabel,
  tilt = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  screenLabel: string;
  tilt?: number;
}) {
  const bezel = 8;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt} ${w / 2} ${h / 2})`}>
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        rx="8"
        fill="var(--surface)"
        fillOpacity="0.8"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      <rect
        x={bezel}
        y={bezel}
        width={w - bezel * 2}
        height={h - bezel * 2}
        rx="3"
        fill="var(--background)"
      />
      <rect
        x={bezel}
        y={bezel}
        width={w - bezel * 2}
        height={(h - bezel * 2) * 0.55}
        rx="3"
        fill="url(#studio-screen-glow)"
      />
      <rect x={w / 2 - 5} y={h} width="10" height="18" fill="var(--border-strong)" />
      <ellipse cx={w / 2} cy={h + 22} rx="34" ry="4" fill="var(--border-strong)" />

      <text
        x={w / 2}
        y={h + 48}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="14"
        letterSpacing="0.18em"
        fill="var(--subtle-foreground)"
        opacity="0.85"
      >
        ▸ {screenLabel.toUpperCase()}
      </text>
    </g>
  );
}
