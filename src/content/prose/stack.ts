import "server-only";

import { getStationEntry } from "../pages";
import type { Destination } from "../schema";
import { stackGroups } from "../stack";

export const stack: Destination = {
  ...getStationEntry("stack"),
  eyebrow: "The toolkit",
  title: "The technical stack behind the work.",
  summary: "Languages, frameworks, and platforms Diogo Esteves builds with.",
  blocks: [
    {
      id: "toolkit",
      kind: "lede",
      text: "The daily toolkit — fluent, in production, at scale. Not a logo wall: everything here has shipped for real users.",
    },
    ...stackGroups.map((group) => ({
      id: group.id,
      kind: "list" as const,
      title: group.label,
      items: group.items,
    })),
  ],
};
