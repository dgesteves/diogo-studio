export type SystemNodeKind = "client" | "service" | "data" | "external" | "agent";

export type SystemNode = {
  id: string;
  label: string;
  kind: SystemNodeKind;
  detail?: string;
  x: number;
  y: number;
};

export type SystemEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  variant?: "solid" | "dashed" | "dotted";
};

export type SystemDiagramData = {
  nodes: readonly SystemNode[];
  edges: readonly SystemEdge[];
};
