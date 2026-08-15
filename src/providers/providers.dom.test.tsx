import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { restoreMediaStubs } from "@tests/media";
import { persistOverride, useReducedMotionPreference } from "@/reduced-motion";
import { AppProviders } from "./index";
import { ThemeProvider } from "./theme-provider";

/**
 * What the two providers do *together*. Each one on its own is asserted where it lives —
 * the motion preference and its three sources in `reduced-motion.dom.test.tsx`.
 */

function Preference(): ReactElement {
  const { reducedMotion } = useReducedMotionPreference();
  return <p data-testid="reduced-motion">{String(reducedMotion)}</p>;
}

afterEach(restoreMediaStubs);

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

    expect(screen.getByTestId("reduced-motion")).toHaveTextContent("true");
    // The theme resolves through the same tree; a missing ThemeProvider leaves no class.
    expect(document.documentElement).toHaveClass("light");
  });
});
