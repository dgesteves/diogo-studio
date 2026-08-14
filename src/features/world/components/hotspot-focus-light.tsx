"use client";

import { useRef, type ReactElement } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type PointLight } from "three";
import type { RouteKey } from "@/content/pages";
import { getStation } from "../constants/stations";
import { FOCUS_FADE_RATE, FOCUS_LIGHT_DISTANCE, FOCUS_LIGHT_INTENSITY } from "../constants/focus";

/**
 * A hotspot's glow light is mounted here permanently rather than inside
 * `HotspotFocus`. Mounting a light on hover changes `NUM_POINT_LIGHTS`, which
 * rewrites every material's program key and forces three.js to relink every
 * shader in the scene (~47 programs) — and to drop them again on un-hover, so
 * the stall repeats on every single hover. Keeping the count constant and only
 * animating uniforms costs nothing.
 */
export function HotspotFocusLight({ slug }: { slug: RouteKey | null }): ReactElement {
  const lightRef = useRef<PointLight>(null);
  const amount = useRef(0);
  const accent = useRef(new Color());

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light) return;

    if (slug) {
      const station = getStation(slug);
      light.position.set(...station.anchor);
      accent.current.set(station.accent);
      light.color.copy(accent.current);
    }

    amount.current += ((slug ? 1 : 0) - amount.current) * (1 - Math.exp(-delta * FOCUS_FADE_RATE));
    light.intensity = FOCUS_LIGHT_INTENSITY * amount.current;
  });

  return <pointLight ref={lightRef} intensity={0} distance={FOCUS_LIGHT_DISTANCE} decay={2} />;
}
