import { CircleAlert, Info, Lightbulb, ShieldAlert } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CalloutTone = "info" | "warn" | "danger" | "tip";

const toneConfig: Record<CalloutTone, { Icon: typeof Info; ring: string; text: string }> = {
  info: { Icon: Info, ring: "border-border bg-surface-muted", text: "text-muted-foreground" },
  warn: {
    Icon: CircleAlert,
    ring: "border-signal-warn/40 bg-signal-warn/5",
    text: "text-signal-warn",
  },
  danger: {
    Icon: ShieldAlert,
    ring: "border-signal-hot/40 bg-signal-hot/5",
    text: "text-signal-hot",
  },
  tip: { Icon: Lightbulb, ring: "border-accent/40 bg-accent-soft/40", text: "text-accent" },
};

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}): ReactElement {
  const { Icon, ring, text } = toneConfig[tone];
  return (
    <aside
      className={cn("not-prose mdx-callout flex gap-3 rounded-md border px-4 py-3", ring)}
      data-mdx-block="callout"
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", text)} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1.5 text-sm leading-relaxed">
        {title ? (
          <p className={cn("font-mono text-[10px] font-medium tracking-wider uppercase", text)}>
            {title}
          </p>
        ) : null}
        <div className="text-foreground/90 [&>p]:my-0">{children}</div>
      </div>
    </aside>
  );
}
