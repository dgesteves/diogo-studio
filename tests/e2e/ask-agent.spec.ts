import type { Locator, Page } from "@playwright/test";
import { routes } from "@/constants/routes";
import type { AgentCitation, AgentSourcesPayload } from "@/schemas/agent";
import { expect, test } from "./fixtures";

/**
 * The client half of `/api/chat`. `app/api/chat/route.test.ts` already asserts all seven
 * response branches and their headers in milliseconds, so nothing here re-checks a
 * payload — this asserts only what a browser adds: that the bytes reach the DOM as an
 * answer, that the sources header becomes clickable citations that navigate, and that
 * each failure branch produces something a visitor can actually read.
 *
 * The route is mocked rather than hit for real: a live call needs `OPENAI_API_KEY`, costs
 * money, and returns different prose every time. What is under test is the reader, not
 * the model.
 *
 * Two branches are deliberately absent. A refusal is indistinguishable from a normal
 * answer in this UI — `AskAnswerSurface` has no branch for it, so the only observable is
 * the server's own text, which `route.test.ts` owns. And the 400s cannot be reached from
 * here at all: the form refuses to submit an empty query, and the input caps at 600
 * characters, which is the schema's limit.
 */
test.describe("Ask the agent", () => {
  test("streams an answer and turns the sources header into citations", async ({ page }) => {
    await mockChat(page, {
      body: "He led the design system at Diligent [1], then agentic UX at Fueled [2].",
      sources: {
        citations: [
          citation(1, { sourceTitle: "Design system at scale", sourceKind: "case-study" }),
          citation(2, { sourceTitle: "Agentic UX in production", sourceKind: "essay" }),
        ],
        retrieval: "cosine",
        refused: false,
      },
    });

    const dialog = await openAsk(page);
    await askFor(page, "What has he shipped?");

    await expect(dialog).toContainText("He led the design system at Diligent");

    // The markers become real buttons, not decoration — that is the difference between a
    // cited answer and an answer that looks cited.
    await expect(
      dialog.getByRole("button", { name: "Open source 1: Design system at scale" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Open source 2: Agentic UX in production" }),
    ).toBeVisible();

    await expect(dialog.getByText("Sources")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /design system at scale/i })).toHaveCount(2);
    await expect(dialog.getByText("Embedded", { exact: true })).toBeVisible();
  });

  test("labels a keyword-scored answer as such", async ({ page }) => {
    // With no `OPENAI_API_KEY` the site degrades to BM25, and saying so is the point of
    // the badge: the visitor can tell they got the lesser retrieval path.
    await mockChat(page, {
      body: "Matched on terms alone [1].",
      sources: { citations: [citation(1)], retrieval: "keyword", refused: false },
    });

    const dialog = await openAsk(page);
    await askFor(page, "stack");

    // Exact, because the badge is one word and an answer that happened to use it would
    // otherwise satisfy this test — which is how the first draft of it passed for the
    // wrong reason.
    await expect(dialog.getByText("Keyword", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Embedded", { exact: true })).toHaveCount(0);
  });

  test("a citation navigates to the cited page, anchor and all, and closes the menu", async ({
    page,
  }) => {
    await mockChat(page, {
      body: "See the write-up [1].",
      sources: {
        citations: [citation(1, { href: `${routes.caseStudies}#diligent` })],
        retrieval: "cosine",
        refused: false,
      },
    });

    const dialog = await openAsk(page);
    await askFor(page, "case studies");

    await dialog.getByRole("button", { name: /open source 1/i }).click();

    // `asInternalHref` is what stands between LLM output and `router.push`, and the anchor
    // surviving it is the part a type cannot check.
    await expect(page).toHaveURL(new RegExp(`${routes.caseStudies}#diligent$`));
    await expect(dialog).toBeHidden({ timeout: 30_000 });
  });

  test("says so when the agent is rate limited", async ({ page }) => {
    await mockChat(page, { status: 429, body: "Too many questions. Try again in a minute." });

    const dialog = await openAsk(page);
    await askFor(page, "again and again");

    await expect(dialog.getByRole("alert")).toHaveText(
      "Too many questions. Try again in a minute.",
    );
  });

  test("shows the keyword-only fallback when the agent is unconfigured", async ({ page }) => {
    // 503 is not an error state in the UI: with no API key the route still answers with
    // the matches it found, and that text is the answer rather than an alert.
    await mockChat(page, {
      status: 503,
      body: "The agent is not configured, but these pages match your question.",
    });

    const dialog = await openAsk(page);
    await askFor(page, "design systems");

    await expect(dialog).toContainText("these pages match your question");
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  });

  test("says so when the agent cannot be reached at all", async ({ page }) => {
    await page.route("**/api/chat", (route) => route.abort("failed"));

    const dialog = await openAsk(page);
    await askFor(page, "anything");

    await expect(dialog.getByRole("alert")).toContainText(/couldn't reach the agent/i);
  });

  test("stopping a slow answer returns the visitor to the suggestions", async ({ page }) => {
    // Held open rather than sent, which is the only way to observe the streaming state:
    // `route.fulfill` delivers a body in one piece, so the wait has to be on the server
    // side of the mock.
    await page.route("**/api/chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4_000));
      await route.fulfill({ status: 200, body: "too late" });
    });

    const dialog = await openAsk(page);
    await askFor(page, "something slow");

    await expect(dialog.getByText(/reading the indexed material/i)).toBeVisible();

    await dialog.getByRole("button", { name: /stop generating/i }).click();

    // `stop()` falls back to `idle` when nothing has streamed yet, and idle is the
    // suggestions view — so the visitor lands somewhere useful rather than on a dead panel.
    await expect(dialog.getByText(/design-system thesis/i)).toBeVisible();
    await expect(dialog.getByText(/reading the indexed material/i)).toBeHidden();
  });
});

/** The hero CTA opens straight into Ask mode, which is one step instead of two. */
async function openAsk(page: Page): Promise<Locator> {
  await page.goto(routes.home);
  await page.getByRole("button", { name: /ask the agent about diogo/i }).press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(/question for the agent/i)).toBeFocused();
  return dialog;
}

async function askFor(page: Page, question: string): Promise<void> {
  await page.getByLabel(/question for the agent/i).fill(question);
  await page.keyboard.press("Enter");
}

type ChatResponse = {
  status?: number;
  body: string;
  sources?: AgentSourcesPayload;
};

async function mockChat(page: Page, response: ChatResponse): Promise<void> {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: response.status ?? 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        // The same unicode-safe base64 the route emits: JSON to UTF-8 bytes to base64,
        // which is what `decodeAgentSources` reverses. Plain `btoa` would throw on the
        // accented source titles the real corpus contains.
        ...(response.sources
          ? { "x-agent-sources": Buffer.from(JSON.stringify(response.sources)).toString("base64") }
          : {}),
      },
      body: response.body,
    }),
  );
}

function citation(marker: number, overrides: Partial<AgentCitation> = {}): AgentCitation {
  return {
    marker,
    chunkId: `chunk-${marker}`,
    sourceKind: "case-study",
    sourceTitle: `Source ${marker}`,
    href: routes.work,
    ...overrides,
  };
}
