/**
 * Phase 4 — Inspector "Ask" mode endpoint.
 *
 * Edge-runtime, streaming, grounded RAG against `src/content/agent-index.json`.
 * Strict refusal guardrail when no chunk crosses the relevance floor; rate
 * limited via Upstash when configured, otherwise an in-memory token bucket
 * suitable for dev / single-instance prod.
 *
 * Response shape:
 *  - body: `text/plain; charset=utf-8` stream of model output.
 *  - `X-Agent-Sources` header: base64(JSON) of `AgentSourcesPayload` so the
 *    client can render citation chips without a second round-trip.
 *  - On refusal: a non-streamed text body explaining the refusal; the
 *    sources header still ships (empty citations + refused=true).
 *  - 429 with a small JSON body when rate-limited.
 *  - 503 with a JSON body when OPENAI_API_KEY is unset (keyword retrieval
 *    will still degrade gracefully on the client; the route refuses cleanly).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, streamText } from "ai";

import { env } from "@/env";
import { retrieve } from "@/server/ai/retrieve";
import { formatUserPrompt, SYSTEM_PROMPT } from "@/server/ai/system-prompt";
import type { AgentChunk, AgentCitation, AgentIndex, AgentSourcesPayload } from "@/types/agent";

import indexJson from "@/content/agent-index.json" with { type: "json" };

export const runtime = "edge";
export const maxDuration = 30;

/* ---------------------------------------------------------------------------
 * Index — frozen at module load so subsequent requests don't re-parse.
 * ------------------------------------------------------------------------- */

const INDEX = indexJson as unknown as AgentIndex;
const CHUNKS: AgentChunk[] = INDEX.chunks;
const CORPUS_HAS_EMBEDDINGS = CHUNKS.some(
  (c) => Array.isArray(c.embedding) && c.embedding.length > 0,
);

/* ---------------------------------------------------------------------------
 * Rate limiting
 *
 * Vercel Edge serves multiple instances; in-memory state is best-effort.
 * Upstash gives us global per-IP fairness when configured. Both share the
 * same `allow(key)` shape so the route stays simple.
 * ------------------------------------------------------------------------- */

const upstashLimiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        // 10 requests per minute per IP. The chat is cheap; the rate limit is
        // about cost containment, not anti-abuse — that's separate concern.
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: false,
        prefix: "agent-chat",
      })
    : null;

const localBuckets = new Map<string, { tokens: number; updatedAt: number }>();
const LOCAL_CAPACITY = 10;
const LOCAL_REFILL_PER_MS = LOCAL_CAPACITY / 60_000; // 10 tokens / minute

function allowLocal(key: string): boolean {
  const now = Date.now();
  const bucket = localBuckets.get(key) ?? { tokens: LOCAL_CAPACITY, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(LOCAL_CAPACITY, bucket.tokens + elapsed * LOCAL_REFILL_PER_MS);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    localBuckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  localBuckets.set(key, bucket);
  return true;
}

async function allow(req: Request): Promise<boolean> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(ip);
    return result.success;
  }
  return allowLocal(ip);
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function sourcesHeaderValue(payload: AgentSourcesPayload): string {
  // base64 of UTF-8 JSON. `btoa` is available on Edge.
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function buildCitations(chunks: AgentChunk[]): AgentCitation[] {
  return chunks.map((c, i) => ({
    marker: i + 1,
    chunkId: c.id,
    sourceKind: c.sourceKind,
    sourceTitle: c.sourceTitle,
    href: `${c.permalink}${c.anchor ? `#${c.anchor}` : ""}`,
    heading: c.heading,
  }));
}

const REFUSAL_TEXT =
  "I don't have that in the indexed material. The fastest way to get a direct answer is via [/contact](/contact) — Diogo replies.";

/* ---------------------------------------------------------------------------
 * Route
 * ------------------------------------------------------------------------- */

export async function POST(req: Request): Promise<Response> {
  // 1) Parse + validate input.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, { status: 400 });
  }
  const query =
    typeof body === "object" &&
    body &&
    "query" in body &&
    typeof (body as { query: unknown }).query === "string"
      ? ((body as { query: string }).query as string).trim()
      : "";
  if (!query) {
    return jsonResponse({ error: "Missing `query` string." }, { status: 400 });
  }
  if (query.length > 600) {
    return jsonResponse({ error: "Query too long (max 600 chars)." }, { status: 400 });
  }

  // 2) Rate limit.
  if (!(await allow(req))) {
    return jsonResponse({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

  // 3) Retrieve. Embed the query if we can; otherwise the dispatcher falls
  //    back to BM25 keyword retrieval — same chunks, lower-tier scoring.
  const apiKey = env.OPENAI_API_KEY;
  let queryEmbedding: number[] | null = null;
  if (apiKey && CORPUS_HAS_EMBEDDINGS) {
    try {
      const openaiClient = createOpenAI({ apiKey });
      const result = await embed({
        model: openaiClient.embedding(env.OPENAI_EMBED_MODEL),
        value: query,
        providerOptions: {
          openai: { dimensions: INDEX.embeddingDim ?? 512 },
        },
      });
      queryEmbedding = result.embedding;
    } catch (err) {
      // Embedding failure is recoverable — fall through to keyword retrieval.
      console.warn("[/api/chat] embed failed, falling back to keyword:", err);
    }
  }

  const retrieval = retrieve(CHUNKS, query, queryEmbedding);

  // 4) Grounding guardrail: refuse cleanly if nothing crossed the floor.
  if (retrieval.refused || retrieval.hits.length === 0) {
    const payload: AgentSourcesPayload = {
      citations: [],
      retrieval: retrieval.retrieval,
      refused: true,
    };
    return new Response(REFUSAL_TEXT, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-agent-sources": sourcesHeaderValue(payload),
        "cache-control": "no-store",
      },
    });
  }

  // 5) Without an API key we can retrieve but can't generate. Return the
  //    top hit titles as a structured fallback so the UI still shows
  //    something useful — and 503 so the client can render a "set up the
  //    agent" hint in dev.
  if (!apiKey) {
    const titles = retrieval.hits.map((h, i) => `[${i + 1}] ${h.chunk.sourceTitle}`).join("\n");
    const payload: AgentSourcesPayload = {
      citations: buildCitations(retrieval.hits.map((h) => h.chunk)),
      retrieval: retrieval.retrieval,
      refused: false,
    };
    return new Response(
      `The chat model isn't configured (no OPENAI_API_KEY). Top matches from the index:\n\n${titles}`,
      {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-agent-sources": sourcesHeaderValue(payload),
          "cache-control": "no-store",
        },
      },
    );
  }

  // 6) Stream the grounded answer.
  const orderedChunks = retrieval.hits.map((h) => h.chunk);
  const payload: AgentSourcesPayload = {
    citations: buildCitations(orderedChunks),
    retrieval: retrieval.retrieval,
    refused: false,
  };

  const openaiClient = createOpenAI({ apiKey });
  const result = streamText({
    model: openaiClient.chat(env.OPENAI_CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: formatUserPrompt(query, orderedChunks),
    temperature: 0.2,
    // Keep replies tight; the prompt also asks for brevity. Belt + braces.
    // Most well-grounded answers land well under 400 tokens.
    maxOutputTokens: 600,
  });

  // Wrap the AsyncIterable<string> as a ReadableStream<Uint8Array>. We do
  // this by hand (rather than `result.toTextStreamResponse()`) so we can
  // attach the sources header before the stream starts.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.textStream) {
          controller.enqueue(encoder.encode(part));
        }
        controller.close();
      } catch (err) {
        console.error("[/api/chat] stream error:", err);
        controller.enqueue(encoder.encode("\n\n[The model stream ended unexpectedly. Try again.]"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-agent-sources": sourcesHeaderValue(payload),
      "cache-control": "no-store",
    },
  });
}
