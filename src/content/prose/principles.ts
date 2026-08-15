import "server-only";

import { getStationEntry } from "../pages";
import { practices, principles as stances } from "../principles";
import type { Page } from "../schema";

export const principles: Page = {
  ...getStationEntry("principles"),
  eyebrow: "How I build",
  title: "The non-negotiables behind the work.",
  summary:
    "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
  blocks: [
    {
      id: "principles",
      kind: "cards",
      items: stances.map((stance) => ({
        title: stance.title,
        meta: stance.meta,
        body: stance.body,
      })),
    },
    {
      id: "practices",
      kind: "list",
      title: "The short version",
      items: practices,
    },
  ],
};
