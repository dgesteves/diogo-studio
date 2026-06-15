"use client";

import type { ReactElement } from "react";
import { Activity } from "lucide-react";
import { useInspectorOverlay } from "../stores/inspector-overlay-store";

export function InspectorFooterTrigger(): ReactElement {
  const { toggle } = useInspectorOverlay();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open the performance inspector overlay"
      className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
    >
      <Activity className="size-3" aria-hidden="true" />
      Inspector
    </button>
  );
}
