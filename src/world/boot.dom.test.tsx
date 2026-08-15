import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { click } from "@tests/interactions";
import { useInspectorOverlay } from "@/features/inspector";
import { persistOverride, ReducedMotionProvider } from "@/reduced-motion";
import {
  BOOT_EXIT_MS,
  BOOT_MAX_MS,
  BOOT_MIN_MS,
  BOOT_READY_LABEL,
  BOOT_STEPS,
  BOOT_SESSION_KEY,
  BOOT_SPLASH_ID,
  BootProgressReporter,
  BootSequence,
  BootSplash,
  BootThemeToggle,
  hasBootedThisSession,
  hideBootSplash,
  markBootedThisSession,
} from "./boot";
import {
  getBootServerSnapshot,
  getBootSnapshot,
  markWorldReady,
  setBootProgress,
  subscribeBoot,
} from "./store";

const audio = vi.hoisted(() => ({ enable: vi.fn() }));
const theme = vi.hoisted(() => ({ resolved: "light", setTheme: vi.fn() }));

// drei's loader store, which is the only thing `BootProgressReporter` reads.
const loader = vi.hoisted(() => ({ progress: 0 }));

vi.mock("@/world/audio", () => ({ useAudio: () => ({ enable: audio.enable }) }));
vi.mock("@react-three/drei", () => ({ useProgress: () => ({ progress: loader.progress }) }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolved, setTheme: theme.setTheme }),
}));

/**
 * The boot gate is a state machine over three timers — BOOT_MIN_MS, BOOT_MAX_MS and
 * BOOT_EXIT_MS — plus the world-ready signal. End-to-end that made it the slowest and
 * least reliable spec in the repo: which button is on screen depends on how fast the
 * machine compiles shaders, and on a 2-vCPU CI runner "Enter the studio" needed longer
 * than 20s to appear. Here the timers are ours, so every branch is asserted in
 * milliseconds against exactly what the visitor sees. E2E keeps only the part that is
 * genuinely end-to-end: a first visit is gated, dismissing it reveals the world, and a
 * reload does not gate again.
 */

const STUDIO_DIALOG = /entering .*studio/i;

const [FIRST_STEP = ""] = BOOT_STEPS;

// `BootLog` repeats every step label as aria-hidden decoration, so a bare text query
// matches twice. Ignoring aria-hidden subtrees asserts the status line a screen reader
// would actually announce.
const VISIBLE_ONLY = { ignore: '[aria-hidden="true"] *' } as const;

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function reachReadyState(): void {
  advance(BOOT_MIN_MS);
  act(() => {
    markWorldReady();
  });
}

/** The overlay's inspector choice is only visible through the store it writes. */
function InspectorProbe(): ReactElement {
  const { open } = useInspectorOverlay();
  return <p data-testid="inspector">{open ? "open" : "closed"}</p>;
}

function renderGate(): UserEvent {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <>
      <BootSequence />
      <InspectorProbe />
    </>,
  );
  return user;
}

function preference(group: RegExp, option: RegExp): HTMLElement {
  return within(screen.getByRole("group", { name: group })).getByRole("button", { name: option });
}

async function choose(user: UserEvent, group: RegExp, option: RegExp): Promise<void> {
  const target = preference(group, option);
  await act(async () => {
    await user.click(target);
  });
}

function inspector(): string {
  return screen.getByTestId("inspector").textContent ?? "";
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  audio.enable.mockClear();
  theme.setTheme.mockClear();
  theme.resolved = "light";
});

describe("Boot gate", () => {
  it("gates a first visit, showing progress and an immediate way past it", () => {
    render(<BootSequence />);

    expect(screen.getByRole("dialog", { name: STUDIO_DIALOG })).toBeInTheDocument();
    expect(screen.getByText(FIRST_STEP, VISIBLE_ONLY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip intro/i })).toBeInTheDocument();
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("holds the visitor for the minimum duration even once the world is ready", () => {
    render(<BootSequence />);

    act(() => {
      markWorldReady();
    });

    // Ready alone is not enough: canEnter is `(ready || forceReady) && minElapsed`, so the
    // splash cannot flash past faster than a person can read it.
    expect(screen.getByRole("button", { name: /skip intro/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enter the studio/i })).not.toBeInTheDocument();

    advance(BOOT_MIN_MS);

    expect(screen.getByRole("button", { name: /enter the studio/i })).toBeInTheDocument();
  });

  it("reports the studio ready at full progress", () => {
    render(<BootSequence />);
    reachReadyState();

    expect(screen.getByText(BOOT_READY_LABEL)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("lets the visitor in even if the world never reports ready", () => {
    render(<BootSequence />);

    advance(BOOT_MAX_MS);

    // The forceReady escape hatch: a device that never finishes compiling must not be
    // trapped behind the splash.
    expect(screen.getByRole("button", { name: /enter the studio/i })).toBeInTheDocument();
  });

  it("dismisses on entry and does not gate again in the same session", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<BootSequence />);
    reachReadyState();

    await click(user, /enter the studio/i);
    advance(BOOT_EXIT_MS);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
    expect(hasBootedThisSession()).toBe(true);

    unmount();
    render(<BootSequence />);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
  });

  it("lets the visitor out through the pre-ready skip control", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<BootSequence />);

    await click(user, /skip intro/i);
    advance(BOOT_EXIT_MS);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
    expect(hasBootedThisSession()).toBe(true);
    // Skipping is not consent to sound: the sound choice is only offered on the ready
    // screen, which a skipping visitor never sees.
    expect(audio.enable).not.toHaveBeenCalled();
  });

  it("skips the gate entirely for a returning visitor", () => {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");

    render(<BootSequence />);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
  });

  it("never gates when reduced motion is set", () => {
    persistOverride(true);

    render(
      <ReducedMotionProvider>
        <BootSequence />
      </ReducedMotionProvider>,
    );

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
  });

  it("hides the server-rendered splash as soon as it takes over", () => {
    // Two overlays at once would double the backdrop; the splash exists only to cover the
    // gap before hydration.
    render(
      <>
        <BootSplash />
        <BootSequence />
      </>,
    );

    expect(document.getElementById(BOOT_SPLASH_ID)?.style.display).toBe("none");
  });

  it("keeps the pre-hydration splash script free of anything but its own constants", () => {
    // The one inline script in the app, and the reason `unsafe-inline` is tolerated: it
    // must only ever read a session key and hide an element by id. See docs/decisions.md.
    const { container } = render(<BootSplash />);
    const inline = container.querySelector("script")?.innerHTML ?? "";

    expect(inline).toContain(BOOT_SESSION_KEY);
    expect(inline).toContain(BOOT_SPLASH_ID);
    expect(inline).not.toMatch(/document\.write|innerHTML|eval|fetch|location/);
  });

  it("cannot be dismissed twice, however fast the visitor is", async () => {
    const user = renderGate();
    reachReadyState();

    await click(user, /enter the studio/i);
    await click(user, /enter the studio/i);

    // The overlay stays on screen for its fade, so the CTA is still there to be pressed —
    // and starting the sound twice is audible.
    expect(audio.enable).toHaveBeenCalledOnce();
  });
});

describe("Boot gate: the preferences it offers", () => {
  it("hands a theme choice straight to the theme provider", async () => {
    const user = renderGate();
    reachReadyState();

    expect(preference(/theme preference/i, /light/i)).toHaveAttribute("aria-pressed", "true");

    await choose(user, /theme preference/i, /dark/i);

    expect(theme.setTheme).toHaveBeenCalledWith("dark");
  });

  it("presses neither theme until it knows which one is resolved", () => {
    // `resolvedTheme` is unknowable on the server, and a pressed segment that flips on
    // hydration is both a mismatch and a lie about what the visitor chose.
    theme.resolved = "dark";

    const html = renderToStaticMarkup(<BootThemeToggle />);
    expect(html).not.toContain('aria-pressed="true"');
  });

  it("enters muted when the visitor asks for silence", async () => {
    const user = renderGate();
    reachReadyState();

    await choose(user, /sound preference/i, /muted/i);
    expect(preference(/sound preference/i, /muted/i)).toHaveAttribute("aria-pressed", "true");

    await click(user, /enter the studio/i);

    // The CTA carries the sound choice, so a muted entry must never touch the engine.
    expect(audio.enable).not.toHaveBeenCalled();
  });

  it("enters with sound when the visitor leaves it on", async () => {
    const user = renderGate();
    reachReadyState();

    await click(user, /enter the studio/i);

    expect(audio.enable).toHaveBeenCalledOnce();
  });

  it("opens the inspector overlay on a default entry", async () => {
    const user = renderGate();
    reachReadyState();

    expect(preference(/inspector preference/i, /^inspector$/i)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(inspector()).toBe("closed");

    await click(user, /enter the studio/i);

    // The preference is applied on entry, not while the gate is still up.
    expect(inspector()).toBe("open");
  });

  it("leaves the inspector overlay closed when the visitor hides it", async () => {
    // Asserted in both directions on purpose: "closed" is also what a control wired to
    // nothing produces.
    const user = renderGate();
    reachReadyState();

    await choose(user, /inspector preference/i, /hidden/i);
    await click(user, /enter the studio/i);

    expect(inspector()).toBe("closed");
  });

  it("lets Escape out of the gate, muted", async () => {
    const user = renderGate();
    reachReadyState();

    await act(async () => {
      await user.keyboard("{Escape}");
    });
    advance(BOOT_EXIT_MS);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
    expect(hasBootedThisSession()).toBe(true);
    expect(audio.enable).not.toHaveBeenCalled();
  });
});

/**
 * The number on the progress bar comes from inside the canvas: drei's loader publishes it,
 * `BootProgressReporter` copies it into the boot store, and the gate reads the store. Nothing
 * else connects the two, so with the reporter missing the bar would sit at 0% until the world
 * reported ready and then jump straight to 100%.
 */
describe("Boot progress", () => {
  function renderWithLoader() {
    return render(
      <>
        <BootProgressReporter />
        <BootSequence />
      </>,
    );
  }

  it("shows the loader's asset progress to the visitor", () => {
    loader.progress = 37.4;

    renderWithLoader();

    expect(screen.getByText("37%")).toBeInTheDocument();
  });

  it("follows the loader as the assets arrive", () => {
    loader.progress = 20;
    const { rerender } = renderWithLoader();
    expect(screen.getByText("20%")).toBeInTheDocument();

    loader.progress = 80;
    act(() => {
      rerender(
        <>
          <BootProgressReporter />
          <BootSequence />
        </>,
      );
    });

    expect(screen.getByText("80%")).toBeInTheDocument();
  });
});

/**
 * Not asserted, deliberately: the overlay's `onInteractOutside` guard. Its content is
 * `fixed inset-0`, so a pointer has nowhere outside to land, and Radix's outside-interaction
 * detection (a deferred `pointerdown`, then a `click`, then a macrotask, weighed against the
 * layer's own surfaces) does not reproduce faithfully in jsdom — a version of this test
 * passed while the guard was deleted. A test that cannot fail is worse than none.
 */

describe("boot progress", () => {
  it("clamps and rounds reported progress", () => {
    setBootProgress(-10);
    expect(getBootSnapshot().progress).toBe(0);

    setBootProgress(150);
    expect(getBootSnapshot().progress).toBe(100);

    setBootProgress(42.6);
    expect(getBootSnapshot().progress).toBe(43);
  });

  it("marks the world ready once", () => {
    expect(getBootSnapshot().ready).toBe(false);
    markWorldReady();
    expect(getBootSnapshot().ready).toBe(true);
  });

  it("notifies subscribers only when the signal changes", () => {
    let calls = 0;
    const unsubscribe = subscribeBoot(() => {
      calls += 1;
    });

    // The loader reports progress on every frame, so re-emitting a rounded value that has
    // not moved would re-render the splash dozens of times per percent.
    setBootProgress(40);
    setBootProgress(40.2);
    markWorldReady();
    markWorldReady();

    unsubscribe();
    setBootProgress(80);

    expect(calls).toBe(2);
  });

  it("reports an unstarted boot on the server", () => {
    setBootProgress(60);
    markWorldReady();

    expect(getBootServerSnapshot()).toEqual({ progress: 0, ready: false });
  });
});

describe("boot session gate", () => {
  it("tracks the once-per-session flag", () => {
    expect(hasBootedThisSession()).toBe(false);
    markBootedThisSession();
    expect(hasBootedThisSession()).toBe(true);
  });

  it("treats unavailable storage as a first visit instead of throwing", () => {
    const denied = new Error("The operation is insecure.");
    // Spy on the prototype, not on `window.sessionStorage`: jsdom's Storage is a proxy
    // that turns a property definition into a stored *key*, so spying on the instance
    // silently does nothing and leaves this test unable to fail.
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw denied;
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw denied;
    });

    // Safari in private mode throws on both. Gating twice is a nuisance; a thrown error
    // during the boot gate would leave the visitor with no world at all.
    expect(() => markBootedThisSession()).not.toThrow();
    expect(hasBootedThisSession()).toBe(false);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("boot splash handoff", () => {
  it("hides the server-rendered splash, and tolerates its absence", () => {
    // The splash is markup in the document head's layout, not React's — the store is what
    // hands over to the client boot sequence.
    const splash = document.createElement("div");
    splash.id = BOOT_SPLASH_ID;
    document.body.append(splash);

    hideBootSplash();
    expect(splash.style.display).toBe("none");

    splash.remove();
    expect(() => hideBootSplash()).not.toThrow();
  });

  it("keys the session flag and the splash element to stable ids", () => {
    // Both values are duplicated where TypeScript cannot see them: `#boot-splash` styles
    // the pre-hydration splash in `styles/globals.css`, and `studio-booted` is written by
    // hand in `tests/e2e/fixtures.ts` to simulate a returning visitor. Renaming either
    // constant silently breaks that copy, so pin them.
    expect(BOOT_SESSION_KEY).toBe("studio-booted");
    expect(BOOT_SPLASH_ID).toBe("boot-splash");
  });
});
