import { finalizeEntry } from "./entry";
import type { IndexEntry } from "./types";

import { worldDestinations } from "../../src/content/prose";
import type { ContentBlock, Destination } from "../../src/content/schema";

function blockToText(block: ContentBlock): string {
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
    case "cards":
      return block.items
        .map(({ title, meta, body }) => `${title}${meta ? ` (${meta})` : ""} — ${body}`)
        .join("\n");
    case "timeline":
      return block.items
        .map(
          ({ period, title, org, points }) =>
            `${period} — ${title}${org ? ` @ ${org}` : ""}: ${points.join(" ")}`,
        )
        .join("\n");
    case "links":
      return "";
  }
}

function destinationContent(destination: Destination): string {
  const blocks = destination.blocks.map(blockToText).filter((text) => text.length > 0);
  return [destination.title, destination.summary, ...blocks].join("\n");
}

export function buildDestinationChunks(): IndexEntry[] {
  return worldDestinations.map((destination) =>
    finalizeEntry({
      sourceId: `route:${destination.slug}`,
      sourceKind: "site",
      sourceTitle: destination.label,
      permalink: destination.href,
      anchor: undefined,
      heading: destination.eyebrow,
      tags: undefined,
      ordinal: 0,
      content: destinationContent(destination),
    }),
  );
}
