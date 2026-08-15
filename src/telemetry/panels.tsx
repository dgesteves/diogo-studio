"use client";

import { Activity, Gauge, Layers, Zap } from "lucide-react";
import { useId, type ReactElement, type ReactNode } from "react";

import { useReducedMotionPreference } from "@/reduced-motion";
import type { PerfSnapshot } from "@/world/perf";
import { cn } from "@/ui/cn";

import type { VitalRating, VitalSample, VitalsSnapshot } from "./vitals";

/**
 * What the overlay shows, and the units it shows it in. The atoms below are shared by every
 * panel and by nothing outside this file, which is why they live here rather than in a
 * primitives module: a `Vital` that knows what a rating is is not a primitive.
 */

const ratingTone: Record<VitalRating, string> = {
  good: "text-signal-good",
  "needs-improvement": "text-signal-warn",
  poor: "text-signal-hot",
};

export function formatVital(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function fpsTone(fps: number): string {
  if (fps >= 55) return "text-signal-good";
  if (fps >= 30) return "text-signal-warn";
  return "text-signal-hot";
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}): ReactElement {
  // The title looks like a heading and groups everything under it, so it is one (WCAG
  // 1.3.1) — and naming the section by it makes each panel a region a screen reader can
  // jump between, rather than four unlabelled boxes in one overlay.
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="border-border bg-surface-inset/60 rounded-md border p-2.5"
    >
      <h2
        id={titleId}
        className="text-subtle-foreground mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider uppercase"
      >
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Vital({ name, sample }: { name: string; sample?: VitalSample }): ReactElement {
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}): ReactElement {
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
}): ReactElement {
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

export function VitalsPanel({ vitals }: { vitals: VitalsSnapshot }): ReactElement {
  return (
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
  );
}

export function ScenePanel({ perf }: { perf: PerfSnapshot }): ReactElement {
  return (
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
          No live scene. The 3D world is not running — reduced motion, a low-power connection, or a
          renderer that could not hold a frame rate. Every page is fully readable without it.
        </p>
      )}
    </Panel>
  );
}

export function RouteJsPanel({
  routeJs,
  pathname,
}: {
  routeJs: { kb: number; count: number };
  pathname: string;
}): ReactElement {
  return (
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
  );
}

export function MotionPanel(): ReactElement {
  const { reducedMotion, systemReducedMotion, lowPower, override, setOverride } =
    useReducedMotionPreference();

  const current: "auto" | "on" | "off" = override === null ? "auto" : override ? "on" : "off";
  function set(mode: "auto" | "on" | "off"): void {
    setOverride(mode === "auto" ? null : mode === "on");
  }

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
