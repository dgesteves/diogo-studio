"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useIsClient } from "@/lib/hooks/use-is-client";

/**
 * Career Graph — composed of two siblings the home page can position
 * independently:
 *
 *   1. `<CareerGraphAtmosphere />` — the R3F canvas. Designed to sit as a
 *      full-bleed absolute layer behind the hero section. Adds the
 *      volumetric heatmap, radar sweep, perspective grid floor, and
 *      drifting particles. Pointer-events disabled so it never steals
 *      clicks from the content above.
 *
 *   2. `<CareerGraphFigure />` — the SVG career graph itself. Bounded
 *      inside whatever column the hero gives it. Carries the data, time
 *      axis, edges, labels, clicks, focus, and screen-reader story.
 *
 * The split exists so the canvas can scale to the full viewport width
 * (delivering the wow moment) while the SVG remains comfortably sized
 * inside its content column.
 *
 * For pages that want the legacy combined layout (canvas + SVG sharing
 * one container), `<CareerGraph />` still renders both stacked.
 */

export {
  CareerGraphSvg as CareerGraphFigure,
  CareerGraphAccessibleDescription,
} from "./career-graph-svg";

const CareerGraphCanvas = dynamic(
  () => import("./career-graph-canvas").then((m) => m.CareerGraphCanvas),
  { ssr: false, loading: () => null },
);

/* ---------------------------------------------------------------------------
 * Full-bleed atmosphere
 * ------------------------------------------------------------------------- */

/**
 * Just the R3F canvas. Render this as an absolutely-positioned full-bleed
 * layer inside any `position: relative` parent — typically the hero
 * section itself. Pass the parent's ref so the camera dolly and the
 * mouse-parallax shader sample positions relative to the visible region.
 */
export function CareerGraphAtmosphere({
  /**
   * Container element used to derive scroll progress and the bounding
   * box for mouse-parallax. Defaults to the canvas's own wrapper if not
   * provided.
   */
  containerRef: externalRef,
  className,
}: {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}): ReactElement {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef ?? (internalRef as React.RefObject<HTMLElement | null>);

  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();

  // Pause the canvas when the wrapper is fully off-screen so we don't burn
  // frames on a hidden scene.
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = internalRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin: "200px 0px",
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const shouldMount = isClient && !reducedMotion && inView;
  const [ready, setReady] = useState(false);

  return (
    <div
      ref={internalRef}
      aria-hidden="true"
      data-career-graph-atmosphere=""
      className={[
        "pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out",
        ready ? "opacity-100" : "opacity-0",
        className ?? "",
      ].join(" ")}
    >
      {shouldMount ? (
        <CareerGraphCanvas containerRef={containerRef} onReady={() => setReady(true)} />
      ) : null}
    </div>
  );
}
