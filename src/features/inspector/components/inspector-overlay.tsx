"use client";

import { Activity, Gauge, Layers, X, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";

import { useInspectorOverlay } from "@/components/providers/inspector-overlay-context";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { Kbd } from "@/components/ui/kbd";
import { getPerfServerSnapshot, getPerfSnapshot, subscribePerf } from "@/lib/telemetry/perf-store";
import {
  getVitalsServerSnapshot,
  getVitalsSnapshot,
  subscribeVitals,
} from "@/lib/telemetry/web-vitals-store";
import { cn } from "@/lib/utils/cn";

import { Panel, Stat, Vital } from "./inspector-atoms";
import { fpsTone, formatCount } from "./inspector-format";
import { MotionPanel } from "./inspector-motion-panel";

function measureRouteJs(): { kb: number; count: number } {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return { kb: 0, count: 0 };
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    const isScript = entry.initiatorType === "script" || entry.name.endsWith(".js");
    const sameOrigin = entry.name.startsWith(origin) || entry.name.startsWith("/");
    if (isScript && sameOrigin) {
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
  // Subtree only mounts while open, so the web-vitals import and the perf-store
  // subscription cost nothing until the visitor opts in.
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
    // Defer a beat so late-arriving chunks for this route are counted.
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
        <Panel icon={<Zap className="size-3" />} title="Web Vitals">
          <div className="grid grid-cols-3 gap-2">
            {(["LCP", "INP", "CLS"] as const).map((name) => (
              <Vital key={name} name={name} sample={vitals[name]} />
            ))}
            {(["TTFB", "FCP"] as const).map((name) => (
              <Vital key={name} name={name} sample={vitals[name]} />
            ))}
          </div>
        </Panel>

        <Panel icon={<Gauge className="size-3" />} title="3D scene">
          {perf.active ? (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="FPS" value={String(perf.fps)} tone={fpsTone(perf.fps)} />
              <Stat label="Frame" value={`${perf.frameMs}ms`} />
              <Stat label="Calls" value={String(perf.drawCalls)} />
              <Stat label="Tris" value={formatCount(perf.triangles)} />
              <Stat label="Geom" value={String(perf.geometries)} />
              <Stat label="Tex" value={String(perf.textures)} />
            </div>
          ) : (
            <p className="text-subtle-foreground text-[11px] leading-relaxed">
              No live scene. The hero canvas is paused (reduced-motion, low-power, or off-screen) —
              the static SVG carries the same data.
            </p>
          )}
        </Panel>

        <Panel icon={<Layers className="size-3" />} title="Route JS">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-foreground tabular text-xl font-medium tracking-tight">
                {routeJs.kb}
              </span>
              <span className="text-muted-foreground ml-1 text-xs">KB transferred</span>
            </div>
            <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
              {routeJs.count} files
            </span>
          </div>
          <p className="text-subtle-foreground mt-1 font-mono text-[10px] tracking-wider">
            <span className="text-muted-foreground break-all">{pathname}</span> · budget 1.25 MB
            (size-limit, gzip)
          </p>
        </Panel>

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
