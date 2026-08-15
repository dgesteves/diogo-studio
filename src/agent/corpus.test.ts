import { describe, expect, it } from "vitest";

import { asInternalHref, routes } from "@/content/pages";
import { worldDestinations } from "@/content/prose";

import { CHUNKS, CORPUS_HAS_EMBEDDINGS, INDEX } from "./corpus";
import { buildCitations } from "./response";

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

  // The defect this replaced: every career chunk hard-coded `routes.home`, so 8 of 25
  // chunks permalinked to `/` and the agent cited the home page when asked about Peacock.
  it("sends no chunk to the home page but the home page's own", () => {
    const home = CHUNKS.filter((c) => c.permalink === routes.home);
    expect(home.map((c) => c.id).filter((id) => !id.startsWith("page:home#"))).toEqual([]);
  });

  it("anchors every chunk to a block that exists on the page it links to", () => {
    const blocksByHref = new Map<string, Set<string>>(
      worldDestinations.map((destination) => [
        destination.href,
        new Set(destination.blocks.map((block) => block.id)),
      ]),
    );

    const dangling = CHUNKS.filter(
      (c) => c.anchor !== undefined && !blocksByHref.get(c.permalink)?.has(c.anchor),
    );
    expect(dangling.map((c) => `${c.id} → ${c.permalink}#${c.anchor}`)).toEqual([]);
  });

  it("deep-links the blocks, rather than citing the top of a page every time", () => {
    // Anchorless chunks are the 17 page overviews plus the identity chunk, and nothing
    // else: a corpus where most chunks lack an anchor is the one this replaced.
    const anchorless = CHUNKS.filter((c) => c.anchor === undefined);
    expect(anchorless).toHaveLength(worldDestinations.length + 1);
    expect(buildCitations(CHUNKS).filter((c) => c.href.includes("#")).length).toBe(
      CHUNKS.length - anchorless.length,
    );
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
