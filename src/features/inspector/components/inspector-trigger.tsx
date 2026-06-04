"use client";

import type { ReactElement } from "react";
import { Activity } from "lucide-react";
import { useInspectorOverlay } from "../stores/inspector-overlay-store";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

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
