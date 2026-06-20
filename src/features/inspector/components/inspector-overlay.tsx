"use client";

import { Activity, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";

import { useInspectorOverlay } from "../stores/inspector-overlay-store";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { Kbd } from "@/components/ui/kbd";
import { getPerfServerSnapshot, getPerfSnapshot, subscribePerf } from "@/stores/perf-store";
import {
  getVitalsServerSnapshot,
  getVitalsSnapshot,
  subscribeVitals,
} from "@/stores/web-vitals-store";
import { cn } from "@/utils/cn";

import { measureRouteJs } from "./inspector-route-js";
import { RouteJsPanel, ScenePanel, VitalsPanel } from "./inspector-panels";
import { MotionPanel } from "./inspector-motion-panel";

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
