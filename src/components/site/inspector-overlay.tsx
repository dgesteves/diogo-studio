"use client";

import { Activity, Gauge, Layers, X, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { Kbd } from "@/components/ui/kbd";
import { getPerfServerSnapshot, getPerfSnapshot, subscribePerf } from "@/lib/telemetry/perf-store";
import {
  getVitalsServerSnapshot,
  getVitalsSnapshot,
  subscribeVitals,
  type VitalRating,
  type VitalSample,
} from "@/lib/telemetry/web-vitals-store";
import { cn } from "@/lib/utils";
import { useInspectorOverlay } from "./inspector-overlay-context";

/**
 * Inspector Overlay — the S4 "receipts" surface.
 *
 * The CV claims streaming-grade performance; this proves it on the surface
 * itself. Toggle with `Ctrl` + `` ` ``. Four panels:
 *
 *  1. Web Vitals (LCP / INP / CLS / TTFB / FCP) via the `web-vitals` package,
 *     dynamically imported on first open so it never touches the initial
 *     bundle (keeping the first-route JS budget intact).
 *  2. 3D scene telemetry (FPS, frame time, draw calls, triangles, GPU
 *     objects) sampled from `WebGLRenderer.info` via the perf store.
 *  3. Route JS actually transferred, measured from the Resource Timing API.
 *  4. Motion mode — system / low-power / override signals, with a live
 *     toggle so visitors can experience the reduced-motion story on demand.
 *
 * Off by default. Non-modal (doesn't trap focus or block the page).
 */

const ratingTone: Record<VitalRating, string> = {
  good: "text-signal-good",
  "needs-improvement": "text-signal-warn",
  poor: "text-signal-hot",
};

function formatVital(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

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

export function InspectorOverlay() {
  const { open, setOpen } = useInspectorOverlay();
  const { reducedMotion } = useReducedMotionPreference();

  if (!open) return null;
  // Subtree is only mounted while open, so the web-vitals import and the
  // perf-store subscription cost nothing until the visitor opts in.
  return <OverlayPanel onClose={() => setOpen(false)} reducedMotion={reducedMotion} />;
}

function OverlayPanel({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
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
        {/* Web Vitals */}
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

        {/* 3D scene */}
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

        {/* Route JS */}
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

        {/* Motion mode */}
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

/* ---------------------------------------------------------------------------
 * Motion panel — reads the global motion preference and lets the visitor flip
 * it live, so the reduced-motion story is experienceable from the receipts.
 * ------------------------------------------------------------------------- */

function MotionPanel() {
  const { reducedMotion, systemReducedMotion, lowPower, override, setOverride } =
    useReducedMotionPreference();

  const current: "auto" | "on" | "off" = override === null ? "auto" : override ? "on" : "off";
  const set = useCallback(
    (mode: "auto" | "on" | "off") => setOverride(mode === "auto" ? null : mode === "on"),
    [setOverride],
  );

  return (
    <Panel icon={<Activity className="size-3" />} title="Motion mode">
      <div className="flex flex-col gap-2">
        <div
          role="group"
          aria-label="Reduced-motion override"
          className="border-border bg-surface-inset grid grid-cols-3 gap-0.5 rounded-md border p-0.5"
        >
          {(["auto", "on", "off"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set(mode)}
              aria-pressed={current === mode}
              className={cn(
                "focus-visible:ring-ring rounded px-2 py-1 font-mono text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none",
                current === mode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <Signal label="Effective" on={reducedMotion} onLabel="reduced" offLabel="full" />
          <Signal label="System" on={systemReducedMotion} onLabel="reduce" offLabel="no-pref" />
          <Signal label="Low-power" on={lowPower} onLabel="yes" offLabel="no" />
          <Signal label="Override" on={override !== null} onLabel={current} offLabel="auto" />
        </dl>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------------------
 * Presentational atoms
 * ------------------------------------------------------------------------- */

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface-inset/60 rounded-md border p-2.5">
      <div className="text-subtle-foreground mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider uppercase">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Vital({ name, sample }: { name: string; sample?: VitalSample }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-0.5 rounded border px-2 py-1.5">
      <span className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {name}
      </span>
      <span
        className={cn(
          "tabular text-sm font-medium",
          sample ? ratingTone[sample.rating] : "text-subtle-foreground",
        )}
      >
        {sample ? formatVital(name, sample.value) : "—"}
      </span>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-0.5 rounded border px-2 py-1.5">
      <span className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {label}
      </span>
      <span className={cn("tabular text-sm font-medium", tone ?? "text-foreground")}>{value}</span>
    </div>
  );
}

function Signal({
  label,
  on,
  onLabel,
  offLabel,
}: {
  label: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {label}
      </dt>
      <dd className={cn("font-mono text-[10px]", on ? "text-accent" : "text-muted-foreground")}>
        {on ? onLabel : offLabel}
      </dd>
    </div>
  );
}

function fpsTone(fps: number): string {
  if (fps >= 55) return "text-signal-good";
  if (fps >= 30) return "text-signal-warn";
  return "text-signal-hot";
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
