import { chatRequestSchema } from "@/lib/validations/agent";
import { retrieve } from "@/server/ai/retrieve";
import { createRateLimiter } from "@/server/rate-limit";
import { env } from "@/env";
import type { AgentSourcesPayload } from "@/types/agent";

import { CHUNKS, CORPUS_HAS_EMBEDDINGS } from "@/server/ai/agent-index";
import {
  buildCitations,
  jsonResponse,
  REFUSAL_TEXT,
  textResponse,
} from "@/server/ai/agent-response";
import { embedQuery } from "@/server/ai/embed-query";
import { streamAgentResponse } from "@/server/ai/agent-stream";

export const runtime = "edge";
export const maxDuration = 30;

const allow = createRateLimiter({ prefix: "agent-chat", limit: 10, windowMs: 60_000 });

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
  const queryEmbedding = apiKey && CORPUS_HAS_EMBEDDINGS ? await embedQuery(query, apiKey) : null;

  const retrieval = retrieve(CHUNKS, query, queryEmbedding);

  if (retrieval.refused || retrieval.hits.length === 0) {
    const payload: AgentSourcesPayload = {
      citations: [],
      retrieval: retrieval.retrieval,
      refused: true,
    };
    return textResponse(REFUSAL_TEXT, payload, 200);
  }

  const orderedChunks = retrieval.hits.map((h) => h.chunk);
  const payload: AgentSourcesPayload = {
    citations: buildCitations(orderedChunks),
    retrieval: retrieval.retrieval,
    refused: false,
  };

  if (!apiKey) {
    const titles = retrieval.hits.map((h, i) => `[${i + 1}] ${h.chunk.sourceTitle}`).join("\n");
    return textResponse(
      `The chat model isn't configured (no OPENAI_API_KEY). Top matches from the index:\n\n${titles}`,
      payload,
      503,
    );
  }

  return streamAgentResponse(query, orderedChunks, payload, apiKey);
}
