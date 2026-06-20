import "server-only";

import type { AgentChunk, AgentCitation, AgentSourcesPayload } from "@/types/agent";

export const REFUSAL_TEXT =
  "I don't have that in the indexed material yet. Reach out to Diogo directly via the links in the site footer.";

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

export function sourcesHeaderValue(payload: AgentSourcesPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function buildCitations(chunks: AgentChunk[]): AgentCitation[] {
  return chunks.map((c, i) => ({
    marker: i + 1,
    chunkId: c.id,
    sourceKind: c.sourceKind,
    sourceTitle: c.sourceTitle,
    href: `${c.permalink}${c.anchor ? `#${c.anchor}` : ""}`,
    heading: c.heading,
  }));
}

export function textResponse(body: string, payload: AgentSourcesPayload, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-agent-sources": sourcesHeaderValue(payload),
      "cache-control": "no-store",
    },
  });
}
