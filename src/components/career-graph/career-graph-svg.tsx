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
 * After we tried (and rejected) layering 3D nodes on top of this graph,
 * the SVG is now the single source of truth for the career graph:
 *
 * - Server-rendered so it owns LCP.
 * - Always visible, never hidden behind a canvas.
 * - Owns clicks, hover tooltips, focus, screen-reader access.
 * - Carries the time axis, year markers, pattern-colored edges.
 *
 * The R3F canvas (when motion is allowed) renders BEHIND this SVG as a
 * pure atmospheric layer: heatmap field, slow scroll-parallax, restrained
 * postprocessing. It adds depth without competing with the actual data.
 *
 * Tooltips: pure CSS, revealed on group hover / focus-within. No JS state,
 * no client component required. Lives inside the same `<g>` per node so
 * it tracks position even if the SVG scales.
 */

const VIEWPORT = {
  width: 1000,
  height: 600,
  padding: { x: 80, top: 60, bottom: 80 },
} as const;

// Newest engagements first — used for the screen-reader summary and tab order.
const sortedNodes = [...nodes].sort((a, b) => b.position[0] - a.position[0]);

const TIMELINE_YEARS = [2016, 2018, 2020, 2022, 2024, 2026] as const;

// Where to place each node's label relative to its marker. Top-half of the
// viewport gets labels below, bottom-half gets labels above — keeps the
// timeline axis (y near bottom) and the cluster (y near top) uncluttered.
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
        role="img"
        aria-labelledby={ariaLabelledBy}
        aria-hidden={ariaHidden}
        className="block h-full w-full overflow-visible"
      >
        <defs>
          {/* Pattern-colored line gradients give edges a tracer-quality fade. */}
          {Object.values(patterns).map((p) => (
            <linearGradient key={p.id} id={`cg-edge-${p.id}`} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.05} />
              <stop offset="50%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.55} />
              <stop offset="100%" stopColor={`var(--${p.colorVar})`} stopOpacity={0.05} />
            </linearGradient>
          ))}

          {/* Soft halo behind each node. */}
          <radialGradient id="cg-node-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
            <stop offset="55%" stopColor="var(--accent)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </radialGradient>

          {/* Console grid — fades at the edges via the mask below. */}
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

          {/* Glow filter used on the active node when hovered/focused. */}
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

        {/* Time-axis baseline + year ticks — anchors the graph chronologically. */}
        <Axis />

        {/* Edges — under the nodes so they don't draw over the markers. */}
        <g aria-hidden="true">
          {edges.map((edge) => {
            const a = positions[edge.from];
            const b = positions[edge.to];
            return (
              <line
                key={edge.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={`url(#cg-edge-${edge.pattern})`}
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Nodes — each is a Link-wrapped <g> so the entire marker + label is
            one big hit target. Hover/focus reveals the tooltip via CSS. */}
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
              y="22"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
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
        y={VIEWPORT.height - 8}
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.12em"
        fill="var(--subtle-foreground)"
        opacity="0.7"
      >
        OLDEST
      </text>
      <text
        x={VIEWPORT.width - VIEWPORT.padding.x}
        y={VIEWPORT.height - 8}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.12em"
        fill="var(--subtle-foreground)"
        opacity="0.7"
      >
        NEWEST →
      </text>
    </g>
  );
}

function Node({ node, position }: { node: CareerNode; position: { x: number; y: number } }) {
  const r = 9 * node.weight;
  const hitR = Math.max(r * 3, 28); // generous click/focus target, never < 56px diameter
  const placement = labelPlacement(position);
  const labelY = placement === "below" ? r + 18 : -r - 14;
  const yearY = placement === "below" ? r + 32 : -r - 28;
  const tooltipY = placement === "below" ? r + 48 : -r - 44;
  const tooltipAnchor = placement === "below" ? "start" : "end";

  return (
    <Link
      href={nodeHref(node)}
      aria-label={`${node.fullName} — ${node.role}, ${node.years}. ${node.summary}`}
      data-career-graph-node={node.id}
      // SVG <g> wrapped in a Link works because next/link forwards href onto
      // its child anchor. The whole subtree is one big hit target now.
      className="cg-node-link group cursor-pointer outline-none"
      style={
        {
          // CSS custom property lets the focus ring colorize uniformly.
          "--cg-active": "var(--accent)",
        } as React.CSSProperties
      }
    >
      {/* The actual rendered marker + label. Pointer events on the whole `<g>`
          so any pixel of the marker, label, halo, or hit-circle is clickable. */}
      <g transform={`translate(${position.x} ${position.y})`} style={{ pointerEvents: "all" }}>
        {/* Invisible hit circle — guarantees a generous tap target even for
            the lowest-weight (Deloitte) marker. */}
        <circle r={hitR} fill="transparent" />

        {/* Halo (always faint, brightens on hover/focus). */}
        <circle r={r * 4} fill="url(#cg-node-halo)" className="cg-node-halo" />

        {/* Outer ring. */}
        <circle
          r={r}
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          className="cg-node-ring"
        />
        {/* Inner dot. */}
        <circle r={r * 0.45} fill="var(--accent)" className="cg-node-dot" />

        {/* Company label — mono caps. */}
        <text
          y={labelY}
          textAnchor="middle"
          dominantBaseline={placement === "below" ? "hanging" : "auto"}
          fontFamily="var(--font-mono)"
          fontSize="11"
          letterSpacing="0.08em"
          fill="var(--foreground)"
          style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 3 }}
        >
          {node.label.toUpperCase()}
        </text>
        {/* Years — secondary mono. */}
        <text
          y={yearY}
          textAnchor="middle"
          dominantBaseline={placement === "below" ? "hanging" : "auto"}
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.1em"
          fill="var(--subtle-foreground)"
          style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 3 }}
        >
          {node.years}
        </text>

        {/* Hover/focus tooltip — purely CSS-driven, no JS state. */}
        <g className="cg-tooltip pointer-events-none" transform={`translate(0 ${tooltipY})`}>
          <foreignObject
            // Width-wide enough for the longest summary, centered horizontally.
            x={tooltipAnchor === "start" ? -120 : -240}
            y="0"
            width="360"
            height="160"
            style={{ overflow: "visible" }}
          >
            <div className="cg-tooltip-panel">
              <div className="cg-tooltip-header">
                <span className="cg-tooltip-years">{node.years}</span>
                <span className="cg-tooltip-role">{node.role}</span>
              </div>
              <p className="cg-tooltip-name">{node.fullName}</p>
              <p className="cg-tooltip-summary">{node.summary}</p>
              <ul className="cg-tooltip-tags">
                {node.patterns.map((p) => (
                  <li
                    key={p}
                    style={{ color: `var(--${patterns[p].colorVar})` }}
                    className="cg-tooltip-tag"
                  >
                    {patterns[p].label}
                  </li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>
      </g>
    </Link>
  );
}

/**
 * Hidden long-form description used by screen readers and search engines.
 * Sits outside the SVG so it's announced once regardless of which surface
 * is active.
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
