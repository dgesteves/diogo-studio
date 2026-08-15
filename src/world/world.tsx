"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTheme } from "next-themes";
import { resolveWorldMode } from "./materials";
import { setWorldMode } from "./store";
import dynamic from "next/dynamic";
import { useReducedMotionPreference } from "@/reduced-motion";
import { useIsClient } from "@/use-is-client";
import { cn } from "@/ui/cn";
import { useActiveStation } from "./stations";
import { type WorldQuality } from "./quality";
import { detectSoftwareRenderer } from "./gpu";
import { WorldFallback } from "./fallback";

/**
 * The world's mount point, and the one place that decides whether there is a 3D world at all.
 * Reduced motion, no client, or a software renderer each end here with a poster instead of a
 * canvas — which is why the canvas is a dynamic import and not a static one.
 */

function WorldThemeBridge(): null {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setWorldMode(resolveWorldMode(resolvedTheme));
  }, [resolvedTheme]);

  return null;
}

const WorldCanvas = dynamic(() => import("./canvas").then((m) => m.WorldCanvas), {
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
