/**
 * Shared types for `<SystemDiagram />` and its server-rendered fallback.
 *
 * Authored deterministically in MDX (per-case-study) so each diagram is
 * stable and reviewable in PRs. Node positions are hand-tuned for
 * readability — no auto-layout runtime.
 */

export type SystemNodeKind = "client" | "service" | "data" | "external" | "agent";

export type SystemNode = {
  id: string;
  label: string;
  /** Sub-label / role / framework — rendered as mono small-caps. */
  kind: SystemNodeKind;
  detail?: string;
  /** Coordinates in the diagram's local 100×100 grid. Hand-tuned. */
  x: number;
  y: number;
};

export type SystemEdge = {
  id: string;
  from: string;
  to: string;
  /** Edge label rendered along the curve. Optional. */
  label?: string;
  /** Solid for sync calls, dashed for events / async, dotted for telemetry. */
  variant?: "solid" | "dashed" | "dotted";
};

export type SystemDiagramData = {
  nodes: readonly SystemNode[];
  edges: readonly SystemEdge[];
};
