"use client";

import { useEffect, useRef, useState, type ReactElement, type RefObject } from "react";
import dynamic from "next/dynamic";
import { useReducedMotionPreference } from "@/reduced-motion";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/utils/cn";
import { siteConfig } from "@/content/profile";

/**
 * The About page's portrait: a DOM frame that describes itself, and a canvas that only ever
 * loads when a visitor can see it. `portrait-engine.tsx` is a separate module because this
 * `dynamic` import is what keeps the sampler and the animation loop out of the initial
 * bundle — merging the two would ship the engine to every route.
 */
const PortraitCanvas = dynamic(() => import("./portrait-engine").then((m) => m.PortraitCanvas), {
  ssr: false,
  loading: () => null,
});

const PORTRAIT = {
  src: "/images/diogo-esteves.png",
  alt: `Pixelated portrait of ${siteConfig.name}`,
} as const;

const VIEWPORT_MARGIN = "200px 0px";
const DEFAULT_CELL_SIZE = 8;

type PortraitStatus = "loading" | "loaded" | "error";

export function AboutPortrait(): ReactElement {
  return <PixelatedPortrait src={PORTRAIT.src} alt={PORTRAIT.alt} className="w-40 sm:w-48" />;
}

export type PixelatedPortraitProps = {
  src: string;
  alt: string;
  cellSize?: number;
  bleed?: boolean;
  className?: string;
};

export function PixelatedPortrait({
  src,
  alt,
  cellSize = DEFAULT_CELL_SIZE,
  bleed = false,
  className,
}: PixelatedPortraitProps): ReactElement {
  const { ref: containerRef, inView } = useInView<HTMLDivElement>(VIEWPORT_MARGIN);
  const isClient = useIsClient();
  const { reducedMotion } = useReducedMotionPreference();
  const [status, setStatus] = useState<PortraitStatus>("loading");

  const shouldMount = isClient && inView;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className={cn(
        "border-border bg-surface-inset relative aspect-4/5 overflow-hidden rounded-lg border",
        bleed && "lg:mask-[linear-gradient(to_right,transparent,#000_22%)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="console-grid absolute inset-0 opacity-50 dark:opacity-30"
      />

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-500",
          status === "loaded" ? "opacity-0" : "opacity-100",
        )}
      >
        <span className="text-subtle-foreground/40 font-mono text-5xl font-medium tracking-tight select-none">
          {siteConfig.initials}
        </span>
      </div>

      {shouldMount ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
        >
          <PortraitCanvas
            src={src}
            cellSize={cellSize}
            interactive={!reducedMotion}
            onLoaded={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0", bleed && "lg:hidden")}
      >
        <span className="border-border-strong/70 absolute top-2 left-2 size-2.5 border-t border-l" />
        <span className="border-border-strong/70 absolute top-2 right-2 size-2.5 border-t border-r" />
        <span className="border-border-strong/70 absolute bottom-2 left-2 size-2.5 border-b border-l" />
        <span className="border-border-strong/70 absolute right-2 bottom-2 size-2.5 border-r border-b" />
      </div>
    </div>
  );
}

/**
 * Defers the canvas until the visitor can see it, and degrades to visible where
 * `IntersectionObserver` is missing — hiding content forever is the failure mode that
 * matters here, not a wasted frame of work.
 */
function useInView<T extends Element>(
  rootMargin = "0px",
): { ref: RefObject<T | null>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
