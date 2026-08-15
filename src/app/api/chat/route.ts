import { chatRequestSchema, type AgentSourcesPayload } from "@/chat-contract";
import { env } from "@/env";

import { CHUNKS, CORPUS_HAS_EMBEDDINGS } from "@/agent/corpus";
import { createRateLimiter } from "@/agent/rate-limit";
import { buildCitations, jsonResponse, REFUSAL_TEXT, textResponse } from "@/agent/response";
import { embedQuery, retrieve } from "@/agent/retrieval";
import { streamAgentResponse } from "@/agent/stream";

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
