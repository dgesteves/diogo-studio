import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { click } from "@tests/interactions";
import { CommandMenu, CommandMenuProvider } from "@/features/command-menu";
import { ReducedMotionProvider } from "@/providers/reduced-motion-provider";
import { getExploreSnapshot } from "@/stores/explore-store";
import { persistOverride } from "@/stores/reduced-motion-store";
import { getWorldSnapshot } from "@/stores/world-store";
import { stationIndex } from "../../constants/station-index";
import { CommandDeck } from "./command-deck";
import { DeckComms } from "./deck-comms";
import { DeckControls } from "./deck-controls";
import { ExploreHud } from "./explore-hud";

/**
 * The command deck: the studio's whole navigation surface for anyone who is not going to
 * click a sign inside the canvas. `world.spec.ts` proves a visitor can reach all 17
 * destinations through it in a browser, so what is here is what a browser cannot show —
 * the state each control reports before and after it is used, what the deck hands to the
 * world when a destination is merely pointed at, and the pre-hydration render, where
 * guessing the theme would be a hydration mismatch.
 */

const nav = vi.hoisted(() => ({ pathname: "/" }));
const theme = vi.hoisted(() => ({ resolved: "light", setTheme: vi.fn() }));
const audio = vi.hoisted(() => ({ enabled: false, toggle: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolved, setTheme: theme.setTheme }),
}));
vi.mock("@/features/audio", () => ({
  useAudio: () => ({ enabled: audio.enabled, toggle: audio.toggle }),
}));

function withProviders(children: ReactElement): ReactElement {
  return (
    <ReducedMotionProvider>
      <CommandMenuProvider>{children}</CommandMenuProvider>
    </ReducedMotionProvider>
  );
}

function renderDeck(): UserEvent {
  const user = userEvent.setup();
  render(
    withProviders(
      <>
        <CommandDeck />
        <CommandMenu />
      </>,
    ),
  );
  return user;
}

function renderControls(): UserEvent {
  const user = userEvent.setup();
  render(withProviders(<DeckControls />));
  return user;
}

async function openMap(user: UserEvent): Promise<HTMLElement> {
  await click(user, /open studio map/i);
  return screen.getByRole("dialog", { name: /navigate the studio/i });
}

function mapTrigger(): HTMLElement {
  return screen.getByRole("button", { name: /open studio map/i });
}

function hovered(): string | null {
  return getWorldSnapshot().hovered;
}

beforeEach(() => {
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
  nav.pathname = "/";
  theme.resolved = "light";
  audio.enabled = false;
});

describe("Command deck: the controls", () => {
  it("opens the command menu, and opens it in Ask mode from the agent button", async () => {
    const user = renderDeck();

    await click(user, /open command menu/i);
    expect(screen.getByPlaceholderText(/type a command, page, or question/i)).toBeInTheDocument();

    await act(async () => {
      await user.keyboard("{Escape}");
    });

    // Two entry points, two modes: the sparkle skips Navigate entirely.
    await click(user, /ask the studio agent/i);
    expect(screen.getByLabelText(/question for the agent/i)).toBeInTheDocument();
  });

  it("labels the sound control by what pressing it will do", async () => {
    const user = renderControls();

    const play = screen.getByRole("button", { name: /play ambient studio audio/i });
    expect(play).toHaveAttribute("aria-pressed", "false");

    await click(user, /play ambient studio audio/i);
    expect(audio.toggle).toHaveBeenCalledOnce();

    audio.enabled = true;
    renderControls();

    const mute = screen.getByRole("button", { name: /mute ambient studio audio/i });
    expect(mute).toHaveAttribute("aria-pressed", "true");
  });

  it("does not guess the theme before it knows the answer", () => {
    // The server has no theme to report, so the icon and the label must both be neutral
    // until `useIsClient` flips — otherwise the first paint contradicts the second.
    theme.resolved = "dark";
    const html = renderToStaticMarkup(withProviders(<DeckControls />));

    expect(html).toContain('aria-label="Switch to dark theme"');
    expect(html).not.toContain("lucide-sun");
    expect(html).not.toContain("lucide-moon-star");
  });

  it.each([
    ["dark", "light"],
    ["light", "dark"],
  ])("offers the theme a %s visitor does not have", async (resolved, offered) => {
    theme.resolved = resolved;
    const user = renderControls();

    await click(user, new RegExp(`switch to ${offered} theme`, "i"));

    expect(theme.setTheme).toHaveBeenCalledWith(offered);
  });

  it("toggles the performance overlay and says which way it will go", async () => {
    const user = renderControls();

    const open = screen.getByRole("button", { name: /open the performance inspector overlay/i });
    expect(open).toHaveAttribute("aria-pressed", "false");

    await click(user, /open the performance inspector overlay/i);

    expect(
      screen.getByRole("button", { name: /close the performance inspector overlay/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("turns explore mode on, and names the keys it takes over", async () => {
    const user = renderControls();

    const enter = screen.getByRole("button", { name: /explore the studio — move with wasd/i });
    expect(enter).toHaveAttribute("aria-pressed", "false");
    expect(getExploreSnapshot()).toBe(false);

    await click(user, /explore the studio/i);

    expect(getExploreSnapshot()).toBe(true);
    expect(screen.getByRole("button", { name: /exit explore mode/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not offer explore mode at all under reduced motion", () => {
    // Explore is a free-flight camera; there is no reduced version of it to offer, and a
    // control that appears and then does nothing is worse than its absence.
    act(() => persistOverride(true));
    renderControls();

    expect(screen.queryByRole("button", { name: /explore/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open command menu/i })).toBeInTheDocument();
  });
});

describe("Command deck: the radar", () => {
  it("names the station the visitor is on, and how many there are", () => {
    nav.pathname = "/stack";
    render(withProviders(<CommandDeck />));

    const trigger = screen.getByRole("button", {
      name: new RegExp(`open studio map — ${stationIndex.length} destinations`, "i"),
    });
    // Derived from the path, so a deep link into a station still reads correctly.
    expect(trigger).toHaveTextContent("Stack");
  });

  it("falls back to the studio itself for a path that is no station", () => {
    nav.pathname = "/not-a-route";
    render(withProviders(<CommandDeck />));

    expect(mapTrigger()).toHaveTextContent("Studio");
  });

  it("opens the studio map, reports that it is expanded, and closes again", async () => {
    const user = renderDeck();
    // Held by reference: Radix hides the rest of the document from assistive technology
    // while the dialog is up, so the trigger is deliberately not queryable meanwhile.
    const trigger = mapTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    const map = await openMap(user);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(map).getByRole("navigation", { name: /all studio destinations/i })).toBeVisible();

    await click(user, /close studio map/i);

    expect(screen.queryByRole("dialog", { name: /navigate the studio/i })).not.toBeInTheDocument();
    expect(mapTrigger()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Studio map: what the world is told", () => {
  it("lights up the station the pointer is over, and lets go of it", async () => {
    // The radar and the map plot both read `hovered`, which is how pointing at a name in
    // the list highlights the same station in the world.
    const user = renderDeck();
    const map = await openMap(user);
    const index = within(map).getByRole("navigation", { name: /all studio destinations/i });
    const link = within(index).getByRole("link", { name: "Case studies" });

    await act(async () => {
      await user.hover(link);
    });
    expect(hovered()).toBe("caseStudies");

    // Moved onto the dialog's own title rather than off the document: Radix takes pointer
    // events away from `body` while a modal is open, which is what a real visitor's pointer
    // meets too.
    await act(async () => {
      await user.hover(within(map).getByRole("heading", { name: /navigate the studio/i }));
    });
    expect(hovered()).toBeNull();
  });

  it("does the same on the plot, for the pointer and for the keyboard", async () => {
    const user = renderDeck();
    const map = await openMap(user);
    // The plot's stations are positioned dots whose labels only appear on hover, so focus
    // has to do exactly what hover does or a keyboard visitor never sees a name.
    const [dot] = within(map).getAllByRole("link", { name: "Timeline" });
    expect(dot).toBeDefined();

    act(() => dot?.focus());
    expect(hovered()).toBe("timeline");

    act(() => dot?.blur());
    expect(hovered()).toBeNull();

    if (!dot) return;
    await act(async () => {
      await user.hover(dot);
    });
    expect(hovered()).toBe("timeline");

    await act(async () => {
      await user.hover(within(map).getByRole("heading", { name: /navigate the studio/i }));
    });
    expect(hovered()).toBeNull();
  });
});

describe("Studio map: choosing a destination", () => {
  it("dismisses itself when a destination is chosen", async () => {
    // The route change belongs to `world.spec.ts`; here the anchor's default action is
    // cancelled, because jsdom answers a real navigation with "Not implemented" on stderr.
    const cancel = (event: Event): void => event.preventDefault();
    document.addEventListener("click", cancel);
    const user = renderDeck();
    const map = await openMap(user);
    const index = within(map).getByRole("navigation", { name: /all studio destinations/i });

    await act(async () => {
      await user.click(within(index).getByRole("link", { name: "Uses" }));
    });
    document.removeEventListener("click", cancel);

    // Left open, the map would cover the page it just navigated to.
    expect(screen.queryByRole("dialog", { name: /navigate the studio/i })).not.toBeInTheDocument();
  });
});

describe("Studio map: how to get in touch", () => {
  it("offers the email as a mailto and the profiles as safe external links", () => {
    render(<DeckComms />);

    expect(screen.getByRole("link", { name: /@/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
    for (const name of [/linkedin/i, /github/i]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("dates the copyright from the clock, not from a constant", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-06-01T00:00:00Z"));

    render(<DeckComms />);

    expect(screen.getByText(/© 2031/)).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("Explore HUD", () => {
  it("announces the controls, in words, once explore mode is on", async () => {
    const user = renderControls();
    render(<ExploreHud />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await click(user, /explore the studio/i);

    // The visible chrome is aria-hidden, so this announcement is all a screen-reader
    // visitor gets — and it is the only place the key bindings are written down. Queried as
    // an element rather than as the region's text content: text nobody can reach is not an
    // announcement, and `toHaveTextContent` cannot tell the difference.
    const announcement = within(screen.getByRole("status")).getByText(/explore mode on/i);
    expect(announcement).toBeVisible();
    expect(announcement).toHaveTextContent(/move with w, a, s, d/i);
    expect(announcement).toHaveTextContent(/press escape to exit/i);
  });
});
