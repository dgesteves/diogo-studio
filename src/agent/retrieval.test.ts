import { describe, expect, it } from "vitest";
import { makeChunk } from "@tests/agent";
import type { AgentChunk } from "./corpus";
import { cosine, retrieve, retrieveByCosine, retrieveByKeyword, TOP_K } from "./retrieval";

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

  it("returns 0 when both vectors are zero", () => {
    expect(cosine([0, 0], [0, 0])).toBe(0);
  });

  it("treats a missing component on either side as zero, never NaN", () => {
    const gappy: number[] = [1];
    gappy[2] = 1;
    const expected = 2 / (Math.sqrt(2) * Math.sqrt(3));

    expect(cosine(gappy, [1, 1, 1])).toBeCloseTo(expected, 6);
    expect(cosine([1, 1, 1], gappy)).toBeCloseTo(expected, 6);
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

  it("caps at TOP_K without an explicit topK", () => {
    const many = Array.from({ length: TOP_K + 4 }, (_, i) =>
      makeChunk({ id: `c${i}`, content: "alpha", embedding: [1, 0, 0] }),
    );

    expect(retrieveByCosine(many, [1, 0, 0]).hits).toHaveLength(TOP_K);
  });

  it("refuses an empty corpus rather than answering from nothing", () => {
    expect(retrieveByCosine([], [1, 0, 0])).toEqual({
      hits: [],
      retrieval: "cosine",
      refused: true,
    });
  });

  it("ranks by similarity, not by corpus order", () => {
    const result = retrieveByCosine(chunks, [0.6, 0.8, 0], { minScore: -1 });

    expect(result.hits.map((h) => h.chunk.id)).toEqual(["b", "a", "c"]);
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
    expect(result.hits).toHaveLength(TOP_K);
  });

  it("matches on the title and heading, not only the body", () => {
    const result = retrieveByKeyword(chunks, "decisions", { minScore: 0 });

    expect(result.hits[0]?.chunk.id).toBe("diligent");
  });

  it("refuses an empty corpus rather than answering from nothing", () => {
    expect(retrieveByKeyword([], "design system")).toEqual({
      hits: [],
      retrieval: "keyword",
      refused: true,
    });
  });

  it("applies the keyword floor by default, where an explicit minScore overrides it", () => {
    const weak = [makeChunk({ id: "weak", sourceTitle: "notes", content: "governance" })];

    expect(retrieveByKeyword(weak, "governance").refused).toBe(true);
    expect(retrieveByKeyword(weak, "governance", { minScore: 0 }).refused).toBe(false);
  });
});

// BM25 is the ranking engine whenever there is no OPENAI_API_KEY, which is the default
// deployment, so its three characteristics are product behavior rather than math trivia.
describe("keyword ranking characteristics", () => {
  const filler = "alpha bravo charlie delta echo foxtrot golf hotel india";

  // Both documents match one query term once and are the same length, so only the
  // rarity of the term they matched can separate them.
  it("prefers a rare term over one that nearly every document shares", () => {
    const result = retrieveByKeyword(
      [
        makeChunk({ id: "common", content: "engineering alpha bravo charlie" }),
        makeChunk({ id: "rare", content: "governance delta echo foxtrot" }),
        makeChunk({ id: "third", content: "engineering golf hotel india" }),
        makeChunk({ id: "fourth", content: "engineering juliett kilo lima" }),
      ],
      "engineering governance",
      { minScore: 0 },
    );
    const [first, second] = result.hits;

    expect(first?.chunk.id).toBe("rare");
    expect(second?.chunk.id).toBe("common");
    expect(first?.score).toBeGreaterThan(second?.score ?? 0);
  });

  it("prefers the shorter document when both mention the term equally often", () => {
    const result = retrieveByKeyword(
      [
        makeChunk({ id: "padded", content: `governance governance ${filler} ${filler}` }),
        makeChunk({ id: "short", content: "governance governance" }),
      ],
      "governance",
      { minScore: 0 },
    );
    const [first, second] = result.hits;

    expect(first?.chunk.id).toBe("short");
    expect(first?.score).toBeGreaterThan(second?.score ?? 0);
  });

  it("saturates repeats: ten mentions rank higher than one, but nowhere near ten times", () => {
    const result = retrieveByKeyword(
      [
        makeChunk({ id: "ten", content: "governance ".repeat(10) }),
        makeChunk({ id: "one", content: `governance ${filler}` }),
      ],
      "governance",
      { minScore: 0 },
    );
    const ten = result.hits.find((h) => h.chunk.id === "ten")?.score ?? 0;
    const one = result.hits.find((h) => h.chunk.id === "one")?.score ?? 0;

    expect(ten).toBeGreaterThan(one);
    expect(ten).toBeLessThan(one * 10);
  });

  it("drops stopwords, so a document dense with them cannot be retrieved by them", () => {
    const corpus = [
      makeChunk({ id: "chatter", sourceTitle: "notes", content: "the the the and or but is are" }),
    ];

    expect(retrieveByKeyword(corpus, "what is the", { minScore: 0 }).refused).toBe(true);
  });

  it("drops single characters, so an initial cannot drive retrieval", () => {
    const corpus = [
      makeChunk({ id: "initials", sourceTitle: "notes", content: "d e s design system" }),
    ];

    expect(retrieveByKeyword(corpus, "d e", { minScore: 0 }).refused).toBe(true);
  });

  it("ignores query terms the corpus has never seen instead of scoring them", () => {
    const corpus = [makeChunk({ id: "a", content: "governance governance governance tokens" })];
    const alone = retrieveByKeyword(corpus, "governance", { minScore: 0 });
    const padded = retrieveByKeyword(corpus, "governance astronaut blob shader", { minScore: 0 });

    expect(padded.hits[0]?.score).toBeCloseTo(alone.hits[0]?.score ?? 0, 10);
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
