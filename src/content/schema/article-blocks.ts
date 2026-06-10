import type { SystemDiagramData } from "./system-diagram";

export type CalloutTone = "info" | "warn" | "danger" | "tip";
export type MetricTone = "default" | "good" | "warn" | "hot" | "accent";
export type SparklineTone = "accent" | "good" | "warn" | "hot" | "muted";

export type SparklineData = {
  values: readonly number[];
  tone?: SparklineTone;
  ariaLabel?: string;
};

export type MetricItem = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: MetricTone;
  sparkline?: SparklineData;
};

export type TimelinePhase = {
  tag: string;
  title: string;
  dates?: string;
  body: string;
};

export type DecisionItem = {
  index?: number;
  title: string;
  constraint: string;
  options: string;
  choice: string;
  outcome: string;
};

export type ArticleBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "quote"; text: string }
  | { kind: "callout"; tone?: CalloutTone; title?: string; body: string }
  | { kind: "tradeoff"; title?: string; gained: string; paid: string }
  | { kind: "outcome"; tag?: string; body: string }
  | { kind: "stack"; label: string; items: readonly string[] }
  | { kind: "metrics"; items: readonly MetricItem[] }
  | {
      kind: "diagram";
      title: string;
      description?: string;
      caption?: string;
      data: SystemDiagramData;
    }
  | { kind: "timeline"; phases: readonly TimelinePhase[] }
  | { kind: "decisions"; items: readonly DecisionItem[] };
