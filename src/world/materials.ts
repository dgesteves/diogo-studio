"use client";

import { useSyncExternalStore } from "react";
import { brand } from "@/ui/brand";
import {
  getWorldModeServerSnapshot,
  getWorldModeSnapshot,
  subscribeWorldTheme,
  type WorldMode,
} from "./store";

/**
 * Every color, surface finish and light level the room is allowed to use.
 *
 * Two kinds of token live here and they are not interchangeable. `worldColors` and the four
 * material presets are *fixed* — a mesh reads them once and they never change. The palettes
 * are *swapped*: day and night are the same geometry under a different rig, which is why the
 * theme is a store subscription rather than a remount.
 *
 * Nothing in the room may inline a hex, a roughness or a metalness value. Add a token here
 * instead — see `.claude/rules/three-r3f-world.md`.
 */

export const worldColors = {
  accent: brand.accent,
  accentBright: "#67e8f9",
  accentSoft: "#7dd3fc",
  /**
   * The room's second neon, and the only one that is not on the cyan axis. Everything lit in
   * here is the accent or a shade of it, which is the house style right up until one object
   * has to be told apart from the rest of the desk rather than blend into it.
   */
  hotNeon: brand.magenta,
  coolLight: "#bfe9f5",
  coolLightCore: "#f2fbff",
  statusOk: "#34d399",
  foliage: "#266a44",
} as const;

export const frameMaterial = { color: "#0b1016", roughness: 0.5, metalness: 0.6 } as const;

export const darkMetalMaterial = { color: "#11161b", roughness: 0.5, metalness: 0.6 } as const;

export const anodizedMetalMaterial = {
  color: "#1a212a",
  roughness: 0.28,
  metalness: 0.7,
} as const;

export const portMaterial = { color: "#04070a", roughness: 0.9, metalness: 0.15 } as const;

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
  ceilingLightIntensity: number;
  neonIntensity: number;
  /** Multiplied into the framed photograph, which is lit daylight in an unlit room. */
  printTint: string;
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
    ceilingLightIntensity: 1,
    neonIntensity: 1,
    printTint: "#6d7a83",
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
    ceilingLightIntensity: 0.5,
    neonIntensity: 0.45,
    printTint: "#e8eef2",
  },
};

export function resolveWorldMode(resolvedTheme: string | undefined): WorldMode {
  return resolvedTheme === "light" ? "day" : "night";
}

export function useWorldPalette(): WorldPalette {
  const mode = useSyncExternalStore(
    subscribeWorldTheme,
    getWorldModeSnapshot,
    getWorldModeServerSnapshot,
  );
  return worldPalettes[mode];
}
