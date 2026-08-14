import "server-only";

import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const principles: Destination = {
  ...getStationEntry("principles"),
  eyebrow: "How I build",
  title: "The non-negotiables behind the work.",
  summary:
    "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          title: "The frontend is the product",
          meta: "Strategy",
          body: "Treat the surface users touch as the business — never a thin layer over an API.",
        },
        {
          title: "Systems over heroics",
          meta: "Architecture",
          body: "Turn ambiguity into composable, evolvable architectures that survive multiple product lines and team changes.",
        },
        {
          title: "AI that ships",
          meta: "AI-native",
          body: "Agentic UX, RAG-backed flows, and human-in-the-loop review that hold up in production, not just in demos.",
        },
        {
          title: "Accessibility is a gate",
          meta: "WCAG",
          body: "Semantic HTML, keyboard support, visible focus — a requirement inherited from boardroom and broadcast-grade software.",
        },
        {
          title: "Performance is a feature",
          meta: "Core Web Vitals",
          body: "Bundle budgets, runtime optimization, and release safety — measured, not assumed. Learned at streaming scale.",
        },
        {
          title: "Decide in the open",
          meta: "Leadership",
          body: "RFCs, leveling rubrics, and roadmaps the whole team can reason about. High trust, async, shipping-oriented.",
        },
      ],
    },
  ],
};
