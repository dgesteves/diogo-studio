import type { Metadata } from "next";
import type { RouteKey } from "@/content/pages";
import { getDestination } from "@/content/prose";

/**
 * A page's metadata, derived rather than restated. Every station used to hand-copy its
 * `summary` into `description`, and three had already drifted from the record by the time
 * this replaced them.
 *
 * `title` is the page's short label, which the root's `%s · Diogo Esteves` template
 * completes; `description` is the summary, which is also the Open Graph and agent-facing
 * description — one sentence, one owner. Open Graph is deliberately not set here: Next
 * derives it from the resolved metadata, and a value at any level is inherited verbatim by
 * every child. See `.claude/rules/nextjs-app-router.md`.
 *
 * The home page is the one route that does not call this. The root's default title and
 * description are the site's own and its canonical is already `/`, so deriving there would
 * retitle the most-shared surface after a station.
 */
export function pageMetadata(slug: RouteKey): Metadata {
  const page = getDestination(slug);

  return {
    title: page.label,
    description: page.summary,
    alternates: { canonical: page.href },
  };
}
