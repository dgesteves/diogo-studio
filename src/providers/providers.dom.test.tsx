import type { ReactElement, ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { click } from "@tests/interactions";
import { restoreMediaStubs, stubMatchMedia, stubNetworkConnection } from "@tests/media";
import { persistOverride } from "@/stores/reduced-motion-store";
import { AppProviders } from "./index";
import { ReducedMotionProvider, useReducedMotionPreference } from "./reduced-motion-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * `reducedMotion` decides whether this site animates at all, and `AGENTS.md` makes reduced
 * motion a real path rather than a degraded one. It is derived from three independent
 * sources — the OS media query, a low-power connection, and the visitor's own toggle — so
 * what matters here is the precedence between them.
 *
 * It used to also assert that Motion and Lenis obeyed the result. Both were deleted in the
 * refactor's first phase: `MotionConfig` configured a library with no animated components,
 * and Lenis substituted a permanent rAF loop for the native `scroll-behavior: smooth` it
 * disabled. What consumes the preference now is the world (which does not mount at all under
 * reduced motion, asserted in `world-stage.dom.test.tsx` and `reduced-motion.spec.ts`) and
 * the CSS media query in `globals.css`.
 */

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

function withPreference(children: ReactNode): ReactElement {
  return <ReducedMotionProvider>{children}</ReducedMotionProvider>;
}

function read(testId: string): string {
  return screen.getByTestId(testId).textContent ?? "";
}

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
  it("wires the whole tree, so a page reads both the theme and the preference", () => {
    // Set the override first: the fallback in `useReducedMotionPreference` reports full
    // motion, so asserting the default would pass even with the provider removed here.
    persistOverride(true);

    render(
      <AppProviders>
        <Preference />
      </AppProviders>,
    );

    expect(read("reduced-motion")).toBe("true");
    // The theme resolves through the same tree; a missing ThemeProvider leaves no class.
    expect(document.documentElement).toHaveClass("light");
  });
});
