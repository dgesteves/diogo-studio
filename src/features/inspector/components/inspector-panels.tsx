import { Gauge, Layers, Zap } from "lucide-react";
import type { ReactElement } from "react";

import type { PerfSnapshot } from "@/stores/perf-store";
import type { VitalsSnapshot } from "@/stores/web-vitals-store";

import { Panel, Stat, Vital } from "./inspector-atoms";
import { fpsTone, formatCount } from "./inspector-format";

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
          No live scene. The hero canvas is paused (reduced-motion, low-power, or off-screen) — the
          static SVG carries the same data.
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
