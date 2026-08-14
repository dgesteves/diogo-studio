import { describe, expect, it } from "vitest";

import { asInternalHref, routes } from "@/content/pages";

import { CHUNKS, CORPUS_HAS_EMBEDDINGS, INDEX } from "./agent-index";
import { buildCitations } from "./agent-response";

describe("the generated corpus", () => {
  it("parses against the schema and is not empty", () => {
    expect(CHUNKS.length).toBeGreaterThan(0);
    expect(CHUNKS).toBe(INDEX.chunks);
    expect(Number.isNaN(Date.parse(INDEX.generatedAt))).toBe(false);
  });

  it("gives every chunk a unique id", () => {
    expect(new Set(CHUNKS.map((c) => c.id)).size).toBe(CHUNKS.length);
  });

  it("has content and a hash for every chunk", () => {
    const empty = CHUNKS.filter((c) => !c.content.trim() || !c.contentHash);
    expect(empty.map((c) => c.id)).toEqual([]);
  });
});

describe("corpus ↔ routes", () => {
  it("only ever links to a real route", () => {
    const unknown = CHUNKS.filter((c) => !asInternalHref(c.permalink));
    expect(unknown.map((c) => `${c.id} → ${c.permalink}`)).toEqual([]);
  });

  it("covers every route, so the agent can answer for any station", () => {
    const covered = new Set(CHUNKS.map((c) => c.permalink));
    const missing = Object.values(routes).filter((path) => !covered.has(path));
    expect(missing).toEqual([]);
  });

  it("produces citation hrefs that survive the typed-route guard", () => {
    const rejected = buildCitations(CHUNKS).filter((c) => !asInternalHref(c.href));
    expect(rejected.map((c) => c.href)).toEqual([]);
  });
});

describe("embeddings", () => {
  it("reports whether the corpus can be searched by cosine at all", () => {
    expect(CORPUS_HAS_EMBEDDINGS).toBe(CHUNKS.some((c) => c.embedding?.length));
  });

  it("embeds every chunk it embeds at all at the declared dimension", () => {
    const wrongSize = CHUNKS.filter(
      (c) => c.embedding && c.embedding.length !== INDEX.embeddingDim,
    );
    expect(wrongSize.map((c) => c.id)).toEqual([]);
  });

  it("declares a model and a dimension exactly when it carries vectors", () => {
    expect(INDEX.embeddingModel !== null).toBe(CORPUS_HAS_EMBEDDINGS);
    expect((INDEX.embeddingDim ?? 0) > 0).toBe(CORPUS_HAS_EMBEDDINGS);
  });
});
