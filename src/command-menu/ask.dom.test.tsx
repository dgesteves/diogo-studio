import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentCitation, AgentSourcesPayload } from "@/chat-contract";
import { useAskAgent } from "./ask";

/**
 * Driven through `useAskAgent` rather than `runAskRequest` directly: the hook is the seam
 * the menu uses, and every state the answer UI can render — streaming, done, refused,
 * rate-limited, unconfigured, error — is a combination of the two. `ask-agent.spec.ts`
 * covers the same journey in a real browser; this covers the branches a browser cannot
 * reach reliably (a dead stream, a mid-stream failure, an abort) in milliseconds.
 */

type ReadResult = { done: boolean; value?: Uint8Array };

type ResponseStub = {
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
  body: { getReader: () => { read: () => Promise<ReadResult> } } | null;
  text: () => Promise<string>;
};

const CITATION: AgentCitation = {
  marker: 1,
  chunkId: "case-studies-1",
  sourceKind: "career",
  sourceTitle: "Rebuilding the checkout",
  href: "/case-studies#checkout",
};

function encodeSources(payload: unknown): string {
  // The same unicode-safe encoding the route uses: plain `btoa` throws on non-Latin-1.
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes));
}

// A `null` chunk is a read that resolves with no bytes, which a real stream does for a
// keep-alive: it must not be mistaken for the end, and must not corrupt what is accumulated.
function streamOf(...chunks: (string | null)[]): ResponseStub["body"] {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    getReader: () => ({
      read: async () => {
        if (index >= chunks.length) return { done: true };
        const chunk = chunks[index++];
        return chunk === null ? { done: false } : { done: false, value: encoder.encode(chunk) };
      },
    }),
  };
}

function failingStream(error: Error): ResponseStub["body"] {
  return {
    getReader: () => ({
      read: async () => {
        throw error;
      },
    }),
  };
}

function respondWith(overrides: Partial<ResponseStub> = {}): void {
  const response: ResponseStub = {
    status: 200,
    ok: true,
    headers: { get: () => null },
    body: streamOf("An answer."),
    text: async () => "",
    ...overrides,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response),
  );
}

function sourcesHeader(payload: Partial<AgentSourcesPayload> = {}): ResponseStub["headers"] {
  const encoded = encodeSources({
    citations: [CITATION],
    retrieval: "cosine",
    refused: false,
    ...payload,
  });
  return { get: (name) => (name === "x-agent-sources" ? encoded : null) };
}

function abortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

async function ask(
  hook: ReturnType<typeof renderAsk>,
  query = "what did you build?",
): Promise<void> {
  await act(async () => {
    await hook.result.current.ask(query);
  });
}

function renderAsk(): ReturnType<typeof renderHook<ReturnType<typeof useAskAgent>, void>> {
  return renderHook(() => useAskAgent());
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAskAgent: a successful answer", () => {
  it("streams the answer in and finishes", async () => {
    respondWith({ body: streamOf("The studio ", null, "is a 3D ", "portfolio.") });
    const hook = renderAsk();

    expect(hook.result.current.status).toBe("idle");
    await ask(hook);

    expect(hook.result.current.answer).toBe("The studio is a 3D portfolio.");
    expect(hook.result.current.status).toBe("done");
    expect(hook.result.current.submitted).toBe("what did you build?");
    expect(hook.result.current.error).toBeNull();
  });

  it("reports streaming for as long as the answer is arriving", async () => {
    // Every other test awaits the whole request, so none of them can see the state that
    // renders the typing indicator and the Stop control.
    let release: ((response: ResponseStub) => void) | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<ResponseStub>((resolve) => (release = resolve))),
    );
    const hook = renderAsk();

    let inFlight: Promise<void> | undefined;
    act(() => {
      inFlight = hook.result.current.ask("what did you build?");
    });
    expect(hook.result.current.status).toBe("streaming");

    await act(async () => {
      release?.({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: streamOf("Answer."),
        text: async () => "",
      });
      await inFlight;
    });

    expect(hook.result.current.status).toBe("done");
  });

  it("reads the citations and the retrieval mode from the header", async () => {
    respondWith({ headers: sourcesHeader() });
    const hook = renderAsk();

    await ask(hook);

    // Citations arrive in a header before the body streams, which is what lets the chips
    // render next to the first token.
    expect(hook.result.current.citations).toEqual([CITATION]);
    expect(hook.result.current.retrieval).toBe("cosine");
  });

  it("reports a refusal as its own state, not as an error", async () => {
    respondWith({ headers: sourcesHeader({ refused: true }) });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("refused");
    expect(hook.result.current.error).toBeNull();
  });

  it("clears the previous answer when a second question is asked", async () => {
    respondWith({ headers: sourcesHeader(), body: streamOf("First.") });
    const hook = renderAsk();
    await ask(hook, "first question");

    respondWith({ body: streamOf("Second.") });
    await ask(hook, "second question");

    expect(hook.result.current.answer).toBe("Second.");
    expect(hook.result.current.submitted).toBe("second question");
    // Stale citations pointing at the previous question's sources would be a wrong answer
    // rendered as a correct one.
    expect(hook.result.current.citations).toEqual([]);
    expect(hook.result.current.retrieval).toBeNull();
  });

  it("clears the last answer and error before the next answer can arrive", async () => {
    respondWith({ body: streamOf("First answer.") });
    const hook = renderAsk();
    await ask(hook, "first question");

    respondWith({ status: 500, ok: false });
    await ask(hook, "second question");

    // The failing request never writes an answer, so anything left here would be the
    // previous answer displayed under the new question.
    expect(hook.result.current.answer).toBe("");
    expect(hook.result.current.status).toBe("error");

    respondWith({ body: streamOf("Third answer.") });
    await ask(hook, "third question");

    expect(hook.result.current.answer).toBe("Third answer.");
    expect(hook.result.current.error).toBeNull();
  });
});

describe("useAskAgent: a header it cannot trust", () => {
  it("ignores a header that is not valid base64 JSON", async () => {
    respondWith({ headers: { get: () => "not-base64-at-all" } });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.citations).toEqual([]);
    expect(hook.result.current.status).toBe("done");
  });

  it("ignores a well-formed payload that fails the schema", async () => {
    // Anything reaching the citation list must have been validated: the chips become links.
    respondWith({
      headers: { get: () => encodeSources({ citations: [{ marker: "one" }], refused: false }) },
    });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.citations).toEqual([]);
    expect(hook.result.current.status).toBe("done");
  });

  it("round-trips citations containing non-Latin-1 characters", async () => {
    const accented: AgentCitation = { ...CITATION, sourceTitle: "Café — naïve résumé" };
    respondWith({ headers: sourcesHeader({ citations: [accented] }) });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.citations).toEqual([accented]);
  });
});

describe("useAskAgent: the failure states the visitor sees", () => {
  it("surfaces the server's rate-limit message", async () => {
    respondWith({ status: 429, ok: false, text: async () => "Slow down. Try again in a minute." });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("rate-limited");
    expect(hook.result.current.error).toBe("Slow down. Try again in a minute.");
  });

  it("falls back to its own wording when the 429 body is empty", async () => {
    respondWith({ status: 429, ok: false, text: async () => "" });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.error).toMatch(/rate limit exceeded/i);
  });

  it("renders an unconfigured agent's 503 as the answer, not an error", async () => {
    // No OPENAI_API_KEY is a deployment state, not a fault: the route replies with prose
    // and the menu shows it as the answer.
    respondWith({ status: 503, ok: false, text: async () => "The agent is not configured." });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("unconfigured");
    expect(hook.result.current.answer).toBe("The agent is not configured.");
    expect(hook.result.current.error).toBeNull();
  });

  it("names the status for any other failure and points at Navigate mode", async () => {
    respondWith({ status: 500, ok: false });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.error).toMatch(/500.*navigate mode/i);
  });

  it("recovers when a body a text() call rejects", async () => {
    respondWith({
      status: 429,
      ok: false,
      text: async () => {
        throw new Error("body already consumed");
      },
    });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("rate-limited");
    expect(hook.result.current.error).toMatch(/rate limit exceeded/i);
  });

  it("reports a 200 with no stream at all", async () => {
    respondWith({ body: null });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.error).toBe("No response stream available.");
  });

  it("reports a stream that dies mid-answer", async () => {
    respondWith({ body: failingStream(new Error("network reset")) });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.error).toBe("The stream was interrupted.");
  });

  it("reports a request that never reaches the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.error).toMatch(/check your connection/i);
  });
});

describe("useAskAgent: stopping", () => {
  it("keeps a partial answer and marks it done", async () => {
    respondWith({ body: streamOf("Half an ans") });
    const hook = renderAsk();
    await ask(hook);

    act(() => hook.result.current.stop());

    expect(hook.result.current.answer).toBe("Half an ans");
    expect(hook.result.current.status).toBe("done");
  });

  it("returns to idle when there is nothing to keep", async () => {
    respondWith({ status: 500, ok: false });
    const hook = renderAsk();
    await ask(hook);

    act(() => hook.result.current.stop());

    expect(hook.result.current.status).toBe("idle");
  });

  it("aborts the in-flight request", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
        signals.push(init.signal);
        return { status: 200, ok: true, headers: { get: () => null }, body: streamOf("Answer.") };
      }),
    );
    const hook = renderAsk();
    await ask(hook);

    act(() => hook.result.current.stop());

    expect(signals[0]?.aborted).toBe(true);
  });

  it("stays silent when the abort lands mid-stream", async () => {
    // An abort is the visitor's own doing, so it must not paint an error.
    respondWith({ body: failingStream(abortError()) });
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.error).toBeNull();
  });

  it("stays silent when the abort lands before the response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw abortError();
      }),
    );
    const hook = renderAsk();

    await ask(hook);

    expect(hook.result.current.error).toBeNull();
  });

  it("abandons the first question when a second one is asked", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
        signals.push(init.signal);
        return { status: 200, ok: true, headers: { get: () => null }, body: streamOf("Answer.") };
      }),
    );
    const hook = renderAsk();

    await ask(hook, "first");
    await ask(hook, "second");

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it("aborts whatever is in flight when the menu unmounts", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
        signals.push(init.signal);
        return { status: 200, ok: true, headers: { get: () => null }, body: streamOf("Answer.") };
      }),
    );
    const hook = renderAsk();
    await ask(hook);

    hook.unmount();

    // Closing ⌘K mid-answer must not leave a request writing into a dead component.
    expect(signals[0]?.aborted).toBe(true);
  });
});

describe("useAskAgent: the query box", () => {
  it("holds the typed query separately from the submitted one", async () => {
    respondWith();
    const hook = renderAsk();

    act(() => hook.result.current.setQuery("half-typed"));
    expect(hook.result.current.query).toBe("half-typed");
    expect(hook.result.current.submitted).toBeNull();

    await ask(hook, "the real question");
    // The box keeps its text while the answer streams, so the visitor can edit and re-ask.
    expect(hook.result.current.query).toBe("half-typed");
    expect(hook.result.current.submitted).toBe("the real question");
  });

  it("posts the query as JSON to the chat route", async () => {
    respondWith();
    const hook = renderAsk();

    await ask(hook, "what is the stack?");

    expect(fetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "what is the stack?" }),
      }),
    );
  });
});
