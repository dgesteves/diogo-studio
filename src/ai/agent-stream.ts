import "server-only";

import * as Sentry from "@sentry/nextjs";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { env } from "@/config/env";
import type { AgentChunk, AgentSourcesPayload } from "@/types/agent";

import { sourcesHeaderValue } from "./agent-response";
import { formatUserPrompt, SYSTEM_PROMPT } from "./system-prompt";

export function streamAgentResponse(
  query: string,
  chunks: AgentChunk[],
  payload: AgentSourcesPayload,
  apiKey: string,
): Response {
  const openaiClient = createOpenAI({ apiKey });
  const result = streamText({
    model: openaiClient.chat(env.OPENAI_CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: formatUserPrompt(query, chunks),
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
