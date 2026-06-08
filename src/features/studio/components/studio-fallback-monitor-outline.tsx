import type { ReactElement } from "react";

type MonitorOutlineProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  screenLabel: string;
  tilt?: number;
};

export function MonitorOutline({
  x,
  y,
  w,
  h,
  screenLabel,
  tilt = 0,
}: MonitorOutlineProps): ReactElement {
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
