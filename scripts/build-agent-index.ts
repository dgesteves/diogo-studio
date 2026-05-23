#!/usr/bin/env tsx
/**
 * scripts/build-agent-index.ts — Phase 4 agentic ⌘K Inspector
 *
 * Builds the grounded retrieval index that powers `/api/chat`. The output
 * lives in `src/content/agent-index.json` and is committed to git per the
 * §7.4 decision (in-repo JSON, with a content-hash check on PRs).
 *
 * Pipeline:
 *   1. Read case-studies + essays MDX from `src/content/`.
 *   2. Strip frontmatter + MDX JSX, chunk by `## ` headings (and further
 *      split long sections by paragraph) into ~600-char passages.
 *   3. Add a small set of virtual chunks for the career graph and the
 *      site-config identity block so the agent can answer "who is Diogo"
 *      from the same retriever path as everything else.
 *   4. Content-hash every chunk (sha256(content)). Reuse embeddings from
 *      the existing committed index where the hash matches; only re-embed
 *      genuinely new/changed chunks. This keeps the diff bounded by content
 *      edits, the OpenAI bill near zero, and the index reproducible.
 *   5. Embed via `text-embedding-3-small` at `dimensions=512` (Matryoshka
 *      truncation) — a 3× JSON size win that costs nothing for this corpus.
 *
 * Modes:
 *   - default:          rebuild, embed deltas if OPENAI_API_KEY is set, write file.
 *   - `--check`:        recompute chunks + hashes, compare to committed file.
 *                       Exits non-zero if anything would change. Used in CI.
 *   - `--no-embed`:     never call the API, even if the key is set. Useful
 *                       for fast local iteration on the chunking logic.
 *   - `--strict`:       (with `--check`) also requires every chunk to have
 *                       an embedding present. Used when the index is the
 *                       canonical artifact, not just a working draft.
 *
 * The Edge `/api/chat` route handles both tiers gracefully:
 *   - embeddings present → cosine-similarity retrieval.
 *   - embeddings absent  → BM25-flavored keyword retrieval over the same
 *                          chunks. The site still answers; it just answers
 *                          less semantically.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { nodes as careerNodes, patterns as careerPatterns } from "../src/content/career-graph";
import { operatingCompanies, siteConfig } from "../src/lib/site-config";

/* ---------------------------------------------------------------------------
 * Paths
 * ------------------------------------------------------------------------- */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const CONTENT_ROOT = join(ROOT, "src", "content");
const INDEX_PATH = join(CONTENT_ROOT, "agent-index.json");

/* ---------------------------------------------------------------------------
 * Types — mirror `src/lib/agent/types.ts` (kept duplicated so this script
 * has zero runtime deps on the app code beyond the typed content modules).
 * ------------------------------------------------------------------------- */

type SourceKind = "case-study" | "essay" | "career" | "site";

type IndexEntry = {
  /** Stable id: `${sourceId}#${anchor || "_"}#${ordinal}`. */
  id: string;
  sourceId: string;
  sourceKind: SourceKind;
  sourceTitle: string;
  /** Routable URL for the citation chip. */
  permalink: string;
  /** Heading anchor inside the source page, when applicable. */
  anchor?: string;
  /** Human-readable heading label for the citation chip. */
  heading?: string;
  /** Pattern tags (case-studies / essays only). */
  tags?: string[];
  /** Cleaned plaintext content used for embedding + display. */
  content: string;
  /** sha256(content) — drives the delta detection. */
  contentHash: string;
  /** 512d embedding (Matryoshka truncation). Absent on the keyword-only tier. */
  embedding?: number[];
};

type AgentIndex = {
  generatedAt: string;
  embeddingModel: string | null;
  embeddingDim: number | null;
  /** Build of the chunker — bump when chunking semantics change so CI surfaces it. */
  chunkerVersion: number;
  chunks: IndexEntry[];
};

const CHUNKER_VERSION = 1;
const EMBED_DIMENSIONS = 512;

/* ---------------------------------------------------------------------------
 * CLI flags
 * ------------------------------------------------------------------------- */

const flags = {
  check: process.argv.includes("--check"),
  noEmbed: process.argv.includes("--no-embed"),
  strict: process.argv.includes("--strict"),
};

/* ---------------------------------------------------------------------------
 * Frontmatter / MDX → plaintext
 * ------------------------------------------------------------------------- */

type Frontmatter = {
  title?: string;
  description?: string;
  slug?: string;
  patterns?: string[];
  company?: string;
  role?: string;
  years?: string;
};

/**
 * Minimal, regex-based frontmatter parser. We only need a handful of scalar
 * fields here; the full YAML lives in velite. Keeping a bespoke parser
 * avoids dragging a YAML library into the build script for this one job.
 */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const yaml = match[1] ?? "";
  const body = match[2] ?? "";
  const data: Frontmatter = {};
  const lines = yaml.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    // Inline `key: [a, b, c]` arrays.
    const inlineArr = line.match(/^(\w+):\s*\[(.*)\]\s*$/);
    if (inlineArr) {
      const key = inlineArr[1] ?? "";
      const contents = inlineArr[2] ?? "";
      const values = contents
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      if (key === "patterns") data.patterns = values;
      continue;
    }
    // Scalar `key: "value"` or `key: value`.
    const kv = line.match(/^(\w+):\s*(.+?)\s*$/);
    if (!kv) continue;
    const key = kv[1] ?? "";
    const value = (kv[2] ?? "").replace(/^["']|["']$/g, "");
    if (key === "title") data.title = value;
    else if (key === "description") data.description = value;
    else if (key === "slug") data.slug = value;
    else if (key === "company") data.company = value;
    else if (key === "role") data.role = value;
    else if (key === "years") data.years = value;
  }
  return { data, body };
}

/**
 * Strip MDX JSX from prose so the retriever sees clean markdown text.
 * Best-effort; this is a portfolio corpus, not a general MDX renderer.
 * The MDX components in the case studies (`<MetricGrid>`, `<Decision …>`,
 * etc.) are removed wholesale — their *human-readable* signal lives in the
 * surrounding markdown headings + the frontmatter metrics list (which is
 * captured separately via the structured virtual chunks below).
 */
function stripMdxJsx(md: string): string {
  let s = md;
  // Drop fenced code blocks first — their contents are usually noise for retrieval.
  s = s.replace(/```[\s\S]*?```/g, "");
  // Self-closing JSX tags: <Tag ... />.
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[\s\S]*?\/>/g, "");
  // Opening and closing JSX tags (multi-line, attribute-rich).
  s = s.replace(/<[A-Z][A-Za-z0-9]*\b[\s\S]*?>/g, "");
  s = s.replace(/<\/[A-Z][A-Za-z0-9]*>/g, "");
  // Remove markdown image syntax (alt text is rarely useful in this corpus).
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // Collapse runs of blank lines.
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/* ---------------------------------------------------------------------------
 * Chunking
 *
 * Two-pass split:
 *   1. Section split on `## ` headings (and an implicit lead section).
 *   2. If a section exceeds MAX_CHUNK_CHARS, split it by paragraphs into
 *      ordered sub-chunks under the same heading.
 *
 * Chunks shorter than MIN_CHUNK_CHARS are dropped — they're noise for
 * retrieval and pollute the citations panel.
 * ------------------------------------------------------------------------- */

const MAX_CHUNK_CHARS = 1400;
const MIN_CHUNK_CHARS = 120;

/** ASCII-fold + slug-ify a heading so anchors line up with rehype-slug. */
function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type RawSection = { heading?: string; anchor?: string; body: string };

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
    // Skip h1 — case studies use frontmatter `title` for the page title.
    if (/^#\s/.test(line)) continue;
    current.body += `${line}\n`;
  }
  if (current.body.trim()) sections.push(current);
  return sections;
}

function splitLongSection(section: RawSection): RawSection[] {
  const body = section.body.trim();
  if (body.length <= MAX_CHUNK_CHARS) return [section];
  // Paragraph split. Greedy-pack paragraphs until we'd overflow.
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

function buildMdxChunks(opts: {
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

  // Always seed with the description as the lead chunk — it's the canonical
  // one-paragraph summary and a strong retrieval target for high-level
  // questions like "what is the eino.ai work about?".
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
      // Prepend the heading inside the chunk so the embedding sees the
      // structural context and retrieval ranks heading-relevant matches higher.
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

function finalizeEntry(input: {
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

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

/* ---------------------------------------------------------------------------
 * Virtual chunks — career graph + site identity
 *
 * The career-graph data already exists as typed TypeScript (used by the
 * hero SVG and the R3F scene). Reusing it here means the agent answers
 * "tell me about Diogo at Peacock" out of the same source of truth that
 * renders the graph node — no parallel resume file to drift.
 * ------------------------------------------------------------------------- */

function buildCareerChunks(): IndexEntry[] {
  const out: IndexEntry[] = [];
  // One identity chunk so questions like "who is Diogo" retrieve cleanly.
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

/* ---------------------------------------------------------------------------
 * MDX collection walkers
 * ------------------------------------------------------------------------- */

async function readMdxCollection(
  subdir: "case-studies" | "essays",
  kind: SourceKind,
  permalinkPrefix: "/work" | "/writing",
): Promise<IndexEntry[]> {
  const dir = join(CONTENT_ROOT, subdir);
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith(".mdx")).sort();
  const out: IndexEntry[] = [];
  for (const file of files) {
    const filePath = join(dir, file);
    const raw = readFileSync(filePath, "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug ?? file.replace(/\.mdx$/, "");
    const sourceTitle = data.title ?? slug;
    const permalink = `${permalinkPrefix}/${slug}`;
    out.push(
      ...buildMdxChunks({
        kind,
        slug,
        permalink,
        sourceTitle,
        description: data.description,
        tags: data.patterns,
        body,
      }),
    );
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Index assembly + diffing
 * ------------------------------------------------------------------------- */

function loadExistingIndex(): AgentIndex | null {
  if (!existsSync(INDEX_PATH)) return null;
  try {
    const raw = readFileSync(INDEX_PATH, "utf8");
    return JSON.parse(raw) as AgentIndex;
  } catch (err) {
    console.warn("[agent:index] could not parse existing index:", err);
    return null;
  }
}

function indexById(chunks: IndexEntry[]): Map<string, IndexEntry> {
  const m = new Map<string, IndexEntry>();
  for (const c of chunks) m.set(c.id, c);
  return m;
}

/** Normalize chunks for stable serialization: sort by id. */
function serialize(idx: AgentIndex): string {
  const sorted = [...idx.chunks].sort((a, b) => a.id.localeCompare(b.id));
  return `${JSON.stringify({ ...idx, chunks: sorted }, null, 2)}\n`;
}

/* ---------------------------------------------------------------------------
 * Main
 * ------------------------------------------------------------------------- */

async function main() {
  console.log("[agent:index] gathering source chunks…");
  const mdxCase = await readMdxCollection("case-studies", "case-study", "/work");
  const mdxEssay = await readMdxCollection("essays", "essay", "/writing");
  const career = buildCareerChunks();
  const chunks = [...career, ...mdxCase, ...mdxEssay];

  console.log(
    `[agent:index] ${chunks.length} chunks (career=${career.length}, case=${mdxCase.length}, essay=${mdxEssay.length})`,
  );

  const existing = loadExistingIndex();
  const previous = existing ? indexById(existing.chunks) : new Map<string, IndexEntry>();

  // Carry embeddings forward where the contentHash matches.
  let reused = 0;
  let stale = 0;
  for (const chunk of chunks) {
    const prev = previous.get(chunk.id);
    if (prev && prev.contentHash === chunk.contentHash && prev.embedding) {
      chunk.embedding = prev.embedding;
      reused += 1;
    } else if (prev && prev.contentHash !== chunk.contentHash) {
      stale += 1;
    }
  }

  const missing = chunks.filter((c) => !c.embedding);
  console.log(
    `[agent:index] embeddings: reused=${reused}, stale=${stale}, missing=${missing.length}`,
  );

  // --check is the CI guard. It must NOT call the API and must NOT write the file.
  if (flags.check) {
    if (!existing) {
      console.error(
        "[agent:index] --check failed: no existing index. Run `pnpm agent:index` and commit src/content/agent-index.json.",
      );
      process.exitCode = 1;
      return;
    }
    if (existing.chunkerVersion !== CHUNKER_VERSION) {
      console.error(
        `[agent:index] --check failed: chunker version drift (${existing.chunkerVersion} → ${CHUNKER_VERSION}). Rebuild.`,
      );
      process.exitCode = 1;
      return;
    }
    const currentIds = new Set(chunks.map((c) => c.id));
    const existingIds = new Set(existing.chunks.map((c) => c.id));
    const added = [...currentIds].filter((id) => !existingIds.has(id));
    const removed = [...existingIds].filter((id) => !currentIds.has(id));
    const changed = chunks
      .filter((c) => {
        const prev = previous.get(c.id);
        return prev && prev.contentHash !== c.contentHash;
      })
      .map((c) => c.id);

    if (added.length || removed.length || changed.length) {
      console.error("[agent:index] --check failed: index out of date.");
      if (added.length) console.error(`  added (${added.length}):`, added.slice(0, 5));
      if (removed.length) console.error(`  removed (${removed.length}):`, removed.slice(0, 5));
      if (changed.length) console.error(`  changed (${changed.length}):`, changed.slice(0, 5));
      console.error("  → Run `pnpm agent:index` and commit the result.");
      process.exitCode = 1;
      return;
    }

    if (flags.strict) {
      const noEmbed = chunks.filter((c) => !c.embedding);
      if (noEmbed.length) {
        console.error(
          `[agent:index] --check --strict failed: ${noEmbed.length} chunks missing embeddings.`,
        );
        console.error("  → Run `pnpm agent:index` with OPENAI_API_KEY set, then commit.");
        process.exitCode = 1;
        return;
      }
    }

    console.log("[agent:index] --check passed.");
    return;
  }

  // Build / refresh mode.
  const apiKey = process.env.OPENAI_API_KEY;
  const shouldEmbed = !flags.noEmbed && Boolean(apiKey) && missing.length > 0;

  if (shouldEmbed) {
    const embedModel = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
    console.log(
      `[agent:index] embedding ${missing.length} chunks with ${embedModel} @ ${EMBED_DIMENSIONS}d…`,
    );
    const openai = createOpenAI({ apiKey });
    // Batch in groups of 64 to keep request sizes well under provider caps.
    const BATCH = 64;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      const { embeddings } = await embedMany({
        model: openai.embedding(embedModel),
        values: batch.map((c) => c.content),
        providerOptions: { openai: { dimensions: EMBED_DIMENSIONS } },
      });
      for (let j = 0; j < batch.length; j += 1) {
        const entry = batch[j];
        const vec = embeddings[j];
        if (entry && vec) entry.embedding = vec;
      }
      console.log(`[agent:index]   batch ${i / BATCH + 1} → ${batch.length} embedded`);
    }
  } else if (missing.length > 0) {
    const reason = flags.noEmbed
      ? "--no-embed set"
      : !apiKey
        ? "OPENAI_API_KEY not set"
        : "no missing chunks";
    console.warn(
      `[agent:index] skipping embedding (${reason}). ${missing.length} chunks will fall back to keyword retrieval at runtime.`,
    );
  }

  const index: AgentIndex = {
    generatedAt: new Date().toISOString(),
    embeddingModel: shouldEmbed
      ? (process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small")
      : (existing?.embeddingModel ?? null),
    embeddingDim: shouldEmbed ? EMBED_DIMENSIONS : (existing?.embeddingDim ?? null),
    chunkerVersion: CHUNKER_VERSION,
    chunks,
  };

  mkdirSync(dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, serialize(index));
  console.log(
    `[agent:index] wrote ${relative(ROOT, INDEX_PATH)} (${index.chunks.length} chunks, ${
      index.chunks.filter((c) => c.embedding).length
    } embedded).`,
  );
}

main().catch((err) => {
  console.error("[agent:index] failed:", err);
  process.exit(1);
});
