import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Destination } from "../schema";

export const caseStudies: Destination = {
  ...getStationEntry("caseStudies"),
  eyebrow: "Deeper dives",
  title: "How the hard problems got solved.",
  summary: "In-depth case studies on design systems, streaming scale, and agentic UX.",
  blocks: [
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
      id: "status",
      kind: "lede",
      text: "Full write-ups are being drafted for this space. Until they land, I'll happily walk you through any of these live — architecture diagrams included.",
    },
    {
      id: "next",
      kind: "links",
      items: [{ label: "Book a walkthrough", href: routes.contact }],
    },
  ],
};
