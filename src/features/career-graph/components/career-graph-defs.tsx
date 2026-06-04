import type { ReactElement } from "react";

import { patterns } from "@/content/data/career-graph";

export function CareerGraphDefs(): ReactElement {
  return (
    <defs>
      {Object.values(patterns).map((p) => (
        <linearGradient key={p.id} id={`cg-edge-${p.id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.05} />
          <stop offset="50%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.55} />
          <stop offset="100%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.05} />
        </linearGradient>
      ))}

      <radialGradient id="cg-node-halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
        <stop offset="55%" stopColor="var(--accent)" stopOpacity={0.08} />
        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
      </radialGradient>

      <pattern id="cg-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path
          d="M 48 0 L 0 0 0 48"
          fill="none"
          stroke="var(--border)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
      </pattern>
      <radialGradient id="cg-grid-mask" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="white" stopOpacity={1} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </radialGradient>
      <mask id="cg-grid-mask-clip">
        <rect width="100%" height="100%" fill="url(#cg-grid-mask)" />
      </mask>

      <filter id="cg-node-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
