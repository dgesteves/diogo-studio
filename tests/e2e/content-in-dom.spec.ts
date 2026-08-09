import { routes } from "@/constants/routes";
// Deep import on purpose: `destinations.ts` is the only source of the authored prose,
// and the `@/features/world` barrel also exports the client islands, which would drag
// three.js into the test process to read a string. Restructure Phase 5 moves this to
// `world/data/`; the import is the only line that has to follow it.
import { worldDestinations } from "@/features/world/constants/destinations";
import type { ContentBlock } from "@/features/world/types";
import { expect, test } from "./fixtures";

/**
 * The crawlability non-negotiable, asserted as literally as it can be: over raw HTTP,
 * with no browser and therefore no JavaScript at all, every authored block of every
 * station must already be in the bytes.
 *
 * `reduced-motion.spec.ts` covers a related but weaker claim — that /work reads
 * correctly with the canvas absent — and it checks two strings on one route. This
 * checks every string on every route, against the collection the pages render from, so
 * prose that silently stops being emitted cannot pass. Reveal-on-focus is a visual
 * affordance; the day it becomes a data change, this goes red.
 *
 * Untagged, and identical in both projects by construction: without JavaScript the
 * canvas cannot mount, so motion mode cannot influence the result. It runs twice
 * because the cost is a few hundred milliseconds and a spec that quietly stops running
 * in one project is worse.
 */
test.describe("Server-rendered content", () => {
  for (const destination of worldDestinations) {
    // `/` renders `HeroSection`, not `DestinationView`, so only the title and summary
    // reach the page. The home destination's remaining blocks feed the agent index
    // through `destination-chunks.ts` — deliberately, since the 3D world is the home
    // page and its panel is `sr-only`.
    const authored =
      destination.href === routes.home
        ? [destination.title, destination.summary]
        : [
            destination.eyebrow,
            destination.title,
            destination.summary,
            ...destination.blocks.flatMap(authoredStrings),
          ];

    test(`${destination.href} serves all ${authored.length} authored strings with no JavaScript`, async ({
      request,
    }) => {
      const response = await request.get(destination.href);
      expect(response.status()).toBe(200);

      const served = textOf(await response.text());

      // Reported as a list rather than one assertion per string, so a failure names
      // everything that went missing instead of only the first.
      const missing = authored.filter((value) => !served.includes(collapse(value)));
      expect(missing).toEqual([]);
    });
  }
});

function authoredStrings(block: ContentBlock): string[] {
  switch (block.kind) {
    case "lede":
      return [block.text];
    case "prose":
      return [...block.paragraphs];
    case "list":
      return [...(block.title ? [block.title] : []), ...block.items];
    case "stats":
      return block.items.flatMap((item) => [item.label, item.value, ...optional(item.hint)]);
    case "cards":
      return block.items.flatMap((item) => [item.title, item.body, ...optional(item.meta)]);
    case "timeline":
      return block.items.flatMap((item) => [
        item.period,
        item.title,
        ...optional(item.org),
        ...item.points,
      ]);
    case "links":
      return block.items.map((item) => item.label);
  }
}

function optional(value: string | undefined): string[] {
  return value ? [value] : [];
}

/**
 * What a crawler reads: script and style bodies dropped, tags replaced by a space so
 * text cannot be glued across elements, entities decoded, whitespace collapsed. React
 * escapes all five of these in text nodes, and every authored string is the sole child
 * of its element, so nothing here can be split mid-sentence.
 */
function textOf(html: string): string {
  const withoutCode = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const decoded = withoutCode
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
  return collapse(decoded);
}

function collapse(value: string): string {
  return value.split(/\s+/).join(" ").trim();
}
