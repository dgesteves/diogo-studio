import "server-only";

import * as Sentry from "@sentry/nextjs";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

import { env } from "@/config/env";
import { INDEX } from "./agent-index";

export async function embedQuery(query: string, apiKey: string): Promise<number[] | null> {
  try {
    const openaiClient = createOpenAI({ apiKey });
    const result = await embed({
      model: openaiClient.embedding(env.OPENAI_EMBED_MODEL),
      value: query,
      providerOptions: {
        openai: { dimensions: INDEX.embeddingDim ?? 512 },
      },
    });
    return result.embedding;
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "/api/chat", stage: "embed" } });
    return null;
  }
}
