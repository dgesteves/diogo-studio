import type { WorldMode } from "@/stores/world-theme-store";

export type WorldPalette = {
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  neonIntensity: number;
};

export const worldPalettes: Record<WorldMode, WorldPalette> = {
  night: {
    background: "#05080b",
    fogColor: "#05080b",
    fogNear: 9,
    fogFar: 30,
    bloomIntensity: 0.8,
    bloomLuminanceThreshold: 0.45,
    bloomLuminanceSmoothing: 0.2,
    vignetteOffset: 0.3,
    vignetteDarkness: 0.6,
    ambientIntensity: 0.55,
    hemisphereSky: "#1c2d39",
    hemisphereGround: "#06090c",
    hemisphereIntensity: 0.55,
    keyLightColor: "#f6efe1",
    keyLightIntensity: 1.15,
    neonIntensity: 1,
  },
  day: {
    background: "#b4cde0",
    fogColor: "#c2d6e6",
    fogNear: 12,
    fogFar: 40,
    bloomIntensity: 0.25,
    bloomLuminanceThreshold: 0.7,
    bloomLuminanceSmoothing: 0.2,
    vignetteOffset: 0.45,
    vignetteDarkness: 0.32,
    ambientIntensity: 1.1,
    hemisphereSky: "#cfe3f5",
    hemisphereGround: "#6f6657",
    hemisphereIntensity: 0.9,
    keyLightColor: "#fff4e0",
    keyLightIntensity: 1.9,
    neonIntensity: 0.45,
  },
};

export function resolveWorldMode(resolvedTheme: string | undefined): WorldMode {
  return resolvedTheme === "light" ? "day" : "night";
}
