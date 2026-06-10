import { finalizeEntry } from "./entry";
import type { IndexEntry, RawSection, SourceKind } from "./types";

const MAX_CHUNK_CHARS = 1400;
const MIN_CHUNK_CHARS = 120;

function splitLongSection(section: RawSection): RawSection[] {
  const body = section.body.trim();
  if (body.length <= MAX_CHUNK_CHARS) return [section];
  const paragraphs = body.split(/\n{2,}/);
  const out: RawSection[] = [];
  let buf = "";
  for (const p of paragraphs) {
    const candidate = buf ? `${buf}\n\n${p}` : p;
    if (candidate.length > MAX_CHUNK_CHARS && buf) {
      out.push({ ...section, body: buf });
      buf = p;
    } else {
      buf = candidate;
    }
  }
  if (buf.trim()) out.push({ ...section, body: buf });
  return out;
}

export function buildArticleChunks(opts: {
  kind: SourceKind;
  slug: string;
  permalink: string;
  sourceTitle: string;
  description?: string;
  tags?: string[];
  sections: readonly RawSection[];
}): IndexEntry[] {
  const { kind, slug, permalink, sourceTitle, description, tags, sections } = opts;
  const sourceId = `${kind}:${slug}`;
  const entries: IndexEntry[] = [];

  if (description) {
    entries.push(
      finalizeEntry({
        sourceId,
        sourceKind: kind,
        sourceTitle,
        permalink,
        anchor: undefined,
        heading: "Summary",
        tags,
        ordinal: 0,
        content: `${sourceTitle}. ${description}`,
      }),
    );
  }

  let ordinal = 1;
  for (const raw of sections) {
    const split = splitLongSection(raw);
    for (const piece of split) {
      const trimmed = piece.body.trim();
      if (trimmed.length < MIN_CHUNK_CHARS) continue;
      const headed = piece.heading ? `## ${piece.heading}\n\n${trimmed}` : trimmed;
      entries.push(
        finalizeEntry({
          sourceId,
          sourceKind: kind,
          sourceTitle,
          permalink,
          anchor: piece.anchor,
          heading: piece.heading,
          tags,
          ordinal: ordinal++,
          content: headed,
        }),
      );
    }
  }
  return entries;
}
