"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMemo, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import type { SystemDiagramData, SystemNode, SystemNodeKind } from "./system-diagram-types";
import "@xyflow/react/dist/style.css";

/**
 * `<SystemDiagramCanvas />` — the interactive xyflow surface that hydrates
 * on top of `<SystemDiagramFallback />`. Reduced-motion + low-power users
 * never see this (the wrapper returns early) so the fallback stays
 * authoritative.
 *
 * Keep this small: xyflow is already heavy (~80 KB gz), so we
 * deliberately don't bring in node types, mini-map, layout helpers, or
 * other extras. A single custom node renderer + dashed edges is enough
 * to convey "this is a real architecture diagram."
 */

const kindClass: Record<SystemNodeKind, string> = {
  client: "border-accent/60 text-accent",
  service: "border-signal-edge/60 text-signal-edge",
  data: "border-signal-good/60 text-signal-good",
  external: "border-border-strong text-muted-foreground",
  agent: "border-signal-active/60 text-signal-active",
};

const kindLabel: Record<SystemNodeKind, string> = {
  client: "Client",
  service: "Service",
  data: "Data",
  external: "External",
  agent: "Agent",
};

const NODE_W = 156;
const NODE_H = 72;

function mapNodes(nodes: readonly SystemNode[]): Node[] {
  // xyflow's grid is in pixels; we lay them out using the same projection
  // the SVG fallback uses, so hydration is "snap-into-place" rather than a
  // visible relayout. The 800×360 viewport mirrors the fallback's viewBox.
  return nodes.map((n) => ({
    id: n.id,
    type: "default",
    position: {
      x: 32 + (n.x / 100) * (800 - 64) - NODE_W / 2,
      y: 36 + (n.y / 100) * (360 - 72) - NODE_H / 2,
    },
    data: { label: n.label, detail: n.detail, kind: n.kind },
    draggable: false,
    connectable: false,
    selectable: false,
  }));
}

function mapEdges(edges: SystemDiagramData["edges"]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: e.label,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "var(--border-strong)",
      strokeDasharray: e.variant === "dashed" ? "6 4" : e.variant === "dotted" ? "2 4" : undefined,
      strokeWidth: 1.25,
    },
    labelStyle: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fill: "var(--muted-foreground)",
    },
    labelBgStyle: { fill: "var(--background)" },
  }));
}

export function SystemDiagramCanvas({
  data,
  title,
}: {
  data: SystemDiagramData;
  title: string;
}): ReactElement | null {
  const { reducedMotion } = useReducedMotionPreference();

  const nodes = useMemo(() => mapNodes(data.nodes), [data.nodes]);
  const edges = useMemo(() => mapEdges(data.edges), [data.edges]);

  // Respect reduced-motion + low-power: keep the SVG fallback authoritative.
  if (reducedMotion) return null;

  return (
    <div
      className="mdx-system-diagram-canvas absolute inset-0"
      role="presentation"
      aria-label={title}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag
        fitView
        fitViewOptions={{ padding: 0.1 }}
        proOptions={{ hideAttribution: true }}
        // Render custom node bodies — xyflow's defaults look like a flowchart;
        // we want them to look like the same cards the fallback drew.
        nodeTypes={{}}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
        <Controls position="bottom-right" showInteractive={false} className="mdx-flow-controls" />
      </ReactFlow>
      {/* Render node bodies on top of xyflow's default boxes so they pick
          up our typography + tokens. xyflow draws connection handles which
          we hide entirely via mdx.css. */}
      <div className="pointer-events-none absolute inset-0">
        {data.nodes.map((n) => {
          const left = 32 + (n.x / 100) * (800 - 64) - NODE_W / 2;
          const top = 36 + (n.y / 100) * (360 - 72) - NODE_H / 2;
          return (
            <div
              key={n.id}
              className={`bg-surface absolute flex flex-col gap-1 rounded-lg border ${kindClass[n.kind]} p-3`}
              style={{ left, top, width: NODE_W, height: NODE_H }}
              aria-hidden="true"
            >
              <span
                className={`font-mono text-[9px] font-medium tracking-wider uppercase ${kindClass[n.kind]}`}
              >
                {kindLabel[n.kind]}
              </span>
              <span className="text-foreground text-sm font-medium tracking-tight">{n.label}</span>
              {n.detail ? (
                <span className="text-muted-foreground font-mono text-[10px] leading-tight">
                  {n.detail}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
