import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { worldPalettes } from "@/config/world-theme";
import { setWorldMode } from "@/stores/world-theme-store";
import { useWorldPalette } from "./use-world-palette";

function Probe(): ReactElement {
  const palette = useWorldPalette();
  return <span data-testid="background">{palette.background}</span>;
}

describe("useWorldPalette", () => {
  it("re-renders the consumer when the world switches to day and back", () => {
    render(<Probe />);

    expect(screen.getByTestId("background")).toHaveTextContent(worldPalettes.night.background);

    // The store is the only writer, so subscribing through it is what makes the whole
    // lighting rig respond to the theme toggle without prop drilling.
    act(() => {
      setWorldMode("day");
    });
    expect(screen.getByTestId("background")).toHaveTextContent(worldPalettes.day.background);

    act(() => {
      setWorldMode("night");
    });
    expect(screen.getByTestId("background")).toHaveTextContent(worldPalettes.night.background);
  });
});
