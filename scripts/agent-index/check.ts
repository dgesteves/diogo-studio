import { CHUNKER_VERSION } from "./types";
import type { AgentIndex, IndexEntry } from "./types";

type CheckArgs = {
  chunks: IndexEntry[];
  existing: AgentIndex | null;
  previous: Map<string, IndexEntry>;
  strict: boolean;
};

export function runCheck({ chunks, existing, previous, strict }: CheckArgs): boolean {
  if (!existing) {
    console.error(
      "[agent:index] --check failed: no existing index. Run `pnpm agent:index` and commit src/content/agent-index.json.",
    );
    return false;
  }
  if (existing.chunkerVersion !== CHUNKER_VERSION) {
    console.error(
      `[agent:index] --check failed: chunker version drift (${existing.chunkerVersion} → ${CHUNKER_VERSION}). Rebuild.`,
    );
    return false;
  }

  const currentIds = new Set(chunks.map((c) => c.id));
  const existingIds = new Set(existing.chunks.map((c) => c.id));
  const added = [...currentIds].filter((id) => !existingIds.has(id));
  const removed = [...existingIds].filter((id) => !currentIds.has(id));
  const changed = chunks
    .filter((c) => {
      const prev = previous.get(c.id);
      return prev && prev.contentHash !== c.contentHash;
    })
    .map((c) => c.id);

  if (added.length || removed.length || changed.length) {
    console.error("[agent:index] --check failed: index out of date.");
    if (added.length) console.error(`  added (${added.length}):`, added.slice(0, 5));
    if (removed.length) console.error(`  removed (${removed.length}):`, removed.slice(0, 5));
    if (changed.length) console.error(`  changed (${changed.length}):`, changed.slice(0, 5));
    console.error("  → Run `pnpm agent:index` and commit the result.");
    return false;
  }

  if (strict) {
    const noEmbed = chunks.filter((c) => !c.embedding);
    if (noEmbed.length) {
      console.error(
        `[agent:index] --check --strict failed: ${noEmbed.length} chunks missing embeddings.`,
      );
      console.error("  → Run `pnpm agent:index` with OPENAI_API_KEY set, then commit.");
      return false;
    }
  }

  console.log("[agent:index] --check passed.");
  return true;
}
