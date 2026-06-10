import type { CaseStudyInput } from "@/content/schema/article";
import { architecture } from "./architecture";
import { closing } from "./closing";
import { decisions } from "./decisions";
import { habits } from "./habits";
import { intro } from "./intro";

export const peacockStreaming: CaseStudyInput = {
  title: "Streaming-grade reliability at Peacock",
  description:
    "Senior engineer on the Peacock web surfaces during launch and scale-up. The work was less about features and more about not breaking on a minute-by-minute basis — release safety, performance, and the discipline a global streaming surface demands.",
  slug: "peacock-streaming",
  publishedAt: "2025-05-22",
  company: "NBCUniversal · Peacock",
  role: "Senior Software Engineer",
  years: "2020–2022",
  patterns: ["streaming", "enterprise"],
  order: 20,
  metrics: [
    {
      label: "Subscribers",
      value: "30M+",
      unit: "public figure",
      hint: "NBCUniversal-disclosed scale during my tenure.",
    },
    {
      label: "Release cadence",
      value: "Daily",
      unit: "production",
      hint: "Every merge had to be safely shippable to a multi-million-user surface.",
    },
    {
      label: "Surfaces",
      value: "Web",
      unit: "+ commerce",
      hint: "Sign-up, billing, account, video discovery. The non-player surfaces.",
    },
    {
      label: "On-call",
      value: "Eyes on",
      unit: "during events",
      hint: "Olympics, NFL, marquee launches — surfaces under live load.",
    },
  ],
  outcomes: [
    "Shipped through Peacock's growth phase without my surfaces being the reason for an incident — measured in launch-week pageloads and not adjectives.",
    "Turned the team's release process into one engineers stopped fearing, by making safety checks visible instead of bolted-on.",
    "Took the operational habits I learned here — feature flags, canary, rollback discipline — into every senior role since.",
  ],
  body: [...intro, ...architecture, ...habits, ...decisions, ...closing],
};
