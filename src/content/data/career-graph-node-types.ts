import type { PatternId } from "./patterns";

export type NodeId = "fueled" | "moment" | "eino" | "peacock" | "diligent" | "bmw" | "deloitte";

export type CareerNode = {
  id: NodeId;
  label: string;
  fullName: string;
  role: string;
  years: string;
  summary: string;
  patterns: PatternId[];
  slug?: string;
  position: readonly [number, number, number];
  weight: 0.6 | 0.8 | 1 | 1.2;
};
