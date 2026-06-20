"use client";

import { Activity } from "lucide-react";
import { type ReactElement } from "react";

import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { cn } from "@/utils/cn";

import { Panel, Signal } from "./inspector-atoms";

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
