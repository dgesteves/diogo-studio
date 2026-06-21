import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import { NeonGridScene } from "./neon-grid-scene";

export function WorldFallback({ className }: { className?: string }): ReactElement {
  return (
    <div aria-hidden="true" className={cn("relative h-full w-full overflow-hidden", className)}>
      <NeonGridScene />
    </div>
  );
}
