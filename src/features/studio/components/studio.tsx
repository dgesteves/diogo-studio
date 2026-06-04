"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { StudioFallback } from "./studio-fallback";

const StudioCanvas = dynamic(() => import("./studio-canvas").then((m) => m.StudioCanvas), {
  ssr: false,
  loading: () => null,
});

export function Studio({ className }: { className?: string }): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();

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
      void import("./studio-canvas");
    });
    return () => cancel(handle as number);
  }, [reducedMotion]);

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
      <StudioFallback className="absolute inset-0 z-0" />

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
