import { finalizeEntry } from "./entry";
import type { IndexEntry } from "./types";

import { engagements, operatingCompanies, patternLabels } from "../../src/content/career";
import { routes } from "../../src/content/pages";
import { siteConfig } from "../../src/content/profile";

export function buildCareerChunks(): IndexEntry[] {
  const out: IndexEntry[] = [];
  out.push(
    finalizeEntry({
      sourceId: "site:identity",
      sourceKind: "site",
      sourceTitle: siteConfig.name,
      permalink: routes.about,
      anchor: undefined,
      heading: "Identity",
      tags: undefined,
      ordinal: 0,
      content:
        `${siteConfig.name} — ${siteConfig.role}. ${siteConfig.tagline} ` +
        `Based in ${siteConfig.location}. ${siteConfig.availability} ` +
        `Operating companies: ${operatingCompanies.join(", ")}.`,
    }),
  );

  for (const engagement of engagements) {
    const labels = engagement.patterns.map((pattern) => patternLabels[pattern]).join(", ");
    out.push(
      finalizeEntry({
        sourceId: `career:${engagement.id}`,
        sourceKind: "career",
        sourceTitle: engagement.company,
        permalink: routes.work,
        anchor: undefined,
        heading: engagement.role,
        tags: [...engagement.patterns],
        ordinal: 0,
        content:
          `${engagement.company} (${engagement.period}) — ${engagement.role}. ` +
          `${engagement.points.join(" ")} Patterns: ${labels}.`,
      }),
    );
  }
  return out;
}
