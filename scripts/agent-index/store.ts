import { existsSync, readFileSync } from "node:fs";

import { INDEX_PATH } from "./paths";
import type { AgentIndex, IndexEntry } from "./types";

export function loadExistingIndex(): AgentIndex | null {
  if (!existsSync(INDEX_PATH)) return null;
  try {
    const raw = readFileSync(INDEX_PATH, "utf8");
    return JSON.parse(raw) as AgentIndex;
  } catch (err) {
    console.warn("[agent:index] could not parse existing index:", err);
    return null;
  }
}

export function indexById(chunks: IndexEntry[]): Map<string, IndexEntry> {
  const m = new Map<string, IndexEntry>();
  for (const c of chunks) m.set(c.id, c);
  return m;
}

export function serialize(idx: AgentIndex): string {
  const sorted = [...idx.chunks].sort((a, b) => a.id.localeCompare(b.id));
  return `${JSON.stringify({ ...idx, chunks: sorted }, null, 2)}\n`;
}
