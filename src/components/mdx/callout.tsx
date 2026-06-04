import { CircleAlert, Info, Lightbulb, ShieldAlert } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

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
      className={`not-prose mdx-callout flex gap-3 rounded-md border ${ring} px-4 py-3`}
      data-mdx-block="callout"
    >
      <Icon className={`${text} mt-0.5 size-4 shrink-0`} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1.5 text-sm leading-relaxed">
        {title ? (
          <p className={`font-mono text-[10px] font-medium tracking-wider uppercase ${text}`}>
            {title}
          </p>
        ) : null}
        <div className="text-foreground/90 [&>p]:my-0">{children}</div>
      </div>
    </aside>
  );
}
