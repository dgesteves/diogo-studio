"use client";

import { Background, BackgroundVariant, Controls, ReactFlow } from "@xyflow/react";
import { type ReactElement } from "react";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";

import { mapEdges, mapNodes } from "./system-diagram-canvas-map";
import { CanvasNodeOverlay } from "./system-diagram-canvas-overlay";
import type { SystemDiagramData } from "@/types/system-diagram";
import "@xyflow/react/dist/style.css";

export function SystemDiagramCanvas({
  data,
  title,
}: {
  data: SystemDiagramData;
  title: string;
}): ReactElement | null {
  const { reducedMotion } = useReducedMotionPreference();

  const nodes = mapNodes(data.nodes);
  const edges = mapEdges(data.edges);

  if (reducedMotion) return null;

  return (
    <div className="system-diagram-canvas absolute inset-0" role="presentation" aria-label={title}>
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
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={{}}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      <CanvasNodeOverlay data={data} />
    </div>
  );
}
