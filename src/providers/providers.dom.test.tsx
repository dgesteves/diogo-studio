import type { ReactElement, ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { useReducedMotionConfig } from "motion/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreMediaStubs, stubMatchMedia, stubNetworkConnection } from "@tests/media";
import { persistOverride } from "@/stores/reduced-motion-store";
import { AppProviders } from "./index";
import { LenisProvider } from "./lenis-provider";
import { MotionProvider } from "./motion-provider";
import { ReducedMotionProvider, useReducedMotionPreference } from "./reduced-motion-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * `reducedMotion` decides whether this site animates at all, and `AGENTS.md` makes reduced
 * motion a real path rather than a degraded one. It is derived from three independent
 * sources — the OS media query, a low-power connection, and the visitor's own toggle — so
 * what matters here is the precedence between them and that both consumers of the result
 * (Motion and Lenis) actually obey it.
 */

type LenisOptions = { anchors?: boolean; smoothWheel?: boolean; easing?: (t: number) => number };

const lenis = vi.hoisted(() => ({
  constructed: 0,
  destroyed: 0,
  frames: 0,
  options: null as LenisOptions | null,
}));

vi.mock("lenis", () => ({
  default: class FakeLenis {
    constructor(options: LenisOptions) {
      lenis.constructed += 1;
      lenis.options = options;
    }
    raf(): void {
      lenis.frames += 1;
    }
    destroy(): void {
      lenis.destroyed += 1;
    }
  },
}));

function Preference(): ReactElement {
  const { reducedMotion, systemReducedMotion, lowPower, override, setOverride } =
    useReducedMotionPreference();
  return (
    <>
      <dl>
        <dt>reducedMotion</dt>
        <dd data-testid="reduced-motion">{String(reducedMotion)}</dd>
        <dt>system</dt>
        <dd data-testid="system">{String(systemReducedMotion)}</dd>
        <dt>lowPower</dt>
        <dd data-testid="low-power">{String(lowPower)}</dd>
        <dt>override</dt>
        <dd data-testid="override">{String(override)}</dd>
      </dl>
      {/* The HUD's motion toggle writes through the context, never the store directly. */}
      <button type="button" onClick={() => setOverride(true)}>
        Reduce motion
      </button>
      <button type="button" onClick={() => setOverride(null)}>
        Follow the system
      </button>
    </>
  );
}

// `useReducedMotionConfig` is what Motion's own components call: it resolves
// MotionConfig's `reducedMotion` first and only then falls back to the OS query. Motion's
// `useReducedMotion` deliberately ignores MotionConfig, so it would report the system
// preference here and say nothing about this provider.
function MotionProbe(): ReactElement {
  return <span data-testid="motion">{String(useReducedMotionConfig())}</span>;
}

function withPreference(children: ReactNode): ReactElement {
  return <ReducedMotionProvider>{children}</ReducedMotionProvider>;
}

function read(testId: string): string {
  return screen.getByTestId(testId).textContent ?? "";
}

// `persistOverride` notifies its `useSyncExternalStore` subscribers synchronously inside
// the click, which user-event does not wrap — the same reason `boot.dom.test.tsx` has this
// helper.
async function click(user: UserEvent, name: RegExp): Promise<void> {
  const target = screen.getByRole("button", { name });
  await act(async () => {
    await user.click(target);
  });
}

beforeEach(() => {
  lenis.constructed = 0;
  lenis.destroyed = 0;
  lenis.frames = 0;
  lenis.options = null;
});

afterEach(restoreMediaStubs);

describe("ReducedMotionProvider", () => {
  it("respects motion by default, when nothing asks for less", () => {
    render(withPreference(<Preference />));

    expect(read("reduced-motion")).toBe("false");
    expect(read("system")).toBe("false");
    expect(read("low-power")).toBe("false");
    expect(read("override")).toBe("null");
  });

  it("follows the system preference, including a change made while the tab is open", () => {
    const media = stubMatchMedia(true);
    render(withPreference(<Preference />));

    expect(read("system")).toBe("true");
    expect(read("reduced-motion")).toBe("true");

    act(() => media.change(false));
    expect(read("reduced-motion")).toBe("false");
  });

  it("reduces motion on a low-power connection", () => {
    stubNetworkConnection({ saveData: true });
    render(withPreference(<Preference />));

    // Save-Data is a request to spend less, and this world's animation budget is GPU time
    // and battery — so the low-power signal has to reach `reducedMotion`, not just report
    // itself.
    expect(read("low-power")).toBe("true");
    expect(read("reduced-motion")).toBe("true");
  });

  it("lets the visitor's own choice win in both directions", () => {
    stubMatchMedia(true);
    render(withPreference(<Preference />));

    // `override ?? (system || lowPower)`: an explicit "animate" must beat the OS, or the
    // world's motion toggle would be a control with no effect.
    act(() => persistOverride(false));
    expect(read("override")).toBe("false");
    expect(read("reduced-motion")).toBe("false");

    act(() => persistOverride(true));
    expect(read("reduced-motion")).toBe("true");

    // Clearing hands the decision back to the system.
    act(() => persistOverride(null));
    expect(read("override")).toBe("null");
    expect(read("reduced-motion")).toBe("true");
  });

  it("persists a choice made through the context, not just through the store", async () => {
    const user = userEvent.setup();
    render(withPreference(<Preference />));

    await click(user, /reduce motion/i);
    expect(read("reduced-motion")).toBe("true");
    // Persisted, so the choice survives a reload rather than only this render.
    expect(window.localStorage.getItem("diogo-studio.reduced-motion")).toBe("true");

    await click(user, /follow the system/i);
    expect(read("override")).toBe("null");
    expect(window.localStorage.getItem("diogo-studio.reduced-motion")).toBeNull();
  });

  it("falls back to full motion outside the provider instead of throwing", () => {
    // Several components read this hook and are also rendered inside the scene, where the
    // provider is not always an ancestor. Throwing there would take down the canvas.
    render(<Preference />);

    expect(read("reduced-motion")).toBe("false");
    expect(read("override")).toBe("null");
  });
});

describe("MotionProvider", () => {
  it("hands the preference to Motion, so every animation obeys it", () => {
    persistOverride(true);
    render(
      withPreference(
        <MotionProvider>
          <MotionProbe />
        </MotionProvider>,
      ),
    );

    expect(read("motion")).toBe("true");
  });

  it("leaves animation enabled when motion is allowed", () => {
    render(
      withPreference(
        <MotionProvider>
          <MotionProbe />
        </MotionProvider>,
      ),
    );

    expect(read("motion")).toBe("false");
  });
});

describe("LenisProvider", () => {
  it("runs smooth scrolling and tears it down on unmount", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount } = render(withPreference(<LenisProvider />));

    expect(lenis.constructed).toBe(1);
    expect(raf).toHaveBeenCalled();

    // Drive one frame by hand: the loop is `lenis.raf(time)` then re-request.
    const [frame] = raf.mock.calls[0] ?? [];
    act(() => frame?.(performance.now()));
    expect(lenis.frames).toBe(1);

    unmount();
    expect(lenis.destroyed).toBe(1);
    expect(cancel).toHaveBeenCalled();

    raf.mockRestore();
    cancel.mockRestore();
  });

  it("takes over in-page anchors with a bounded ease-out", () => {
    render(withPreference(<LenisProvider />));

    // `anchors: true` is why a "skip to content" or footnote link glides instead of
    // jumping; the easing has to start at rest and finish, or the scroll never lands.
    expect(lenis.options).toMatchObject({ anchors: true, smoothWheel: true });
    const easing = lenis.options?.easing;
    expect(easing?.(0)).toBe(0);
    // An exponential ease-out never quite reaches 1 (1 - 2⁻¹⁰), which is close enough that
    // the scroll lands on the anchor.
    expect(easing?.(1)).toBeCloseTo(1, 2);
    expect(easing?.(0.5)).toBeGreaterThan(0.5);
  });

  it("never hijacks scrolling under reduced motion", () => {
    persistOverride(true);

    render(withPreference(<LenisProvider />));

    // Smooth scroll is momentum the visitor did not ask for; it is also a documented
    // accessibility failure. Not constructing it is the only correct behavior.
    expect(lenis.constructed).toBe(0);
  });
});

describe("ThemeProvider", () => {
  it("applies the resolved theme as a class, which is what Tailwind reads", () => {
    render(
      <ThemeProvider>
        <p>themed</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("themed")).toBeInTheDocument();
    // `attribute="class"` plus the stubbed "no dark preference" query resolves to light.
    expect(document.documentElement).toHaveClass("light");
  });
});

describe("AppProviders", () => {
  it("wires the whole tree, so a page can read the preference and raise a toast", () => {
    // Set the override first: the fallback in `useReducedMotionPreference` reports full
    // motion, so asserting the default would pass even with the provider removed here.
    persistOverride(true);

    render(
      <AppProviders>
        <Preference />
        <MotionProbe />
      </AppProviders>,
    );

    expect(read("reduced-motion")).toBe("true");
    expect(read("motion")).toBe("true");
    // Sonner's region is where every toast lands; without it, feedback is silent.
    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });
});
