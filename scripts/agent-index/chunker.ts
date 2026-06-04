import { finalizeEntry } from "./entry";
import type { IndexEntry, RawSection, SourceKind } from "./types";

const MAX_CHUNK_CHARS = 1400;
const MIN_CHUNK_CHARS = 120;

// Best-effort MDX→text: this is a portfolio corpus, not a general renderer.
// Custom components are dropped wholesale — their human-readable signal lives in
// the surrounding markdown headings + the frontmatter captured by virtual chunks.
export function stripMdxJsx(md: string): string {
  let s = md;
  s = s.replace(/```[\s\S]*?```/g, "");
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[\s\S]*?\/>/g, "");
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[\s\S]*?>/g, "");
  s = s.replace(/<\/[A-Z][A-Za-z0-9]*>/g, "");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function splitIntoSections(body: string): RawSection[] {
  const lines = body.split(/\r?\n/);
  const sections: RawSection[] = [];
  let current: RawSection = { body: "" };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      if (current.body.trim()) sections.push(current);
      const heading = h2[1]!;
      current = { heading, anchor: slugifyHeading(heading), body: "" };
      continue;
    }
    // Skip h1 — case studies use the frontmatter `title` for the page title.
    if (/^#\s/.test(line)) continue;
    current.body += `${line}\n`;
  }
  if (current.body.trim()) sections.push(current);
  return sections;
}

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

export function buildMdxChunks(opts: {
  kind: SourceKind;
  slug: string;
  permalink: string;
  sourceTitle: string;
  description?: string;
  tags?: string[];
  body: string;
}): IndexEntry[] {
  const { kind, slug, permalink, sourceTitle, description, tags, body } = opts;
  const sourceId = `${kind}:${slug}`;
  const entries: IndexEntry[] = [];

  // Lead chunk = the description: a canonical one-paragraph summary and a strong
  // retrieval target for high-level questions ("what is the eino.ai work about?").
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

  const sections = splitIntoSections(stripMdxJsx(body));
  let ordinal = 1;
  for (const raw of sections) {
    const split = splitLongSection(raw);
    for (const piece of split) {
      const trimmed = piece.body.trim();
      if (trimmed.length < MIN_CHUNK_CHARS) continue;
      // Prepend the heading inside the chunk so the embedding sees the structural
      // context and ranks heading-relevant matches higher.
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
