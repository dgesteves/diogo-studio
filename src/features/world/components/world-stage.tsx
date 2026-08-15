"use client";

import dynamic from "next/dynamic";
import { useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/reduced-motion";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/utils/cn";
import { useActiveStation } from "../hooks/use-active-station";
import type { WorldQuality } from "../utils/frame-budget";
import { detectSoftwareRenderer } from "../utils/gpu";
import { WorldFallback } from "./world-fallback";
import { WorldThemeBridge } from "./world-theme-bridge";

const WorldCanvas = dynamic(() => import("./world-canvas").then((m) => m.WorldCanvas), {
  ssr: false,
  loading: () => null,
});

export function WorldStage(): ReactElement {
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();
  const active = useActiveStation();
  const [ready, setReady] = useState(false);
  // Resolved before the dynamic import mounts the canvas, so the scene never renders a
  // single full-quality frame on a renderer that cannot afford one. The probe is
  // memoised and returns `false` during SSR, and the first client render paints "off"
  // either way, so hydration sees no difference.
  const [quality, setQuality] = useState<WorldQuality>(() =>
    detectSoftwareRenderer() ? "frozen" : "full",
  );

  const shouldMount = isClient && !reducedMotion;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      data-world-root=""
      data-world-quality={shouldMount ? quality : "off"}
    >
      <WorldFallback className="absolute inset-0" showPoster={isClient && reducedMotion} />

      {shouldMount ? (
        <>
          <WorldThemeBridge />
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <WorldCanvas
              active={active}
              quality={quality}
              onQuality={setQuality}
              onReady={() => setReady(true)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
