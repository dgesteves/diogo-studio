import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReducedMotionProvider } from "@/providers/reduced-motion-provider";
import {
  BOOT_SESSION_KEY,
  hasBootedThisSession,
  markWorldReady,
  resetBoot,
} from "@/stores/boot-store";
import { persistOverride } from "@/stores/reduced-motion-store";
import {
  BOOT_EXIT_MS,
  BOOT_MAX_MS,
  BOOT_MIN_MS,
  BOOT_READY_LABEL,
  BOOT_STEPS,
} from "../constants/boot";
import { BootSequence } from "./boot-sequence";

vi.mock("@/features/audio", () => ({ useAudio: () => ({ enable: vi.fn() }) }));

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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  resetBoot();
  persistOverride(null);
  window.sessionStorage.clear();
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

    await user.click(screen.getByRole("button", { name: /enter the studio/i }));
    advance(BOOT_EXIT_MS);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
    expect(hasBootedThisSession()).toBe(true);

    unmount();
    render(<BootSequence />);

    expect(screen.queryByRole("dialog", { name: STUDIO_DIALOG })).not.toBeInTheDocument();
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
});
