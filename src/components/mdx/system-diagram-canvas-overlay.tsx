import type { ReactElement } from "react";
import { cn } from "@/lib/utils/cn";

import { NODE_H, NODE_W, nodeTopLeft } from "./system-diagram-geometry";
import type { SystemDiagramData, SystemNodeKind } from "./system-diagram-types";

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

export function CanvasNodeOverlay({ data }: { data: SystemDiagramData }): ReactElement {
  return (
    <div className="pointer-events-none absolute inset-0">
      {data.nodes.map((n) => {
        const { left, top } = nodeTopLeft(n.x, n.y);
        return (
          <div
            key={n.id}
            className={cn(
              "bg-surface absolute flex flex-col gap-1 rounded-lg border p-3",
              kindClass[n.kind],
            )}
            style={{ left, top, width: NODE_W, height: NODE_H }}
            aria-hidden="true"
          >
            <span
              className={cn(
                "font-mono text-[9px] font-medium tracking-wider uppercase",
                kindClass[n.kind],
              )}
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
  );
}
