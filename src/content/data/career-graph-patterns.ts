import type { CSSProperties } from "react";

export type PatternId = "ai-native" | "design-systems" | "streaming" | "agentic-ux" | "enterprise";

export type PatternMeta = {
  id: PatternId;
  label: string;
  description: string;
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
    colorVar: "border-strong",
  },
} as const satisfies Record<PatternId, PatternMeta>;

export const patternList: PatternMeta[] = Object.values(patterns);

export const patternIds: readonly PatternId[] = patternList.map((p) => p.id);

const patternIdSet = new Set<string>(patternIds);

export function isPatternId(value: string): value is PatternId {
  return patternIdSet.has(value);
}

export function parsePatternIds(value: string | string[] | undefined): PatternId[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.filter(isPatternId);
}

export function patternColorVar(pattern: PatternId): string {
  return `var(--${patterns[pattern].colorVar})`;
}

export function patternColorStyle(pattern: PatternId): CSSProperties {
  return { color: patternColorVar(pattern) };
}
