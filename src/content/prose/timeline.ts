import "server-only";

import { education, engagements, orgLine } from "../career";
import { getStationEntry } from "../pages";
import type { ContentBlock, Destination } from "../schema";

type TimelineItem = Extract<ContentBlock, { kind: "timeline" }>["items"][number];

/**
 * `/work` is the engagement record; this is the whole arc, education included, in one
 * chronological run. Both derive from `content/career.ts` — the two pages differ by
 * projection, never by a second authoring of the same date.
 */
const chronological: readonly TimelineItem[] = [
  ...engagements.map((engagement) => ({
    start: engagement.start,
    item: {
      period: engagement.period,
      title: engagement.role,
      org: orgLine(engagement),
      points: engagement.points,
    },
  })),
  ...education.map((entry) => ({
    start: entry.start,
    item: {
      period: entry.period,
      title: entry.qualification,
      org: entry.institution,
      points: entry.points,
    },
  })),
]
  .sort((a, b) => b.start.localeCompare(a.start))
  .map((entry) => entry.item);

export const timeline: Destination = {
  ...getStationEntry("timeline"),
  eyebrow: "The long arc",
  title: "From law school to leading AI-native platforms.",
  summary: "The chronological career and education timeline of Diogo Esteves.",
  blocks: [
    {
      id: "intro",
      kind: "lede",
      text: "Law school first, then the pivot. Every step since has traded up in scale, ambiguity, or altitude.",
    },
    {
      id: "chronology",
      kind: "timeline",
      items: chronological,
    },
  ],
};
