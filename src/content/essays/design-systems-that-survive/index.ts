import type { EssayInput } from "@/content/schema/article";
import { actualWork } from "./actual-work";
import { failureModes } from "./failure-modes";
import { metrics } from "./metrics";

export const designSystemsThatSurvive: EssayInput = {
  title: "Design systems that survive multiple product lines",
  description:
    "What separates a design system that survives a five-year, multi-product engagement from one that ships eight Buttons and dies. Hint: it isn't the components.",
  slug: "design-systems-that-survive",
  publishedAt: "2025-05-22",
  patterns: ["design-systems", "enterprise"],
  dek: "If your design system can't survive your most opinionated product team contributing a Banner, it isn't going to survive five years.",
  order: 10,
  body: [...failureModes, ...actualWork, ...metrics],
};
