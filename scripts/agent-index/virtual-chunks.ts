import { finalizeEntry } from "./entry";
import type { IndexEntry } from "./types";

import {
  nodes as careerNodes,
  patterns as careerPatterns,
} from "../../src/content/data/career-graph";
import { operatingCompanies, siteConfig } from "../../src/config/site";

export function buildCareerChunks(): IndexEntry[] {
  const out: IndexEntry[] = [];
  out.push(
    finalizeEntry({
      sourceId: "site:identity",
      sourceKind: "site",
      sourceTitle: siteConfig.name,
      permalink: "/about",
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

  for (const node of careerNodes) {
    const patternLabels = node.patterns
      .map((p) => careerPatterns[p]?.label ?? p)
      .filter(Boolean)
      .join(", ");
    const permalink = node.slug ? `/work/${node.slug}` : "/work";
    out.push(
      finalizeEntry({
        sourceId: `career:${node.id}`,
        sourceKind: "career",
        sourceTitle: node.fullName,
        permalink,
        anchor: undefined,
        heading: node.role,
        tags: [...node.patterns],
        ordinal: 0,
        content:
          `${node.fullName} (${node.years}) — ${node.role}. ` +
          `${node.summary} Patterns: ${patternLabels}.`,
      }),
    );
  }
  return out;
}
