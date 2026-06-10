import type { ReactElement } from "react";
import { cn } from "@/lib/utils/cn";

import { NODE_H, NODE_W } from "./system-diagram-geometry";
import type { SystemNode, SystemNodeKind } from "./system-diagram-types";

const nodeKindStyles: Record<SystemNodeKind, { ring: string; tag: string; tagText: string }> = {
  client: { ring: "stroke-accent", tag: "fill-accent/15", tagText: "fill-accent" },
  service: { ring: "stroke-signal-edge", tag: "fill-signal-edge/15", tagText: "fill-signal-edge" },
  data: { ring: "stroke-signal-good", tag: "fill-signal-good/15", tagText: "fill-signal-good" },
  external: {
    ring: "stroke-border-strong",
    tag: "fill-surface-muted",
    tagText: "fill-muted-foreground",
  },
  agent: {
    ring: "stroke-signal-active",
    tag: "fill-signal-active/15",
    tagText: "fill-signal-active",
  },
};

const kindLabels: Record<SystemNodeKind, string> = {
  client: "Client",
  service: "Service",
  data: "Data",
  external: "External",
  agent: "Agent",
};

export function FallbackNode({
  node,
  p,
}: {
  node: SystemNode;
  p: { cx: number; cy: number };
}): ReactElement {
  const style = nodeKindStyles[node.kind];
  const x = p.cx - NODE_W / 2;
  const y = p.cy - NODE_H / 2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        className={cn("fill-surface", style.ring)}
        strokeWidth={1.25}
      />
      <rect x={x + 8} y={y + 8} width={56} height={14} rx={3} className={style.tag} />
      <text
        x={x + 36}
        y={y + 18}
        textAnchor="middle"
        fontSize={8}
        className={style.tagText}
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {kindLabels[node.kind]}
      </text>
      <text
        x={x + 12}
        y={y + 40}
        fontSize={13}
        className="fill-foreground"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
      >
        {node.label}
      </text>
      {node.detail ? (
        <text
          x={x + 12}
          y={y + 58}
          fontSize={10}
          className="fill-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {node.detail}
        </text>
      ) : null}
    </g>
  );
}
