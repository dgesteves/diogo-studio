import { describe, expect, it } from "vitest";
import type { AgentChunk } from "@/types/agent";
import { cosine, retrieve, retrieveByCosine, retrieveByKeyword, TOP_K } from "./retrieve";

function makeChunk(
  overrides: Partial<AgentChunk> & Pick<AgentChunk, "id" | "content">,
): AgentChunk {
  return {
    sourceId: overrides.sourceId ?? overrides.id,
    sourceKind: overrides.sourceKind ?? "case-study",
    sourceTitle: overrides.sourceTitle ?? overrides.id,
    permalink: overrides.permalink ?? "/work",
    contentHash: overrides.contentHash ?? "deadbeef",
    ...overrides,
  };
}

describe("cosine()", () => {
  it("returns 1 for parallel unit vectors", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 6);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it("returns -1 for anti-parallel vectors", () => {
    expect(cosine([1, 1], [-1, -1])).toBeCloseTo(-1, 6);
  });

  it("handles zero vectors without dividing by zero", () => {
    expect(cosine([0, 0, 0], [1, 1, 1])).toBe(0);
  });

  it("clamps to the shorter dimension (cheap robustness for mixed-dim corpora)", () => {
    expect(cosine([1, 1, 999], [1, 1])).toBeCloseTo(1, 6);
  });
});

describe("retrieveByCosine()", () => {
  const chunks: AgentChunk[] = [
    makeChunk({ id: "a", content: "alpha", embedding: [1, 0, 0] }),
    makeChunk({ id: "b", content: "beta", embedding: [0, 1, 0] }),
    makeChunk({ id: "c", content: "gamma", embedding: [0, 0, 1] }),
    makeChunk({ id: "d", content: "delta" }),
  ];

  it("ranks the chunk parallel to the query first", () => {
    const result = retrieveByCosine(chunks, [1, 0, 0]);
    expect(result.retrieval).toBe("cosine");
    expect(result.refused).toBe(false);
    expect(result.hits[0]?.chunk.id).toBe("a");
    expect(result.hits[0]?.score).toBeCloseTo(1, 6);
  });

  it("refuses when no chunk crosses the relevance floor", () => {
    const result = retrieveByCosine(chunks, [0, 0, 0, 1]);
    expect(result.refused).toBe(true);
    expect(result.hits).toHaveLength(0);
  });

  it("never returns chunks without embeddings", () => {
    const result = retrieveByCosine(chunks, [1, 0, 0]);
    expect(result.hits.find((h) => h.chunk.id === "d")).toBeUndefined();
  });

  it("respects an explicit topK", () => {
    const result = retrieveByCosine(chunks, [1, 1, 1], { topK: 2, minScore: -1 });
    expect(result.hits.length).toBeLessThanOrEqual(2);
  });
});

describe("retrieveByKeyword()", () => {
  const chunks: AgentChunk[] = [
    makeChunk({
      id: "eino",
      sourceTitle: "Agentic RF planning at eino.ai",
      heading: "Architecture",
      content:
        "Lead engineer on an agentic RF network planning platform. Digital-twin maps, human-in-the-loop review, agent orchestration.",
    }),
    makeChunk({
      id: "peacock",
      sourceTitle: "Peacock streaming reliability",
      heading: "Operating habits",
      content:
        "Senior engineer at Peacock, tens of millions of viewers, streaming-grade reliability, performance and release safety.",
    }),
    makeChunk({
      id: "diligent",
      sourceTitle: "Diligent design system",
      heading: "Decisions",
      content:
        "Authored the company-wide React and Angular enterprise design system. Multi-framework tokens, governance, contribution model.",
    }),
    makeChunk({
      id: "deloitte",
      sourceTitle: "Deloitte data viz",
      content: "Enterprise data-visualization for financial services and regulated industries.",
    }),
  ];

  it("ranks the obvious match first for a domain query", () => {
    const result = retrieveByKeyword(chunks, "design system", { minScore: 0 });
    expect(result.retrieval).toBe("keyword");
    expect(result.hits[0]?.chunk.id).toBe("diligent");
  });

  it("ranks the obvious match first for an agentic query", () => {
    const result = retrieveByKeyword(chunks, "agentic RF planning", { minScore: 0 });
    expect(result.hits[0]?.chunk.id).toBe("eino");
  });

  it("returns refused for queries with only stopwords", () => {
    const result = retrieveByKeyword(chunks, "what is the");
    expect(result.refused).toBe(true);
    expect(result.hits).toHaveLength(0);
  });

  it("refuses when no chunk has a non-zero score against the query", () => {
    const result = retrieveByKeyword(chunks, "astronaut blob shader");
    expect(result.refused).toBe(true);
  });

  it("caps at TOP_K", () => {
    const many = Array.from({ length: TOP_K + 4 }, (_, i) =>
      makeChunk({
        id: `c${i}`,
        sourceTitle: "design system tokens",
        content: "design system tokens design system tokens design system tokens",
      }),
    );
    const result = retrieveByKeyword(many, "design system", { minScore: 0 });
    expect(result.hits.length).toBeLessThanOrEqual(TOP_K);
  });
});

describe("retrieve() dispatcher", () => {
  const cosineChunks: AgentChunk[] = [
    makeChunk({ id: "x", content: "design system", embedding: [1, 0] }),
    makeChunk({ id: "y", content: "streaming", embedding: [0, 1] }),
  ];
  const keywordChunks: AgentChunk[] = [
    makeChunk({ id: "x", content: "design system tokens governance" }),
    makeChunk({ id: "y", content: "streaming reliability release safety" }),
  ];

  it("uses cosine when a query embedding is supplied AND the corpus has embeddings", () => {
    const r = retrieve(cosineChunks, "design", [1, 0]);
    expect(r.retrieval).toBe("cosine");
  });

  it("falls back to keyword when no query embedding is supplied", () => {
    const r = retrieve(cosineChunks, "design system", null);
    expect(r.retrieval).toBe("keyword");
  });

  it("falls back to keyword when the corpus has no embeddings", () => {
    const r = retrieve(keywordChunks, "design system", [1, 0]);
    expect(r.retrieval).toBe("keyword");
  });
});
