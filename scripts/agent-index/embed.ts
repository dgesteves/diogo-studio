import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import { EMBED_DIMENSIONS } from "./types";
import type { IndexEntry } from "./types";

// Matryoshka truncation to 512d — ~3× smaller JSON at no quality cost for this
// corpus. Batches of 64 keep request sizes well under provider caps.
const BATCH = 64;

export async function embedMissingChunks(
  missing: IndexEntry[],
  apiKey: string,
  model: string,
): Promise<void> {
  console.log(
    `[agent:index] embedding ${missing.length} chunks with ${model} @ ${EMBED_DIMENSIONS}d…`,
  );
  const openai = createOpenAI({ apiKey });
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const { embeddings } = await embedMany({
      model: openai.embedding(model),
      values: batch.map((c) => c.content),
      providerOptions: { openai: { dimensions: EMBED_DIMENSIONS } },
    });
    for (let j = 0; j < batch.length; j += 1) {
      const entry = batch[j];
      const vec = embeddings[j];
      if (entry && vec) entry.embedding = vec;
    }
    console.log(`[agent:index]   batch ${i / BATCH + 1} → ${batch.length} embedded`);
  }
}
