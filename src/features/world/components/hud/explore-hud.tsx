"use client";

import type { ReactElement } from "react";
import { Kbd } from "@/components/ui/kbd";
import { useExplore } from "../../hooks/use-explore";

export function ExploreHud(): ReactElement {
  const exploring = useExplore();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4"
    >
      {exploring ? (
        <>
          <span className="sr-only">
            Explore mode on. Move with W, A, S, D or the arrow keys, drag to look around, and press
            Escape to exit.
          </span>
          <div
            aria-hidden="true"
            className="world-intro-rise border-border/70 bg-background/80 supports-backdrop-filter:bg-background/60 flex items-center gap-3 rounded-full border px-4 py-2 shadow-2xl shadow-black/20 backdrop-blur-xl backdrop-saturate-150"
          >
            <span className="text-accent font-mono text-[11px] tracking-widest">EXPLORE</span>
            <span className="bg-border/70 h-4 w-px" />
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Kbd>W</Kbd>
              <Kbd>A</Kbd>
              <Kbd>S</Kbd>
              <Kbd>D</Kbd>
              move
            </span>
            <span className="text-muted-foreground hidden items-center text-xs sm:flex">
              drag to look
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Kbd>Esc</Kbd>
              exit
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
