import "server-only";

import type { AgentCitation, AgentSourcesPayload } from "@/chat-contract";

import type { AgentChunk } from "./corpus";

export const REFUSAL_TEXT =
  "I don't have that in the indexed material yet. The contact page has direct links if you'd like to ask Diogo about it.";

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
