import { finalizeEntry } from "./entry";
import type { IndexEntry } from "./types";

import { operatingCompanies } from "../../src/content/career";
import { routes } from "../../src/content/pages";
import { siteConfig } from "../../src/content/profile";

/**
 * One chunk, for "who is this and what are they open to" — the question no single block
 * on any page answers, because identity is spread across metadata, JSON-LD and the shell.
 *
 * The seven career chunks that used to live here are gone: they hard-coded `routes.home`
 * as their permalink, so the agent cited the home page when asked about Peacock, and the
 * facts they carried are now `/work`'s timeline blocks, which cite `/work`.
 */
export function buildProfileChunks(): IndexEntry[] {
  return [
    finalizeEntry({
      sourceId: "profile:identity",
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
  ];
}
