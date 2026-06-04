"use client";

import type { ReactElement } from "react";
import { Activity } from "lucide-react";
import { useInspectorOverlay } from "@/components/providers/inspector-overlay-context";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

/**
 * Launches the Inspector Overlay (S4) from server-rendered pages like
 * `/colophon`. Thin client wrapper so the page itself stays a server
 * component. Also surfaces the keyboard shortcut for discoverability.
 */
export function InspectorTrigger(): ReactElement {
  const { toggle } = useInspectorOverlay();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="accent" size="md" onClick={toggle}>
        <Activity className="size-4" aria-hidden="true" />
        Open the Inspector
      </Button>
      <span className="text-subtle-foreground inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
        or press
        <Kbd>Ctrl</Kbd>
        <Kbd>`</Kbd>
      </span>
    </div>
  );
}
