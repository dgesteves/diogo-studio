import type { ReactElement } from "react";
import type { SystemDiagramData, SystemNodeKind } from "./system-diagram-types";

const nodeKindStyles: Record<SystemNodeKind, { ring: string; tag: string; tagText: string }> = {
  client: { ring: "stroke-accent", tag: "fill-accent/15", tagText: "fill-accent" },
  service: {
    ring: "stroke-signal-edge",
    tag: "fill-signal-edge/15",
    tagText: "fill-signal-edge",
  },
  data: {
    ring: "stroke-signal-good",
    tag: "fill-signal-good/15",
    tagText: "fill-signal-good",
  },
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

const VIEW_W = 800;
const VIEW_H = 360;
const PAD_X = 32;
const PAD_Y = 36;
const NODE_W = 156;
const NODE_H = 72;

function project(x: number, y: number) {
  const u = x / 100;
  const v = y / 100;
  return {
    cx: PAD_X + u * (VIEW_W - PAD_X * 2),
    cy: PAD_Y + v * (VIEW_H - PAD_Y * 2),
  };
}

function edgeAnchor(from: { cx: number; cy: number }, to: { cx: number; cy: number }) {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const start = horizontal
    ? { x: from.cx + Math.sign(dx) * (NODE_W / 2), y: from.cy }
    : { x: from.cx, y: from.cy + Math.sign(dy) * (NODE_H / 2) };
  const end = horizontal
    ? { x: to.cx - Math.sign(dx) * (NODE_W / 2), y: to.cy }
    : { x: to.cx, y: to.cy - Math.sign(dy) * (NODE_H / 2) };
  return { start, end };
}

export function SystemDiagramFallback({
  title,
  description,
  data,
  height,
}: {
  title: string;
  description?: string;
  data: SystemDiagramData;
  height: number;
}): ReactElement {
  const projected = new Map(data.nodes.map((n) => [n.id, project(n.x, n.y)]));

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height={height}
      className="block"
    >
      <title>{title}</title>
      {description ? <desc>{description}</desc> : null}

      <g>
        {data.edges.map((edge) => {
          const from = projected.get(edge.from);
          const to = projected.get(edge.to);
          if (!from || !to) return null;
          const { start, end } = edgeAnchor(from, to);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const dash =
            edge.variant === "dashed" ? "6 4" : edge.variant === "dotted" ? "2 4" : undefined;
          return (
            <g key={edge.id}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                strokeWidth={1.25}
                strokeDasharray={dash}
                className="stroke-border-strong"
              />
              {edge.label ? (
                <g>
                  <rect
                    x={midX - 38}
                    y={midY - 9}
                    width={76}
                    height={18}
                    rx={4}
                    className="fill-background stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    fontSize={9}
                    className="fill-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {edge.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </g>

      <g>
        {data.nodes.map((node) => {
          const p = projected.get(node.id);
          if (!p) return null;
          const style = nodeKindStyles[node.kind];
          const x = p.cx - NODE_W / 2;
          const y = p.cy - NODE_H / 2;
          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                className={`fill-surface ${style.ring}`}
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
        })}
      </g>
    </svg>
  );
}
