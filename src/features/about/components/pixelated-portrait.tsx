"use client";

import { useState, type ReactElement } from "react";
import dynamic from "next/dynamic";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useInView } from "@/lib/hooks/use-in-view";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";

const PixelatedPortraitCanvas = dynamic(
  () => import("./pixelated-portrait-canvas").then((m) => m.PixelatedPortraitCanvas),
  { ssr: false, loading: () => null },
);

const VIEWPORT_MARGIN = "200px 0px";
const DEFAULT_CELL_SIZE = 8;

type PortraitStatus = "loading" | "loaded" | "error";

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
          <PixelatedPortraitCanvas
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
