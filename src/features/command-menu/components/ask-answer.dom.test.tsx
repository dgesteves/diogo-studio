import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AgentCitation } from "@/chat-contract";
import type { AskStatus, RetrievalMode } from "../types";
import { AskAnswerSurface } from "./ask-answer-surface";

/**
 * What the visitor reads once the agent answers. `ask-agent.dom.test.tsx` owns the states
 * the hook can be in; this owns how each one renders, and the markup rules that make model
 * output safe: an answer is text, a citation marker only becomes a control when the server
 * sent a source for it, and a link in the answer is either an internal route, a fragment or
 * an http(s)/mailto URL — never anything else.
 */

const CITATION: AgentCitation = {
  marker: 1,
  chunkId: "case-studies-1",
  sourceKind: "career",
  sourceTitle: "Rebuilding the checkout",
  href: "/case-studies#checkout",
};

type SurfaceProps = {
  question: string | null;
  answer: string;
  citations: AgentCitation[];
  status: AskStatus;
  error: string | null;
  retrieval: RetrievalMode | null;
  reducedMotion: boolean;
  onCitation: (href: string) => void;
};

function renderSurface(overrides: Partial<SurfaceProps> = {}): SurfaceProps {
  const props: SurfaceProps = {
    question: null,
    answer: "",
    citations: [],
    status: "idle",
    error: null,
    retrieval: null,
    reducedMotion: false,
    onCitation: vi.fn(),
    ...overrides,
  };
  render(<AskAnswerSurface {...props} />);
  return props;
}

/** The answer is rendered as it streams, so it has to be announced as it grows. */
function liveRegionAround(text: string | RegExp): HTMLElement | null {
  return screen.getByText(text).closest('[aria-live="polite"]');
}

describe("Ask answer: the states the visitor sees", () => {
  it("echoes the submitted question above the answer", () => {
    renderSurface({ question: "what is the stack?", answer: "Next.js.", status: "done" });

    expect(screen.getByText("what is the stack?")).toBeInTheDocument();
  });

  it("announces the answer in a polite live region as it streams", () => {
    renderSurface({ answer: "The studio is a 3D portfolio.", status: "streaming" });

    expect(liveRegionAround(/3d portfolio/i)).not.toBeNull();
  });

  it("says it is reading before the first token arrives", () => {
    renderSurface({ status: "streaming" });

    expect(screen.getByText(/reading the indexed material/i)).toBeInTheDocument();
  });

  it("shows nothing at all while idle", () => {
    renderSurface();

    expect(screen.queryByText(/reading the indexed material/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("raises a failure as an alert so a screen reader interrupts", () => {
    renderSurface({ status: "error", error: "Agent error (500). Try navigate mode." });

    expect(screen.getByRole("alert")).toHaveTextContent(/agent error \(500\)/i);
  });

  it("raises the rate-limit message as an alert too", () => {
    renderSurface({ status: "rate-limited", error: "Slow down. Try again in a minute." });

    expect(screen.getByRole("alert")).toHaveTextContent(/slow down/i);
  });

  it("keeps the error state silent when there is no message to show", () => {
    renderSurface({ status: "error", error: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("splits the answer on blank lines so paragraphs are paragraphs", () => {
    renderSurface({ answer: "First point.\n\nSecond point.", status: "done" });

    expect(screen.getByText("First point.")).toBeInTheDocument();
    expect(screen.getByText("Second point.")).toBeInTheDocument();
  });

  it("drops the animations reduced motion asks it to drop", () => {
    // The only observable difference is the utility class that drives the animation, the
    // same way the theme test reads the class next-themes writes: here Tailwind's
    // `animate-spin` *is* the spinning.
    const { unmount } = render(
      <AskAnswerSurface
        question={null}
        answer=""
        citations={[]}
        status="streaming"
        error={null}
        retrieval={null}
        reducedMotion
        onCitation={vi.fn()}
      />,
    );
    expect(screen.getByText(/reading the indexed material/i).firstElementChild).not.toHaveClass(
      "animate-spin",
    );
    unmount();

    renderSurface({ status: "streaming" });
    expect(screen.getByText(/reading the indexed material/i).firstElementChild).toHaveClass(
      "animate-spin",
    );
  });
});

describe("Ask answer: citations", () => {
  it("turns a marker the server sent a source for into a labelled control", async () => {
    const user = userEvent.setup();
    const props = renderSurface({
      answer: "The checkout was rebuilt. [1]",
      citations: [{ ...CITATION, heading: "Outcome" }],
      status: "done",
    });

    const chip = screen.getByRole("button", { name: "Open source 1: Rebuilding the checkout" });
    expect(chip).toHaveAttribute("title", "Rebuilding the checkout · Outcome");

    await user.click(chip);

    expect(props.onCitation).toHaveBeenCalledWith("/case-studies#checkout");
  });

  it("leaves a marker with no matching source as plain text", () => {
    // A chip that resolves to nothing is a dead control, and the model is free to invent
    // a number the server never sent.
    renderSurface({ answer: "As covered elsewhere. [7]", citations: [CITATION], status: "done" });

    expect(screen.getByText("[7]")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open source 7/i })).not.toBeInTheDocument();
  });

  it("lists every source under the answer and opens the one that is picked", async () => {
    const user = userEvent.setup();
    const props = renderSurface({
      answer: "An answer. [1][2]",
      citations: [
        { ...CITATION, heading: "Outcome" },
        {
          marker: 2,
          chunkId: "about-2",
          sourceKind: "site",
          sourceTitle: "About Diogo",
          href: "/about",
        },
      ],
      status: "done",
    });

    const sources = screen.getByRole("list");
    expect(sources).toHaveTextContent("Rebuilding the checkout");
    expect(sources).toHaveTextContent("Outcome");

    // Scoped to the list: the inline chip for the same source is also a button, and the
    // two are different affordances for the same href.
    await user.click(within(sources).getByRole("button", { name: /about diogo/i }));

    expect(props.onCitation).toHaveBeenCalledWith("/about");
  });

  it("says how the sources were retrieved, and what that means", () => {
    renderSurface({ answer: "An answer.", citations: [CITATION], retrieval: "cosine" });

    expect(screen.getByTitle(/cosine similarity/i)).toHaveTextContent("Embedded");
  });

  it("labels a keyword-scored answer as keyword-scored", () => {
    renderSurface({ answer: "An answer.", citations: [CITATION], retrieval: "keyword" });

    expect(screen.getByTitle(/bm25 keyword scoring/i)).toHaveTextContent("Keyword");
  });

  it("shows no retrieval badge when the header did not say", () => {
    renderSurface({ answer: "An answer.", citations: [CITATION], retrieval: null });

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryByTitle(/retrieved by/i)).not.toBeInTheDocument();
  });

  it("shows no source list when there are no citations", () => {
    renderSurface({ answer: "An answer.", status: "done" });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("Ask answer: the markup the model is allowed to produce", () => {
  function renderAnswer(answer: string): void {
    renderSurface({ answer, status: "done" });
  }

  it("emphasises bold spans and sets code in a code element", () => {
    renderAnswer("It uses **React 19** and `useSyncExternalStore` today.");

    expect(screen.getByText("React 19").tagName).toBe("STRONG");
    expect(screen.getByText("useSyncExternalStore").tagName).toBe("CODE");
    expect(screen.getByText(/it uses/i)).toHaveTextContent(
      "It uses React 19 and useSyncExternalStore today.",
    );
  });

  it("links an internal route through the app's own router", () => {
    renderAnswer("See [the case studies](/case-studies#checkout) for detail.");

    expect(screen.getByRole("link", { name: "the case studies" })).toHaveAttribute(
      "href",
      "/case-studies#checkout",
    );
  });

  it("links a fragment on the current page", () => {
    renderAnswer("Jump to [the outcome](#outcome).");

    expect(screen.getByRole("link", { name: "the outcome" })).toHaveAttribute("href", "#outcome");
  });

  it("opens an external link in a new tab without handing it this window", () => {
    renderAnswer("Read [the post](https://example.com/post).");

    const link = screen.getByRole("link", { name: "the post" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("allows a mailto link", () => {
    renderAnswer("Write to [Diogo](mailto:hi@example.com).");

    expect(screen.getByRole("link", { name: "Diogo" })).toHaveAttribute(
      "href",
      "mailto:hi@example.com",
    );
  });

  it.each([
    ["a script URL", "[click me](javascript:alert(1))"],
    ["a data URL", "[click me](data:text/html;base64,PHNjcmlwdD4=)"],
    ["a nonsense scheme", "[click me](wow://what)"],
    ["something that is not a URL at all", "[click me](over there somewhere)"],
    ["a path that is not a route", "[click me](/admin/delete-everything)"],
  ])("renders %s as text, never as a link", (_case, answer) => {
    renderAnswer(answer);

    expect(screen.getByText(/click me/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps the label of a rejected link readable in place", () => {
    renderAnswer("Try [this thing](data:text/plain,hi) instead.");

    expect(screen.getByText(/try this thing instead/i)).toBeInTheDocument();
  });
});
