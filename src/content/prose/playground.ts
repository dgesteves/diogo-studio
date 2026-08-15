import "server-only";

import { getStationEntry } from "../pages";
import { experiments } from "../playground";
import type { Destination } from "../schema";

export const playground: Destination = {
  ...getStationEntry("playground"),
  eyebrow: "Interactive toys",
  title: "Where the interface gets to play.",
  summary: "Interactive experiments powering this studio — 3D, motion, and command-driven UX.",
  blocks: [
    {
      id: "live",
      kind: "lede",
      text: "Everything here is running live in the site you're standing in. No mockups — view source is the case study.",
    },
    {
      id: "experiments",
      kind: "cards",
      items: experiments.map((experiment) => ({
        title: experiment.title,
        meta: experiment.meta,
        body: experiment.body,
      })),
    },
  ],
};
