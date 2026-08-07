import { finalizeEntry } from "./entry";
import type { IndexEntry } from "./types";

import { careerEngagements, operatingCompanies } from "../../src/constants/career";
import { patterns as careerPatterns } from "../../src/constants/patterns";
import { routes } from "../../src/constants/routes";
import { siteConfig } from "../../src/config/site";

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

  for (const engagement of careerEngagements) {
    const patternLabels = engagement.patterns
      .map((p) => careerPatterns[p]?.label ?? p)
      .filter(Boolean)
      .join(", ");
    const permalink = routes.home;
    out.push(
      finalizeEntry({
        sourceId: `career:${engagement.id}`,
        sourceKind: "career",
        sourceTitle: engagement.name,
        permalink,
        anchor: undefined,
        heading: engagement.role,
        tags: [...engagement.patterns],
        ordinal: 0,
        content:
          `${engagement.name} (${engagement.years}) — ${engagement.role}. ` +
          `${engagement.summary} Patterns: ${patternLabels}.`,
      }),
    );
  }
  return out;
}
