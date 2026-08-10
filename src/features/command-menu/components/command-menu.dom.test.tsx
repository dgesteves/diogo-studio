import { act, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { click, press } from "@tests/interactions";
import { restoreMediaStubs } from "@tests/media";
import { primaryNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import type { ReactElement } from "react";
import { CommandMenuProvider, useCommandMenu } from "../stores/command-menu-store";
import { CommandMenu } from "./command-menu";

/**
 * The ⌘K surface itself: which view the mode shows, what Navigate offers and where each
 * entry goes, and what Ask does with a question. `command-menu-store.dom.test.tsx` owns the
 * open/close state machine and `ask-agent.dom.test.tsx` the request; `command-menu.spec.ts`
 * drives the same menu in a browser. What is here is what neither of those reaches: every
 * navigation and profile action rather than one of them, the close-then-act ordering that
 * keeps a navigation from happening under a dialog that is still up, and a citation whose
 * href does not resolve to a route.
 */

const { push, setTheme } = vi.hoisted(() => ({ push: vi.fn(), setTheme: vi.fn() }));

const SUGGESTION = "What is Diogo's design-system thesis?";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));

type ResponseStub = {
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
  body: { getReader: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }> } } | null;
  text: () => Promise<string>;
};

function streamOf(text: string): ResponseStub["body"] {
  let sent = false;
  return {
    getReader: () => ({
      read: async () => {
        if (sent) return { done: true };
        sent = true;
        return { done: false, value: new TextEncoder().encode(text) };
      },
    }),
  };
}

function encodeSources(payload: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes));
}

function answerWith(text: string, sources?: unknown): ReturnType<typeof vi.fn> {
  const encoded = sources === undefined ? null : encodeSources(sources);
  const fetchMock = vi.fn(async () => ({
    status: 200,
    ok: true,
    headers: { get: (name: string) => (name === "x-agent-sources" ? encoded : null) },
    body: streamOf(text),
    text: async () => "",
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function citation(href: string) {
  return {
    citations: [
      {
        marker: 1,
        chunkId: "case-studies-1",
        sourceKind: "case-study",
        sourceTitle: "Rebuilding the checkout",
        href,
      },
    ],
    retrieval: "cosine",
    refused: false,
  };
}

/**
 * The menu has no `Dialog.Trigger` of its own — the deck button, the hero CTA and ⌘K all
 * open it through the store — so a trigger has to be part of the harness for focus
 * restoration to have anywhere to go back to.
 */
function Opener(): ReactElement {
  const { setOpen } = useCommandMenu();
  return (
    <button type="button" onClick={() => setOpen(true)}>
      Open the menu
    </button>
  );
}

function setup(): UserEvent {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <CommandMenuProvider>
      <Opener />
      <CommandMenu />
    </CommandMenuProvider>,
  );
  return user;
}

/** Returns whether the menu claimed the keystroke, the way the browser would ask. */
function modeShortcut(key: string): boolean {
  const event = new KeyboardEvent("keydown", {
    key,
    metaKey: true,
    cancelable: true,
    bubbles: true,
  });
  act(() => void window.dispatchEvent(event));
  return event.defaultPrevented;
}

async function open(): Promise<UserEvent> {
  const user = setup();
  await press(user, "{Meta>}k{/Meta}");
  return user;
}

async function openAsk(): Promise<UserEvent> {
  const user = await open();
  await press(user, "{Meta>}2{/Meta}");
  return user;
}

/** Selecting anything closes the menu first and acts on the next frame. */
function flushFrame(): void {
  act(() => {
    vi.advanceTimersByTime(16);
  });
}

function dialog(): HTMLElement {
  return screen.getByRole("dialog");
}

function tab(name: RegExp): HTMLElement {
  return screen.getByRole("tab", { name });
}

/** `@tests/interactions`'s `click` looks for a button, and these carry `role="tab"`. */
async function clickTab(user: UserEvent, name: RegExp): Promise<void> {
  const target = tab(name);
  await act(async () => {
    await user.click(target);
  });
}

async function selectOption(user: UserEvent, name: RegExp): Promise<void> {
  const option = screen.getByRole("option", { name });
  await act(async () => {
    await user.click(option);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // Two browser APIs jsdom does not implement and cmdk uses unconditionally: it measures
  // its list with a ResizeObserver, and keeps the active item in view.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  // `unstubAllGlobals` also drops the `matchMedia` stub `vitest.setup.ts` installs, which
  // every later spec in this file would then be missing.
  restoreMediaStubs();
  push.mockReset();
  setTheme.mockReset();
});

describe("⌘K menu: the shell", () => {
  it("is not in the document until it is opened", async () => {
    const user = setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await press(user, "{Meta>}k{/Meta}");

    expect(dialog()).toBeInTheDocument();
  });

  it("names the mode it is in, for anyone who cannot see which view is up", async () => {
    const user = await open();
    expect(screen.getByRole("dialog", { name: /^command menu$/i })).toBeInTheDocument();

    await press(user, "{Meta>}2{/Meta}");

    expect(screen.getByRole("dialog", { name: /ask the inspector agent/i })).toBeInTheDocument();
  });

  it("switches mode from the tabs as well as the shortcut", async () => {
    // The tabs are the only route into Ask for a pointer visitor.
    const user = await open();

    await clickTab(user, /ask/i);

    expect(tab(/ask/i)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/question for the agent/i)).toBeInTheDocument();

    await clickTab(user, /navigate/i);

    expect(tab(/navigate/i)).toHaveAttribute("aria-selected", "true");
  });

  it("comes back from Ask to Navigate, and keeps the shortcut from the browser", async () => {
    const user = await openAsk();
    expect(tab(/ask/i)).toHaveAttribute("aria-selected", "true");

    // ⌘1 and ⌘2 are the browser's own tab shortcuts, so the menu has to claim them; the
    // events are dispatched by hand because user-event cannot report defaultPrevented.
    expect(modeShortcut("1")).toBe(true);
    expect(tab(/navigate/i)).toHaveAttribute("aria-selected", "true");
    expect(modeShortcut("2")).toBe(true);
    expect(tab(/ask/i)).toHaveAttribute("aria-selected", "true");

    await press(user, "{Escape}");
  });

  it("returns focus to whatever opened it", async () => {
    // WCAG 2.4.3, and the reason `restoreOpenerFocus` exists: Radix skips its own
    // restoration without a `Dialog.Trigger`, which this menu deliberately does not have.
    const user = setup();
    const opener = screen.getByRole("button", { name: /open the menu/i });
    opener.focus();

    await click(user, /open the menu/i);
    expect(screen.getByPlaceholderText(/type a command, page, or question/i)).toHaveFocus();

    await press(user, "{Escape}");

    expect(opener).toHaveFocus();
  });

  it("leaves an unmodified digit to the search box", async () => {
    const user = await open();

    await act(async () => {
      await user.keyboard("2");
    });

    // Typing "2" while filtering must not throw the visitor into Ask mode.
    expect(tab(/navigate/i)).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText(/type a command, page, or question/i)).toHaveValue("2");
  });

  it("stops answering the mode shortcut once it is closed", async () => {
    const user = await open();

    await press(user, "{Escape}");
    await press(user, "{Meta>}2{/Meta}");
    await press(user, "{Meta>}k{/Meta}");

    // A listener left behind would reopen the menu mid-conversation in Ask mode.
    expect(tab(/navigate/i)).toHaveAttribute("aria-selected", "true");
  });
});

describe("⌘K menu: Navigate mode", () => {
  it("offers home and every primary destination, each labelled with its path", async () => {
    await open();

    const pages = screen.getByRole("group", { name: /pages/i });
    expect(within(pages).getByRole("option", { name: /^home\s*\/$/i })).toBeInTheDocument();
    for (const item of primaryNav) {
      expect(
        within(pages).getByRole("option", {
          name: new RegExp(`${item.label}\\s*${item.href}`, "i"),
        }),
      ).toBeInTheDocument();
    }
  });

  it("closes before it navigates, so nothing routes under an open dialog", async () => {
    const user = await open();

    await selectOption(user, /^home\s*\/$/i);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    flushFrame();

    expect(push).toHaveBeenCalledWith("/");
  });

  it.each(primaryNav.map((item) => [item.label, item.href] as const))(
    "sends %s to %s",
    async (label, href) => {
      // Data-driven on purpose: a destination that renders but pushes a neighbor's route is
      // exactly the kind of drift a single spot-checked item hides.
      const user = await open();

      await selectOption(user, new RegExp(`${label}\\s*${href}`, "i"));
      flushFrame();

      expect(push).toHaveBeenCalledWith(href);
    },
  );

  it.each([
    ["Light theme", "light"],
    ["Dark theme", "dark"],
    ["Follow system", "system"],
  ])("applies %s", async (label, theme) => {
    const user = await open();

    await selectOption(user, new RegExp(label, "i"));
    flushFrame();

    expect(setTheme).toHaveBeenCalledWith(theme);
  });

  it.each([
    ["LinkedIn", siteConfig.links.linkedin],
    ["GitHub", siteConfig.links.github],
  ])("opens %s in a new tab without handing it this window", async (label, url) => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    const user = await open();

    await selectOption(user, new RegExp(label, "i"));
    flushFrame();

    // Without `noopener` the opened page can reach back through `window.opener`.
    expect(openSpy).toHaveBeenCalledWith(url, "_blank", "noopener,noreferrer");
  });

  it("hands the email address to the mail client, and shows which one it is", async () => {
    // `location` is stubbed because a real assignment makes jsdom log "Not implemented:
    // navigation to another Document", and stderr output counts as a failure here.
    const hrefs: string[] = [];
    vi.stubGlobal("location", {
      get href(): string {
        return "";
      },
      set href(value: string) {
        hrefs.push(value);
      },
    });
    const user = await open();

    expect(
      screen.getByRole("option", { name: new RegExp(`email\\s*${siteConfig.email}`, "i") }),
    ).toBeInTheDocument();

    await selectOption(user, /^email/i);
    flushFrame();

    expect(hrefs).toEqual([`mailto:${siteConfig.email}`]);
  });
});

describe("⌘K menu: Ask mode", () => {
  it("puts the cursor in the question box on arrival", async () => {
    // The dialog focuses itself first, so the box claims focus a frame later. Radix
    // remounts this view every time the menu opens, which is what makes mounting the right
    // moment — there is no reopen that skips it.
    await openAsk();

    flushFrame();

    expect(screen.getByLabelText(/question for the agent/i)).toHaveFocus();
  });

  it("shows the suggestions first, and asks the one that is picked", async () => {
    const fetchMock = answerWith("A design system is infrastructure.");
    const user = await openAsk();

    await click(user, /design-system thesis/i);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ body: JSON.stringify({ query: SUGGESTION }) }),
    );
    expect(screen.getByText(/design system is infrastructure/i)).toBeInTheDocument();
    expect(screen.queryByText(/try one of these/i)).not.toBeInTheDocument();
  });

  it("asks the typed question when the form is submitted", async () => {
    const fetchMock = answerWith("Next.js 16, React 19 and three.js.");
    const user = await openAsk();

    await act(async () => {
      await user.type(
        screen.getByLabelText(/question for the agent/i),
        "what is the stack?{Enter}",
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ body: JSON.stringify({ query: "what is the stack?" }) }),
    );
    expect(screen.getByText(/next\.js 16/i)).toBeInTheDocument();
  });

  it("sends nothing at all for a blank question", async () => {
    const fetchMock = answerWith("Never asked.");
    const user = await openAsk();

    await act(async () => {
      await user.type(screen.getByLabelText(/question for the agent/i), "   {Enter}");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/try one of these/i)).toBeInTheDocument();
  });

  it("offers a way to stop an answer, and only while one is arriving", async () => {
    let release: ((response: ResponseStub) => void) | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<ResponseStub>((resolve) => (release = resolve))),
    );
    const user = await openAsk();
    expect(screen.queryByRole("button", { name: /stop generating/i })).not.toBeInTheDocument();

    await click(user, /design-system thesis/i);
    expect(screen.getByRole("button", { name: /stop generating/i })).toBeInTheDocument();

    await act(async () => {
      release?.({
        status: 200,
        ok: true,
        headers: { get: () => null },
        body: streamOf("An answer."),
        text: async () => "",
      });
    });

    expect(screen.queryByRole("button", { name: /stop generating/i })).not.toBeInTheDocument();
  });

  it("follows a citation to the cited page, closing the menu on the way", async () => {
    answerWith("The checkout was rebuilt. [1]", citation("/case-studies#checkout"));
    const user = await openAsk();
    await click(user, /design-system thesis/i);

    await click(user, /open source 1/i);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    flushFrame();
    expect(push).toHaveBeenCalledWith("/case-studies#checkout");
  });

  it("goes nowhere when a citation's href is not a route of this site", async () => {
    // The chip's href comes from the model's own answer via the server's citation list;
    // anything that is not an internal route must be inert rather than a navigation.
    answerWith("As published elsewhere. [1]", citation("https://example.com/post"));
    const user = await openAsk();
    await click(user, /design-system thesis/i);

    await click(user, /open source 1/i);
    flushFrame();

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
