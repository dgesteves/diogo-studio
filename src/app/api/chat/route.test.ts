import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeChunk } from "@tests/agent";
import { setTestEnv } from "@tests/env";
import { REFUSAL_TEXT } from "@/ai/agent-response";
import {
  agentSourcesPayloadSchema,
  type AgentChunk,
  type AgentSourcesPayload,
} from "@/schemas/agent";

import { POST } from "./route";

const { streamText, embed, createOpenAI, chatModel, embeddingModel, captureException } = vi.hoisted(
  () => ({
    streamText: vi.fn(),
    embed: vi.fn(),
    createOpenAI: vi.fn(),
    chatModel: vi.fn(),
    embeddingModel: vi.fn(),
    captureException: vi.fn(),
  }),
);

const corpus: { chunks: AgentChunk[]; hasEmbeddings: boolean; embeddingDim: number | null } = {
  chunks: [],
  hasEmbeddings: true,
  embeddingDim: 3,
};

vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }));
vi.mock("ai", () => ({ streamText, embed }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI }));
vi.mock("@sentry/nextjs", () => ({ captureException }));
vi.mock("@/ai/agent-index", () => ({
  get CHUNKS() {
    return corpus.chunks;
  },
  get CORPUS_HAS_EMBEDDINGS() {
    return corpus.hasEmbeddings;
  },
  get INDEX() {
    return { embeddingDim: corpus.embeddingDim };
  },
}));

const DESIGN_SYSTEM = makeChunk({
  id: "diligent#1",
  sourceTitle: "Diligent design system",
  heading: "Governance",
  permalink: "/work",
  anchor: "diligent",
  tags: ["design-system", "react"],
  content:
    "Authored the company-wide design system. Design system tokens, design system governance, and a design system contribution model across React and Angular.",
  embedding: [1, 0, 0],
});

const STREAMING = makeChunk({
  id: "peacock#1",
  sourceKind: "site",
  sourceTitle: "Peacock streaming reliability",
  permalink: "/writing",
  content:
    "Streaming reliability, streaming release safety and streaming performance for tens of millions of viewers.",
  embedding: [0, 1, 0],
});

const API_KEY = "sk-test-key";
const MATCHING_QUERY = "design system governance";

let callerId = 0;

// The route builds its rate limiter at import — 10 requests per minute per address — so
// every case gets its own, and only the rate-limit case deliberately reuses one.
function post(body: unknown, ip = `10.0.0.${(callerId += 1)}`): Promise<Response> {
  return POST(
    new Request("https://diogo.studio/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function sourcesOf(res: Response): AgentSourcesPayload {
  const header = res.headers.get("x-agent-sources");
  expect(header).not.toBeNull();
  return agentSourcesPayloadSchema.parse(JSON.parse(decodeURIComponent(escape(atob(header!)))));
}

function textStreamOf(
  parts: string[],
  throwAtPart?: number,
): { textStream: AsyncIterable<string> } {
  return {
    textStream: {
      async *[Symbol.asyncIterator]() {
        for (const [index, part] of parts.entries()) {
          if (index === throwAtPart) throw new Error("upstream closed the stream");
          yield part;
        }
      },
    },
  };
}

beforeEach(() => {
  corpus.chunks = [DESIGN_SYSTEM, STREAMING];
  corpus.hasEmbeddings = true;
  corpus.embeddingDim = 3;
  setTestEnv({ OPENAI_API_KEY: API_KEY });
  createOpenAI.mockReturnValue({ chat: chatModel, embedding: embeddingModel });
  embed.mockResolvedValue({ embedding: [1, 0, 0] });
  streamText.mockReturnValue(textStreamOf(["Diogo ", "authored it [1]."]));
});

afterEach(() => {
  setTestEnv();
  vi.clearAllMocks();
});

describe("request validation", () => {
  it("rejects a body that is not JSON with 400", async () => {
    const res = await post("not json at all");

    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body." });
  });

  it("rejects a missing query with the schema's message", async () => {
    const res = await post({});

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing `query` string." });
  });

  it("rejects a whitespace-only query", async () => {
    const res = await post({ query: "   " });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing `query` string." });
  });

  it("rejects a query over 600 characters", async () => {
    const res = await post({ query: "a".repeat(601) });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Query too long (max 600 chars)." });
  });

  it("accepts a query of exactly 600 characters", async () => {
    const res = await post({ query: `${MATCHING_QUERY} ${"a".repeat(575)}` });

    expect(res.status).toBe(200);
  });

  it("rejects a non-string query with the same message, not zod's internals", async () => {
    const res = await post({ query: 42 });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing `query` string." });
  });

  it("never reaches the model for an invalid request", async () => {
    await post({ query: "" });

    expect(streamText).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
  });
});

describe("rate limiting", () => {
  it("refuses the 11th request from the same address within the window", async () => {
    const ip = "10.9.9.9";
    for (let i = 0; i < 10; i += 1) {
      expect((await post({ query: MATCHING_QUERY }, ip)).status).toBe(200);
    }

    const res = await post({ query: MATCHING_QUERY }, ip);

    expect(res.status).toBe(429);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    await expect(res.json()).resolves.toEqual({ error: "Rate limit exceeded. Try again shortly." });
  });

  it("counts the request before spending anything on the model", async () => {
    const ip = "10.9.9.8";
    for (let i = 0; i < 10; i += 1) await post({ query: MATCHING_QUERY }, ip);
    vi.clearAllMocks();

    await post({ query: MATCHING_QUERY }, ip);

    expect(embed).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });
});

describe("refusal", () => {
  beforeEach(() => {
    embed.mockResolvedValue({ embedding: [0, 0, 1] });
  });

  it("answers 200 with the refusal text when nothing in the index is close enough", async () => {
    const res = await post({ query: "underwater basket weaving championship" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    await expect(res.text()).resolves.toBe(REFUSAL_TEXT);
    expect(streamText).not.toHaveBeenCalled();
  });

  it("reports the refusal and no citations in x-agent-sources", async () => {
    const res = await post({ query: "underwater basket weaving championship" });

    expect(sourcesOf(res)).toEqual({ citations: [], retrieval: "cosine", refused: true });
  });

  it("refuses rather than answering from an empty index", async () => {
    corpus.chunks = [];

    const res = await post({ query: MATCHING_QUERY });

    await expect(res.text()).resolves.toBe(REFUSAL_TEXT);
    expect(streamText).not.toHaveBeenCalled();
  });

  it("refuses a query made only of stopwords", async () => {
    corpus.hasEmbeddings = false;

    const res = await post({ query: "what is the" });

    await expect(res.text()).resolves.toBe(REFUSAL_TEXT);
    expect(sourcesOf(res)).toMatchObject({ retrieval: "keyword", refused: true });
  });
});

describe("without an API key", () => {
  beforeEach(() => {
    setTestEnv();
  });

  it("answers 503 with the top matches from the index", async () => {
    const res = await post({ query: MATCHING_QUERY });
    const body = await res.text();

    expect(res.status).toBe(503);
    expect(body).toContain("The chat model isn't configured (no OPENAI_API_KEY)");
    expect(body).toContain("[1] Diligent design system");
  });

  it("still reports its citations, unrefused, in x-agent-sources", async () => {
    const res = await post({ query: MATCHING_QUERY });
    const payload = sourcesOf(res);

    expect(payload.refused).toBe(false);
    expect(payload.retrieval).toBe("keyword");
    expect(payload.citations[0]).toMatchObject({
      marker: 1,
      chunkId: DESIGN_SYSTEM.id,
      href: "/work#diligent",
    });
  });

  it("neither embeds nor streams", async () => {
    await post({ query: MATCHING_QUERY });

    expect(embed).not.toHaveBeenCalled();
    expect(streamText).not.toHaveBeenCalled();
  });

  it("marks the fallback uncacheable", async () => {
    const res = await post({ query: MATCHING_QUERY });

    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("streaming answer", () => {
  it("streams the model's text with a 200 and no-store", async () => {
    const res = await post({ query: MATCHING_QUERY });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    await expect(res.text()).resolves.toBe("Diogo authored it [1].");
  });

  it("grounds the model in the retrieved sources, in citation order", async () => {
    await post({ query: "design system governance streaming reliability" });

    const call = streamText.mock.calls[0]?.[0] as { system: string; prompt: string };
    expect(call.system).toContain("You are the Inspector agent");
    expect(call.prompt).toContain("[1] Diligent design system");
    expect(call.prompt).toContain("[2] Peacock streaming reliability");
    expect(call.prompt).toContain("design system governance streaming reliability");
  });

  it("builds the client from the configured key and chat model", async () => {
    setTestEnv({ OPENAI_API_KEY: API_KEY, OPENAI_CHAT_MODEL: "gpt-4o" });

    await post({ query: MATCHING_QUERY });

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: API_KEY });
    expect(chatModel).toHaveBeenCalledWith("gpt-4o");
  });

  it("carries every retrieved chunk as a numbered citation", async () => {
    const res = await post({ query: "design system governance streaming reliability" });
    const payload = sourcesOf(res);

    expect(payload.refused).toBe(false);
    expect(payload.citations.map((c) => c.marker)).toEqual([1, 2]);
    expect(payload.citations[0]).toMatchObject({
      chunkId: DESIGN_SYSTEM.id,
      sourceTitle: "Diligent design system",
      sourceKind: "career",
      href: "/work#diligent",
      heading: "Governance",
    });
    expect(payload.citations[1]).toMatchObject({ chunkId: STREAMING.id, href: "/writing" });
  });

  it("recovers when the model stream dies mid-answer", async () => {
    streamText.mockReturnValue(textStreamOf(["Diogo ", "authored"], 1));

    const res = await post({ query: MATCHING_QUERY });

    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe(
      "Diogo \n\n[The model stream ended unexpectedly. Try again.]",
    );
  });

  it("reports a dead stream to Sentry with the failing stage", async () => {
    streamText.mockReturnValue(textStreamOf(["Diogo "], 0));

    await (await post({ query: MATCHING_QUERY })).text();

    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { route: "/api/chat", stage: "stream" },
    });
  });
});

describe("query embedding", () => {
  it("embeds the query and retrieves by cosine when the corpus has vectors", async () => {
    const res = await post({ query: "anything at all" });

    expect(embed).toHaveBeenCalledWith(expect.objectContaining({ value: "anything at all" }));
    expect(embeddingModel).toHaveBeenCalledWith("text-embedding-3-small");
    expect(sourcesOf(res).retrieval).toBe("cosine");
  });

  it("asks for the index's own embedding dimensions", async () => {
    corpus.embeddingDim = 1536;

    await post({ query: "anything at all" });

    expect(embed).toHaveBeenCalledWith(
      expect.objectContaining({ providerOptions: { openai: { dimensions: 1536 } } }),
    );
  });

  it("defaults to 512 dimensions when the index declares none", async () => {
    corpus.embeddingDim = null;

    await post({ query: "anything at all" });

    expect(embed).toHaveBeenCalledWith(
      expect.objectContaining({ providerOptions: { openai: { dimensions: 512 } } }),
    );
  });

  it("skips embedding when the corpus carries no vectors", async () => {
    corpus.hasEmbeddings = false;

    const res = await post({ query: MATCHING_QUERY });

    expect(embed).not.toHaveBeenCalled();
    expect(sourcesOf(res).retrieval).toBe("keyword");
  });

  it("falls back to keyword retrieval when embedding fails", async () => {
    embed.mockRejectedValue(new Error("openai is down"));

    const res = await post({ query: MATCHING_QUERY });

    expect(res.status).toBe(200);
    expect(sourcesOf(res).retrieval).toBe("keyword");
  });

  it("reports a failed embedding to Sentry with the failing stage", async () => {
    embed.mockRejectedValue(new Error("openai is down"));

    await post({ query: MATCHING_QUERY });

    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { route: "/api/chat", stage: "embed" },
    });
  });
});
