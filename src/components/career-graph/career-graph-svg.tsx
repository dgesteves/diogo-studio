import Link from "next/link";
import {
  edges,
  getNode,
  nodeHref,
  nodes,
  patterns,
  projectToSvg,
  type CareerNode,
  type NodeId,
} from "@/content/career-graph";

/**
 * Career Graph — SVG canonical surface.
 *
 * Visible at all times. Server-rendered. Owns:
 *   - LCP frame
 *   - The actual career data (time axis, labels, edges)
 *   - Clicks, focus, screen-reader story (native `<title>` per node)
 *
 * The R3F canvas (when motion is allowed) renders BEHIND this SVG as a
 * pure atmospheric layer. It must never compete with this surface.
 *
 * No popups. No hover overlays. Each node shows its company + years
 * always — the SVG `<title>` element gives browsers their default hover
 * tooltip and lets screen readers announce the long-form description.
 */

const VIEWPORT = {
  width: 1000,
  height: 600,
  padding: { x: 80, top: 60, bottom: 80 },
} as const;

// Newest engagements first — used for the screen-reader summary.
const sortedNodes = [...nodes].sort((a, b) => b.position[0] - a.position[0]);

const TIMELINE_YEARS = [2016, 2018, 2020, 2022, 2024, 2026] as const;

// Decide whether a node's label sits above or below its marker. Top half of
// the viewport gets labels below; bottom half gets labels above. Keeps the
// time-axis row and the upper cluster uncrowded.
function labelPlacement(p: { x: number; y: number }): "above" | "below" {
  return p.y < VIEWPORT.height * 0.55 ? "below" : "above";
}

export function CareerGraphSvg({
  className,
  ariaLabelledBy,
  ariaHidden,
}: {
  className?: string;
  ariaLabelledBy?: string;
  ariaHidden?: boolean;
}) {
  const positions = Object.fromEntries(
    nodes.map((n) => [n.id, projectToSvg(n.position, VIEWPORT)] as const),
  ) as Record<NodeId, { x: number; y: number }>;

  return (
    <div className={className} data-career-graph-svg="">
      <svg
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-labelledby={ariaLabelledBy}
        aria-hidden={ariaHidden}
        className="block h-full w-full"
      >
        <defs>
          {/* Pattern-colored edge gradients. */}
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

        <rect
          width="100%"
          height="100%"
          fill="url(#cg-grid)"
          mask="url(#cg-grid-mask-clip)"
          opacity="0.5"
        />

        <Axis />

        {/* Edges — under the nodes. Each edge gets a base stroke plus a
            short animated "tracer" segment that flows from the older
            engagement (lower x) to the newer one, sized as ~14% of the
            edge length. Direction matches career chronology. */}
        <g aria-hidden="true">
          {edges.map((edge, idx) => {
            const a = positions[edge.from];
            const b = positions[edge.to];
            // Ensure tracer travels old → new regardless of edge data order.
            const fromOld = a.x <= b.x ? a : b;
            const toNew = a.x <= b.x ? b : a;
            const len = Math.hypot(toNew.x - fromOld.x, toNew.y - fromOld.y);
            const tracer = Math.max(18, len * 0.14);
            // Stagger the tracer phase per edge so they don't all pulse in
            // lockstep — phase is multiples of 0.6s, wrapped within the
            // animation period (3.6s in `cg-edge-tracer`).
            const delay = -(idx * 0.6) % 3.6;
            return (
              <g key={edge.id}>
                {/* Static base stroke. */}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={`url(#cg-edge-${edge.pattern})`}
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                {/* Animated tracer — a short dash that travels along the
                    edge from old to new. Stroke uses the pattern's solid
                    color so the moving segment reads brighter than the
                    base gradient. */}
                <line
                  x1={fromOld.x}
                  y1={fromOld.y}
                  x2={toNew.x}
                  y2={toNew.y}
                  className="cg-edge-tracer"
                  stroke={`var(--${patterns[edge.pattern].colorVar})`}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray={`${tracer} ${Math.max(20, len)}`}
                  style={{ animationDelay: `${delay}s` }}
                />
              </g>
            );
          })}
        </g>

        {/* Nodes — each is a Link-wrapped <g>, generous hit area, native
            <title> for browser + a11y tooltips. */}
        {sortedNodes.map((node) => {
          const p = positions[node.id]!;
          return <Node key={node.id} node={node} position={p} />;
        })}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Subcomponents
 * ------------------------------------------------------------------------- */

function Axis() {
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

function Node({ node, position }: { node: CareerNode; position: { x: number; y: number } }) {
  const r = 13 * node.weight;
  const hitR = Math.max(r * 2.6, 36);
  const placement = labelPlacement(position);
  const labelOffset = placement === "below" ? r + 26 : -r - 18;
  const yearOffset = placement === "below" ? r + 48 : -r - 40;
  const dominantBaseline = placement === "below" ? "hanging" : "auto";

  return (
    <Link
      href={nodeHref(node)}
      data-career-graph-node={node.id}
      aria-label={`${node.fullName} — ${node.role}, ${node.years}. ${node.summary}`}
      className="cg-node-link group cursor-pointer outline-none"
    >
      <g transform={`translate(${position.x} ${position.y})`} style={{ pointerEvents: "all" }}>
        {/* Native SVG tooltip — gives browsers a default hover popup and
            adds the engagement summary to the accessibility tree. */}
        <title>{`${node.fullName} — ${node.role}\n${node.years}\n${node.summary}`}</title>

        {/* Generous invisible hit target so every node, including the
            smaller-weight Deloitte/BMW markers, is comfortably clickable. */}
        <circle r={hitR} fill="transparent" />

        {/* Halo. */}
        <circle r={r * 4} fill="url(#cg-node-halo)" className="cg-node-halo" />

        {/* Ring + dot. */}
        <circle
          r={r}
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          className="cg-node-ring"
        />
        <circle r={r * 0.45} fill="var(--accent)" className="cg-node-dot" />

        {/* Company label — paint-order trick gives us a background "halo" so
            labels stay readable when an edge or the heatmap field crosses
            behind them. */}
        <text
          y={labelOffset}
          textAnchor="middle"
          dominantBaseline={dominantBaseline}
          fontFamily="var(--font-mono)"
          fontSize="19"
          letterSpacing="0.08em"
          fill="var(--foreground)"
          style={{
            paintOrder: "stroke",
            stroke: "var(--background)",
            strokeWidth: 5,
            fontWeight: 500,
          }}
        >
          {node.label.toUpperCase()}
        </text>
        <text
          y={yearOffset}
          textAnchor="middle"
          dominantBaseline={dominantBaseline}
          fontFamily="var(--font-mono)"
          fontSize="15"
          letterSpacing="0.1em"
          fill="var(--subtle-foreground)"
          style={{
            paintOrder: "stroke",
            stroke: "var(--background)",
            strokeWidth: 5,
          }}
        >
          {node.years}
        </text>
      </g>
    </Link>
  );
}

/**
 * Hidden long-form description used by screen readers and search engines.
 */
export function CareerGraphAccessibleDescription({ id }: { id: string }) {
  return (
    <p id={id} className="sr-only">
      A career graph of {nodes.length} engagements connected by {edges.length} pattern
      relationships:{" "}
      {sortedNodes.map((n, i) => {
        const node = getNode(n.id);
        return (
          <span key={node.id}>
            {node.fullName} as {node.role} ({node.years}){i < sortedNodes.length - 1 ? "; " : "."}
          </span>
        );
      })}{" "}
      Patterns:{" "}
      {Object.values(patterns)
        .map((p) => p.label)
        .join(", ")}
      .
    </p>
  );
}
