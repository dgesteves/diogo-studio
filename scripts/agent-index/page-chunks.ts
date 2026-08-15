import { finalizeEntry } from "./entry";
import type { IndexEntry, SourceKind } from "./types";

import { worldDestinations } from "../../src/content/prose";
import type { ContentBlock, Destination } from "../../src/content/schema";

/**
 * The whole retrieval corpus, derived from the authored record and nothing else.
 *
 * **Granularity is the point.** The chunker this replaced emitted one chunk per page —
 * the largest was 2,979 characters — so a question about one engagement retrieved the
 * whole of `/work`, and every chunk cited the top of a page because there was nothing
 * finer to cite. Here a block is a chunk, and `cards` and `timeline` go finer still,
 * one chunk per item, because each item is a self-contained record.
 *
 * Every chunk carries its block's `id` as the anchor, so a citation deep-links to the
 * paragraph it came from rather than to the page that contains it.
 */

/** A block's text, or `null` where a block has no prose to retrieve. */
function blockText(block: ContentBlock): string | null {
  switch (block.kind) {
    case "lede":
      return block.text;
    case "prose":
      return block.paragraphs.join("\n");
    case "list":
      return [block.title ? `${block.title}:` : "", ...block.items.map((item) => `- ${item}`)]
        .filter(Boolean)
        .join("\n");
    case "stats":
      return block.items
        .map(({ label, value, hint }) => `${label}: ${value}${hint ? ` (${hint})` : ""}`)
        .join("; ");
    // A link's label is navigation, not knowledge, and its href is already the permalink
    // of whatever it points at.
    case "links":
      return null;
    // Both are chunked per item by `itemChunks`, so there is nothing left to emit whole.
    case "cards":
    case "timeline":
      return null;
  }
}

/** Where a block splits into one chunk per item, that item's text and heading. */
function itemChunks(block: ContentBlock): { heading: string; text: string; kind: SourceKind }[] {
  switch (block.kind) {
    case "cards":
      return block.items.map((item) => ({
        heading: item.title,
        kind: "site",
        text: `${item.title}${item.meta ? ` (${item.meta})` : ""} — ${item.body}`,
      }));
    case "timeline":
      return block.items.map((item) => ({
        heading: item.title,
        // A timeline entry is a role, a date and an organization: the career record as the
        // reader meets it, and what makes a citation about an engagement resolvable.
        kind: "career",
        text:
          `${item.period} — ${item.title}${item.org ? ` @ ${item.org}` : ""}: ` +
          `${item.points.join(" ")}${item.tags?.length ? ` Patterns: ${item.tags.join(", ")}.` : ""}`,
      }));
    default:
      return [];
  }
}

function pageChunks(destination: Destination): IndexEntry[] {
  const sourceId = `page:${destination.slug}`;
  const lede = destination.blocks.find((block) => block.kind === "lede");

  // Ordinal 0 is the page as a whole, so "what is on /work" retrieves something, and it
  // is the one chunk with no anchor — its permalink already lands at the top of the page.
  const overview = finalizeEntry({
    sourceId,
    sourceKind: "site",
    sourceTitle: destination.label,
    permalink: destination.href,
    anchor: undefined,
    heading: destination.eyebrow,
    tags: undefined,
    ordinal: 0,
    content: [destination.title, destination.summary, lede?.kind === "lede" ? lede.text : ""]
      .filter(Boolean)
      .join("\n"),
  });

  const rest = destination.blocks.flatMap((block, index) => {
    // The lede is already the overview's third line; a second copy would compete with it.
    if (block.kind === "lede" && block === lede) return [];

    const items = itemChunks(block);
    if (items.length > 0) {
      return items.map((item, itemIndex) =>
        finalizeEntry({
          sourceId,
          sourceKind: item.kind,
          sourceTitle: destination.label,
          permalink: destination.href,
          anchor: block.id,
          heading: item.heading,
          tags: undefined,
          // Unique per chunk: the id is `sourceId#anchor#ordinal`, and several items
          // share one anchor.
          ordinal: (index + 1) * 100 + itemIndex,
          content: item.text,
        }),
      );
    }

    const text = blockText(block);
    if (text === null || text.length === 0) return [];
    return [
      finalizeEntry({
        sourceId,
        sourceKind: "site",
        sourceTitle: destination.label,
        permalink: destination.href,
        anchor: block.id,
        heading: block.kind === "list" ? (block.title ?? destination.eyebrow) : destination.eyebrow,
        tags: undefined,
        ordinal: index + 1,
        content: text,
      }),
    ];
  });

  return [overview, ...rest];
}

export function buildPageChunks(): IndexEntry[] {
  return worldDestinations.flatMap(pageChunks);
}
