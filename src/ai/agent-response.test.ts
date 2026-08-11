import { describe, expect, it } from "vitest";

import { makeChunk } from "@tests/agent";
import { agentSourcesPayloadSchema, type AgentSourcesPayload } from "@/schemas/agent";

import {
  buildCitations,
  jsonResponse,
  REFUSAL_TEXT,
  sourcesHeaderValue,
  textResponse,
} from "./agent-response";

function decodeHeader(value: string): unknown {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

describe("jsonResponse()", () => {
  it("serializes the body as JSON with a charset", async () => {
    const res = jsonResponse({ error: "nope" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    await expect(res.json()).resolves.toEqual({ error: "nope" });
  });

  it("honors the caller's status", () => {
    expect(jsonResponse({}, { status: 429 }).status).toBe(429);
  });

  it("keeps the caller's own headers alongside the content type", () => {
    const res = jsonResponse({}, { headers: { "retry-after": "60" } });

    expect(res.headers.get("retry-after")).toBe("60");
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
  });
});

describe("sourcesHeaderValue()", () => {
  const payload: AgentSourcesPayload = {
    citations: [
      {
        marker: 1,
        chunkId: "resume#0",
        sourceKind: "career",
        sourceTitle: "Résumé — Universidade Lusófona",
        href: "/resume#education",
      },
    ],
    retrieval: "cosine",
    refused: false,
  };

  it("round-trips the payload through base64", () => {
    expect(agentSourcesPayloadSchema.parse(decodeHeader(sourcesHeaderValue(payload)))).toEqual(
      payload,
    );
  });

  it("survives non-ASCII source titles, which raw btoa cannot encode", () => {
    expect(() => btoa(JSON.stringify(payload))).toThrow();
    expect(decodeHeader(sourcesHeaderValue(payload))).toMatchObject({
      citations: [{ sourceTitle: "Résumé — Universidade Lusófona" }],
    });
  });

  it("emits only characters that are legal in an HTTP header", () => {
    expect(sourcesHeaderValue(payload)).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe("buildCitations()", () => {
  it("numbers citations from 1, in the order the chunks were ranked", () => {
    const citations = buildCitations([
      makeChunk({ id: "a", content: "one" }),
      makeChunk({ id: "b", content: "two" }),
      makeChunk({ id: "c", content: "three" }),
    ]);

    expect(citations.map((c) => c.marker)).toEqual([1, 2, 3]);
    expect(citations.map((c) => c.chunkId)).toEqual(["a", "b", "c"]);
  });

  it("deep-links to the chunk's anchor when it has one", () => {
    const [citation] = buildCitations([
      makeChunk({ id: "a", content: "one", permalink: "/work", anchor: "diligent" }),
    ]);

    expect(citation?.href).toBe("/work#diligent");
  });

  it("links to the bare permalink when the chunk has no anchor", () => {
    const [citation] = buildCitations([makeChunk({ id: "a", content: "one", permalink: "/work" })]);

    expect(citation?.href).toBe("/work");
  });

  it("carries the heading through, and leaves it out when absent", () => {
    const [withHeading, withoutHeading] = buildCitations([
      makeChunk({ id: "a", content: "one", heading: "Governance" }),
      makeChunk({ id: "b", content: "two" }),
    ]);

    expect(withHeading?.heading).toBe("Governance");
    expect(withoutHeading?.heading).toBeUndefined();
  });

  it("returns nothing for no chunks", () => {
    expect(buildCitations([])).toEqual([]);
  });
});

describe("textResponse()", () => {
  const payload: AgentSourcesPayload = { citations: [], retrieval: "keyword", refused: true };

  it("sends plain text with the sources header and no caching", () => {
    const res = textResponse(REFUSAL_TEXT, payload, 200);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(decodeHeader(res.headers.get("x-agent-sources")!)).toEqual(payload);
  });

  it("carries the caller's status, so the degraded paths stay distinguishable", () => {
    expect(textResponse("no key", payload, 503).status).toBe(503);
  });
});
