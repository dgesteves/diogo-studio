#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";

import { runCheck } from "./agent-index/check";
import { embedMissingChunks } from "./agent-index/embed";
import { INDEX_PATH, ROOT, loadEnvFiles } from "./agent-index/paths";
import { caseStudyChunks, essayChunks } from "./agent-index/sources";
import { indexById, loadExistingIndex, serialize } from "./agent-index/store";
import { CHUNKER_VERSION, EMBED_DIMENSIONS } from "./agent-index/types";
import type { AgentIndex, IndexEntry } from "./agent-index/types";
import { buildCareerChunks } from "./agent-index/virtual-chunks";

const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

const flags = {
  check: process.argv.includes("--check"),
  noEmbed: process.argv.includes("--no-embed"),
  strict: process.argv.includes("--strict"),
};

async function main(): Promise<void> {
  loadEnvFiles();
  console.log("[agent:index] gathering source chunks…");
  const caseChunks = caseStudyChunks();
  const essaySourceChunks = essayChunks();
  const career = buildCareerChunks();
  const chunks = [...career, ...caseChunks, ...essaySourceChunks];

  console.log(
    `[agent:index] ${chunks.length} chunks (career=${career.length}, case=${caseChunks.length}, essay=${essaySourceChunks.length})`,
  );

  const existing = loadExistingIndex();
  const previous = existing ? indexById(existing.chunks) : new Map<string, IndexEntry>();

  let reused = 0;
  let stale = 0;
  for (const chunk of chunks) {
    const prev = previous.get(chunk.id);
    if (prev && prev.contentHash === chunk.contentHash && prev.embedding) {
      chunk.embedding = prev.embedding;
      reused += 1;
    } else if (prev && prev.contentHash !== chunk.contentHash) {
      stale += 1;
    }
  }

  const missing = chunks.filter((c) => !c.embedding);
  console.log(
    `[agent:index] embeddings: reused=${reused}, stale=${stale}, missing=${missing.length}`,
  );

  if (flags.check) {
    if (!runCheck({ chunks, existing, previous, strict: flags.strict })) {
      process.exitCode = 1;
    }
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const embedModel = process.env.OPENAI_EMBED_MODEL ?? DEFAULT_EMBED_MODEL;
  const shouldEmbed = !flags.noEmbed && Boolean(apiKey) && missing.length > 0;

  if (shouldEmbed && apiKey) {
    await embedMissingChunks(missing, apiKey, embedModel);
  } else if (missing.length > 0) {
    const reason = flags.noEmbed
      ? "--no-embed set"
      : !apiKey
        ? "OPENAI_API_KEY not set"
        : "no missing chunks";
    console.warn(
      `[agent:index] skipping embedding (${reason}). ${missing.length} chunks will fall back to keyword retrieval at runtime.`,
    );
  }

  const index: AgentIndex = {
    generatedAt: new Date().toISOString(),
    embeddingModel: shouldEmbed ? embedModel : (existing?.embeddingModel ?? null),
    embeddingDim: shouldEmbed ? EMBED_DIMENSIONS : (existing?.embeddingDim ?? null),
    chunkerVersion: CHUNKER_VERSION,
    chunks,
  };

  mkdirSync(dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, serialize(index));
  console.log(
    `[agent:index] wrote ${relative(ROOT, INDEX_PATH)} (${index.chunks.length} chunks, ${
      index.chunks.filter((c) => c.embedding).length
    } embedded).`,
  );
}

main().catch((err) => {
  console.error("[agent:index] failed:", err);
  process.exit(1);
});
