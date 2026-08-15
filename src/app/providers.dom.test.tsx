import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { restoreMediaStubs } from "@tests/media";
import { persistOverride, useReducedMotionPreference } from "@/reduced-motion";
import { AppProviders } from "./providers";

/**
 * What the two providers do *together*, which is the only seam there is now that they are
 * one module: `ThemeProvider` is private to it. The motion preference and its three sources
 * are asserted where they live, in `reduced-motion.dom.test.tsx`.
 */

function Preference(): ReactElement {
  const { reducedMotion } = useReducedMotionPreference();
  return <p data-testid="reduced-motion">{String(reducedMotion)}</p>;
}

afterEach(restoreMediaStubs);

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

    expect(screen.getByTestId("reduced-motion")).toHaveTextContent("true");
    // The theme resolves through the same tree; a missing ThemeProvider leaves no class.
    // `attribute="class"` plus the stubbed "no dark preference" query resolves to light.
    expect(document.documentElement).toHaveClass("light");
  });
});
