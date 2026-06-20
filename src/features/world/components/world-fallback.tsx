import type { ReactElement } from "react";
import { StudioFallback } from "@/features/studio";
import { cn } from "@/utils/cn";

export function WorldFallback({ className }: { className?: string }): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-background relative h-full w-full overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_72%_8%,#0c1925_0%,#05080b_62%)]" />
      <StudioFallback className="absolute inset-0 opacity-70" />
    </div>
  );
}
