import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, streamText } from "ai";

import { env } from "@/env";
import { agentIndexSchema, chatRequestSchema } from "@/lib/validations/agent";
import { retrieve } from "@/server/ai/retrieve";
import { formatUserPrompt, SYSTEM_PROMPT } from "@/server/ai/system-prompt";
import type { AgentChunk, AgentCitation, AgentIndex, AgentSourcesPayload } from "@/types/agent";

import indexJson from "@/content/agent-index.json" with { type: "json" };

export const runtime = "edge";
export const maxDuration = 30;

const INDEX: AgentIndex = agentIndexSchema.parse(indexJson);
const CHUNKS: AgentChunk[] = INDEX.chunks;
const CORPUS_HAS_EMBEDDINGS = CHUNKS.some(
  (c) => Array.isArray(c.embedding) && c.embedding.length > 0,
);

const upstashLimiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: false,
        prefix: "agent-chat",
      })
    : null;

const localBuckets = new Map<string, { tokens: number; updatedAt: number }>();
const LOCAL_CAPACITY = 10;
const LOCAL_REFILL_PER_MS = LOCAL_CAPACITY / 60_000;

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

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const query = parsed.data.query;

  if (!(await allow(req))) {
    return jsonResponse({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }

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
      Sentry.captureException(err, { tags: { route: "/api/chat", stage: "embed" } });
    }
  }

  const retrieval = retrieve(CHUNKS, query, queryEmbedding);

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
    maxOutputTokens: 600,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.textStream) {
          controller.enqueue(encoder.encode(part));
        }
        controller.close();
      } catch (err) {
        Sentry.captureException(err, { tags: { route: "/api/chat", stage: "stream" } });
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
