"use client";

import { Activity, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";

import { useReducedMotionPreference } from "@/reduced-motion";
import { Kbd } from "@/components/ui/kbd";
import { getPerfServerSnapshot, getPerfSnapshot, subscribePerf } from "@/world/perf";
import { cn } from "@/utils/cn";

import { MotionPanel, RouteJsPanel, ScenePanel, VitalsPanel } from "./panels";
import { useInspectorOverlay } from "./store";
import { getVitalsServerSnapshot, getVitalsSnapshot, subscribeVitals } from "./vitals";

/**
 * Called only from the overlay's effect, so `window` and Resource Timing are both present —
 * the guards that used to stand in for that could not run. Entry names are absolute URLs by
 * spec, which is what makes a prefix comparison a same-origin test.
 */
function measureRouteJs(): { kb: number; count: number } {
  const { origin } = window.location;
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    const isScript = entry.initiatorType === "script" || entry.name.endsWith(".js");
    if (isScript && entry.name.startsWith(origin)) {
      bytes += entry.encodedBodySize || 0;
      count += 1;
    }
  }
  return { kb: Math.round(bytes / 1024), count };
}

export function InspectorOverlay(): ReactElement | null {
  const { open, setOpen } = useInspectorOverlay();
  const { reducedMotion } = useReducedMotionPreference();

  if (!open) return null;
  return <OverlayPanel onClose={() => setOpen(false)} reducedMotion={reducedMotion} />;
}

function OverlayPanel({
  onClose,
  reducedMotion,
}: {
  onClose: () => void;
  reducedMotion: boolean;
}): ReactElement {
  const perf = useSyncExternalStore(subscribePerf, getPerfSnapshot, getPerfServerSnapshot);
  const vitals = useSyncExternalStore(subscribeVitals, getVitalsSnapshot, getVitalsServerSnapshot);
  const pathname = usePathname();

  const [routeJs, setRouteJs] = useState<{ kb: number; count: number }>({ kb: 0, count: 0 });
  useEffect(() => {
    const id = window.setTimeout(() => setRouteJs(measureRouteJs()), 600);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <aside
      role="region"
      aria-label="Performance inspector overlay"
      className={cn(
        "border-border-strong bg-surface/95 fixed bottom-4 left-4 z-40 flex w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl shadow-black/30 backdrop-blur-md",
        !reducedMotion && "animate-in fade-in slide-in-from-bottom-2 duration-200",
      )}
    >
      <header className="border-border flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="text-accent size-3.5" aria-hidden="true" />
          <span className="text-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Inspector · receipts
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector overlay"
          className="text-subtle-foreground hover:text-foreground hover:bg-surface-muted focus-visible:ring-ring grid size-6 place-items-center rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-3">
        <VitalsPanel vitals={vitals} />
        <ScenePanel perf={perf} />
        <RouteJsPanel routeJs={routeJs} pathname={pathname} />
        <MotionPanel />
      </div>

      <footer className="border-border text-subtle-foreground flex items-center justify-between border-t px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase">
        <span>Toggle</span>
        <span className="flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>`</Kbd>
        </span>
      </footer>
    </aside>
  );
}
