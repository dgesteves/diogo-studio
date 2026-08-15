import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Destination } from "../schema";

export const caseStudies: Destination = {
  ...getStationEntry("caseStudies"),
  eyebrow: "Deeper dives",
  title: "How the hard problems got solved.",
  summary: "Case-study summaries on design systems, streaming scale, and agentic UX.",
  blocks: [
    {
      id: "intro",
      kind: "lede",
      text: "Four problems worth the space to explain. These are the summaries; most of the detail sits under NDA, which is why the walkthrough is a conversation rather than a page.",
    },
    {
      id: "studies",
      kind: "cards",
      items: [
        {
          title: "One design system, two frameworks",
          meta: "Diligent",
          body: "Dual React + Angular component infrastructure that kept product teams consistent without freezing their roadmaps.",
        },
        {
          title: "Streaming-grade release safety",
          meta: "Peacock",
          body: "Instrumentation, monitoring, and CI gates for UIs where a regression hits millions of viewers within minutes.",
        },
        {
          title: "Agentic UX beyond the demo",
          meta: "eino.ai",
          body: "Natural-language design, autonomous execution with human override, and inspectable agent reasoning in production.",
        },
        {
          title: "Prototype velocity → production reliability",
          meta: "Moment",
          body: "Standing up hiring, RFCs, CI/CD, and observability as VPE — without breaking the shipping pace.",
        },
      ],
    },
    {
      id: "next",
      kind: "links",
      items: [
        { label: "Book a walkthrough", href: routes.contact },
        { label: "The engagements behind them", href: routes.work },
      ],
    },
  ],
};
