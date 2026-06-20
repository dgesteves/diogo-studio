import { describe, expect, it } from "vitest";
import { resolveWorldMode, worldPalettes } from "./world-theme";

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
  });
});
