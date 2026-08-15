import "server-only";

import { getStationEntry } from "../pages";
import type { Page } from "../schema";

export const uses: Page = {
  ...getStationEntry("uses"),
  eyebrow: "The rig",
  title: "Three monitors, one focus.",
  summary: "The hardware, software, and rig Diogo Esteves ships the work from.",
  blocks: [
    {
      id: "rig",
      kind: "lede",
      text: "Live signals from the rig the work ships from — runtime on the left, ops telemetry in the center, perf and latency on the right.",
    },
    {
      id: "daily-drivers",
      kind: "list",
      title: "Daily drivers",
      items: [
        "Three-monitor desk setup tuned for flow — the one modeled in this world.",
        "VS Code with an AI pair, plus a terminal-first workflow.",
        "Figma for design-system collaboration with design leadership.",
        "Local-first, typed, test-driven development.",
      ],
    },
    {
      id: "operating-rhythm",
      kind: "list",
      title: "Operating rhythm",
      items: [
        "Async by default — Lisbon base, US-aligned hours.",
        "Deep-work mornings, review and pairing afternoons.",
      ],
    },
  ],
};
