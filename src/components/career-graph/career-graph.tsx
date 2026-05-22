"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { CareerGraphAccessibleDescription, CareerGraphSvg } from "./career-graph-svg";

/**
 * Career Graph hero. Public entry point used by the home page.
 *
 * Layered rendering strategy:
 * 1. **SVG (always rendered)** — carries the data, time axis, labels,
 *    edges, hover tooltips, click-to-route, and accessibility. Owns the
 *    LCP frame on first paint.
 * 2. **R3F canvas (atmospheric layer behind the SVG)** — heatmap shader,
 *    drifting particle field, scroll-driven camera dolly. Adds depth and
 *    "live telemetry" feel without competing for attention. Pointer events
 *    are disabled on the canvas so clicks pass through to the SVG.
 * 3. **Reduced-motion / low-power / out-of-view** — canvas never mounts.
 *    The SVG looks intentional on its own.
 */

const CareerGraphCanvas = dynamic(
  () => import("./career-graph-canvas").then((m) => m.CareerGraphCanvas),
  { ssr: false, loading: () => null },
);

export function CareerGraph({
  ariaLabelledBy,
  ariaDescribedBy,
}: {
  ariaLabelledBy?: string;
  /** ID for the hidden long-form description used by screen readers. */
  ariaDescribedBy?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();

  // Pause the canvas when the hero is fully scrolled off-screen so we don't
  // burn frames on a hidden scene.
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin: "200px 0px",
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const shouldMountCanvas = isClient && !reducedMotion && inView;

  return (
    <div
      ref={containerRef}
      // Aspect-ratio frame keeps the hero a stable LCP target.
      className="relative isolate w-full"
      style={{ aspectRatio: "5 / 3" }}
      data-career-graph-root=""
    >
      {/* Hidden long-form description for screen readers. */}
      {ariaDescribedBy ? <CareerGraphAccessibleDescription id={ariaDescribedBy} /> : null}

      {/* Canvas layer — BEHIND the SVG, pointer-events disabled so clicks
          pass through. Faded in/out via opacity for a smooth crossfade. */}
      {shouldMountCanvas ? <CanvasLayer key="canvas" containerRef={containerRef} /> : null}

      {/* SVG layer — ALWAYS visible. Owns interaction. */}
      <CareerGraphSvg ariaLabelledBy={ariaLabelledBy} className="absolute inset-0 z-10" />
    </div>
  );
}

/**
 * Wraps the dynamic canvas so its `canvasReady` crossfade state resets
 * naturally on mount/unmount cycles (reduced-motion toggle, scroll-out).
 */
function CanvasLayer({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [ready, setReady] = useState(false);
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out",
        ready ? "opacity-100" : "opacity-0",
      ].join(" ")}
      data-career-graph-canvas=""
    >
      <CareerGraphCanvas containerRef={containerRef} onReady={() => setReady(true)} />
    </div>
  );
}
