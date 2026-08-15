import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setWorldMode } from "./store";
import { resolveWorldMode, useWorldPalette, worldPalettes } from "./materials";

describe("resolveWorldMode", () => {
  it("maps the light theme to the day world", () => {
    expect(resolveWorldMode("light")).toBe("day");
  });

  it("defaults dark and unknown themes to the night world", () => {
    expect(resolveWorldMode("dark")).toBe("night");
    expect(resolveWorldMode(undefined)).toBe("night");
  });
});

describe("worldPalettes", () => {
  it("preserves the authored night look", () => {
    expect(worldPalettes.night.background).toBe("#05080b");
    expect(worldPalettes.night.neonIntensity).toBe(1);
  });

  it("brightens light and dims neon in the day palette", () => {
    expect(worldPalettes.day.ambientIntensity).toBeGreaterThan(
      worldPalettes.night.ambientIntensity,
    );
    expect(worldPalettes.day.neonIntensity).toBeLessThan(worldPalettes.night.neonIntensity);
    expect(worldPalettes.day.ceilingLightIntensity).toBeLessThan(
      worldPalettes.night.ceilingLightIntensity,
    );
  });
});

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
