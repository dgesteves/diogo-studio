/**
 * Career-graph data — the source of truth driving both the static SVG hero
 * fallback and the R3F 3D scene. Treat this file like an RFC artifact:
 * everything user-visible in the hero traces back to a real row on the
 * resume. No invented metrics, no abstract metaphors.
 *
 * Coordinate system (kept small and hand-tuned, not force-directed):
 * - `x` ∈ [-1, 1]  — time axis. -1 = oldest, +1 = newest.
 * - `y` ∈ [-1, 1]  — altitude axis. -1 = IC depth, +1 = leadership scope.
 * - `z` ∈ [-1, 1]  — pattern axis. -1 = streaming/enterprise, +1 = AI-native.
 *
 * The SVG fallback projects to 2D using `x` and `y`. The 3D scene uses all
 * three. Positions are deterministic so both surfaces look identical at
 * first paint and the canvas crossfade has no visible jump.
 */

import type { CSSProperties } from "react";

/* ---------------------------------------------------------------------------
 * Pattern catalogue — the edge labels in the hero graph and the filter chips
 * on `/work`. Color tokens reference the CSS variables defined in globals.css
 * so themes carry through to both SVG and WebGL surfaces.
 * ------------------------------------------------------------------------- */

export type PatternId = "ai-native" | "design-systems" | "streaming" | "agentic-ux" | "enterprise";

export type PatternMeta = {
  id: PatternId;
  label: string;
  description: string;
  /** CSS variable name (without `--`) used as the edge color in both surfaces. */
  colorVar: string;
};

export const patterns = {
  "ai-native": {
    id: "ai-native",
    label: "AI-native platforms",
    description: "Agentic UX, RAG, evaluation tooling, AI-platform front ends.",
    colorVar: "signal-edge",
  },
  "design-systems": {
    id: "design-systems",
    label: "Design-system infrastructure",
    description: "Multi-framework component libraries, tokens, contribution models.",
    colorVar: "accent",
  },
  streaming: {
    id: "streaming",
    label: "Streaming-grade reliability",
    description: "Multi-million-user performance, release safety, observability.",
    colorVar: "signal-good",
  },
  "agentic-ux": {
    id: "agentic-ux",
    label: "Agentic UX",
    description: "Autonomous workflows, human-in-the-loop, inspectable agents.",
    colorVar: "signal-active",
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise scale",
    description: "Regulated environments, audit, compliance-aware UI.",
    // Muted neutral — enterprise is the most-shared pattern across nodes, so
    // a saturated color would dominate the graph. We let the cyan-family
    // patterns (ai-native, design-systems, agentic-ux) carry the narrative.
    colorVar: "border-strong",
  },
} as const satisfies Record<PatternId, PatternMeta>;

export const patternList: PatternMeta[] = Object.values(patterns);

/* ---------------------------------------------------------------------------
 * Nodes — companies as primary nodes (per blueprint §7.5).
 * Each node is a real engagement on the resume.
 * ------------------------------------------------------------------------- */

export type NodeId = "fueled" | "moment" | "eino" | "peacock" | "diligent" | "bmw" | "deloitte";

export type CareerNode = {
  id: NodeId;
  /** Short display label rendered on/near the node. */
  label: string;
  /** Long form name used in the tooltip header. */
  fullName: string;
  /** Role held at this engagement. */
  role: string;
  /** Years in `YYYY–YYYY` or `YYYY+` format. */
  years: string;
  /** One-line, metric-grounded summary for the tooltip body. */
  summary: string;
  /** Tags driving edge styling and pattern filters on `/work`. */
  patterns: PatternId[];
  /** Optional `/work/[slug]` deep link target (Phase 3). Falls back to `/work`. */
  slug?: string;
  /** Hand-tuned 3D position. See coordinate system above. */
  position: readonly [number, number, number];
  /** Marker size hint — purely aesthetic emphasis for flagship engagements. */
  weight: 0.6 | 0.8 | 1 | 1.2;
};

export const nodes: readonly CareerNode[] = [
  {
    id: "fueled",
    label: "Fueled",
    fullName: "Fueled",
    role: "Lead Engineer, Web Applications",
    years: "2025+",
    summary:
      "Frontend architecture for enterprise web platforms across AI, media, and digital-transformation engagements.",
    patterns: ["ai-native", "design-systems", "enterprise"],
    position: [0.95, 0.5, 0.7],
    weight: 1,
  },
  {
    id: "moment",
    label: "Moment",
    fullName: "Moment",
    role: "VP of Engineering",
    years: "2025",
    summary:
      "Took an AI-native knowledge platform from prototype velocity to production reliability. Owned hiring, leveling, RFCs, on-call.",
    patterns: ["ai-native", "agentic-ux"],
    slug: "moment-ai-platform",
    position: [0.75, 0.95, 0.85],
    weight: 1.2,
  },
  {
    id: "eino",
    label: "eino.ai",
    fullName: "eino.ai",
    role: "Lead Frontend Engineer",
    years: "2023–2025",
    summary:
      "Agentic RF network planning, digital-twin maps, real-time heatmaps. Shipped agentic UX ahead of industry adoption.",
    patterns: ["ai-native", "agentic-ux"],
    slug: "eino-ai-network-planning",
    position: [0.4, 0.4, 0.95],
    weight: 1.2,
  },
  {
    id: "peacock",
    label: "Peacock",
    fullName: "Sky · NBCUniversal · Peacock",
    role: "Senior Software Engineer",
    years: "2020–2022",
    summary:
      "Tens-of-millions-of-viewers scale on streaming + commerce surfaces. Reliability, latency, release safety on the surfaces where regressions hit minutes after deploy.",
    patterns: ["streaming", "enterprise"],
    slug: "peacock-streaming",
    position: [-0.1, 0.2, -0.85],
    weight: 1.2,
  },
  {
    id: "diligent",
    label: "Diligent",
    fullName: "Diligent",
    role: "Lead Frontend Engineer",
    years: "2019–2020",
    summary:
      "Authored the company-wide React + Angular enterprise design system serving Fortune-1000-class governance products.",
    patterns: ["design-systems", "enterprise"],
    slug: "diligent-design-system",
    position: [-0.45, 0.7, 0.15],
    weight: 1.2,
  },
  {
    id: "bmw",
    label: "BMW Group",
    fullName: "BMW Group",
    role: "Lead Frontend Engineer",
    years: "2018–2019",
    summary:
      "Innovation platforms for the BMW Group — strategic R&D challenges across future mobility, sustainability, connected vehicles.",
    patterns: ["enterprise"],
    slug: "bmw-innovation",
    position: [-0.7, 0.45, -0.3],
    weight: 0.8,
  },
  {
    id: "deloitte",
    label: "Deloitte",
    fullName: "Deloitte",
    role: "Software Engineer",
    years: "2016–2018",
    summary:
      "Enterprise data-visualization surfaces for clients in financial services and regulated industries.",
    patterns: ["enterprise"],
    position: [-0.95, -0.1, -0.5],
    weight: 0.6,
  },
] as const;

/* ---------------------------------------------------------------------------
 * Edges — derived from each node's pattern tags. We connect every pair of
 * nodes that share a pattern. The result is dense enough to read as a graph,
 * sparse enough to read as signal, not noise.
 *
 * Edges are deduped (each pair appears once) and the rendered color is the
 * pattern the pair shares with the highest visual weight (defined by index
 * in patternList — earlier patterns win).
 * ------------------------------------------------------------------------- */

export type CareerEdge = {
  id: string;
  from: NodeId;
  to: NodeId;
  pattern: PatternId;
  /** All patterns this pair shares — surfaced in the tooltip when relevant. */
  sharedPatterns: PatternId[];
};

const patternPriority: Record<PatternId, number> = {
  "ai-native": 0,
  "agentic-ux": 1,
  "design-systems": 2,
  streaming: 3,
  enterprise: 4,
};

function pickPrimaryPattern(shared: PatternId[]): PatternId {
  return [...shared].sort((a, b) => patternPriority[a] - patternPriority[b])[0]!;
}

export const edges: readonly CareerEdge[] = (() => {
  const out: CareerEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const shared = a.patterns.filter((p) => b.patterns.includes(p));
      if (shared.length === 0) continue;
      out.push({
        id: `${a.id}--${b.id}`,
        from: a.id,
        to: b.id,
        pattern: pickPrimaryPattern(shared),
        sharedPatterns: shared,
      });
    }
  }
  return out;
})();

/* ---------------------------------------------------------------------------
 * Projection helpers shared by both surfaces.
 * ------------------------------------------------------------------------- */

/** Padding spec for the SVG viewport — per-edge, so labels and the time axis
 * can claim their own real estate without crowding the cluster. */
export type SvgPadding = { x: number; top: number; bottom: number };

/**
 * Project a graph-space position onto a 2D viewport for the SVG.
 *
 * X is treated strictly chronologically (no perspective shift, so the time
 * axis reads honestly). Y picks up a tiny z-depth nudge so nodes that share
 * an x-position can still differentiate themselves vertically.
 */
export function projectToSvg(
  position: readonly [number, number, number],
  viewport: { width: number; height: number; padding: SvgPadding },
): { x: number; y: number } {
  const [px, py, pz] = position;
  const xN = (px + 1) / 2;
  // y of -1 maps to the bottom of the usable area; +1 to the top. A small
  // pz nudge keeps overlapping x-positions readable.
  const yPerspective = pz * 0.04;
  const yN = 1 - (py + 1 + yPerspective) / 2;
  const x = viewport.padding.x + xN * (viewport.width - viewport.padding.x * 2);
  const y =
    viewport.padding.top + yN * (viewport.height - viewport.padding.top - viewport.padding.bottom);
  return { x, y };
}

/** Resolve a node's deep-link target. Phase 3 will replace with real pages. */
export function nodeHref(node: CareerNode): string {
  return node.slug ? `/work#${node.slug}` : "/work";
}

/** Convenience lookup. */
export function getNode(id: NodeId): CareerNode {
  const n = nodes.find((node) => node.id === id);
  if (!n) throw new Error(`Unknown career-graph node: ${id}`);
  return n;
}

/** CSS color value referencing the pattern's token (works in any theme). */
export function patternColorVar(pattern: PatternId): string {
  return `var(--${patterns[pattern].colorVar})`;
}

/** Inline-style object using the pattern color — useful in MDX, badges, SVG. */
export function patternColorStyle(pattern: PatternId): CSSProperties {
  return { color: patternColorVar(pattern) };
}
