import type { ReactElement } from "react";
import { cn } from "@/utils/cn";

type StatusTone = "good" | "warn" | "hot" | "neutral";

const toneToClasses: Record<StatusTone, { bg: string; ring: string }> = {
  good: { bg: "bg-signal-good", ring: "bg-signal-good/30" },
  warn: { bg: "bg-signal-warn", ring: "bg-signal-warn/30" },
  hot: { bg: "bg-signal-hot", ring: "bg-signal-hot/30" },
  neutral: { bg: "bg-muted-foreground", ring: "bg-muted-foreground/20" },
};

export function StatusDot({
  tone = "good",
  className,
}: {
  tone?: StatusTone;
  className?: string;
}): ReactElement {
  const { bg, ring } = toneToClasses[tone];
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden="true">
      <span className={cn("absolute inset-0 animate-ping rounded-full", ring)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", bg)} />
    </span>
  );
}
