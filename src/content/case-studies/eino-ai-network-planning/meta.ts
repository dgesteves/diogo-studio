import type { CaseStudyMeta } from "@/content/schema/article";

export const einoAiNetworkPlanningMeta: CaseStudyMeta = {
  title: "Agentic RF network planning at eino.ai",
  description:
    "Lead engineer on an agentic platform that compresses weeks of RF network planning into hours. Digital-twin maps, agent orchestration, human-in-the-loop review — production agentic UX before the category existed.",
  slug: "eino-ai-network-planning",
  publishedAt: "2025-05-22",
  company: "eino.ai",
  role: "Lead Frontend Engineer · Founding",
  years: "2023–2025",
  patterns: ["ai-native", "agentic-ux"],
  order: 10,
  metadata: { readingTime: 6, wordCount: 1179 },
  metrics: [
    {
      label: "Domain",
      value: "RF planning",
      unit: "vertical",
      hint: "From sales pitch to deployable HLD in one session.",
    },
    {
      label: "Planning loop",
      value: "Hours",
      unit: "vs weeks",
      hint: "What a senior RF engineer used to scope in a sprint.",
    },
    {
      label: "Surfaces",
      value: "5",
      unit: "agent panels",
      hint: "Brief, sites, links, capacity, proposal — composable.",
    },
    {
      label: "Human-in-the-loop",
      value: "100%",
      unit: "of plans",
      hint: "Every plan is reviewable, redoable, and traceable to inputs.",
    },
  ],
  outcomes: [
    "Hours-to-plan replaced weeks-to-plan for the same scope of RF design — without dropping the engineer-in-the-loop.",
    "Cut customer onboarding from weeks of consulting to a same-day workshop, opening the SMB segment the product was designed for.",
    "Frontend ran an agent contract that survived three model swaps and two prompt refactors without breaking the UI.",
  ],
  links: [{ label: "eino.ai", href: "https://eino.ai" }],
};
