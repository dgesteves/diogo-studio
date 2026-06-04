import { createHash } from "node:crypto";

import type { IndexEntry, SourceKind } from "./types";

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

export function finalizeEntry(input: {
  sourceId: string;
  sourceKind: SourceKind;
  sourceTitle: string;
  permalink: string;
  anchor: string | undefined;
  heading: string | undefined;
  tags: string[] | undefined;
  ordinal: number;
  content: string;
}): IndexEntry {
  const content = input.content
    .replace(/[\t ]+/g, " ")
    .replace(/\n[\t ]+/g, "\n")
    .trim();
  const id = `${input.sourceId}#${input.anchor ?? "_"}#${input.ordinal}`;
  return {
    id,
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    sourceTitle: input.sourceTitle,
    permalink: input.permalink,
    anchor: input.anchor,
    heading: input.heading,
    tags: input.tags,
    content,
    contentHash: sha256(content),
  };
}
