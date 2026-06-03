"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { StudioFallback } from "./studio-fallback";

/**
 * Studio — "the rig that ships."
 *
 * A second hero-grade 3D moment that pairs with the Career Graph. Where the
 * Career Graph plots *what* I've shipped (the engagements), the Studio
 * shows *how* it gets shipped: a desk + 3 monitors + chair, with each
 * screen running live, on-brand content (telemetry log, code snippet,
 * metrics dashboard).
 *
 * Gating mirrors the Career Graph atmosphere:
 *   - Only mounts on the client.
 *   - Never mounts under `prefers-reduced-motion: reduce`.
 *   - Pauses (unmounts) when scrolled out of view via IntersectionObserver.
 *   - Falls back to a static SVG/HTML representation in all "no canvas"
 *     cases — the section is still meaningful without the 3D.
 *
 * Perf-wise the studio canvas is intentionally cheap compared to the hero:
 *   - No raymarched volumetric shader, no radar sweep, no chromatic
 *     aberration.
 *   - Just lit primitives + three small HTML overlays for the screens.
 *   - Same DPR cap + AdaptiveDpr/AdaptiveEvents safety net.
 */

const StudioCanvas = dynamic(() => import("./studio-canvas").then((m) => m.StudioCanvas), {
  ssr: false,
  loading: () => null,
});

export function Studio({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();

  // Prefetch the canvas chunk during browser idle so it's already in memory
  // by the time the IntersectionObserver triggers the actual mount. Without
  // this, the user stares at `<StudioFallback />` for the round-trip cost
  // of downloading the chunk (and any drei/three modules it pulls in).
  // Gated on reduced-motion: no canvas, no need to fetch its code.
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 200);
    const cancel =
      "cancelIdleCallback" in window
        ? window.cancelIdleCallback
        : (id: number) => window.clearTimeout(id);
    const handle = idle(() => {
      // Fire-and-forget. If the import fails the IO-gated mount path will
      // surface the same error; nothing here needs to await it.
      void import("./studio-canvas");
    });
    return () => cancel(handle as number);
  }, [reducedMotion]);

  // Pause when fully off-screen so we never burn frames on hidden content.
  // Generous `rootMargin` so the canvas starts mounting well before the
  // section enters the viewport — at typical scroll speeds this is enough
  // for R3F's first frame to land *before* the section is actually on
  // screen, so the user perceives the 3D scene as "already there."
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin: "600px 0px",
      threshold: 0,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const shouldMount = isClient && !reducedMotion && inView;
  const [ready, setReady] = useState(false);

  return (
    <div
      ref={containerRef}
      className={[
        "border-border/60 bg-surface/40 relative isolate w-full overflow-hidden rounded-2xl border",
        className ?? "",
      ].join(" ")}
      style={{ aspectRatio: "16 / 9" }}
      data-studio-root=""
    >
      {/* Static fallback — always rendered, sits at z-0 so the canvas can
          fade in over it. Keeps the section meaningful for SSR, reduced-
          motion users, and anyone who never gets the canvas mounted. */}
      <StudioFallback className="absolute inset-0 z-0" />

      {/* Canvas — pointer-events disabled so the section is purely
          visual; nothing here is clickable. */}
      {shouldMount ? (
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 z-10 transition-opacity duration-1000 ease-out",
            ready ? "opacity-100" : "opacity-0",
          ].join(" ")}
          data-studio-canvas=""
        >
          <StudioCanvas containerRef={containerRef} onReady={() => setReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
