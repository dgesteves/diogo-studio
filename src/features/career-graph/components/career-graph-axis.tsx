import type { ReactElement } from "react";

import { VIEWPORT } from "./career-graph-svg-viewport";

const TIMELINE_YEARS = [2016, 2018, 2020, 2022, 2024, 2026] as const;

export function Axis(): ReactElement {
  return (
    <g aria-hidden="true">
      <line
        x1={VIEWPORT.padding.x}
        x2={VIEWPORT.width - VIEWPORT.padding.x}
        y1={VIEWPORT.height - 36}
        y2={VIEWPORT.height - 36}
        stroke="var(--border-strong)"
        strokeOpacity="0.6"
        strokeWidth="1"
      />
      {TIMELINE_YEARS.map((year, idx, arr) => {
        const x =
          VIEWPORT.padding.x + (idx / (arr.length - 1)) * (VIEWPORT.width - VIEWPORT.padding.x * 2);
        return (
          <g key={year} transform={`translate(${x} ${VIEWPORT.height - 36})`}>
            <line y2="6" stroke="var(--border-strong)" strokeOpacity="0.5" />
            <text
              y="28"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="17"
              letterSpacing="0.08em"
              fill="var(--subtle-foreground)"
            >
              {year}
            </text>
          </g>
        );
      })}
      <text
        x={VIEWPORT.padding.x}
        y={VIEWPORT.height - 6}
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.14em"
        fill="var(--subtle-foreground)"
        opacity="0.7"
      >
        ← OLDEST
      </text>
      <text
        x={VIEWPORT.width - VIEWPORT.padding.x}
        y={VIEWPORT.height - 6}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="13"
        letterSpacing="0.14em"
        fill="var(--subtle-foreground)"
        opacity="0.7"
      >
        NEWEST →
      </text>
    </g>
  );
}
