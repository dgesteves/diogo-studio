import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { click } from "@tests/interactions";
import GlobalError from "./global-error";
import Loading from "./loading";
import NotFound from "./not-found";
import RouteError from "./error";

/**
 * The four screens a visitor only ever sees when something has gone wrong or is slow. They are
 * easy to leave untested and expensive to get wrong, because nobody looks at them until they are
 * the only thing on screen — and two of them are the site's only error reporting path.
 */

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({ captureException: sentry.captureException }));

/**
 * `GlobalError` renders its own `<html>`, which is correct — it replaces the root layout — and
 * Testing Library can only mount into a `<div>`, so React reports invalid nesting. That is an
 * artifact of the harness rather than of the component, and it is the only console output this
 * file tolerates: anything else is forwarded, so a real warning still fails the zero-stderr rule.
 */
const NESTING = "cannot be a child of";
/* eslint-disable-next-line no-console -- restored in afterEach; see above */
const realError = console.error;

beforeEach(() => {
  sentry.captureException.mockClear();
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(NESTING)) return;
    realError(...args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("not-found", () => {
  it("says what happened and offers the way back", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    // A 404 with no link out is a dead end for anyone who arrived from a stale URL.
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
  });
});

describe("loading", () => {
  /**
   * A spinner is a `div`. Without a live region a screen-reader user gets silence during exactly
   * the moment the page is telling everyone else to wait.
   */
  it("announces itself to assistive technology", () => {
    render(<Loading />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });
});

describe.each([
  ["route error", RouteError, /an unexpected error occurred/i],
  ["global error", GlobalError, /a critical error occurred/i],
])("%s", (_name, Boundary, body) => {
  function boom(digest?: string): Error & { digest?: string } {
    return Object.assign(new Error("kaboom"), digest ? { digest } : {});
  }

  it("tells the visitor what happened", () => {
    render(<Boundary error={boom()} reset={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(body)).toBeInTheDocument();
  });

  /**
   * The only place a production error becomes visible to anyone but the visitor — and it has to
   * be once per error, not once per render. The effect is keyed on `error` for that reason; keyed
   * on nothing, a boundary that re-renders while the error is on screen sends a duplicate event
   * every time, which is how a Sentry quota disappears in an afternoon.
   */
  it("reports the error once, however many times it re-renders", () => {
    const error = boom();

    const { rerender } = render(<Boundary error={error} reset={vi.fn()} />);
    rerender(<Boundary error={error} reset={vi.fn()} />);

    expect(sentry.captureException).toHaveBeenCalledExactlyOnceWith(error);
  });

  /**
   * The digest is the id that ties what the visitor saw to the report. Next only supplies it in
   * production, so the branch that omits it is the one every local reproduction takes.
   */
  it("shows the error id when there is one, and nothing when there is not", () => {
    const { unmount } = render(<Boundary error={boom("f00dfeed")} reset={vi.fn()} />);
    expect(screen.getByText(/error id: f00dfeed/i)).toBeInTheDocument();

    unmount();
    render(<Boundary error={boom()} reset={vi.fn()} />);

    expect(screen.queryByText(/error id/i)).not.toBeInTheDocument();
  });

  it("lets the visitor retry", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<Boundary error={boom()} reset={reset} />);

    await click(user, /try again/i);

    expect(reset).toHaveBeenCalledOnce();
  });
});

describe("global-error", () => {
  /**
   * `global-error.tsx` replaces the root layout rather than rendering inside it, so it has to
   * supply its own document. Without these the page it renders has no `<html>` at all.
   */
  it("renders its own document, because it replaces the root layout", () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error("kaboom")} reset={vi.fn()} />);

    expect(html).toContain("<html");
    expect(html).toContain('lang="en"');
    expect(html).toContain("<body");
  });
});
